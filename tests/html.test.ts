import { describe, expect, it } from "vitest";
import { decodeHtmlEntities, decodeHtmlValue } from "@/lib/text/html";

describe("HTML entity decoding", () => {
  it("decodes decimal and hexadecimal Tamil entities", () => {
    expect(decodeHtmlEntities("&#2949;&#2990;&#3021; &#xBA4;&#xBAE;&#xBBF;&#xBB4;&#xBCD;")).toBe("அம் தமிழ்");
  });

  it("decodes double-escaped and common named entities", () => {
    expect(decodeHtmlEntities("Batticaloa &amp;amp; Tamil &amp;#3021; &ndash; update")).toBe("Batticaloa & Tamil ் – update");
  });

  it("normalizes nested persisted editor content", () => {
    expect(decodeHtmlValue({ editorContent: { headline: "&#2980;&#2990;&#3007;&#2996;&#3021;" } })).toEqual({ editorContent: { headline: "தமிழ்" } });
  });
});
