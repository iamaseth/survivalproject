// Workflow intelligence — derives the current stage, recommended next action,
// context-appropriate primary actions, and relationship health from a creator
// row + workspace overlay. Pure functions so the UI just renders.
import type { CreatorRow } from "./creator-partnerships";
import { addActivity, updateWorkspace, type CreatorWorkspace } from "./creator-workspace";

export type Stage =
  | "Research Complete"
  | "Ready for Outreach"
  | "Waiting for Reply"
  | "Follow-up Due"
  | "Negotiating"
  | "Sample Requested"
  | "Sample Shipped"
  | "Content Pending"
  | "Content Published"
  | "Active Partnership"
  | "Inactive";

export type Health = "Active" | "Warm" | "Cooling" | "Inactive";

const DAY = 86_400_000;
const todayISO = () => new Date().toISOString().slice(0, 10);
const addDaysISO = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export function daysBetween(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((t - today.getTime()) / DAY);
}

export function timeAgo(iso: string | null): string {
  const d = daysBetween(iso);
  if (d === null) return "—";
  if (d === 0) return "today";
  if (d === -1) return "yesterday";
  if (d < 0) return `${-d} days ago`;
  return `in ${d} days`;
}

export function computeStage(c: CreatorRow, ws: CreatorWorkspace): Stage {
  if (c.responseState === "Replied — Declined" || ws.deliveryStatus === "Failed") return "Inactive";
  if (ws.publishDate || ws.publishedPlatforms.length > 0) {
    return ws.sampleShipped || ws.contentReceived ? "Active Partnership" : "Content Published";
  }
  if (ws.contentReceived) return "Content Published";
  if (ws.deliveryStatus === "Delivered") return "Content Pending";
  if (ws.sampleShipped || ws.deliveryStatus === "In Transit") return "Sample Shipped";
  if (ws.sampleRequired && (ws.addressReceived || ws.deliveryStatus === "Preparing")) return "Sample Requested";
  if (ws.responded) return ws.sampleRequired ? "Sample Requested" : "Negotiating";
  if (ws.emailSent) {
    const overdue = ws.nextFollowUpDate && ws.nextFollowUpDate <= todayISO();
    return overdue ? "Follow-up Due" : "Waiting for Reply";
  }
  if (ws.emailDraftCreated || ws.assignedTo) return "Ready for Outreach";
  if (c.lastResearched || c.researchStatus) return "Research Complete";
  return "Ready for Outreach";
}

export function nextAction(stage: Stage): string {
  switch (stage) {
    case "Research Complete": return "Assign to Rena to begin outreach.";
    case "Ready for Outreach": return "Draft the initial outreach email.";
    case "Waiting for Reply": return "Waiting for creator response — follow up if no reply within 5 days.";
    case "Follow-up Due": return "Send the follow-up email now.";
    case "Negotiating": return "Confirm the offer and request shipping address.";
    case "Sample Requested": return "Ship the product sample once address is confirmed.";
    case "Sample Shipped": return "Monitor delivery, then confirm receipt with the creator.";
    case "Content Pending": return "Follow up on promised content deliverables.";
    case "Content Published": return "Review published content and log the link.";
    case "Active Partnership": return "Maintain relationship — check in monthly.";
    case "Inactive": return "No action needed. Revisit in a future cycle.";
  }
}

export function stageTone(stage: Stage): string {
  switch (stage) {
    case "Active Partnership":
    case "Content Published":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Sample Shipped":
    case "Sample Requested":
    case "Negotiating":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Follow-up Due":
      return "bg-red-100 text-red-800 border-red-200";
    case "Waiting for Reply":
    case "Content Pending":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "Ready for Outreach":
      return "bg-[color:var(--gold)]/25 text-[color:var(--forest)] border-[color:var(--gold)]/40";
    case "Inactive":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
}

export function relationshipHealth(c: CreatorRow, ws: CreatorWorkspace): Health {
  if (c.responseState === "Replied — Declined" || ws.deliveryStatus === "Failed") return "Inactive";
  if (ws.publishDate || ws.contentReceived || ws.deliveryStatus === "Delivered") return "Active";
  const lastDays = daysBetween(ws.lastContactDate ?? ws.dateSent);
  if (ws.responded && (lastDays === null || lastDays >= -14)) return "Active";
  if (ws.responded) return "Warm";
  if (!ws.emailSent) return "Warm";
  if (lastDays !== null && lastDays <= -14) return "Inactive";
  if (lastDays !== null && lastDays <= -7) return "Cooling";
  return "Warm";
}

export function healthTone(h: Health): string {
  switch (h) {
    case "Active": return "bg-emerald-100 text-emerald-800";
    case "Warm": return "bg-amber-100 text-amber-800";
    case "Cooling": return "bg-orange-100 text-orange-800";
    case "Inactive": return "bg-red-100 text-red-800";
  }
}

export function healthDot(h: Health): string {
  switch (h) {
    case "Active": return "🟢";
    case "Warm": return "🟡";
    case "Cooling": return "🟠";
    case "Inactive": return "🔴";
  }
}

// ---------- Primary actions ----------
export interface PrimaryAction {
  id: string;
  label: string;
  variant: "primary" | "secondary";
  run?: () => void;
  // When set, WorkflowCard treats the action as a jump to another tab on the
  // creator detail page (no state mutation, no Gmail bypass).
  jumpTo?: "communications" | "shipping" | "content";
}

function actor(ws: CreatorWorkspace): "RENA" | "VINA" {
  return (ws.currentOwner ?? "RENA") as "RENA" | "VINA";
}

export function primaryActions(c: CreatorRow, ws: CreatorWorkspace, stage: Stage): PrimaryAction[] {
  const today = todayISO();
  const a = actor(ws);

  // No state-mutating "Create Draft" / "Send Email" / "Send Follow-up" buttons
  // here — those must go through the real Gmail flow in the Communications
  // tab, which is the single source of a confirmed gmailMessageId (the only
  // thing that flips waitingForReply on).
  const goToComms: PrimaryAction = {
    id: "go-comms",
    label: "Go to Communications",
    variant: "primary",
    jumpTo: "communications",
  };
  const logReply: PrimaryAction = {
    id: "reply",
    label: "Log Reply",
    variant: "secondary",
    run: () => addActivity(c, { at: today, actor: a, kind: "creator_replied", action: "Creator replied" }),
  };
  const requestAddress: PrimaryAction = {
    id: "address",
    label: "Request Address",
    variant: "primary",
    run: () => {
      updateWorkspace(c.id, { sampleRequired: true });
      addActivity(c, { at: today, actor: a, kind: "note", action: "Requested shipping address" });
    },
  };
  const approveSample: PrimaryAction = {
    id: "approve",
    label: "Approve Sample",
    variant: "secondary",
    run: () => {
      updateWorkspace(c.id, { sampleRequired: true, addressReceived: true, deliveryStatus: "Preparing" });
      addActivity(c, { at: today, actor: a, kind: "note", action: "Sample approved for shipping" });
    },
  };
  const shipSample: PrimaryAction = {
    id: "ship",
    label: "Ship Sample",
    variant: "primary",
    run: () => {
      updateWorkspace(c.id, { sampleShipped: true, deliveryStatus: "In Transit" });
      addActivity(c, {
        at: today,
        actor: a,
        kind: "sample_shipped",
        action: "Sample shipped",
        notes: ws.trackingNumber ? `Tracking ${ws.trackingNumber}` : undefined,
      });
    },
  };
  const markDelivered: PrimaryAction = {
    id: "delivered",
    label: "Mark Delivered",
    variant: "secondary",
    run: () => {
      updateWorkspace(c.id, { deliveryStatus: "Delivered" });
      addActivity(c, { at: today, actor: a, kind: "note", action: "Sample delivered" });
    },
  };
  const contentReceived: PrimaryAction = {
    id: "received",
    label: "Content Received",
    variant: "primary",
    run: () => {
      updateWorkspace(c.id, { contentReceived: true });
      addActivity(c, { at: today, actor: a, kind: "note", action: "Content received from creator" });
    },
  };
  const markPublished: PrimaryAction = {
    id: "published",
    label: "Mark Published",
    variant: "primary",
    run: () => {
      updateWorkspace(c.id, { contentReceived: true, publishDate: today });
      addActivity(c, { at: today, actor: a, kind: "content_published", action: "Content published" });
    },
  };
  const goToShipping: PrimaryAction = {
    id: "go-shipping",
    label: "Open Shipping tab",
    variant: "secondary",
    jumpTo: "shipping",
  };

  switch (stage) {
    case "Research Complete":
    case "Ready for Outreach":
      return [goToComms];
    case "Waiting for Reply":
      return [logReply, goToComms];
    case "Follow-up Due":
      return [goToComms, logReply];
    case "Negotiating":
      return [requestAddress, goToShipping];
    case "Sample Requested":
      return [shipSample, approveSample];
    case "Sample Shipped":
      return [markDelivered, contentReceived];
    case "Content Pending":
      return [contentReceived, markPublished];
    case "Content Published":
    case "Active Partnership":
      return [markPublished, contentReceived];
    case "Inactive":
      return [];
  }
}

