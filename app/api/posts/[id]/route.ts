import { z } from "zod";
import { canTransition, isEditorialStatus, nextVersion } from "@/lib/editorial/workflow";
import { requireStaff } from "@/lib/supabase/auth";
import type { Json } from "@/lib/supabase/database.types";

const updateSchema = z.object({
  title: z.string().max(500).nullable().optional(),
  body: z.string().min(1).max(50000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  workflowStatus: z.enum(["draft", "ready_for_review", "approved", "archived"]).optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await requireStaff();
  if (!context) return response;
  const { id } = await params;
  const current = await context.supabase.from("generated_posts").select("*").eq("id", id).single();
  if (current.error) return Response.json({ error: current.error.message }, { status: 404 });
  let history = context.supabase.from("generated_posts").select("*").eq("platform", current.data.platform).order("version", { ascending: false });
  history = current.data.news_item_id ? history.eq("news_item_id", current.data.news_item_id) : history.is("news_item_id", null);
  const rows = await history;
  if (rows.error) return Response.json({ error: rows.error.message }, { status: 500 });
  return Response.json({ post: current.data, versions: rows.data ?? [] });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await requireStaff();
  if (!context) return response;
  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid editorial update." }, { status: 400 });
  const selected = await context.supabase.from("generated_posts").select("*").eq("id", id).single();
  if (selected.error) return Response.json({ error: selected.error.message }, { status: 404 });
  let latestQuery = context.supabase.from("generated_posts").select("id,version").eq("platform", selected.data.platform).order("version", { ascending: false }).order("created_at", { ascending: false }).limit(1);
  latestQuery = selected.data.news_item_id ? latestQuery.eq("news_item_id", selected.data.news_item_id) : latestQuery.is("news_item_id", null);
  const latest = await latestQuery.single();
  if (latest.error) return Response.json({ error: latest.error.message }, { status: 500 });
  if (latest.data.id !== id) return Response.json({ error: "This version is no longer current. Refresh before changing its workflow." }, { status: 409 });
  const currentStatus = isEditorialStatus(selected.data.workflow_status) ? selected.data.workflow_status : "draft";
  const targetStatus = parsed.data.workflowStatus ?? (parsed.data.body !== undefined || parsed.data.title !== undefined || parsed.data.metadata !== undefined ? "draft" : currentStatus);
  if (!canTransition(currentStatus, targetStatus)) return Response.json({ error: `Cannot move ${currentStatus} content to ${targetStatus}.` }, { status: 409 });
  if (targetStatus === "approved" && context.role !== "admin") return Response.json({ error: "Only an administrator can approve content." }, { status: 403 });
  if ((targetStatus === "ready_for_review" || targetStatus === "approved") && selected.data.news_item_id) {
    const source = await context.supabase.from("news_items").select("verification_status").eq("id", selected.data.news_item_id).single();
    if (source.error || source.data.verification_status !== "verified") return Response.json({ error: "Verify the source story before review or approval." }, { status: 409 });
  }
  let versions = context.supabase.from("generated_posts").select("version").eq("platform", selected.data.platform);
  versions = selected.data.news_item_id ? versions.eq("news_item_id", selected.data.news_item_id) : versions.is("news_item_id", null);
  const previous = await versions;
  if (previous.error) return Response.json({ error: previous.error.message }, { status: 500 });
  const now = new Date().toISOString();
  const approved = targetStatus === "approved";
  const { data, error } = await context.supabase.from("generated_posts").insert({
    news_item_id: selected.data.news_item_id,
    platform: selected.data.platform,
    title: parsed.data.title !== undefined ? parsed.data.title : selected.data.title,
    body: parsed.data.body ?? selected.data.body,
    metadata: (parsed.data.metadata ?? selected.data.metadata) as Json,
    version: nextVersion(previous.data),
    workflow_status: targetStatus,
    created_by: context.user.id,
    approved_by: approved ? context.user.id : null,
    approved_at: approved ? now : null,
    updated_at: now,
  }).select().single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (selected.data.news_item_id) await context.supabase.from("news_items").update({ workflow_status: targetStatus, updated_at: now }).eq("id", selected.data.news_item_id);
  return Response.json({ post: data }, { status: 201 });
}
