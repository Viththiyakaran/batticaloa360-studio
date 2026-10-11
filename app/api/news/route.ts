import { NextResponse } from "next/server";
import { z } from "zod";

const importSchema = z.object({ url: z.string().url().max(2048) });

function isUnsafeHostname(hostname: string) {
  const host = hostname.toLowerCase();
  return host === "localhost" || host.endsWith(".local") || host === "0.0.0.0" || host === "127.0.0.1" || host === "::1" || /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
}

export async function POST(request: Request) {
  const parsed = importSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid public article URL." }, { status: 400 });
  const url = new URL(parsed.data.url);
  if (!["http:", "https:"].includes(url.protocol) || isUnsafeHostname(url.hostname)) return NextResponse.json({ error: "This address is not allowed." }, { status: 400 });
  try {
    const response = await fetch(url, { headers: { "User-Agent": "Batticaloa360Studio/1.0" }, redirect: "error", signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Source returned ${response.status}`);
    const type = response.headers.get("content-type") ?? "";
    if (!type.includes("text/html") && !type.includes("xml")) throw new Error("Source is not an article or feed");
    const html = (await response.text()).slice(0, 1_000_000);
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ?? url.hostname;
    const description = html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)/i)?.[1] ?? "Imported source awaiting editorial review.";
    return NextResponse.json({ item: { id: crypto.randomUUID(), headline: title, sourceName: url.hostname.replace(/^www\./, ""), sourceUrl: url.toString(), publishedAt: null, discoveredAt: new Date().toISOString(), category: "செய்திகள்", summary: description.replace(/<[^>]+>/g, "").slice(0, 320), verificationStatus: "unverified" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to fetch source." }, { status: 422 });
  }
}
