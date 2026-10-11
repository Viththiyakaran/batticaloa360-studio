import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { tamilArticlePrompt, tamilCaptionPrompt } from "@/lib/ai/prompts";

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
};

const schema = z.object({
  type: z.enum(["caption", "article"]),
  item: z.object({ id:z.string(), headline:z.string().min(3), sourceName:z.string().min(1), sourceUrl:z.string().url(), publishedAt:z.string().nullable(), discoveredAt:z.string(), category:z.string(), summary:z.string().min(3), verificationStatus:z.enum(["unverified","verified","outdated","unverifiable"]) })
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid source material." }, { status: 400 });
  const { item, type } = parsed.data;
  const prompt = type === "caption" ? tamilCaptionPrompt(item) : tamilArticlePrompt(item);
  if (process.env.GEMINI_API_KEY) {
    try {
      const model = process.env.GEMINI_TEXT_MODEL || "gemini-3.8-flash";
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
        signal: AbortSignal.timeout(45_000),
      });
      const body = await response.json() as GeminiResponse;
      if (!response.ok) throw new Error(body.error?.message || `Gemini request failed (${response.status}).`);
      const text = body.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
      if (!text) throw new Error("Gemini returned an empty response.");
      return NextResponse.json({ mode: "gemini", content: JSON.parse(text.replace(/^\`\`\`json\s*|\s*\`\`\`$/g, "")) });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Gemini generation failed." }, { status: 502 });
    }
  }
  if (process.env.OPENAI_API_KEY) {
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await client.responses.create({ model: process.env.OPENAI_TEXT_MODEL || "gpt-5-mini", input: prompt });
      const text = response.output_text.replace(/^```json\s*|\s*```$/g, "");
      return NextResponse.json({ mode: "live", content: JSON.parse(text) });
    } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "AI generation failed." }, { status: 502 }); }
  }
  if (type === "caption") return NextResponse.json({ mode: "mock", content: { headline: item.headline, caption: `${item.summary}\n\nமேலதிக தகவல்களுக்கு மூல இணைப்பைப் பார்வையிடவும்: ${item.sourceName}\n${item.sourceUrl}`, hashtags: ["#Batticaloa360", `#${item.category}`, "#மட்டக்களப்பு"], question: "இந்தத் தகவல் குறித்து உங்கள் கருத்து என்ன?" } });
  return NextResponse.json({ mode: "mock", content: { title: item.headline, introduction: item.summary, sections: [{ heading: "முக்கிய தகவல்", body: "கிடைக்கப்பெற்ற மூலத் தகவலின் அடிப்படையில் இந்தச் செய்தி தயாரிக்கப்பட்டுள்ளது. மேலதிக விவரங்கள் உறுதிப்படுத்தப்பட்ட பின்னர் இப்பகுதி புதுப்பிக்கப்பட வேண்டும்." }], attribution: `மூலம்: ${item.sourceName} — ${item.sourceUrl}`, labels: [item.category, "மட்டக்களப்பு"], searchDescription: item.summary.slice(0, 150) } });
}
