import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  guides,
  guideCategories,
  guideAuthors,
  guideReviewers,
  guideStatusTone,
  GUIDE_STATUS_ORDER,
  type GuideStatus,
} from "@/lib/knowledge-data";
import { PageHeader } from "@/components/PageHeader";
import { Search, BookOpen } from "lucide-react";

export const Route = createFileRoute("/knowledge")({
  component: KnowledgeLayout,
});

function KnowledgeLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/knowledge") return <Outlet />;
  return <KnowledgeList />;
}

function KnowledgeList() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [status, setStatus] = useState<GuideStatus | "All">("All");
  const [author, setAuthor] = useState<string>("All");
  const [reviewer, setReviewer] = useState<string>("All");
  const [minCompletion, setMinCompletion] = useState<number>(0);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return guides.filter((g) => {
      if (category !== "All" && g.category !== category) return false;
      if (status !== "All" && g.status !== status) return false;
      if (author !== "All" && g.author !== author) return false;
      if (reviewer !== "All" && g.reviewer !== reviewer) return false;
      if (g.completion < minCompletion) return false;
      if (!needle) return true;
      const inKeywords = [g.primaryKeyword, ...g.secondaryKeywords].join(" ").toLowerCase();
      const inChapters = g.chapters.map((c) => c.title).join(" ").toLowerCase();
      const inLegacy = g.legacyArticles.map((a) => a.title).join(" ").toLowerCase();
      return (
        g.title.toLowerCase().includes(needle) ||
        inKeywords.includes(needle) ||
        inChapters.includes(needle) ||
        inLegacy.includes(needle)
      );
    });
  }, [q, category, status, author, reviewer, minCompletion]);

  const totals = useMemo(() => {
    return {
      total: guides.length,
      published: guides.filter((g) => g.status === "Published").length,
      inProgress: guides.filter((g) => g.status !== "Published").length,
      legacy: guides.reduce((n, g) => n + g.legacyArticles.length, 0),
    };
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Content Library"
        title="Knowledge Center"
        description="The master library for every guide, chapter, legacy article, download, image, and video. Built to scale to 1,500+ resources."
      />

      {/* Summary cards */}
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total Guides" value={totals.total} />
        <SummaryCard label="Published" value={totals.published} />
        <SummaryCard label="In Progress" value={totals.inProgress} />
        <SummaryCard label="Legacy Articles Assigned" value={totals.legacy} />
      </section>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search guides, chapters, keywords, legacy articles…"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <Select label="Category" value={category} onChange={setCategory}>
          <option value="All">All</option>
          {guideCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select label="Status" value={status} onChange={(v) => setStatus(v as GuideStatus | "All")}>
          <option value="All">All</option>
          {GUIDE_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select label="Author" value={author} onChange={setAuthor}>
          <option value="All">All</option>
          {guideAuthors.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </Select>
        <Select label="Reviewer" value={reviewer} onChange={setReviewer}>
          <option value="All">All</option>
          {guideReviewers.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </Select>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="uppercase tracking-wider">Min %</span>
          <input
            type="range"
            min={0}
            max={100}
            step={10}
            value={minCompletion}
            onChange={(e) => setMinCompletion(Number(e.target.value))}
            className="w-24"
          />
          <span className="w-8 text-right tabular-nums text-foreground">{minCompletion}</span>
        </label>
      </div>

      {/* Guides grid */}
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
          No guides match these filters.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((g) => (
            <Link
              key={g.id}
              to="/knowledge/$id"
              params={{ id: g.id }}
              className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition hover:border-primary/40 hover:shadow-sm"
            >
              <div
                className="h-40 w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${g.coverImage})` }}
              />
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--gold)]">
                    {g.category}
                  </span>
                  <span className={`status-pill ${guideStatusTone[g.status]}`}>{g.status}</span>
                </div>
                <h3 className="font-display text-xl leading-snug text-foreground group-hover:text-primary">
                  {g.title}
                </h3>
                <p className="line-clamp-2 text-sm text-muted-foreground">{g.description}</p>

                <div className="mt-auto space-y-2 pt-3">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Completion</span>
                      <span className="tabular-nums text-foreground">{g.completion}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-[color:var(--forest)]"
                        style={{ width: `${g.completion}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> {g.chapters.length} chapters
                    </span>
                    <span>· {g.legacyArticles.length} legacy</span>
                    <span>· Updated {new Date(g.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="font-display text-3xl text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="uppercase tracking-wider">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
      >
        {children}
      </select>
    </label>
  );
}
