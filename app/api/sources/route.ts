import { z } from "zod";
import { requireStaff } from "@/lib/supabase/auth";

const sourceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  url: z.string().url().max(2048),
  sourceType: z.enum(["rss", "website", "api"]).default("rss"),
});

export async function GET() {
  const { context, response } = await requireStaff();
  if (!context) return response;
  const { data, error } = await context.supabase.from("news_sources").select("*").order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ sources: data });
}

export async function POST(request: Request) {
  const { context, response } = await requireStaff();
  if (!context) return response;
  const parsed = sourceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a valid source name and public URL." }, { status: 400 });
  const { data, error } = await context.supabase.from("news_sources").insert({
    name: parsed.data.name,
    url: parsed.data.url,
    source_type: parsed.data.sourceType,
    created_by: context.user.id,
  }).select().single();
  if (error) return Response.json({ error: error.code === "23505" ? "This source URL already exists." : error.message }, { status: 400 });
  return Response.json({ source: data }, { status: 201 });
}
