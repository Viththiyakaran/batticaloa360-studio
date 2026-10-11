export type VerificationStatus = "unverified" | "verified" | "outdated" | "unverifiable";
export type WorkflowStatus = "Discovered" | "Unverified" | "Verified" | "Draft" | "Ready for Review" | "Approved" | "Published" | "Failed" | "Archived";

export interface NewsItem {
  id: string;
  headline: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string | null;
  discoveredAt: string;
  category: string;
  summary: string;
  verificationStatus: VerificationStatus;
  thumbnail?: string;
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  type: "rss" | "website" | "api";
  active: boolean;
  lastCheckedAt: string | null;
}

export const categories = ["வாழ்வியல்", "வரலாற்றுவியல்", "அரசியல்", "சுற்றுலாவியல்", "உணவியல்", "செய்திகள்", "கல்வி", "வேலைவாய்ப்பு", "ஆலயங்கள்", "பண்பாடு", "விளையாட்டு", "இளைஞர்கள்", "நிகழ்வுகள்"];

export const seedNews: NewsItem[] = [
  {
    id: "demo-1",
    headline: "மட்டக்களப்பில் புதிய சமூக நூலகத் திட்டம் அறிவிப்பு",
    sourceName: "Batticaloa360 Demo Source",
    sourceUrl: "https://batticaloa360.blogspot.com/",
    publishedAt: "2026-10-11T07:30:00.000Z",
    discoveredAt: "2026-10-11T08:00:00.000Z",
    category: "கல்வி",
    summary: "இது அபிவிருத்தி சூழலுக்கான மாதிரி செய்தி. உண்மையான உள்ளடக்கமாக வெளியிட வேண்டாம்.",
    verificationStatus: "unverified",
  },
  {
    id: "demo-2",
    headline: "கிழக்கு மாகாண சுற்றுலா வழித்தடங்கள் பற்றிய தகவல் தொகுப்பு",
    sourceName: "Batticaloa360 Archive",
    sourceUrl: "https://batticaloa360.blogspot.com/",
    publishedAt: "2026-10-10T10:00:00.000Z",
    discoveredAt: "2026-10-10T10:20:00.000Z",
    category: "சுற்றுலாவியல்",
    summary: "சுற்றுலாப் பயணிகளுக்கான தகவல் வழிகாட்டி உருவாக்க ஏற்ற பின்னணி குறிப்புகள்.",
    verificationStatus: "verified",
  },
];
