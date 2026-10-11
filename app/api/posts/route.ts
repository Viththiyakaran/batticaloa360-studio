import { z } from "zod";
import { requireStaff } from "@/lib/supabase/auth";
import type { Json } from "@/lib/supabase/database.types";

const postSchema = z.object({
  newsItemId: z.string().uuid(),
  platform: z.enum(["facebook", "blogger"]),
  title: z.string().max(500).optional(),
  body: z.string().min(1).max(50000),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export async function GET() {
  const { context, response } = await requireStaff();
  if (!context) return response;
  const { data, error } = await context.supabase.from("generated_posts").select("*").order("updated_at", { ascending: false }).limit(100);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ posts: data });
}

export async function POST(request: Request) {
  const { context, response } = await requireStaff();
  if (!context) return response;
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid draft content." }, { status: 400 });
  const { data, error } = await context.supabase.from("generated_posts").insert({
    news_item_id: parsed.data.newsItemId,
    platform: parsed.data.platform,
    title: parsed.data.title,
    body: parsed.data.body,
    metadata: parsed.data.metadata as Json,
    workflow_status: "draft",
    created_by: context.user.id,
  }).select().single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  await context.supabase.from("news_items").update({ workflow_status: "draft", updated_at: new Date().toISOString() }).eq("id", parsed.data.newsItemId);
  return Response.json({ post: data }, { status: 201 });
}
