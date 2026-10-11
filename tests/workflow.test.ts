import { describe, expect, it } from "vitest";
import { canTransition, currentVersions, imageWorkflowMetadata, nextVersion } from "@/lib/editorial/workflow";

describe("persistent editorial workflow", () => {
  it("allows review transitions but prevents direct draft approval", () => {
    expect(canTransition("draft", "ready_for_review")).toBe(true);
    expect(canTransition("ready_for_review", "approved")).toBe(true);
    expect(canTransition("draft", "approved")).toBe(false);
  });

  it("allocates the next immutable version", () => {
    expect(nextVersion([])).toBe(1);
    expect(nextVersion([{ version: 1 }, { version: 4 }, { version: 2 }])).toBe(5);
  });

  it("selects the latest post for each story and platform", () => {
    const rows = [
      { id: "a", news_item_id: "story", platform: "facebook", version: 1, created_at: "2026-01-01" },
      { id: "b", news_item_id: "story", platform: "facebook", version: 2, created_at: "2026-01-02" },
      { id: "c", news_item_id: "story", platform: "blogger", version: 1, created_at: "2026-01-01" },
    ];
    expect(currentVersions(rows).map((row) => row.id).sort()).toEqual(["b", "c"]);
  });

  it("normalizes legacy image metadata", () => {
    expect(imageWorkflowMetadata({ headline: "Test" })).toMatchObject({ headline: "Test", version: 1, workflowStatus: "draft" });
    expect(imageWorkflowMetadata({ version: 3, workflowStatus: "approved" })).toMatchObject({ version: 3, workflowStatus: "approved" });
  });
});
