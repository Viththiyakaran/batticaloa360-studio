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
