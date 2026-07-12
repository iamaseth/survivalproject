import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { assets, priorityTone, userById } from "@/lib/mock-data";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { ArrowLeft, Check, Download, FileText, MessageSquare, Upload, X } from "lucide-react";

export const Route = createFileRoute("/assets/$id")({
  loader: ({ params }) => {
    const asset = assets.find((a) => a.id === params.id);
    if (!asset) throw notFound();
    return { asset };
  },
  component: AssetDetail,
  notFoundComponent: () => (
    <div className="py-24 text-center">
      <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-[color:var(--gold)]">Not found</div>
      <h1 className="font-display text-3xl">This asset doesn't exist</h1>
      <Link to="/assets" className="mt-4 inline-flex text-sm text-primary hover:underline">
        Back to Assets
      </Link>
    </div>
  ),
});

function AssetDetail() {
  const { asset } = Route.useLoaderData();
  const owner = userById(asset.ownerId);
  const assignee = asset.assigneeId ? userById(asset.assigneeId) : null;

  return (
    <div>
      <Link to="/assets" className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Assets
      </Link>

      <PageHeader
        eyebrow={asset.category}
        title={asset.title}
        description={asset.description}
        actions={
          <>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-card px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
              <X className="h-4 w-4" /> Request changes
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Check className="h-4 w-4" /> Approve
            </button>
          </>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {/* Attachment */}
          {asset.attachment ? (
            <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-secondary">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{asset.attachment.label}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {asset.attachment.kind} · v{asset.version}
                </div>
              </div>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary">
                <Download className="h-4 w-4" /> Download
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary">
                <Upload className="h-4 w-4" /> New version
              </button>
            </div>
          ) : null}

          {/* Produces + Next */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-1 text-[11px] uppercase tracking-wider text-[color:var(--gold)]">What this produces</div>
              <p className="text-sm">{asset.produces}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-1 text-[11px] uppercase tracking-wider text-[color:var(--gold)]">Next action</div>
              <p className="text-sm">{asset.nextAction}</p>
            </div>
          </div>

          {/* Comments */}
          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display text-lg">Comments</h2>
              <span className="text-xs text-muted-foreground">({asset.comments.length})</span>
            </div>
            <div className="divide-y divide-border">
              {asset.comments.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-muted-foreground">No comments yet.</div>
              ) : (
                asset.comments.map((c) => {
                  const author = userById(c.authorId);
                  return (
                    <div key={c.id} className="flex gap-3 px-5 py-4">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                        {author?.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-medium">{author?.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">{c.body}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="border-t border-border p-4">
              <textarea
                rows={2}
                placeholder="Add a comment… @mention to notify"
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
              <div className="mt-2 flex justify-end">
                <button className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  Comment
                </button>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-3">
              <h2 className="font-display text-lg">Activity</h2>
            </div>
            <ul className="divide-y divide-border">
              {asset.activity.map((ac) => (
                <li key={ac.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-[color:var(--gold)]" />
                  <span className="font-medium">{userById(ac.actorId)?.name}</span>
                  <span className="text-muted-foreground">{ac.verb}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(ac.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5 text-sm">
            <Meta label="Status">
              <StatusPill status={asset.status} />
            </Meta>
            <Meta label="Priority">
              <span className={`font-medium ${priorityTone[asset.priority]}`}>{asset.priority}</span>
            </Meta>
            <Meta label="Owner">{owner?.name}</Meta>
            <Meta label="Assignee">{assignee?.name ?? "—"}</Meta>
            <Meta label="Version">v{asset.version}</Meta>
            <Meta label="Created">
              {new Date(asset.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </Meta>
            <Meta label="Updated">
              {new Date(asset.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </Meta>
            {asset.dueAt ? (
              <Meta label="Due">
                {new Date(asset.dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </Meta>
            ) : null}
          </div>
        </aside>
      </div>
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
