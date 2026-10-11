import { NextResponse } from "next/server";
import { z } from "zod";
import { decodeHtmlEntities } from "@/lib/text/html";
import { requireStaff } from "@/lib/supabase/auth";

const importSchema = z.object({ url: z.string().url().max(2048) });

function isUnsafeHostname(hostname: string) {
  const host = hostname.toLowerCase();
  return host === "localhost" || host.endsWith(".local") || host === "0.0.0.0" || host === "127.0.0.1" || host === "::1" || /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
}

export async function POST(request: Request) {
  const { context, response: authResponse } = await requireStaff();
  if (!context) return authResponse;
  const parsed = importSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid public article URL." }, { status: 400 });
  const url = new URL(parsed.data.url);
  if (!["http:", "https:"].includes(url.protocol) || isUnsafeHostname(url.hostname)) return NextResponse.json({ error: "This address is not allowed." }, { status: 400 });
  try {
    const response = await fetch(url, { headers: { "User-Agent": "Batticaloa360Studio/1.0" }, redirect: "error", signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("Source returned " + response.status);
    const type = response.headers.get("content-type") ?? "";
    if (!type.includes("text/html") && !type.includes("xml")) throw new Error("Source is not an article or feed");
    const html = (await response.text()).slice(0, 1_000_000);
    const title = decodeHtmlEntities(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ?? url.hostname);
    const description = html.match(/<meta[^>]+(?:name|property)=[\"'](?:description|og:description)[\"'][^>]+content=[\"']([^\"']+)/i)?.[1] ?? "Imported source awaiting editorial review.";
    const summary = decodeHtmlEntities(description.replace(/<[^>]+>/g, "")).slice(0, 320);
    const bytes = new TextEncoder().encode((title + "|" + summary).toLowerCase());
    const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map((b) => b.toString(16).padStart(2, "0")).join("");
    const category = await context.supabase.from("categories").select("id").eq("slug", "news").single();
    const { data, error } = await context.supabase.from("news_items").insert({
      headline: title,
      source_url: url.toString(),
      canonical_url: url.toString(),
      content_fingerprint: fingerprint,
      summary,
      category_id: category.data?.id ?? null,
      verification_status: "unverified",
      workflow_status: "discovered",
      raw_metadata: { source_name: url.hostname.replace(/^www\./, "") },
    }).select().single();
    if (error) return NextResponse.json({ error: error.code === "23505" ? "This story URL is already in the library." : error.message }, { status: error.code === "23505" ? 409 : 400 });
    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to fetch source." }, { status: 422 });
  }
}
