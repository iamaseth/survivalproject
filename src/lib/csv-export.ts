// CSV export helpers. Everything runs in the browser — the rows are already
// loaded in memory, so no server round-trip is needed.
import type { CreatorRow } from "@/lib/creator-partnerships";
import { amazonStatus } from "@/lib/creator-partnerships";
import { getWorkspace } from "@/lib/creator-workspace";

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = Array.isArray(value) ? value.join(" | ") : String(value);
  // Guard against spreadsheet formula injection on =, +, -, @ leading chars.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((r) => r.map(escapeCell).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  // BOM keeps Excel happy with UTF-8 characters in creator names.
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function timestampedFilename(base: string): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${base}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.csv`;
}

const CREATOR_EXPORT_COLUMNS: { header: string; get: (c: CreatorRow) => unknown }[] = [
  { header: "ID", get: (c) => c.id },
  { header: "Name", get: (c) => c.name },
  { header: "Segment", get: (c) => c.segment },
  { header: "Primary platforms", get: (c) => c.primaryPlatforms },
  { header: "Email", get: (c) => c.email },
  { header: "Contact route", get: (c) => c.contactRoute },
  { header: "Priority", get: (c) => c.priority },
  { header: "Amazon", get: (c) => amazonStatus(c.amazon) },
  { header: "Amazon (raw)", get: (c) => c.amazon },
  { header: "Research status", get: (c) => c.researchStatus },
  { header: "Last researched", get: (c) => c.lastResearched },
  { header: "Owner", get: (c) => c.outreachOwner },
  { header: "Supervisor", get: (c) => c.supervisor },
  { header: "Perry approval", get: (c) => c.perryApproval },
  { header: "Response state", get: (c) => c.responseState },
  { header: "Sample status", get: (c) => c.normalizedSampleStatus },
  { header: "Recommended offer", get: (c) => c.recommendedOffer },
  { header: "Partnership tier", get: (c) => c.partnershipTier },
  { header: "Followers signal", get: (c) => c.followersSignal },
  { header: "Geography", get: (c) => c.geography },
  { header: "Instagram", get: (c) => c.instagram },
  { header: "TikTok", get: (c) => c.tiktok },
  { header: "YouTube", get: (c) => c.youtube },
  { header: "Facebook", get: (c) => c.facebook },
];

const WORKSPACE_EXPORT_COLUMNS: { header: string; get: (c: CreatorRow) => unknown }[] = [
  { header: "Assigned to", get: (c) => getWorkspace(c).assignedTo },
  { header: "Outreach status", get: (c) => getWorkspace(c).outreachStatus },
  { header: "Review status", get: (c) => getWorkspace(c).reviewStatus },
  { header: "Important", get: (c) => (getWorkspace(c).importantFlag ? "Yes" : "") },
  { header: "Important note", get: (c) => getWorkspace(c).importantNote },
  { header: "Email sent", get: (c) => (getWorkspace(c).emailSent ? "Yes" : "") },
  { header: "Date sent", get: (c) => getWorkspace(c).dateSent },
  { header: "Last contact", get: (c) => getWorkspace(c).lastContactDate },
  { header: "Next follow-up", get: (c) => getWorkspace(c).nextFollowUpDate },
  { header: "Follow-up count", get: (c) => getWorkspace(c).followUpCount },
  { header: "Waiting for reply", get: (c) => (getWorkspace(c).waitingForReply ? "Yes" : "") },
  { header: "Responded", get: (c) => (getWorkspace(c).responded ? "Yes" : "") },
  { header: "Product requested", get: (c) => getWorkspace(c).productRequested },
  { header: "Quantity", get: (c) => getWorkspace(c).quantity },
  { header: "Shipping note", get: (c) => getWorkspace(c).shippingNote },
  { header: "Sample shipped", get: (c) => (getWorkspace(c).sampleShipped ? "Yes" : "") },
  { header: "Carrier", get: (c) => getWorkspace(c).carrier },
  { header: "Tracking number", get: (c) => getWorkspace(c).trackingNumber },
  { header: "Delivery status", get: (c) => getWorkspace(c).deliveryStatus },
  { header: "Ship to name", get: (c) => getWorkspace(c).shippingName },
  { header: "Address 1", get: (c) => getWorkspace(c).shippingAddress1 },
  { header: "Address 2", get: (c) => getWorkspace(c).shippingAddress2 },
  { header: "City", get: (c) => getWorkspace(c).shippingCity },
  { header: "State", get: (c) => getWorkspace(c).shippingState },
  { header: "Postal code", get: (c) => getWorkspace(c).shippingPostalCode },
  { header: "Country", get: (c) => getWorkspace(c).shippingCountry },
  { header: "Content status", get: (c) => getWorkspace(c).contentStatus },
  { header: "Content received", get: (c) => (getWorkspace(c).contentReceived ? "Yes" : "") },
  { header: "Publish date", get: (c) => getWorkspace(c).publishDate },
  { header: "Deal type", get: (c) => getWorkspace(c).dealType },
  { header: "Total cost (USD)", get: (c) => getWorkspace(c).totalCostUsd },
  { header: "Revenue attributed (USD)", get: (c) => getWorkspace(c).revenueAttributedUsd },
  { header: "ROI ratio", get: (c) => getWorkspace(c).roiRatio },
  { header: "Team notes", get: (c) => getWorkspace(c).teamNotes },
];

/** Full creator + workspace export for the rows currently in view. */
export function creatorsToCsv(rows: CreatorRow[]): string {
  const cols = [...CREATOR_EXPORT_COLUMNS, ...WORKSPACE_EXPORT_COLUMNS];
  return toCsv(cols.map((c) => c.header), rows.map((r) => cols.map((c) => c.get(r))));
}

/** Shorter shipping-oriented export for pick-and-pack. */
export function shippingToCsv(rows: CreatorRow[]): string {
  const cols = [
    CREATOR_EXPORT_COLUMNS[0],
    CREATOR_EXPORT_COLUMNS[1],
    { header: "Email", get: (c: CreatorRow) => c.email },
    ...WORKSPACE_EXPORT_COLUMNS.filter((c) =>
      ["Product requested", "Quantity", "Shipping note", "Ship to name", "Address 1", "Address 2", "City", "State", "Postal code", "Country", "Carrier", "Tracking number", "Delivery status", "Sample shipped"].includes(c.header),
    ),
  ];
  return toCsv(cols.map((c) => c.header), rows.map((r) => cols.map((c) => c.get(r))));
}

export function exportCreatorsCsv(rows: CreatorRow[], base = "creators") {
  downloadCsv(timestampedFilename(base), creatorsToCsv(rows));
}

export function exportShippingCsv(rows: CreatorRow[]) {
  downloadCsv(timestampedFilename("shipping-list"), shippingToCsv(rows));
}
