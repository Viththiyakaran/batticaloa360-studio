import { z } from "zod";
import { requireStaff } from "@/lib/supabase/auth";

const updateSchema = z.object({ active: z.boolean().optional(), name: z.string().trim().min(2).max(120).optional() }).refine((v) => Object.keys(v).length > 0);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await requireStaff();
  if (!context) return response;
  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid source update." }, { status: 400 });
  const { data, error } = await context.supabase.from("news_sources").update({ ...parsed.data, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ source: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await requireStaff();
  if (!context) return response;
  const { id } = await params;
  const { error } = await context.supabase.from("news_sources").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return new Response(null, { status: 204 });
}
