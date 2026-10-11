import { z } from "zod";
import { currentVersions, nextVersion } from "@/lib/editorial/workflow";
import { requireStaff } from "@/lib/supabase/auth";
import type { Json } from "@/lib/supabase/database.types";

const postSchema = z.object({
  newsItemId: z.string().uuid(),
  platform: z.enum(["facebook", "blogger"]),
  title: z.string().max(500).optional(),
  body: z.string().min(1).max(50000),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export async function GET(request: Request) {
  const { context, response } = await requireStaff();
  if (!context) return response;
  const url = new URL(request.url);
  const newsItemId = url.searchParams.get("newsItemId");
  const platform = url.searchParams.get("platform");
  const includeHistory = url.searchParams.get("includeHistory") === "true";
  let query = context.supabase.from("generated_posts").select("*").order("version", { ascending: false }).order("created_at", { ascending: false }).limit(500);
  if (newsItemId) query = query.eq("news_item_id", newsItemId);
  if (platform === "facebook" || platform === "blogger") query = query.eq("platform", platform);
  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const rows = data ?? [];
  return Response.json({ posts: includeHistory ? rows : currentVersions(rows), history: includeHistory ? rows : undefined });
}

export async function POST(request: Request) {
  const { context, response } = await requireStaff();
  if (!context) return response;
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid draft content." }, { status: 400 });
  const previous = await context.supabase.from("generated_posts").select("version").eq("news_item_id", parsed.data.newsItemId).eq("platform", parsed.data.platform).order("version", { ascending: false }).limit(50);
  if (previous.error) return Response.json({ error: previous.error.message }, { status: 500 });
  const now = new Date().toISOString();
  const { data, error } = await context.supabase.from("generated_posts").insert({
    news_item_id: parsed.data.newsItemId,
    platform: parsed.data.platform,
    title: parsed.data.title,
    body: parsed.data.body,
    metadata: parsed.data.metadata as Json,
    version: nextVersion(previous.data),
    workflow_status: "draft",
    created_by: context.user.id,
    updated_at: now,
  }).select().single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  await context.supabase.from("news_items").update({ workflow_status: "draft", updated_at: now }).eq("id", parsed.data.newsItemId);
  return Response.json({ post: data }, { status: 201 });
}
