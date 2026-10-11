import { requireStaff } from "@/lib/supabase/auth";
import { decodeHtmlEntities } from "@/lib/text/html";

export async function GET(request: Request) {
  const { context, response } = await requireStaff();
  if (!context) return response;
  const url = new URL(request.url);
  const verification = url.searchParams.get("verification");
  let query = context.supabase.from("news_items").select("*").order("discovered_at", { ascending: false }).limit(100);
  if (verification && verification !== "all") query = query.eq("verification_status", verification);
  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const categoryIds = [...new Set((data ?? []).map((item) => item.category_id).filter(Boolean))] as string[];
  const categories = categoryIds.length ? await context.supabase.from("categories").select("id,name").in("id", categoryIds) : { data: [] };
  const names = new Map((categories.data ?? []).map((category) => [category.id, category.name]));
  return Response.json({ items: (data ?? []).map((item) => ({ ...item, headline: decodeHtmlEntities(item.headline), summary: item.summary ? decodeHtmlEntities(item.summary) : null, category_name: item.category_id ? names.get(item.category_id) : "செய்திகள்" })) });
}
