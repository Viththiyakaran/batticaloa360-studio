import type { NewsItem } from "@/lib/types";

export function tamilCaptionPrompt(item: NewsItem) {
  return `You are a careful Sri Lankan Tamil editor. Create a Facebook post from only the supplied source notes. Never invent facts, dates, quotations or numbers. Clearly attribute the source. Return JSON with keys headline, caption, hashtags (array), question.\n\nSource headline: ${item.headline}\nSource: ${item.sourceName}\nURL: ${item.sourceUrl}\nPublished: ${item.publishedAt ?? "Unknown; do not infer"}\nNotes: ${item.summary}`;
}

export function tamilArticlePrompt(item: NewsItem) {
  return `You are a careful Sri Lankan Tamil editor. Draft an original, concise Blogger article in natural Sri Lankan Tamil using only these notes. Do not copy a source article or invent facts. Return JSON with keys title, introduction, sections (array of {heading,body}), attribution, labels (array), searchDescription.\n\nSource headline: ${item.headline}\nSource: ${item.sourceName}\nURL: ${item.sourceUrl}\nPublished: ${item.publishedAt ?? "Unknown; do not infer"}\nNotes: ${item.summary}`;
}
