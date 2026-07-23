import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { guides, guideStatusTone, type Guide, type Chapter } from "@/lib/knowledge-data";
import { PageHeader } from "@/components/PageHeader";
import { ArrowLeft, ExternalLink, GripVertical } from "lucide-react";

export const Route = createFileRoute("/knowledge/$id")({
  loader: ({ params }) => {
    const guide = guides.find((g) => g.id === params.id);
    if (!guide) throw notFound();
    return { guide };
  },
  component: GuideDetail,
  notFoundComponent: () => (
    <div className="py-24 text-center">
      <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-[color:var(--gold)]">Not found</div>
      <h1 className="font-display text-3xl">This guide doesn't exist</h1>
      <Link to="/knowledge" className="mt-4 inline-flex text-sm text-primary hover:underline">
        Back to Knowledge Center
      </Link>
    </div>
  ),
});

const TABS = [
  "Overview",
  "Outline",
  "Chapters",
  "Legacy Articles",
  "Downloads",
  "Images",
  "Videos",
  "SEO",
  "Publishing",
  "Revision History",
] as const;
type Tab = (typeof TABS)[number];

function GuideDetail() {
  const { guide } = Route.useLoaderData() as { guide: Guide };
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div>
      <Link to="/knowledge" className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Knowledge Center
      </Link>

      <PageHeader
        eyebrow={guide.category}
        title={guide.title}
        description={guide.description}
        actions={
          <span className={`status-pill ${guideStatusTone[guide.status]}`}>{guide.status}</span>
        }
      />

      {/* Cover + progress */}
      <div className="mb-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div
          className="h-56 w-full rounded-lg border border-border bg-cover bg-center"
          style={{ backgroundImage: `url(${guide.coverImage})` }}
        />
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-3 text-[11px] uppercase tracking-wider text-muted-foreground">Completion</div>
          <div className="font-display text-4xl">{guide.completion}%</div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-[color:var(--forest)]" style={{ width: `${guide.completion}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <Stat label="Chapters" value={String(guide.chapters.length)} />
            <Stat label="Legacy" value={String(guide.legacyArticles.length)} />
            <Stat label="Downloads" value={String(guide.downloads.length)} />
            <Stat label="Videos" value={String(guide.videos.length)} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <OverviewTab guide={guide} />}
      {tab === "Outline" && <OutlineTab chapters={guide.chapters} />}
      {tab === "Chapters" && <ChaptersTab chapters={guide.chapters} />}
      {tab === "Legacy Articles" && <LegacyTab guide={guide} />}
      {tab === "Downloads" && <DownloadsTab guide={guide} />}
      {tab === "Images" && <ImagesTab guide={guide} />}
      {tab === "Videos" && <VideosTab guide={guide} />}
      {tab === "SEO" && <SeoTab guide={guide} />}
      {tab === "Publishing" && <PublishingTab guide={guide} />}
      {tab === "Revision History" && <RevisionsTab guide={guide} />}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h2 className="font-display text-lg">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm text-foreground/90">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-lg">{value}</div>
    </div>
  );
}

function OverviewTab({ guide }: { guide: Guide }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <Panel title="Description">
          <p className="text-sm text-foreground/90">{guide.description}</p>
        </Panel>
        <Panel title="Content strategy">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Category">{guide.category}</Field>
            <Field label="Target audience">{guide.targetAudience}</Field>
            <Field label="Primary keyword">{guide.primaryKeyword}</Field>
            <Field label="Search intent">{guide.searchIntent}</Field>
            <Field label="Secondary keywords">
              <div className="flex flex-wrap gap-1">
                {guide.secondaryKeywords.map((k) => (
                  <span key={k} className="rounded-full border border-border bg-background px-2 py-0.5 text-xs">
                    {k}
                  </span>
                ))}
              </div>
            </Field>
          </div>
        </Panel>
      </div>
      <aside>
        <div className="rounded-lg border border-border bg-card p-5 text-sm">
          <Meta label="Status">
            <span className={`status-pill ${guideStatusTone[guide.status]}`}>{guide.status}</span>
          </Meta>
          <Meta label="Completion">{guide.completion}%</Meta>
          <Meta label="Author">{guide.author}</Meta>
          <Meta label="Reviewer">{guide.reviewer}</Meta>
          <Meta label="Approver">{guide.approver}</Meta>
          <Meta label="Last revision">
            {new Date(guide.lastRevision).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </Meta>
        </div>
      </aside>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2 last:border-0 last:pb-0 first:pt-0">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

function OutlineTab({ chapters: initial }: { chapters: Chapter[] }) {
  const [chapters, setChapters] = useState<Chapter[]>(initial);
  const [dragId, setDragId] = useState<string | null>(null);

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const src = chapters.findIndex((c) => c.id === dragId);
    const dst = chapters.findIndex((c) => c.id === targetId);
    if (src < 0 || dst < 0) return;
    const next = [...chapters];
    const [item] = next.splice(src, 1);
    next.splice(dst, 0, item);
    setChapters(next.map((c, i) => ({ ...c, number: i + 1 })));
    setDragId(null);
  };

  return (
    <Panel title="Chapter outline">
      <p className="mb-3 text-xs text-muted-foreground">Drag chapters to reorder.</p>
      <ul className="space-y-2">
        {chapters.map((c) => (
          <li
            key={c.id}
            draggable
            onDragStart={() => setDragId(c.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(c.id)}
            className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-3 hover:border-primary/40"
          >
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="w-8 shrink-0 text-center font-display text-lg text-muted-foreground">
              {c.number}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{c.title}</div>
              <div className="text-[11px] text-muted-foreground">
                {c.wordCurrent} / {c.wordTarget} words
              </div>
            </div>
            <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground">
              {c.status}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function ChaptersTab({ chapters }: { chapters: Chapter[] }) {
  return (
    <div className="grid gap-3">
      {chapters.map((c) => (
        <div key={c.id} className="rounded-lg border border-border bg-card p-5">
          <div className="mb-1 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Chapter {c.number}
              </div>
              <h3 className="font-display text-lg">{c.title}</h3>
            </div>
            <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
              {c.status}
            </span>
          </div>
          <p className="text-sm text-foreground/90">{c.summary}</p>
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{c.wordCurrent} / {c.wordTarget} words</span>
            <span>Updated {new Date(c.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const actionTone: Record<string, string> = {
  Keep: "bg-[color:var(--forest)]/15 text-[color:var(--forest)]",
  Rewrite: "bg-primary/15 text-primary",
  Merge: "bg-[color:var(--gold)]/20 text-[color:var(--gold)]",
  Redirect: "bg-[color:var(--olive)]/20 text-[color:var(--olive)]",
  Delete: "bg-destructive/15 text-destructive",
};

const priorityTone: Record<string, string> = {
  High: "text-destructive",
  Medium: "text-[color:var(--gold)]",
  Low: "text-muted-foreground",
};

function LegacyTab({ guide }: { guide: Guide }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b border-border bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-3 font-medium">Article</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3 font-medium">Recommended Action</th>
            <th className="px-3 py-3 font-medium">Priority</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {guide.legacyArticles.map((a) => (
            <tr key={a.id} className="hover:bg-secondary/40">
              <td className="px-3 py-3">
                <div className="font-medium">{a.title}</div>
                <div className="text-xs text-muted-foreground">{a.url}</div>
              </td>
              <td className="px-3 py-3 text-xs">{a.status}</td>
              <td className="px-3 py-3">
                <span className={`status-pill ${actionTone[a.action]}`}>{a.action}</span>
              </td>
              <td className={`px-3 py-3 text-xs font-medium ${priorityTone[a.priority]}`}>{a.priority}</td>
            </tr>
          ))}
          {guide.legacyArticles.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-10 text-center text-sm text-muted-foreground">
                No legacy articles assigned.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function DownloadsTab({ guide }: { guide: Guide }) {
  if (guide.downloads.length === 0) {
    return <Panel title="Downloads"><p className="text-sm text-muted-foreground">No downloads yet.</p></Panel>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {guide.downloads.map((d) => (
        <div key={d.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <div className="min-w-0">
            <div className="truncate font-medium">{d.title}</div>
            <div className="text-xs text-muted-foreground">{d.kind} · {d.size}</div>
          </div>
          <button className="rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-secondary">
            Download
          </button>
        </div>
      ))}
    </div>
  );
}

function ImagesTab({ guide }: { guide: Guide }) {
  if (guide.images.length === 0) {
    return <Panel title="Images"><p className="text-sm text-muted-foreground">No images yet.</p></Panel>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {guide.images.map((img) => (
        <figure key={img.id} className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="h-40 w-full bg-cover bg-center" style={{ backgroundImage: `url(${img.url})` }} />
          <figcaption className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
            {img.caption}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function VideosTab({ guide }: { guide: Guide }) {
  if (guide.videos.length === 0) {
    return <Panel title="Videos"><p className="text-sm text-muted-foreground">No videos yet.</p></Panel>;
  }
  return (
    <div className="grid gap-3">
      {guide.videos.map((v) => (
        <div key={v.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <div className="min-w-0">
            <div className="font-medium">{v.title}</div>
            <div className="text-xs text-muted-foreground">{v.source} · {v.status}</div>
          </div>
          <a
            href={v.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Open <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      ))}
    </div>
  );
}

function SeoTab({ guide }: { guide: Guide }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Keywords & meta">
        <div className="space-y-3">
          <Field label="Primary keyword">{guide.primaryKeyword}</Field>
          <Field label="Secondary keywords">
            <div className="flex flex-wrap gap-1">
              {guide.secondaryKeywords.map((k) => (
                <span key={k} className="rounded-full border border-border bg-background px-2 py-0.5 text-xs">{k}</span>
              ))}
            </div>
          </Field>
          <Field label="Meta title">{guide.metaTitle}</Field>
          <Field label="Meta description">{guide.metaDescription}</Field>
          <Field label="Canonical URL">
            <a href={guide.canonicalUrl} className="text-primary hover:underline">{guide.canonicalUrl}</a>
          </Field>
        </div>
      </Panel>
      <Panel title="Links & schema">
        <div className="space-y-3">
          <Field label="Internal links">
            <ul className="mt-1 space-y-1 text-sm">
              {guide.internalLinks.map((l) => <li key={l} className="text-primary">{l}</li>)}
              {guide.internalLinks.length === 0 && <li className="text-muted-foreground">None</li>}
            </ul>
          </Field>
          <Field label="External references">
            <ul className="mt-1 space-y-1 text-sm">
              {guide.externalReferences.map((l) => <li key={l}>{l}</li>)}
              {guide.externalReferences.length === 0 && <li className="text-muted-foreground">None</li>}
            </ul>
          </Field>
          <Field label="Schema status">{guide.schemaStatus}</Field>
        </div>
      </Panel>
    </div>
  );
}

function PublishingTab({ guide }: { guide: Guide }) {
  return (
    <Panel title="Publishing status">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Draft status">{guide.draftStatus}</Field>
        <Field label="Review status">{guide.reviewStatus}</Field>
        <Field label="Approval status">{guide.approvalStatus}</Field>
        <Field label="Publish date">
          {guide.publishDate
            ? new Date(guide.publishDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
            : "—"}
        </Field>
        <Field label="Last revision">
          {new Date(guide.lastRevision).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </Field>
      </div>
    </Panel>
  );
}

function RevisionsTab({ guide }: { guide: Guide }) {
  return (
    <Panel title="Revision history">
      <ol className="relative space-y-4 border-l border-border pl-5">
        {[...guide.revisions].reverse().map((r) => (
          <li key={r.id} className="relative">
            <span className="absolute -left-[26px] top-1.5 h-2 w-2 rounded-full bg-[color:var(--gold)]" />
            <div className="text-xs text-muted-foreground">
              {new Date(r.at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} · {r.actor}
            </div>
            <div className="text-sm">{r.note}</div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
