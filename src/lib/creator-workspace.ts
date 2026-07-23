// Creator Partnerships — operational workspace overlay.
// Extends CreatorRow (imported from Google Sheet) with editable workflow fields:
// Assignment, Outreach, Follow-up, Shipping, Content, Internal Notes, Activity Timeline.
//
// Persisted in localStorage. Field names & shapes mirror what will become Supabase
// tables so we can swap the store later without touching the UI.
import { useSyncExternalStore } from "react";
import { CREATORS, type CreatorRow, type OutreachOwner } from "./creator-partnerships";

// ---------- Types (future Supabase schema) ----------
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
  at: string; // ISO date  (yyyy-mm-dd)
  time?: string; // HH:mm — populated for real-time entries
  actor: "SETH" | "RENA" | "VINA" | "PERRY" | "SYSTEM";
  actorName?: string;        // "Vina Nguyen"
  actorRoleLabel?: string;   // "Partnership Coordinator"
  actorEmail?: string;
  kind: ActivityKind;
  action: string; // short label
  notes?: string;
}

// ---------- Current actor injection ----------
// AppShell pushes the signed-in user here after Google auth resolves so the
// workspace store can auto-populate created_by / last_modified_by / activity
// author fields without every call-site knowing about auth.
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

export interface CreatorWorkspace {
  // Assignment
  assignedTo: OutreachOwner; // Rena | Vina | null
  assignedDate: string | null;
  currentOwner: OutreachOwner;

  // Outreach
  outreachStatus: OutreachStatus;
  contactMethod: string | null; // Email / DM / Call
  emailDraftCreated: boolean;
  emailSent: boolean;
  dateSent: string | null;
  lastContactDate: string | null;

  // Follow-up
  nextFollowUpDate: string | null;
  followUpCount: number;
  waitingForReply: boolean;
  noResponse: boolean;
  responded: boolean;

  // Shipping
  sampleRequired: boolean;
  addressReceived: boolean;
  sampleShipped: boolean;
  trackingNumber: string | null;
  deliveryStatus: DeliveryStatus;

  // Content
  contentPromised: string | null;
  contentReceived: boolean;
  publishedPlatforms: string[]; // e.g. ["Instagram","YouTube"]
  publishDate: string | null;

  // Internal notes
  teamNotes: string | null;
  aiRecommendation: string | null;
  researchNotes: string | null;
  executiveNotes: string | null; // Perry

  // Activity timeline
  activity: Activity[];
}

// ---------- Defaults derived from existing sheet row ----------
export function defaultsFor(c: CreatorRow): CreatorWorkspace {
  const responded = c.responseState.startsWith("Replied");
  const waiting = !!c.contactedDate && !responded && c.responseState !== "Bounced";
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
      id: `${c.id}-a-res`,
      at: c.lastResearched,
      actor: "SETH",
      kind: "researched",
      action: "Creator researched",
      notes: c.researchNotes ?? undefined,
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
      id: `${c.id}-a-sent`,
      at: c.contactedDate,
      actor: (c.outreachOwner ?? "RENA") as "RENA" | "VINA",
      kind: "email_sent",
      action: "Outreach email sent",
      notes: c.contactMethod ?? undefined,
    });
  }
  if (responded) {
    activity.push({
      id: `${c.id}-a-rep`,
      at: c.contactedDate ?? new Date().toISOString().slice(0, 10),
      actor: (c.outreachOwner ?? "RENA") as "RENA" | "VINA",
      kind: "creator_replied",
      action: "Creator replied",
      notes: c.responseFollowup ?? undefined,
    });
  }
  if (c.normalizedSampleStatus === "Shipped" || c.normalizedSampleStatus === "Delivered") {
    activity.push({
      id: `${c.id}-a-ship`,
      at: c.contactedDate ?? new Date().toISOString().slice(0, 10),
      actor: "RENA",
      kind: "sample_shipped",
      action: "Sample shipped",
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
    waitingForReply: waiting,
    noResponse: noResp,
    responded,

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

    activity: activity.sort((a, b) => a.at.localeCompare(b.at)),
  };
}

// ---------- Store (localStorage-backed, reactive) ----------
const LS_KEY = "st.creator-workspace.v1";

type Overrides = Partial<CreatorWorkspace>;
type StoreShape = Record<string, Overrides>;

function readLS(): StoreShape {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as StoreShape) : {};
  } catch {
    return {};
  }
}

let cache: StoreShape = readLS();
const listeners = new Set<() => void>();

function emit() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(cache));
    } catch {
      /* ignore quota */
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function snapshot() {
  return cache;
}

function serverSnapshot(): StoreShape {
  return {};
}

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
  cache = { ...cache, [id]: { ...(cache[id] ?? {}), ...patch } };
  emit();
}

export function addActivity(c: CreatorRow, ev: Omit<Activity, "id">) {
  const base = defaultsFor(c);
  const existing = cache[c.id]?.activity ?? [];
  const nextExtra: Activity[] = [
    ...existing,
    { ...ev, id: `${c.id}-a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
  ];
  updateWorkspace(c.id, { activity: nextExtra });
  // touch derived counts too
  if (ev.kind === "email_sent") {
    updateWorkspace(c.id, {
      emailSent: true,
      emailDraftCreated: true,
      dateSent: ev.at,
      lastContactDate: ev.at,
      outreachStatus: "Sent",
      waitingForReply: true,
      responded: false,
    });
  } else if (ev.kind === "followup_sent") {
    const cur = getWorkspace(c);
    updateWorkspace(c.id, {
      followUpCount: cur.followUpCount + 1,
      lastContactDate: ev.at,
      outreachStatus: "Follow-up Sent",
      waitingForReply: true,
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
  // suppress unused base
  void base;
}

// ---------- Dashboard derivations ----------
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function dashboardCounts() {
  const today = todayISO();
  let readyForOutreach = 0;
  let rena = 0;
  let vina = 0;
  let waiting = 0;
  let followUpDueToday = 0;
  let samplePending = 0;
  let activePartnerships = 0;

  for (const c of CREATORS) {
    const w = getWorkspace(c);
    if (!w.emailSent && w.assignedTo && c.perryApproval !== "Declined") readyForOutreach++;
    if (w.assignedTo === "RENA") rena++;
    if (w.assignedTo === "VINA") vina++;
    if (w.waitingForReply) waiting++;
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
