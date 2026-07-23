import { createFileRoute, Link } from "@tanstack/react-router";
import { assets, decisions, tasks, users, userById, STATUS_ORDER, priorityTone } from "@/lib/mock-data";
import { guides } from "@/lib/knowledge-data";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { ArrowRight, CheckCircle2, Clock, BookOpen } from "lucide-react";


export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const statusCounts = STATUS_ORDER.map((s) => ({ s, n: assets.filter((a) => a.status === s).length })).filter(
    (r) => r.n > 0,
  );
  const awaitingPerry = assets.filter((a) => a.status === "Ready for Boss Review").slice(0, 5);
  const recent = [...assets]
    .flatMap((a) => a.activity.map((ac) => ({ ...ac, asset: a })))
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Overview"
        title="Team Content Hub"
        description="Everything Perry, Rena, Tuan, and Hoang need — routed through review and approval before it leaves the hub."
      />

      {/* Objective card */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-border bg-primary p-8 text-primary-foreground">
          <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-[color:var(--gold)]">Primary objective</div>
          <p className="font-display text-3xl leading-snug">
            Drive qualified traffic and measurable sales to TheSurvivalTabs.com and approved Amazon listings.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-[color:var(--gold)]">Next priority</div>
          <p className="font-display text-xl leading-snug text-foreground">
            Review and approve the first five qualified creator leads for Rena.
          </p>
          <Link
            to="/leads"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Open leads <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Status counts */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Status counts</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {statusCounts.map(({ s, n }) => (
            <div key={s} className="rounded-lg border border-border bg-card p-4">
              <div className="font-display text-3xl text-foreground">{n}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Knowledge Center */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Knowledge Center</h2>
          <Link to="/knowledge" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            Open library <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" /> Total Guides
            </div>
            <div className="mt-1 font-display text-3xl">{guides.length}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Published</div>
            <div className="mt-1 font-display text-3xl">{guides.filter((g) => g.status === "Published").length}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">In Progress</div>
            <div className="mt-1 font-display text-3xl">{guides.filter((g) => g.status !== "Published").length}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Legacy Articles</div>
            <div className="mt-1 font-display text-3xl">{guides.reduce((n, g) => n + g.legacyArticles.length, 0)}</div>
          </div>
        </div>
      </section>


      {/* Awaiting Perry + Decisions */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="font-display text-lg">Awaiting Perry</h2>
            <Link to="/review" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {awaitingPerry.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <Link to="/assets/$id" params={{ id: a.id }} className="line-clamp-1 font-medium hover:text-primary">
                    {a.title}
                  </Link>
                  <div className="mt-0.5 text-xs text-muted-foreground">{a.category}</div>
                </div>
                <span className={`text-xs font-medium ${priorityTone[a.priority]}`}>{a.priority}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="font-display text-lg">Decisions needed</h2>
            <Link to="/decisions" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {decisions.slice(0, 5).map((d) => (
              <li key={d.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium">{d.title}</div>
                    {d.proposal ? (
                      <div className="mt-0.5 text-xs text-muted-foreground">Proposed: {d.proposal}</div>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">Owner: {d.owner}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Tasks by person */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tasks by person</h2>
          <Link to="/team-actions" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {users.map((u) => {
            const uTasks = tasks.filter((t) => t.assigneeId === u.id);
            return (
              <div key={u.id} className="rounded-lg border border-border bg-card p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    {u.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{u.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{u.title}</div>
                  </div>
                </div>
                {uTasks.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No open tasks.</div>
                ) : (
                  <ul className="space-y-2">
                    {uTasks.map((t) => (
                      <li key={t.id} className="text-xs">
                        <div className="line-clamp-2 font-medium text-foreground">{t.title}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-muted-foreground">
                          <span className={priorityTone[t.priority]}>{t.priority}</span>
                          <span>·</span>
                          <span>{t.status}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent activity */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent activity</h2>
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {recent.map((r) => (
            <li key={r.id} className="flex items-start gap-3 px-5 py-3 text-sm">
              {r.verb.includes("approved") ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[color:var(--olive)]" />
              ) : (
                <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <span className="font-medium">{userById(r.actorId)?.name}</span>{" "}
                <span className="text-muted-foreground">{r.verb}</span>{" "}
                <Link to="/assets/$id" params={{ id: r.asset.id }} className="hover:text-primary">
                  {r.asset.title}
                </Link>
              </div>
              <div className="shrink-0 text-xs text-muted-foreground">
                {new Date(r.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <StatusPill status="Ready for Boss Review" />{" "}
        <span className="ml-2 text-xs text-muted-foreground">Status legend example — full palette used across the hub.</span>
      </section>
    </div>
  );
}
