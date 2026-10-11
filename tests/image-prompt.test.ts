import { describe, expect, it } from "vitest";
import { geminiImagePrompt, imageAspectRatio } from "@/lib/ai/image";

describe("Gemini editorial image prompts", () => {
  it("maps studio formats to supported image aspect ratios", () => {
    expect(imageAspectRatio("square")).toBe("1:1");
    expect(imageAspectRatio("portrait")).toBe("4:5");
    expect(imageAspectRatio("story")).toBe("9:16");
    expect(imageAspectRatio("blogger")).toBe("16:9");
  });

  it("grounds the background and reserves text and branding for the compositor", () => {
    const prompt = geminiImagePrompt({ caption: "Batticaloa lagoon clean-up", headline: "குளம் சுத்தம்", category: "Community" });
    expect(prompt).toContain("Batticaloa lagoon clean-up");
    expect(prompt).toContain("Do not render any words");
    expect(prompt).toContain("logos");
    expect(prompt).toContain("editorial illustration");
  });
});
