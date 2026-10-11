import { z } from "zod";
import { requireStaff } from "@/lib/supabase/auth";

const metadataSchema = z.object({
  newsItemId: z.string().uuid().nullable().optional(),
  template: z.string().min(1).max(80),
  width: z.coerce.number().int().min(320).max(4096),
  height: z.coerce.number().int().min(320).max(4096),
  headline: z.string().max(500).optional(),
});

export async function GET() {
  const { context, response } = await requireStaff();
  if (!context) return response;
  const { data, error } = await context.supabase.from("generated_images").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ images: data });
}

export async function POST(request: Request) {
  const { context, response } = await requireStaff();
  if (!context) return response;
  const form = await request.formData();
  const file = form.get("file");
  const parsed = metadataSchema.safeParse({
    newsItemId: form.get("newsItemId") || null,
    template: form.get("template"),
    width: form.get("width"),
    height: form.get("height"),
    headline: form.get("headline"),
  });
  if (!(file instanceof File) || !parsed.success) return Response.json({ error: "Invalid image upload." }, { status: 400 });
  if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 10 * 1024 * 1024) return Response.json({ error: "Use a PNG or JPG smaller than 10 MB." }, { status: 400 });
  const extension = file.type === "image/png" ? "png" : "jpg";
  const storagePath = context.user.id + "/" + crypto.randomUUID() + "." + extension;
  const upload = await context.supabase.storage.from("generated-images").upload(storagePath, file, { contentType: file.type, upsert: false });
  if (upload.error) return Response.json({ error: upload.error.message }, { status: 400 });
  const publicUrl = context.supabase.storage.from("generated-images").getPublicUrl(storagePath).data.publicUrl;
  const { data, error } = await context.supabase.from("generated_images").insert({
    news_item_id: parsed.data.newsItemId ?? null,
    storage_path: storagePath,
    public_url: publicUrl,
    template: parsed.data.template,
    width: parsed.data.width,
    height: parsed.data.height,
    mime_type: file.type,
    metadata: { headline: parsed.data.headline ?? "" },
    created_by: context.user.id,
  }).select().single();
  if (error) {
    await context.supabase.storage.from("generated-images").remove([storagePath]);
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ image: data }, { status: 201 });
}
