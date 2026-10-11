export type ImageFormat = "square" | "portrait" | "story" | "blogger";

const aspectRatios: Record<ImageFormat, string> = {
  square: "1:1",
  portrait: "4:5",
  story: "9:16",
  blogger: "16:9",
};

export function imageAspectRatio(format: ImageFormat) {
  return aspectRatios[format];
}

export function geminiImagePrompt(input: { caption: string; headline: string; category: string }) {
  return [
    "Create a polished editorial illustration for Batticaloa360, a Sri Lankan Tamil community news publisher.",
    `Story brief: ${input.caption}`,
    `Editorial headline context: ${input.headline}`,
    `Category: ${input.category}`,
    "Depict only details supported by the story brief. Use a culturally respectful Batticaloa and Eastern Sri Lanka visual context when relevant.",
    "This must look like an editorial illustration, not documentary evidence or a photograph of the reported event.",
    "Use a strong composition with a calm, low-detail area through the centre and lower third for a separate headline and publisher mark.",
    "Do not render any words, letters, Tamil or Latin text, numbers, captions, logos, watermarks, signatures, UI, or publisher branding.",
    "Do not portray an identifiable real person unless the brief explicitly describes a public figure; otherwise use anonymous or distant human figures.",
    "Return only the background image.",
  ].join("\n");
}
