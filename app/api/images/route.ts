import { z } from "zod";
import { imageWorkflowMetadata } from "@/lib/editorial/workflow";
import { requireStaff } from "@/lib/supabase/auth";
import type { Json } from "@/lib/supabase/database.types";

const metadataSchema = z.object({
  newsItemId: z.string().uuid().nullable().optional(),
  seriesId: z.string().uuid().nullable().optional(),
  template: z.string().min(1).max(80),
  width: z.coerce.number().int().min(320).max(4096),
  height: z.coerce.number().int().min(320).max(4096),
  headline: z.string().max(500).optional(),
  category: z.string().max(100).optional(),
  format: z.string().max(40).optional(),
  fontSize: z.coerce.number().int().min(24).max(160).optional(),
  generationType: z.enum(["procedural", "licensed_photo"]).default("procedural"),
});

export async function GET(request: Request) {
  const { context, response } = await requireStaff();
  if (!context) return response;
  const url = new URL(request.url);
  const newsItemId = url.searchParams.get("newsItemId");
  const includeHistory = url.searchParams.get("includeHistory") === "true";
  let query = context.supabase.from("generated_images").select("*").order("created_at", { ascending: false }).limit(500);
  if (newsItemId) query = query.eq("news_item_id", newsItemId);
  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const normalized = (data ?? []).map((image) => ({ ...image, metadata: imageWorkflowMetadata(image.metadata) }));
  if (includeHistory) return Response.json({ images: normalized, history: normalized });
  const current = new Map<string, (typeof normalized)[number]>();
  for (const image of normalized) {
    const series = typeof image.metadata.seriesId === "string" ? image.metadata.seriesId : image.id;
    const existing = current.get(series);
    if (!existing || Number(image.metadata.version) > Number(existing.metadata.version)) current.set(series, image);
  }
  return Response.json({ images: [...current.values()] });
}

export async function POST(request: Request) {
  const { context, response } = await requireStaff();
  if (!context) return response;
  const form = await request.formData();
  const file = form.get("file");
  const parsed = metadataSchema.safeParse({
    newsItemId: form.get("newsItemId") || null,
    seriesId: form.get("seriesId") || null,
    template: form.get("template"),
    width: form.get("width"),
    height: form.get("height"),
    headline: form.get("headline"),
    category: form.get("category"),
    format: form.get("format"),
    fontSize: form.get("fontSize"),
    generationType: form.get("generationType") || "procedural",
  });
  if (!(file instanceof File) || !parsed.success) return Response.json({ error: "Invalid image upload." }, { status: 400 });
  if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 10 * 1024 * 1024) return Response.json({ error: "Use a PNG or JPG smaller than 10 MB." }, { status: 400 });
  const seriesId = parsed.data.seriesId ?? crypto.randomUUID();
  let version = 1;
  if (parsed.data.newsItemId) {
    const previous = await context.supabase.from("generated_images").select("metadata").eq("news_item_id", parsed.data.newsItemId).limit(500);
    if (previous.error) return Response.json({ error: previous.error.message }, { status: 500 });
    version = Math.max(0, ...(previous.data ?? []).map((row) => {
      const metadata = imageWorkflowMetadata(row.metadata);
      return metadata.seriesId === seriesId ? Number(metadata.version) : 0;
    })) + 1;
  }
  const extension = file.type === "image/png" ? "png" : "jpg";
  const storagePath = context.user.id + "/" + crypto.randomUUID() + "." + extension;
  const upload = await context.supabase.storage.from("generated-images").upload(storagePath, file, { contentType: file.type, upsert: false });
  if (upload.error) return Response.json({ error: upload.error.message }, { status: 400 });
  const publicUrl = context.supabase.storage.from("generated-images").getPublicUrl(storagePath).data.publicUrl;
  const metadata = {
    seriesId,
    version,
    workflowStatus: "draft",
    headline: parsed.data.headline ?? "",
    category: parsed.data.category ?? "",
    format: parsed.data.format ?? "square",
    fontSize: parsed.data.fontSize ?? 76,
    generationType: parsed.data.generationType,
  };
  const { data, error } = await context.supabase.from("generated_images").insert({
    news_item_id: parsed.data.newsItemId ?? null,
    storage_path: storagePath,
    public_url: publicUrl,
    template: parsed.data.template,
    width: parsed.data.width,
    height: parsed.data.height,
    mime_type: file.type,
    metadata: metadata as Json,
    created_by: context.user.id,
  }).select().single();
  if (error) {
    await context.supabase.storage.from("generated-images").remove([storagePath]);
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ image: { ...data, metadata } }, { status: 201 });
}
