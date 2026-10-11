import { describe, expect, it } from "vitest";
import { tamilArticlePrompt, tamilCaptionPrompt } from "@/lib/ai/prompts";
import type { NewsItem } from "@/lib/types";

const story: NewsItem = {
  id: "story-test",
  headline: "மட்டக்களப்பு செய்தி",
  sourceName: "Verified local source",
  sourceUrl: "https://example.com/batticaloa-story",
  publishedAt: "2026-10-10T10:00:00.000Z",
  discoveredAt: "2026-10-10T10:20:00.000Z",
  category: "செய்திகள்",
  summary: "சோதனைக்கான மூலச் செய்திச் சுருக்கம்.",
  verificationStatus: "verified",
};

describe("grounded Tamil generation prompts", () => {
  it("includes source evidence and anti-fabrication constraints", () => {
    const prompt = tamilCaptionPrompt(story);
    expect(prompt).toContain(story.sourceUrl);
    expect(prompt).toContain("Never invent facts");
    expect(prompt).toContain(story.headline);
  });

  it("requires attribution and original article copy", () => {
    const prompt = tamilArticlePrompt(story);
    expect(prompt).toContain("Do not copy a source article");
    expect(prompt).toContain(story.sourceName);
  });
});
