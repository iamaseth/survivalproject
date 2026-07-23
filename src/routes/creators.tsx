import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  creators,
  CREATOR_STATUS_ORDER,
  creatorStatusTone,
  aiRecommendationTone,
  type CreatorStatus,
  type CreatorAiRecommendation,
  type CreatorPlatform,
} from "@/lib/mock-data";
import { PageHeader } from "@/components/PageHeader";
import { ArrowUpDown, ExternalLink, Search } from "lucide-react";

export const Route = createFileRoute("/creators")({
  component: CreatorsLayout,
});

function CreatorsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/creators") return <Outlet />;
  return <CreatorsList />;
}

type SortKey = "name" | "platform" | "followers" | "brandFitScore" | "status" | "updatedAt";

const PLATFORMS: (CreatorPlatform | "All")[] = [
  "All",
  "YouTube",
  "TikTok",
  "Instagram",
  "Blog",
  "Podcast",
  "Twitter/X",
  "Facebook",
  "Other",
];

const RECS: (CreatorAiRecommendation | "All")[] = ["All", "Recommended", "Maybe", "Not Recommended"];

function CreatorsList() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<CreatorStatus | "All">("All");
  const [platform, setPlatform] = useState<CreatorPlatform | "All">("All");
  const [rec, setRec] = useState<CreatorAiRecommendation | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = creators.filter((c) => {
      if (status !== "All" && c.status !== status) return false;
      if (platform !== "All" && c.platform !== platform) return false;
      if (rec !== "All" && c.aiRecommendation !== rec) return false;
      if (!needle) return true;
      return (
        c.name.toLowerCase().includes(needle) ||
        c.category.toLowerCase().includes(needle) ||
        c.targetAudience.toLowerCase().includes(needle) ||
        c.email.toLowerCase().includes(needle)
      );
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] as string | number;
      const bv = b[sortKey] as string | number;
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [q, status, platform, rec, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  const totals = useMemo(() => {
    const by = (s: CreatorStatus) => creators.filter((c) => c.status === s).length;
    return {
      total: creators.length,
      ready: by("Ready for Review"),
      approved: by("Approved for Outreach"),
      contacted: by("Contacted"),
      negotiating: by("Negotiating"),
      shipped: by("Product Shipped"),
      published: by("Published"),
    };
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="Creator Partnerships"
        description="Central hub for every creator, affiliate, educator, and media partner. Track research, review, outreach, negotiation, and publication."
      />

      {/* Summary cards */}
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <SummaryCard label="Total" value={totals.total} />
        <SummaryCard label="Ready for Review" value={totals.ready} />
        <SummaryCard label="Approved for Outreach" value={totals.approved} />
        <SummaryCard label="Contacted" value={totals.contacted} />
        <SummaryCard label="Negotiating" value={totals.negotiating} />
        <SummaryCard label="Product Shipped" value={totals.shipped} />
        <SummaryCard label="Published" value={totals.published} />
      </section>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search creator, category, audience, email…"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <Select label="Status" value={status} onChange={(v) => setStatus(v as CreatorStatus | "All")}>
          <option value="All">All statuses</option>
          {CREATOR_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select label="Platform" value={platform} onChange={(v) => setPlatform(v as CreatorPlatform | "All")}>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p === "All" ? "All platforms" : p}
            </option>
          ))}
        </Select>
        <Select label="AI Rec" value={rec} onChange={(v) => setRec(v as CreatorAiRecommendation | "All")}>
          {RECS.map((r) => (
            <option key={r} value={r}>
              {r === "All" ? "All AI recs" : r}
            </option>
          ))}
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[1200px] text-sm">
          <thead className="border-b border-border bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <Th onClick={() => toggleSort("name")}>Creator</Th>
              <Th onClick={() => toggleSort("platform")}>Platform</Th>
              <Th onClick={() => toggleSort("followers")}>Followers</Th>
              <Th onClick={() => toggleSort("brandFitScore")}>AI Brand Fit</Th>
              <Th onClick={() => toggleSort("status")}>Status</Th>
              <th className="px-3 py-3 font-medium">Supervisor</th>
              <th className="px-3 py-3 font-medium">Relationship Owner</th>
              <Th onClick={() => toggleSort("updatedAt")}>Last Updated</Th>
              <th className="px-3 py-3 font-medium">Profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((c) => (
              <tr key={c.id} className="align-top hover:bg-secondary/40">
                <td className="px-3 py-3">
                  <Link
                    to="/creators/$id"
                    params={{ id: c.id }}
                    className="font-medium hover:text-primary"
                  >
                    {c.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">{c.category}</div>
                  <div className={`mt-0.5 text-[11px] font-medium ${aiRecommendationTone[c.aiRecommendation]}`}>
                    {c.aiRecommendation}
                  </div>
                </td>
                <td className="px-3 py-3 text-xs">{c.platform}</td>
                <td className="px-3 py-3 text-xs">{formatCount(c.followers)}</td>
                <td className="px-3 py-3">
                  <ScoreBar value={c.brandFitScore} />
                </td>
                <td className="px-3 py-3">
                  <span className={`status-pill ${creatorStatusTone[c.status]}`}>{c.status}</span>
                </td>
                <td className="px-3 py-3 text-xs">{c.supervisor}</td>
                <td className="px-3 py-3 text-xs">{c.relationshipOwner}</td>
                <td className="px-3 py-3 text-xs text-muted-foreground">
                  {new Date(c.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </td>
                <td className="px-3 py-3">
                  <a
                    href={c.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No creators match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
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

function Th({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <th className="px-3 py-3 font-medium">
      <button onClick={onClick} className="inline-flex items-center gap-1 hover:text-foreground">
        {children} <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
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

function ScoreBar({ value }: { value: number }) {
  const tone =
    value >= 85 ? "bg-[color:var(--forest)]" : value >= 70 ? "bg-[color:var(--gold)]" : "bg-destructive/70";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full ${tone}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="text-xs tabular-nums">{value}</span>
    </div>
  );
}

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
