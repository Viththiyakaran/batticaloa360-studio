import { describe, expect, it } from "vitest";
import { tamilArticlePrompt, tamilCaptionPrompt } from "@/lib/ai/prompts";
import { seedNews } from "@/lib/types";

describe("grounded Tamil generation prompts", () => {
  it("includes source evidence and anti-fabrication constraints", () => {
    const prompt = tamilCaptionPrompt(seedNews[0]);
    expect(prompt).toContain(seedNews[0].sourceUrl);
    expect(prompt).toContain("Never invent facts");
    expect(prompt).toContain(seedNews[0].headline);
  });
  it("requires attribution and original article copy", () => {
    const prompt = tamilArticlePrompt(seedNews[1]);
    expect(prompt).toContain("Do not copy a source article");
    expect(prompt).toContain(seedNews[1].sourceName);
  });
});
