// Creator Partnerships — operational workspace overlay.
import { useSyncExternalStore } from "react";
import { CREATORS, type CreatorRow, type OutreachOwner } from "./creator-partnerships";
import { getTestMode } from "./test-mode";

// ---------- Types ----------
export type OutreachStatus =
  | "Not Started"
  | "Draft Ready"
  | "Sent"
  | "Follow-up Sent"
  | "Replied"
  | "No Response";

export type DeliveryStatus =
  | "Not Shipped"
  | "Preparing"
  | "In Transit"
  | "Delivered"
  | "Returned"
  | "Failed";

export type ActivityKind =
  | "researched"
  | "assigned_rena"
  | "assigned_vina"
  | "draft_created"
  | "email_sent"
  | "followup_sent"
  | "sample_shipped"
  | "creator_replied"
  | "content_published"
  | "note";

export interface Activity {
  id: string;
  at: string;
  time?: string;
  actor: "SETH" | "RENA" | "VINA" | "PERRY" | "SYSTEM";
  actorName?: string;
  actorRoleLabel?: string;
  actorEmail?: string;
  kind: ActivityKind;
  action: string;
  notes?: string;
  isTest?: boolean;
  testSessionId?: string | null;
  // Confirmed Gmail message metadata (set only when a real send succeeds).
  gmailMessageId?: string;
  gmailThreadId?: string;
}

export interface CurrentActor {
  id: "SETH" | "RENA" | "VINA" | "PERRY";
  name: string;
  roleLabel: string;
  email?: string;
}
let currentActor: CurrentActor | null = null;
export function setCurrentActor(a: CurrentActor | null) { currentActor = a; }
export function getCurrentActor(): CurrentActor | null { return currentActor; }

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export interface SavedGmailDraft {
  draftId: string;
  to: string;
  subject: string;
  body: string;
  updatedAt: string;
}

export interface CreatorWorkspace {
  assignedTo: OutreachOwner;
  assignedDate: string | null;
  currentOwner: OutreachOwner;

  outreachStatus: OutreachStatus;
  contactMethod: string | null;
  emailDraftCreated: boolean;
  emailSent: boolean;
  dateSent: string | null;
  lastContactDate: string | null;

  // Overrides the creator's saved email address when the operator edits
  // "To" inline from the compose panel (e.g. no address on the seed record).
  emailOverride: string | null;

  nextFollowUpDate: string | null;
  followUpCount: number;
  waitingForReply: boolean;
  noResponse: boolean;
  responded: boolean;

  // Confirmed Gmail send tracking — set only after Gmail API returns success.
  gmailMessageId: string | null;
  gmailThreadId: string | null;
  gmailConfirmedAt: string | null;

  // Persisted Gmail draft (via drafts.create). Resumable across sessions.
  savedGmailDraft: SavedGmailDraft | null;

  sampleRequired: boolean;
  addressReceived: boolean;
  sampleShipped: boolean;
  trackingNumber: string | null;
  deliveryStatus: DeliveryStatus;

  // Shipping address workflow
  shippingName: string | null;
  shippingCompany: string | null;
  shippingAddress1: string | null;
  shippingAddress2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
  carrier: string | null;

  contentPromised: string | null;
  contentReceived: boolean;
  publishedPlatforms: string[];
  publishDate: string | null;

  teamNotes: string | null;
  aiRecommendation: string | null;
  researchNotes: string | null;
  executiveNotes: string | null;

  createdBy?: string | null;
  createdByRole?: string | null;
  createdAt?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedByRole?: string | null;
  lastModifiedAt?: string | null;
  lastActivityBy?: string | null;
  supervisor?: string | null;

  doNotContact?: boolean;
  activity: Activity[];
}

// The creator's effective email — inline override takes precedence over seed.
export function effectiveEmail(c: CreatorRow, ws: CreatorWorkspace): string | null {
  return (ws.emailOverride && ws.emailOverride.trim()) || c.email || null;
}


export function defaultsFor(c: CreatorRow): CreatorWorkspace {
  const responded = c.responseState.startsWith("Replied");
  // NOTE: seed-derived waitingForReply is intentionally FALSE here.
  // The unified selector `isWaitingForReply(c, w)` requires a confirmed Gmail
  // send id — the seed has none — so seed data alone never counts as waiting.
  const noResp = !!c.contactedDate && c.responseState === "No Response";

  let outreachStatus: OutreachStatus = "Not Started";
  if (c.contactedDate && responded) outreachStatus = "Replied";
  else if (c.contactedDate && c.responseState === "No Response") outreachStatus = "No Response";
  else if (c.contactedDate) outreachStatus = "Sent";

  let deliveryStatus: DeliveryStatus = "Not Shipped";
  if (c.normalizedSampleStatus === "Delivered") deliveryStatus = "Delivered";
  else if (c.normalizedSampleStatus === "Shipped") deliveryStatus = "In Transit";
  else if (c.normalizedSampleStatus === "Address Received") deliveryStatus = "Preparing";

  const activity: Activity[] = [];
  if (c.lastResearched) {
    activity.push({
      id: `${c.id}-a-res`, at: c.lastResearched, actor: "SETH",
      kind: "researched", action: "Creator researched", notes: c.researchNotes ?? undefined,
    });
  }
  if (c.outreachOwner) {
    activity.push({
      id: `${c.id}-a-asg`,
      at: c.lastResearched ?? c.contactedDate ?? new Date().toISOString().slice(0, 10),
      actor: "RENA",
      kind: c.outreachOwner === "VINA" ? "assigned_vina" : "assigned_rena",
      action: `Assigned to ${c.outreachOwner === "VINA" ? "Vina" : "Rena"}`,
    });
  }
  if (c.contactedDate) {
    activity.push({
      id: `${c.id}-a-sent`, at: c.contactedDate,
      actor: (c.outreachOwner ?? "RENA") as "RENA" | "VINA",
      kind: "email_sent", action: "Outreach email sent (historical, from spreadsheet)",
      notes: c.contactMethod ?? undefined,
    });
  }
  if (responded) {
    activity.push({
      id: `${c.id}-a-rep`, at: c.contactedDate ?? new Date().toISOString().slice(0, 10),
      actor: (c.outreachOwner ?? "RENA") as "RENA" | "VINA",
      kind: "creator_replied", action: "Creator replied", notes: c.responseFollowup ?? undefined,
    });
  }
  if (c.normalizedSampleStatus === "Shipped" || c.normalizedSampleStatus === "Delivered") {
    activity.push({
      id: `${c.id}-a-ship`, at: c.contactedDate ?? new Date().toISOString().slice(0, 10),
      actor: "RENA", kind: "sample_shipped", action: "Sample shipped",
    });
  }

  return {
    assignedTo: c.outreachOwner,
    assignedDate: c.outreachOwner ? c.lastResearched ?? c.contactedDate : null,
    currentOwner: c.outreachOwner,

    outreachStatus,
    contactMethod: c.contactMethod,
    emailDraftCreated: !!c.contactedDate,
    emailSent: !!c.contactedDate,
    dateSent: c.contactedDate,
    lastContactDate: c.contactedDate,

    nextFollowUpDate: c.nextFollowUpDate,
    followUpCount: 0,
    waitingForReply: false,
    noResponse: noResp,
    responded,

    gmailMessageId: null,
    gmailThreadId: null,
    gmailConfirmedAt: null,

    sampleRequired: c.normalizedSampleStatus !== "Not Sent",
    addressReceived: ["Address Received", "Shipped", "Delivered"].includes(c.normalizedSampleStatus),
    sampleShipped: ["Shipped", "Delivered"].includes(c.normalizedSampleStatus),
    trackingNumber: null,
    deliveryStatus,

    contentPromised: null,
    contentReceived: false,
    publishedPlatforms: [],
    publishDate: null,

    teamNotes: c.renaNotes,
    aiRecommendation: c.recommendedOffer,
    researchNotes: c.researchNotes,
    executiveNotes: c.perryComments,

    doNotContact: false,
    activity: activity.sort((a, b) => a.at.localeCompare(b.at)),
  };
}

// ---------- Store ----------
const LS_KEY = "st.creator-workspace.v1";
type Overrides = Partial<CreatorWorkspace>;
type StoreShape = Record<string, Overrides>;

function readLS(): StoreShape {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as StoreShape) : {};
  } catch { return {}; }
}

let cache: StoreShape = readLS();
const listeners = new Set<() => void>();

function emit() {
  if (typeof window !== "undefined") {
    try { window.localStorage.setItem(LS_KEY, JSON.stringify(cache)); } catch { /* ignore */ }
  }
  listeners.forEach((l) => l());
}
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); }
function snapshot() { return cache; }
function serverSnapshot(): StoreShape { return {}; }

export function getWorkspace(c: CreatorRow): CreatorWorkspace {
  const base = defaultsFor(c);
  const ov = cache[c.id];
  if (!ov) return base;
  return {
    ...base,
    ...ov,
    activity: [...base.activity, ...(ov.activity ?? [])].sort((a, b) => a.at.localeCompare(b.at)),
  };
}

export function useWorkspace(c: CreatorRow): CreatorWorkspace {
  useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return getWorkspace(c);
}

export function updateWorkspace(id: string, patch: Overrides) {
  const stamped: Overrides = { ...patch };
  const actor = getCurrentActor();
  if (actor) {
    stamped.lastModifiedBy = actor.name;
    stamped.lastModifiedByRole = actor.roleLabel;
    stamped.lastModifiedAt = new Date().toISOString();
    if (!cache[id]?.createdBy) {
      stamped.createdBy = actor.name;
      stamped.createdByRole = actor.roleLabel;
      stamped.createdAt = new Date().toISOString().slice(0, 10);
    }
  }
  cache = { ...cache, [id]: { ...(cache[id] ?? {}), ...stamped } };
  emit();
}

export function addActivity(c: CreatorRow, ev: Omit<Activity, "id">) {
  const base = defaultsFor(c);
  const existing = cache[c.id]?.activity ?? [];
  const actor = getCurrentActor();
  const tm = getTestMode();
  const enriched: Omit<Activity, "id"> = {
    ...ev,
    time: ev.time ?? nowTime(),
    actorName: ev.actorName ?? (actor?.id === ev.actor ? actor.name : undefined),
    actorRoleLabel: ev.actorRoleLabel ?? (actor?.id === ev.actor ? actor.roleLabel : undefined),
    actorEmail: ev.actorEmail ?? (actor?.id === ev.actor ? actor.email : undefined),
    isTest: ev.isTest ?? tm.enabled,
    testSessionId: ev.testSessionId ?? tm.sessionId,
  };
  const nextExtra: Activity[] = [
    ...existing,
    { ...enriched, id: `${c.id}-a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
  ];
  updateWorkspace(c.id, { activity: nextExtra, lastActivityBy: enriched.actorName ?? ev.actor });

  // IMPORTANT: 'email_sent' from manual logging no longer flips waitingForReply.
  // Only `logConfirmedGmailSend` (called with a real Gmail message id) does.
  if (ev.kind === "email_sent" && ev.gmailMessageId) {
    updateWorkspace(c.id, {
      emailSent: true,
      emailDraftCreated: true,
      dateSent: ev.at,
      lastContactDate: ev.at,
      outreachStatus: "Sent",
      waitingForReply: true,
      responded: false,
      gmailMessageId: ev.gmailMessageId,
      gmailThreadId: ev.gmailThreadId ?? null,
      gmailConfirmedAt: new Date().toISOString(),
    });
  } else if (ev.kind === "email_sent") {
    // Manual log without a confirmed Gmail id — record contact but do NOT
    // claim we're waiting for a reply (there's no message id to tie it to).
    updateWorkspace(c.id, {
      emailSent: true,
      emailDraftCreated: true,
      dateSent: ev.at,
      lastContactDate: ev.at,
      outreachStatus: "Sent",
    });
  } else if (ev.kind === "followup_sent") {
    const cur = getWorkspace(c);
    updateWorkspace(c.id, {
      followUpCount: cur.followUpCount + 1,
      lastContactDate: ev.at,
      outreachStatus: "Follow-up Sent",
    });
  } else if (ev.kind === "creator_replied") {
    updateWorkspace(c.id, {
      responded: true,
      waitingForReply: false,
      noResponse: false,
      outreachStatus: "Replied",
    });
  } else if (ev.kind === "sample_shipped") {
    updateWorkspace(c.id, { sampleShipped: true, deliveryStatus: "In Transit" });
  }
  void base;
}

/**
 * Called ONLY after Gmail returns a confirmed successful send response.
 * This is the single source of truth for flipping `waitingForReply` on.
 */
export function logConfirmedGmailSend(
  c: CreatorRow,
  args: {
    messageId: string;
    threadId: string;
    subject: string;
    at?: string;
    actor?: "RENA" | "VINA" | "SETH" | "PERRY";
    followUpInDays?: number;
    stageLabel?: string;
  },
) {
  const today = args.at ?? new Date().toISOString().slice(0, 10);
  const ws = getWorkspace(c);
  const actor = (args.actor ?? ws.currentOwner ?? "RENA") as "RENA" | "VINA" | "SETH" | "PERRY";
  const followDays = args.followUpInDays ?? 5;
  const nextFollow = (() => {
    const d = new Date(today);
    d.setDate(d.getDate() + followDays);
    return d.toISOString().slice(0, 10);
  })();
  addActivity(c, {
    at: today,
    actor,
    kind: "email_sent",
    action: `Sent Gmail: "${args.subject.slice(0, 80)}"`,
    notes: args.stageLabel ? `Gmail label: ${args.stageLabel}` : undefined,
    gmailMessageId: args.messageId,
    gmailThreadId: args.threadId,
  });
  updateWorkspace(c.id, { nextFollowUpDate: nextFollow });
}

// ---------- Shared Waiting-for-Reply selector (single source of truth) ----------
/**
 * A creator counts as "Waiting for Reply" only when ALL are true:
 *  - a confirmed Gmail send exists (gmailMessageId is set)
 *  - workspace flag waitingForReply is true
 *  - the creator hasn't replied
 *  - Perry hasn't declined
 *  - relationship isn't marked do-not-contact
 *  - workflow isn't completed (published content / active partnership)
 *  - delivery hasn't failed
 */
export function isWaitingForReply(c: CreatorRow, w: CreatorWorkspace): boolean {
  if (!w.gmailMessageId) return false;
  if (!w.emailSent) return false;
  if (!w.waitingForReply) return false;
  if (w.responded) return false;
  if (c.perryApproval === "Declined") return false;
  if (w.doNotContact) return false;
  if (w.publishDate || w.contentReceived) return false;
  if (w.deliveryStatus === "Failed") return false;
  return true;
}

export function waitingForReplyCreators(): CreatorRow[] {
  return CREATORS.filter((c) => isWaitingForReply(c, getWorkspace(c)));
}

// ---------- Reset / backup helpers ----------
export function exportWorkspaceSnapshot(): StoreShape {
  return JSON.parse(JSON.stringify(cache)) as StoreShape;
}
export function isTestCreatorId(id: string, name?: string): boolean {
  if (id.startsWith("TEST-")) return true;
  if (name && /^TEST\s*[–-]/i.test(name)) return true;
  return false;
}
export function workspaceOverrideCount(): number { return Object.keys(cache).length; }
export function workspaceActivityCounts(sessionId?: string | null): { total: number; test: number } {
  let total = 0, test = 0;
  for (const k of Object.keys(cache)) {
    const acts = cache[k].activity ?? [];
    total += acts.length;
    for (const a of acts) {
      if (a.isTest && (sessionId ? a.testSessionId === sessionId : true)) test++;
    }
  }
  return { total, test };
}
export function clearAllWorkspace() { cache = {}; emit(); }
export function clearWorkspaceForIds(ids: string[]) {
  const set = new Set(ids);
  const next: StoreShape = {};
  for (const k of Object.keys(cache)) if (!set.has(k)) next[k] = cache[k];
  cache = next; emit();
}
export function clearTestActivities(sessionId?: string | null): number {
  let removed = 0;
  const next: StoreShape = {};
  for (const k of Object.keys(cache)) {
    const ov = cache[k];
    const acts = ov.activity ?? [];
    const kept = acts.filter((a) => {
      const isMatch = a.isTest && (sessionId ? a.testSessionId === sessionId : true);
      if (isMatch) removed += 1;
      return !isMatch;
    });
    next[k] = { ...ov, activity: kept };
  }
  cache = next; emit();
  return removed;
}

// ---------- Reconciliation for stale waiting-for-reply overrides ----------
export interface ReconcilePreview {
  scanned: number;
  staleOverrides: Array<{ id: string; name?: string; reason: string }>;
  waitingWithConfirmedSend: number;
}

export function previewReconcileWaitingForReply(): ReconcilePreview {
  const preview: ReconcilePreview = { scanned: 0, staleOverrides: [], waitingWithConfirmedSend: 0 };
  for (const c of CREATORS) {
    const ov = cache[c.id];
    if (!ov) continue;
    preview.scanned++;
    const merged = getWorkspace(c);
    const claimsWaiting =
      ov.waitingForReply === true || ov.emailSent === true || ov.outreachStatus === "Sent";
    if (claimsWaiting && !ov.gmailMessageId) {
      preview.staleOverrides.push({
        id: c.id,
        name: c.name,
        reason: "Claims sent/waiting but no confirmed Gmail message id",
      });
    } else if (isWaitingForReply(c, merged)) {
      preview.waitingWithConfirmedSend++;
    }
  }
  return preview;
}

/**
 * Remove stale waiting-for-reply state from localStorage overrides that
 * cannot be tied to a confirmed Gmail message id. Preserves creator research
 * data — this only touches operational workflow fields on the overlay.
 */
export function reconcileWaitingForReply(): { corrected: number; kept: number } {
  let corrected = 0, kept = 0;
  const next: StoreShape = {};
  for (const [id, ov] of Object.entries(cache)) {
    const cloned: Overrides = { ...ov };
    const claimsWaiting =
      cloned.waitingForReply === true || cloned.emailSent === true || cloned.outreachStatus === "Sent";
    if (claimsWaiting && !cloned.gmailMessageId) {
      cloned.waitingForReply = false;
      cloned.emailSent = false;
      cloned.dateSent = null;
      cloned.lastContactDate = null;
      cloned.outreachStatus = "Not Started";
      corrected++;
    } else if (cloned.waitingForReply && cloned.gmailMessageId) {
      kept++;
    }
    next[id] = cloned;
  }
  cache = next; emit();
  return { corrected, kept };
}

// ---------- Dashboard derivations ----------
function todayISO() { return new Date().toISOString().slice(0, 10); }

export function dashboardCounts() {
  const today = todayISO();
  let readyForOutreach = 0, rena = 0, vina = 0, waiting = 0;
  let followUpDueToday = 0, samplePending = 0, activePartnerships = 0;

  for (const c of CREATORS) {
    const w = getWorkspace(c);
    if (!w.emailSent && w.assignedTo && c.perryApproval !== "Declined") readyForOutreach++;
    if (w.assignedTo === "RENA") rena++;
    if (w.assignedTo === "VINA") vina++;
    if (isWaitingForReply(c, w)) waiting++;
    if (w.nextFollowUpDate && w.nextFollowUpDate <= today && !w.responded) followUpDueToday++;
    if (w.sampleRequired && !["Delivered", "Returned", "Failed"].includes(w.deliveryStatus)) samplePending++;
    if (w.responded && (w.sampleShipped || w.contentReceived || w.publishedPlatforms.length > 0)) activePartnerships++;
  }

  return { readyForOutreach, rena, vina, waiting, followUpDueToday, samplePending, activePartnerships };
}

export function useDashboardCounts() {
  useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return dashboardCounts();
}
