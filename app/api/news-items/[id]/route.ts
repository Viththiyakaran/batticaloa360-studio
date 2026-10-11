import { z } from "zod";
import { requireStaff } from "@/lib/supabase/auth";

const updateSchema = z.object({
  verificationStatus: z.enum(["unverified", "verified", "outdated", "unverifiable"]).optional(),
  workflowStatus: z.enum(["discovered", "unverified", "verified", "draft", "ready_for_review", "approved", "published", "failed", "archived"]).optional(),
  summary: z.string().max(4000).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await requireStaff();
  if (!context) return response;
  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid news update." }, { status: 400 });
  const update = {
    ...(parsed.data.verificationStatus && { verification_status: parsed.data.verificationStatus }),
    ...(parsed.data.workflowStatus && { workflow_status: parsed.data.workflowStatus }),
    ...(parsed.data.summary !== undefined && { summary: parsed.data.summary }),
    ...(parsed.data.verificationStatus === "verified" && { verified_by: context.user.id, verified_at: new Date().toISOString() }),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await context.supabase.from("news_items").update(update).eq("id", id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ item: data });
}
