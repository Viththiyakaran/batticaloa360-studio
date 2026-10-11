import { z } from "zod";
import { geminiImagePrompt, imageAspectRatio } from "@/lib/ai/image";
import { requireStaff } from "@/lib/supabase/auth";

type GeminiImageResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string }; text?: string }> } }>;
  error?: { message?: string };
};

const schema = z.object({
  caption: z.string().trim().min(3).max(3000),
  headline: z.string().trim().min(1).max(500),
  category: z.string().trim().min(1).max(100),
  format: z.enum(["square", "portrait", "story", "blogger"]),
});

export async function POST(request: Request) {
  const { context, response } = await requireStaff();
  if (!context) return response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a visual caption before generating an image." }, { status: 400 });
  if (!process.env.GEMINI_API_KEY) return Response.json({ error: "Gemini image generation is not configured." }, { status: 503 });

  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";
  try {
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: geminiImagePrompt(parsed.data) }] }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio: imageAspectRatio(parsed.data.format), imageSize: "1K" },
        },
      }),
      signal: AbortSignal.timeout(90_000),
    });
    const body = await upstream.json() as GeminiImageResponse;
    if (!upstream.ok) throw new Error(body.error?.message || `Gemini image request failed (${upstream.status}).`);
    const image = body.candidates?.flatMap((candidate) => candidate.content?.parts ?? []).find((part) => part.inlineData?.data)?.inlineData;
    if (!image?.data) throw new Error("Gemini returned no image.");
    const mimeType = image.mimeType && ["image/png", "image/jpeg", "image/webp"].includes(image.mimeType) ? image.mimeType : "image/png";
    const bytes = Uint8Array.from(Buffer.from(image.data, "base64"));
    return new Response(bytes, { headers: { "Content-Type": mimeType, "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Gemini image generation failed." }, { status: 502 });
  }
}
