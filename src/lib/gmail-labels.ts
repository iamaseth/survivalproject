// Gmail label names automatically created and applied for creator threads.
export const CREATOR_GMAIL_LABELS = [
  "Creator Partnerships",
  "Creator Partnerships/Outreach",
  "Creator Partnerships/Waiting Reply",
  "Creator Partnerships/Campaign",
  "Creator Partnerships/Completed",
] as const;

export type CreatorGmailLabel = (typeof CREATOR_GMAIL_LABELS)[number];

// Map internal workflow stage → Gmail label to apply.
export function labelForStage(stage: string | null | undefined): CreatorGmailLabel {
  const s = (stage ?? "").toLowerCase();
  if (s.includes("complete") || s.includes("partnership")) return "Creator Partnerships/Completed";
  if (s.includes("campaign") || s.includes("negotiat")) return "Creator Partnerships/Campaign";
  if (s.includes("waiting") || s.includes("follow")) return "Creator Partnerships/Waiting Reply";
  if (s.includes("outreach") || s.includes("contact") || s.includes("sent")) return "Creator Partnerships/Outreach";
  return "Creator Partnerships";
}
