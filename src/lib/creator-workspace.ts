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

export type ReviewStatus =
  | "Not Reviewed"
  | "Flagged for Second Look"
  | "Approved to Send"
  | "Skip";

export const REVIEW_STATUSES: ReviewStatus[] = [
  "Not Reviewed",
  "Flagged for Second Look",
  "Approved to Send",
  "Skip",
];

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

export const SURVIVAL_FLAVORS = [
  "Vanilla",
  "Chocolate",
  "Strawberry",
  "Butterscotch",
  "Banana",
  "Blueberry",
  "Cherry",
] as const;
export type SurvivalFlavor = (typeof SURVIVAL_FLAVORS)[number];

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

  // Sample product & note (used by Shipping tab)
  productRequested: SurvivalFlavor | null;
  quantity: number | null;
  shippingNote: string | null;


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

  // Rena's structured review pass (per creator).
  reviewStatus: ReviewStatus;
  // Rena's personal bookmark — manual, independent of the review pass.
  importantFlag: boolean;
  importantNote: string | null;

  activity: Activity[];

  // --- v6: contact log, content pieces, deal & ROI ---
  contactAttempts: ContactAttempt[];
  contentPieces: ContentPiece[];
  contentStatus: ContentStatus | null;
  contentDeadline: string | null;

  dealType: DealType;
  sampleCostUsd: number | null;
  shippingCostUsd: number | null;
  flatFeeUsd: number | null;
  commissionRate: number | null;      // 0..1
  commissionSalesUsd: number | null;
  payoutNotes: string | null;
  totalCostUsd: number | null;        // derived on save

  revenueAttributedUsd: number | null;
  roiRatio: number | null;            // revenue / total_cost
  roiUpdatedAt: string | null;
}

export type ContactChannel = "email" | "dm" | "call" | "in_person" | "other";
export type ContactDirection = "outbound" | "inbound";
export interface ContactAttempt {
  id: string;
  at: string;                          // ISO date
  channel: ContactChannel;
  direction: ContactDirection;
  subject?: string | null;
  summary: string;
  actor?: string | null;               // free-text (name)
  actorRole?: string | null;
  gmailMessageId?: string | null;
  gmailThreadId?: string | null;
}

export type ContentPlatform = "instagram" | "tiktok" | "youtube" | "facebook" | "blog" | "podcast" | "other";
export type ContentFormat = "post" | "reel" | "story" | "video" | "short" | "live" | "article" | "episode" | "other";
export type ContentStatus = "not_promised" | "promised" | "in_progress" | "delivered" | "published" | "verified";
export interface ContentPiece {
  id: string;
  platform: ContentPlatform;
  format: ContentFormat;
  url: string | null;
  postedAt: string | null;             // ISO date
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  estReach: number | null;
  metricsUpdatedAt: string | null;
  notes: string | null;
}

export type DealType = "gifted" | "flat_fee" | "commission" | "hybrid" | "none";

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

    emailOverride: null,

    savedGmailDraft: null,

    shippingName: null,
    shippingCompany: null,
    shippingAddress1: null,
    shippingAddress2: null,
    shippingCity: null,
    shippingState: null,
    shippingPostalCode: null,
    shippingCountry: null,
    carrier: null,
    productRequested: null,
    quantity: null,
    shippingNote: null,


    doNotContact: false,
    activity: activity.sort((a, b) => a.at.localeCompare(b.at)),

    contactAttempts: [],
    contentPieces: [],
    contentStatus: null,
    contentDeadline: null,
    dealType: "gifted",
    sampleCostUsd: null,
    shippingCostUsd: null,
    flatFeeUsd: null,
    commissionRate: null,
    commissionSalesUsd: null,
    payoutNotes: null,
    totalCostUsd: null,
    revenueAttributedUsd: null,
    roiRatio: null,
    roiUpdatedAt: null,
  };
}

// ---------- Store ----------
// Team-shared: source of truth is public.creator_workspace in Supabase.
// This module keeps a synchronous in-memory cache that is hydrated from DB
// on app boot (see `hydrateWorkspaceFromDB` below) so every callsite that
// reads workspace state synchronously continues to work. Writes update the
// cache immediately (optimistic) and asynchronously upsert to the DB.
//
// The old localStorage key is kept ONLY as a source for the one-time
// migration to the DB (see `migrateLegacyLocalWorkspace`); after successful
// migration it is deleted so the cache is DB-driven going forward.
const LS_KEY = "st.creator-workspace.v1";
const MIGRATED_FLAG = "st.workspace.migrated.v1";
type Overrides = Partial<CreatorWorkspace>;
type StoreShape = Record<string, Overrides>;

function readLegacyLS(): StoreShape {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as StoreShape) : {};
  } catch { return {}; }
}

// Cache starts empty; hydration fills it. If the browser had legacy
// localStorage data, we seed the cache from it too so the UI is not blank
// before hydration finishes — the boot flow uploads that data to the DB.
let cache: StoreShape = readLegacyLS();
const listeners = new Set<() => void>();
let hydrated = false;

function emit() {
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

// Convert CreatorWorkspace overrides (camelCase) <-> DB row (snake_case).
const CAMEL_TO_SNAKE: Record<string, string> = {
  assignedTo: "assigned_to",
  assignedDate: "assigned_date",
  currentOwner: "current_owner",
  outreachStatus: "outreach_status",
  contactMethod: "contact_method",
  emailDraftCreated: "email_draft_created",
  emailSent: "email_sent",
  dateSent: "date_sent",
  lastContactDate: "last_contact_date",
  emailOverride: "email_override",
  nextFollowUpDate: "next_follow_up_date",
  followUpCount: "follow_up_count",
  waitingForReply: "waiting_for_reply",
  noResponse: "no_response",
  responded: "responded",
  gmailMessageId: "gmail_message_id",
  gmailThreadId: "gmail_thread_id",
  gmailConfirmedAt: "gmail_confirmed_at",
  savedGmailDraft: "saved_gmail_draft",
  sampleRequired: "sample_required",
  addressReceived: "address_received",
  sampleShipped: "sample_shipped",
  trackingNumber: "tracking_number",
  deliveryStatus: "delivery_status",
  shippingName: "shipping_name",
  shippingCompany: "shipping_company",
  shippingAddress1: "shipping_address1",
  shippingAddress2: "shipping_address2",
  shippingCity: "shipping_city",
  shippingState: "shipping_state",
  shippingPostalCode: "shipping_postal_code",
  shippingCountry: "shipping_country",
  carrier: "carrier",
  productRequested: "product_requested",
  quantity: "quantity",
  shippingNote: "shipping_note",

  contentPromised: "content_promised",
  contentReceived: "content_received",
  publishedPlatforms: "published_platforms",
  publishDate: "publish_date",
  teamNotes: "team_notes",
  aiRecommendation: "ai_recommendation",
  researchNotes: "research_notes",
  executiveNotes: "executive_notes",
  activity: "activity",
  createdBy: "created_by",
  createdByRole: "created_by_role",
  lastModifiedBy: "last_modified_by",
  lastModifiedByRole: "last_modified_by_role",
  lastModifiedAt: "last_modified_at",
  lastActivityBy: "last_activity_by",
  supervisor: "supervisor",
  doNotContact: "do_not_contact",
  contactAttempts: "contact_attempts",
  contentPieces: "content_pieces",
  contentStatus: "content_status",
  contentDeadline: "content_deadline",
  dealType: "deal_type",
  sampleCostUsd: "sample_cost_usd",
  shippingCostUsd: "shipping_cost_usd",
  flatFeeUsd: "flat_fee_usd",
  commissionRate: "commission_rate",
  commissionSalesUsd: "commission_sales_usd",
  payoutNotes: "payout_notes",
  totalCostUsd: "total_cost_usd",
  revenueAttributedUsd: "revenue_attributed_usd",
  roiRatio: "roi_ratio",
  roiUpdatedAt: "roi_updated_at",
};
const SNAKE_TO_CAMEL: Record<string, string> = Object.fromEntries(
  Object.entries(CAMEL_TO_SNAKE).map(([k, v]) => [v, k]),
);

function overridesToRow(id: string, ov: Overrides): Record<string, unknown> {
  const out: Record<string, unknown> = { creator_id: id };
  for (const [k, v] of Object.entries(ov)) {
    const col = CAMEL_TO_SNAKE[k];
    if (col) out[col] = v as unknown;
  }
  return out;
}
function rowToOverrides(row: Record<string, unknown>): Overrides {
  const out: Overrides = {};
  for (const [k, v] of Object.entries(row)) {
    if (k === "creator_id" || k === "created_at" || k === "updated_at") continue;
    const cam = SNAKE_TO_CAMEL[k];
    if (cam) (out as Record<string, unknown>)[cam] = v;
  }
  return out;
}

// Persist to DB (fire-and-forget; errors surface via console + optional toast).
async function persistToDB(id: string, patch: Overrides) {
  if (typeof window === "undefined") return;
  try {
    const mod = await import("./creator-workspace.functions");
    const row = overridesToRow(id, { ...cache[id], ...patch });
    await mod.upsertWorkspace({ data: { patch: row as never } });
  } catch (e) {
    console.error("[creator-workspace] persistToDB failed", id, e);
  }
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
  void persistToDB(id, stamped);
}

// ---------- Boot hydration + one-time localStorage migration ----------
export async function hydrateWorkspaceFromDB(): Promise<void> {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const mod = await import("./creator-workspace.functions");
    const { rows } = await mod.listWorkspaces();
    const next: StoreShape = { ...cache };
    for (const r of rows) {
      const id = (r as Record<string, unknown>).creator_id as string;
      // DB wins over any pre-hydration localStorage snapshot.
      next[id] = rowToOverrides(r as Record<string, unknown>);
    }
    cache = next;
    emit();
    await migrateLegacyLocalWorkspace();
  } catch (e) {
    console.error("[creator-workspace] hydrateWorkspaceFromDB failed", e);
  }
}

async function migrateLegacyLocalWorkspace(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(MIGRATED_FLAG)) return;
    const legacy = readLegacyLS();
    if (Object.keys(legacy).length === 0) {
      window.localStorage.setItem(MIGRATED_FLAG, new Date().toISOString());
      return;
    }
    // Convert camelCase overrides to snake_case rows for the server.
    const overrides: Record<string, Record<string, unknown>> = {};
    for (const [id, ov] of Object.entries(legacy)) overrides[id] = overridesToRow(id, ov);
    const mod = await import("./creator-workspace.functions");
    const result = await mod.migrateLocalWorkspace({ data: { overrides } });
    // Record any conflicts for the Settings review banner.
    if (result.conflicted && result.conflicted.length > 0) {
      window.localStorage.setItem(
        "st.workspace.migration.conflicts.v1",
        JSON.stringify(result.conflicted),
      );
    }
    window.localStorage.setItem(MIGRATED_FLAG, new Date().toISOString());
    window.localStorage.removeItem(LS_KEY);
    // Re-hydrate to reflect merged DB state.
    const { rows } = await mod.listWorkspaces();
    const next: StoreShape = {};
    for (const r of rows) {
      const id = (r as Record<string, unknown>).creator_id as string;
      next[id] = rowToOverrides(r as Record<string, unknown>);
    }
    cache = next;
    emit();
  } catch (e) {
    console.error("[creator-workspace] migrateLegacyLocalWorkspace failed", e);
  }
}

export function getWorkspaceMigrationConflicts(): Array<{ creatorId: string; field: string; local: unknown; db: unknown }> {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("st.workspace.migration.conflicts.v1");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
export function clearWorkspaceMigrationConflicts() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("st.workspace.migration.conflicts.v1");
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
  logContactAttempt(c, {
    channel: "email",
    direction: "outbound",
    subject: args.subject,
    summary: `Sent Gmail (${args.stageLabel ?? "outreach"})`,
    at: today,
    gmailMessageId: args.messageId,
    gmailThreadId: args.threadId,
  });
  updateWorkspace(c.id, { nextFollowUpDate: nextFollow });
}

// ---------- Contact attempts, content, and ROI helpers ----------

function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function logContactAttempt(c: CreatorRow, ev: Omit<ContactAttempt, "id" | "at"> & { at?: string }) {
  const ws = getWorkspace(c);
  const actor = getCurrentActor();
  const next: ContactAttempt = {
    id: uid("ca"),
    at: ev.at ?? new Date().toISOString(),
    channel: ev.channel,
    direction: ev.direction,
    subject: ev.subject ?? null,
    summary: ev.summary,
    actor: ev.actor ?? actor?.name ?? null,
    actorRole: ev.actorRole ?? actor?.roleLabel ?? null,
    gmailMessageId: ev.gmailMessageId ?? null,
    gmailThreadId: ev.gmailThreadId ?? null,
  };
  updateWorkspace(c.id, { contactAttempts: [...ws.contactAttempts, next] });
  return next;
}

export function removeContactAttempt(c: CreatorRow, id: string) {
  const ws = getWorkspace(c);
  updateWorkspace(c.id, { contactAttempts: ws.contactAttempts.filter((x) => x.id !== id) });
}

export function addContentPiece(c: CreatorRow, piece: Omit<ContentPiece, "id">) {
  const ws = getWorkspace(c);
  const next: ContentPiece = { id: uid("cp"), ...piece };
  updateWorkspace(c.id, { contentPieces: [...ws.contentPieces, next] });
  recomputeRoi(c);
  return next;
}

export function updateContentPiece(c: CreatorRow, id: string, patch: Partial<ContentPiece>) {
  const ws = getWorkspace(c);
  updateWorkspace(c.id, {
    contentPieces: ws.contentPieces.map((x) => (x.id === id ? { ...x, ...patch, metricsUpdatedAt: new Date().toISOString() } : x)),
  });
  recomputeRoi(c);
}

export function removeContentPiece(c: CreatorRow, id: string) {
  const ws = getWorkspace(c);
  updateWorkspace(c.id, { contentPieces: ws.contentPieces.filter((x) => x.id !== id) });
  recomputeRoi(c);
}

export function computeTotalCost(w: CreatorWorkspace): number {
  return (w.sampleCostUsd ?? 0) + (w.shippingCostUsd ?? 0) + (w.flatFeeUsd ?? 0)
    + ((w.commissionRate ?? 0) * (w.commissionSalesUsd ?? 0));
}

export function recomputeRoi(c: CreatorRow) {
  const w = getWorkspace(c);
  const total = computeTotalCost(w);
  const rev = w.revenueAttributedUsd ?? 0;
  const ratio = total > 0 ? rev / total : null;
  updateWorkspace(c.id, {
    totalCostUsd: total || null,
    roiRatio: ratio,
    roiUpdatedAt: new Date().toISOString(),
  });
}

export function rollupRoi(): { totalSpend: number; totalRevenue: number; avgRoi: number | null; withDeals: number } {
  let spend = 0, rev = 0, deals = 0, ratios = 0, ratioCount = 0;
  for (const id of Object.keys(cache)) {
    const ov = cache[id];
    const t = (ov.totalCostUsd ?? 0);
    const r = (ov.revenueAttributedUsd ?? 0);
    if (t > 0 || r > 0) { deals += 1; spend += t; rev += r; }
    if (typeof ov.roiRatio === "number") { ratios += ov.roiRatio; ratioCount += 1; }
  }
  return { totalSpend: spend, totalRevenue: rev, avgRoi: ratioCount ? ratios / ratioCount : null, withDeals: deals };
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
