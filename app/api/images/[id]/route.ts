import { z } from "zod";
import { canTransition, imageWorkflowMetadata } from "@/lib/editorial/workflow";
import { requireStaff } from "@/lib/supabase/auth";
import type { Json } from "@/lib/supabase/database.types";

const schema = z.object({ workflowStatus: z.enum(["draft", "ready_for_review", "approved", "archived"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await requireStaff();
  if (!context) return response;
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid image workflow update." }, { status: 400 });
  const selected = await context.supabase.from("generated_images").select("*").eq("id", id).single();
  if (selected.error) return Response.json({ error: selected.error.message }, { status: 404 });
  const metadata = imageWorkflowMetadata(selected.data.metadata);
  let seriesQuery = context.supabase.from("generated_images").select("id,metadata,created_at").order("created_at", { ascending: false }).limit(500);
  seriesQuery = selected.data.news_item_id ? seriesQuery.eq("news_item_id", selected.data.news_item_id) : seriesQuery.is("news_item_id", null);
  const seriesRows = await seriesQuery;
  if (seriesRows.error) return Response.json({ error: seriesRows.error.message }, { status: 500 });
  const seriesId = typeof metadata.seriesId === "string" ? metadata.seriesId : selected.data.id;
  const current = (seriesRows.data ?? []).filter((row) => {
    const rowMetadata = imageWorkflowMetadata(row.metadata);
    return (typeof rowMetadata.seriesId === "string" ? rowMetadata.seriesId : row.id) === seriesId;
  }).sort((left, right) => Number(imageWorkflowMetadata(right.metadata).version) - Number(imageWorkflowMetadata(left.metadata).version))[0];
  if (current && current.id !== id) return Response.json({ error: "This image version is no longer current. Refresh before changing its workflow." }, { status: 409 });
  if (!canTransition(metadata.workflowStatus, parsed.data.workflowStatus)) return Response.json({ error: `Cannot move ${metadata.workflowStatus} image to ${parsed.data.workflowStatus}.` }, { status: 409 });
  if (parsed.data.workflowStatus === "approved" && context.role !== "admin") return Response.json({ error: "Only an administrator can approve images." }, { status: 403 });
  const nextMetadata = { ...metadata, version: Number(metadata.version) + 1, workflowStatus: parsed.data.workflowStatus };
  const { data, error } = await context.supabase.from("generated_images").insert({
    news_item_id: selected.data.news_item_id,
    storage_path: selected.data.storage_path,
    public_url: selected.data.public_url,
    prompt: selected.data.prompt,
    template: selected.data.template,
    width: selected.data.width,
    height: selected.data.height,
    mime_type: selected.data.mime_type,
    metadata: nextMetadata as Json,
    created_by: context.user.id,
  }).select().single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ image: { ...data, metadata: nextMetadata } }, { status: 201 });
}
