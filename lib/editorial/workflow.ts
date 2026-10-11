export const workflowStatuses = ["draft", "ready_for_review", "approved", "archived"] as const;

export type EditorialStatus = (typeof workflowStatuses)[number];

const transitions: Record<EditorialStatus, readonly EditorialStatus[]> = {
  draft: ["ready_for_review", "archived"],
  ready_for_review: ["draft", "approved", "archived"],
  approved: ["ready_for_review", "archived"],
  archived: ["draft"],
};

export function isEditorialStatus(value: unknown): value is EditorialStatus {
  return typeof value === "string" && workflowStatuses.includes(value as EditorialStatus);
}

export function canTransition(from: EditorialStatus, to: EditorialStatus) {
  return from === to || transitions[from].includes(to);
}

export function statusLabel(status: EditorialStatus) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function nextVersion(rows: Array<{ version: number }> | null | undefined) {
  return Math.max(0, ...(rows ?? []).map((row) => row.version)) + 1;
}

export function currentVersions<T extends { news_item_id: string | null; platform: string; version: number; created_at: string }>(rows: T[]) {
  const current = new Map<string, T>();
  for (const row of rows) {
    const key = `${row.news_item_id ?? "unlinked"}:${row.platform}`;
    const existing = current.get(key);
    if (!existing || row.version > existing.version || (row.version === existing.version && row.created_at > existing.created_at)) current.set(key, row);
  }
  return [...current.values()];
}

export function imageWorkflowMetadata(value: unknown): Record<string, unknown> & { version: number; workflowStatus: EditorialStatus } {
  const metadata = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return {
    ...metadata,
    version: typeof metadata.version === "number" && Number.isInteger(metadata.version) && metadata.version > 0 ? metadata.version : 1,
    workflowStatus: isEditorialStatus(metadata.workflowStatus) ? metadata.workflowStatus : "draft" as EditorialStatus,
  };
}
