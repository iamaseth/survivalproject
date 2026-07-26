// Personalized team workspace for Creator Partnerships.
// The panel changes what it shows based on the mock-authenticated team
// member: Seth (research), Rena (team lead), Vina (outreach), Perry
// (executive). Every list is derived from the existing CREATORS seed +
// creator-workspace store — no new persistence, no field renames.
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  CREATORS,
  priorityTone,
  type CreatorRow,
} from "@/lib/creator-partnerships";
import {
  getWorkspace,
  useDashboardCounts,
  addActivity,
  updateWorkspace,
  isWaitingForReply,
  type CreatorWorkspace,
} from "@/lib/creator-workspace";
import {
  computeStage,
  nextAction,
  primaryActions,
  relationshipHealth,
  healthDot,
  healthTone,
  stageTone,
  timeAgo,
  type Stage,
} from "@/lib/creator-workflow";
import {
  useCurrentTeamMember,
  type TeamMember,
  type TeamMemberId,
} from "@/lib/current-team-member";
import {
  AlertCircle,
  Bell,
  CalendarClock,
  ChevronRight,
  Clock,
  Handshake,
  Mail,
  MessageSquare,
  Package,
  Truck,
  UserCheck,
} from "lucide-react";

const todayISO = () => new Date().toISOString().slice(0, 10);
const monthStartISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

// ---------- Selectors per role ----------
function creatorsOwnedBy(id: TeamMemberId): CreatorRow[] {
  if (id === "RENA" || id === "VINA") {
    return CREATORS.filter((c) => {
      const w = getWorkspace(c);
      return (w.currentOwner ?? c.outreachOwner) === id;
    });
  }
  if (id === "SETH") {
    // Seth "owns" research — creators without contact or missing info.
    return CREATORS.filter((c) => !c.contactedDate);
  }
  // Perry — all creators (read access)
  return CREATORS;
}

function isMissingInfo(c: CreatorRow): boolean {
  return !c.email || !c.segment || !c.primaryPlatforms || !c.researchStatus;
}

// ---------- Notifications ----------
export interface Notification {
  id: string;
  kind: "overdue" | "reply" | "delivered" | "published" | "assigned" | "shipping";
  message: string;
  creator: CreatorRow;
  at: string;
  icon: React.ComponentType<{ className?: string }>;
}

function buildNotifications(member: TeamMember): Notification[] {
  const list: Notification[] = [];
  const today = todayISO();

  for (const c of CREATORS) {
    const w = getWorkspace(c);
    const owner = w.currentOwner ?? c.outreachOwner;
    // Only surface if relevant to this member.
    const relevant =
      member.id === "PERRY" ||
      (member.id === "SETH" && !c.contactedDate) ||
      owner === member.id;
    if (!relevant) continue;

    if (w.nextFollowUpDate && w.nextFollowUpDate <= today && !w.responded) {
      list.push({
        id: `${c.id}-overdue`,
        kind: "overdue",
        message: `Follow-up overdue for ${c.name}`,
        creator: c,
        at: w.nextFollowUpDate,
        icon: AlertCircle,
      });
    }
    const recentReply = w.activity.find((a) => a.kind === "creator_replied");
    if (recentReply) {
      list.push({
        id: `${c.id}-reply`,
        kind: "reply",
        message: `${c.name} replied`,
        creator: c,
        at: recentReply.at,
        icon: MessageSquare,
      });
    }
    if (w.deliveryStatus === "Delivered") {
      list.push({
        id: `${c.id}-delivered`,
        kind: "delivered",
        message: `Sample delivered to ${c.name}`,
        creator: c,
        at: w.lastContactDate ?? today,
        icon: Package,
      });
    }
    if (w.publishDate) {
      list.push({
        id: `${c.id}-pub`,
        kind: "published",
        message: `${c.name} published content`,
        creator: c,
        at: w.publishDate,
        icon: Handshake,
      });
    }
    if (w.sampleShipped && w.deliveryStatus === "In Transit") {
      const sent = w.activity.find((a) => a.kind === "sample_shipped");
      if (sent) {
        const daysSince = Math.round((Date.now() - new Date(sent.at).getTime()) / 86_400_000);
        if (daysSince > 7) {
          list.push({
            id: `${c.id}-ship-late`,
            kind: "shipping",
            message: `Shipment to ${c.name} in transit ${daysSince} days`,
            creator: c,
            at: sent.at,
            icon: Truck,
          });
        }
      }
    }
  }

  return list.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
}

// ---------- Activity feed ----------
interface FeedEvent {
  at: string;
  actor: string;
  action: string;
  notes?: string;
  creator: CreatorRow;
}

function buildActivityFeed(member: TeamMember): FeedEvent[] {
  const events: FeedEvent[] = [];
  for (const c of CREATORS) {
    const w = getWorkspace(c);
    const owner = w.currentOwner ?? c.outreachOwner;
    const relevant =
      member.id === "PERRY" ||
      (member.id === "SETH" && !c.contactedDate) ||
      owner === member.id;
    if (!relevant) continue;
    for (const a of w.activity) {
      events.push({ at: a.at, actor: a.actor, action: a.action, notes: a.notes, creator: c });
    }
  }
  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
}

// ---------- Metrics ----------
function metricsFor(member: TeamMember, ops: ReturnType<typeof useDashboardCounts>) {
  const mine = creatorsOwnedBy(member.id);
  const today = todayISO();
  const monthStart = monthStartISO();

  let followUpsDue = 0;
  let waiting = 0;
  let inTransit = 0;
  let contentPending = 0;
  let publishedThisMonth = 0;
  let active = 0;
  let healthy = 0;

  for (const c of mine) {
    const w = getWorkspace(c);
    if (w.nextFollowUpDate && w.nextFollowUpDate <= today && !w.responded) followUpsDue++;
    if (isWaitingForReply(c, w)) waiting++;
    if (w.deliveryStatus === "In Transit") inTransit++;
    if (w.deliveryStatus === "Delivered" && !w.contentReceived) contentPending++;
    if (w.publishDate && w.publishDate >= monthStart) publishedThisMonth++;
    const h = relationshipHealth(c, w);
    if (h === "Active") { active++; healthy++; }
    else if (h === "Warm") healthy++;
  }

  return {
    assigned: mine.length,
    active,
    followUpsDue,
    waiting,
    inTransit,
    contentPending,
    publishedThisMonth,
    healthPct: mine.length ? Math.round((healthy / mine.length) * 100) : 0,
    ops,
  };
}

// ---------- Component ----------
export function PersonalizedDashboard() {
  const member = useCurrentTeamMember();
  const ops = useDashboardCounts();

  const metrics = useMemo(() => metricsFor(member, ops), [member, ops]);
  const myQueue = useMemo(() => creatorsOwnedBy(member.id), [member]);
  const notifications = useMemo(() => buildNotifications(member), [member]);
  const feed = useMemo(() => buildActivityFeed(member), [member]);

  return (
    <section className="mb-6 space-y-4">
      {/* Signed-in identity chip (mock switcher removed — real Google auth) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/10 p-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            {member.avatarUrl ? (
              <img src={member.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--forest)] text-xs font-medium text-primary-foreground">
                {member.initials}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[color:var(--gold)]/10 bg-emerald-500" />
          </div>
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--forest)]">Signed in as</div>
            <div className="font-display text-lg">
              {member.name} · <span className="text-sm text-muted-foreground">{member.title}</span>
            </div>
            {member.email ? (
              <div className="text-[11px] text-muted-foreground">{member.email}</div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Role-specific hero row */}
      <RoleHero member={member} metrics={metrics} />

      {/* Queue widget kept for Seth (Research queue) only.
          Perry: removed — he uses the full Creators list directly.
          Rena / Vina: removed — the Creators list opens pre-filtered to
          "Owner = me" from the sidebar / landing redirect, so a preview
          widget just adds a scroll-past step. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {member.id === "SETH" ? (
          <MyQueue member={member} queue={myQueue} />
        ) : (
          <div />
        )}

        <div className="space-y-4">
          <NotificationsPanel items={notifications} />
          <ActivityFeed events={feed} />
        </div>
      </div>
    </section>
  );
}

// ---------- Role hero ----------
function RoleHero({ member, metrics }: { member: TeamMember; metrics: ReturnType<typeof metricsFor> }) {
  const cards = roleMetricCards(member, metrics);
  return (
    <div>
      <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-[color:var(--gold)]">
        {roleEyebrow(member)}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <MetricCard key={c.label} {...c} />
        ))}
      </div>
    </div>
  );
}

function roleEyebrow(m: TeamMember): string {
  switch (m.id) {
    case "SETH": return "Research console — creators to qualify & enrich";
    case "RENA": return "Team lead console — partnerships, escalations & shipping";
    case "VINA": return "Outreach console — today's messages & follow-ups";
    case "PERRY": return "Executive overview — pipeline, growth & team performance";
  }
}

interface Card { label: string; value: number | string; tone?: "warn" | "alert" | "ready" }

function roleMetricCards(m: TeamMember, x: ReturnType<typeof metricsFor>): Card[] {
  const ops = x.ops;
  switch (m.id) {
    case "VINA":
      return [
        { label: "Ready for outreach", value: ops.readyForOutreach, tone: "ready" },
        { label: "Follow-up due today", value: x.followUpsDue, tone: "alert" },
        { label: "Waiting for reply", value: x.waiting, tone: "warn" },
        { label: "My creators", value: x.assigned },
        { label: "Active partnerships", value: x.active, tone: "ready" },
        { label: "Relationship health", value: `${x.healthPct}%` },
      ];
    case "RENA":
      return [
        { label: "High-priority", value: CREATORS.filter((c) => c.priority === "🔴 High").length, tone: "alert" },
        { label: "Negotiations", value: CREATORS.filter((c) => {
            const w = getWorkspace(c); return computeStage(c, w) === "Negotiating";
          }).length },
        { label: "Shipping queue", value: ops.samplePending },
        { label: "Follow-up due today", value: ops.followUpDueToday, tone: "alert" },
        { label: "Vina workload", value: ops.vina },
        { label: "Active partnerships", value: ops.activePartnerships, tone: "ready" },
      ];
    case "SETH":
      return [
        { label: "Research queue", value: CREATORS.filter((c) => !c.lastResearched).length, tone: "warn" },
        { label: "Missing info", value: CREATORS.filter(isMissingInfo).length, tone: "warn" },
        { label: "Missing emails", value: CREATORS.filter((c) => !c.email).length },
        { label: "AI recs pending", value: CREATORS.filter((c) => !c.recommendedOffer).length },
        { label: "Recently added", value: CREATORS.filter((c) => c.lastResearched && c.lastResearched >= monthStartISO()).length, tone: "ready" },
        { label: "Ready for outreach", value: ops.readyForOutreach, tone: "ready" },
      ];
    case "PERRY":
      return [
        { label: "Active partnerships", value: ops.activePartnerships, tone: "ready" },
        { label: "Creator pipeline", value: CREATORS.length },
        { label: "Published this month", value: x.publishedThisMonth, tone: "ready" },
        { label: "Waiting for reply", value: ops.waiting },
        { label: "Rena workload", value: ops.rena },
        { label: "Vina workload", value: ops.vina },
      ];
  }
}

function MetricCard({ label, value, tone }: Card) {
  const border =
    tone === "alert" ? "border-red-300 bg-red-50/60" :
    tone === "warn"  ? "border-amber-300 bg-amber-50/60" :
    tone === "ready" ? "border-emerald-300 bg-emerald-50/60" :
    "border-border bg-card";
  return (
    <div className={`rounded-lg border p-3 ${border}`}>
      <div className="font-display text-2xl leading-none text-foreground">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

// ---------- My Queue ----------
function MyQueue({ member, queue }: { member: TeamMember; queue: CreatorRow[] }) {
  const items = useMemo(() => {
    return queue
      .map((c) => {
        const w = getWorkspace(c);
        const stage = computeStage(c, w);
        return { c, w, stage, health: relationshipHealth(c, w) };
      })
      .sort((a, b) => {
        const rank: Record<string, number> = {
          "Follow-up Due": 0, "Ready for Outreach": 1, "Sample Requested": 2,
          "Negotiating": 3, "Sample Shipped": 4, "Content Pending": 5,
          "Waiting for Reply": 6, "Content Published": 7, "Active Partnership": 8,
          "Research Complete": 9, "Inactive": 10,
        };
        return (rank[a.stage] ?? 99) - (rank[b.stage] ?? 99);
      })
      .slice(0, 8);
  }, [queue]);

  const title = member.id === "PERRY" ? "Creator pipeline" : member.id === "SETH" ? "Research queue" : "My Creator Queue";

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-[color:var(--forest)]" />
          <h3 className="font-display text-lg">{title}</h3>
          <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">{queue.length}</span>
        </div>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Sorted by urgency</span>
      </div>
      {items.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
          No creators in your queue right now.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map(({ c, w, stage, health }) => (
            <QueueRow key={c.id} c={c} w={w} stage={stage} health={health} member={member} />
          ))}
        </ul>
      )}
    </div>
  );
}

function QueueRow({
  c, w, stage, health, member,
}: {
  c: CreatorRow; w: CreatorWorkspace; stage: Stage;
  health: ReturnType<typeof relationshipHealth>; member: TeamMember;
}) {
  const actions = primaryActions(c, w, stage);
  const owner = w.currentOwner ?? c.outreachOwner ?? "Unassigned";
  const canAct = member.id !== "PERRY"; // Perry has read access only

  return (
    <li className="px-4 py-3 hover:bg-secondary/40">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <Link to="/creators/$id" params={{ id: c.id }} className="font-medium hover:text-primary">
            {c.name}
          </Link>
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {c.primaryPlatforms ?? "—"} · Owner: {owner}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex rounded px-2 py-0.5 text-[10px] ${priorityTone(c.priority)}`}>{c.priority ?? "No priority"}</span>
            <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] ${stageTone(stage)}`}>{stage}</span>
            <span className={`inline-flex rounded px-2 py-0.5 text-[10px] ${healthTone(health)}`}>{healthDot(health)} {health}</span>
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground">
          <div>Last contact: <span className="text-foreground">{timeAgo(w.lastContactDate ?? w.dateSent)}</span></div>
          <div>Next follow-up: <span className="text-foreground">{w.nextFollowUpDate ?? "—"}</span></div>
          <div className="mt-1 line-clamp-2 italic">→ {nextAction(stage)}</div>
        </div>
        <div className="flex flex-wrap items-start justify-end gap-1.5">
          {canAct ? actions.slice(0, 2).map((a) => (
            <button
              key={a.id}
              onClick={a.run}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium ${
                a.variant === "primary"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border border-border bg-background hover:bg-secondary"
              }`}
            >
              {a.label}
            </button>
          )) : null}
          <Link
            to="/creators/$id"
            params={{ id: c.id }}
            className="inline-flex items-center gap-0.5 rounded-md border border-border bg-background px-2 py-1 text-[11px] hover:bg-secondary"
          >
            Open <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </li>
  );
}

// ---------- Notifications ----------
function NotificationsPanel({ items }: { items: Notification[] }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[color:var(--forest)]" />
          <h3 className="font-display text-lg">Alerts</h3>
        </div>
        <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-muted-foreground">You're all caught up.</div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((n) => {
            const Icon = n.icon;
            const tone =
              n.kind === "overdue" || n.kind === "shipping" ? "text-red-700" :
              n.kind === "reply" || n.kind === "published" || n.kind === "delivered" ? "text-emerald-700" :
              "text-amber-700";
            return (
              <li key={n.id} className="flex items-start gap-2 px-4 py-2.5 text-xs">
                <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${tone}`} />
                <div className="min-w-0 flex-1">
                  <Link to="/creators/$id" params={{ id: n.creator.id }} className="font-medium hover:text-primary">
                    {n.message}
                  </Link>
                  <div className="text-[10px] text-muted-foreground">{n.at}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------- Activity Feed ----------
function ActivityFeed({ events }: { events: FeedEvent[] }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[color:var(--forest)]" />
          <h3 className="font-display text-lg">Recent activity</h3>
        </div>
      </div>
      {events.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-muted-foreground">No recent activity.</div>
      ) : (
        <ul className="divide-y divide-border">
          {events.map((e, i) => (
            <li key={`${e.creator.id}-${i}`} className="px-4 py-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{e.actor}</span>
                <span className="text-[10px] text-muted-foreground">{e.at}</span>
              </div>
              <div className="text-muted-foreground">
                {e.action} · <Link to="/creators/$id" params={{ id: e.creator.id }} className="hover:text-primary">{e.creator.name}</Link>
              </div>
              {e.notes ? <div className="mt-0.5 text-[11px] italic text-muted-foreground">"{e.notes}"</div> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Re-export helpers for test/debug — silences "unused" if any tree-shaken.
export const __internal = { creatorsOwnedBy, buildNotifications, buildActivityFeed };
// Suppress unused parameter warnings for helpers used in dev.
void addActivity; void updateWorkspace; void Mail; void CalendarClock;
