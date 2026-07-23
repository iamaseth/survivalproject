import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  creators,
  creatorStatusTone,
  aiRecommendationTone,
  type Creator,
} from "@/lib/mock-data";
import { PageHeader } from "@/components/PageHeader";
import { ArrowLeft, ExternalLink, Mail } from "lucide-react";

export const Route = createFileRoute("/creators/$id")({
  loader: ({ params }) => {
    const creator = creators.find((c) => c.id === params.id);
    if (!creator) throw notFound();
    return { creator };
  },
  component: CreatorDetail,
  notFoundComponent: () => (
    <div className="py-24 text-center">
      <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-[color:var(--gold)]">Not found</div>
      <h1 className="font-display text-3xl">This creator doesn't exist</h1>
      <Link to="/creators" className="mt-4 inline-flex text-sm text-primary hover:underline">
        Back to Creator Partnerships
      </Link>
    </div>
  ),
});

function CreatorDetail() {
  const { creator } = Route.useLoaderData() as { creator: Creator };

  return (
    <div>
      <Link to="/creators" className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Creator Partnerships
      </Link>

      <PageHeader
        eyebrow={creator.category}
        title={creator.name}
        description={creator.targetAudience}
        actions={
          <>
            <a
              href={`mailto:${creator.email}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary"
            >
              <Mail className="h-4 w-4" /> Email
            </a>
            <a
              href={creator.profileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <ExternalLink className="h-4 w-4" /> Open profile
            </a>
          </>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {/* Profile info */}
          <Panel title="Profile information">
            <Grid>
              <Field label="Platform">{creator.platform}</Field>
              <Field label="Email">{creator.email}</Field>
              <Field label="Country">{creator.country}</Field>
              <Field label="Language">{creator.language}</Field>
              <Field label="Category">{creator.category}</Field>
              <Field label="Target audience">{creator.targetAudience}</Field>
            </Grid>
          </Panel>

          {/* Audience metrics */}
          <Panel title="Audience metrics">
            <Grid>
              <Field label="Followers">{formatCount(creator.followers)}</Field>
              <Field label="Average views">{formatCount(creator.avgViews)}</Field>
              <Field label="Engagement rate">{creator.engagementRate.toFixed(1)}%</Field>
            </Grid>
          </Panel>

          {/* AI Analysis */}
          <Panel title="AI analysis">
            <div className="grid gap-3 sm:grid-cols-3">
              <ScoreCard label="Brand Fit" value={creator.brandFitScore} />
              <ScoreCard label="Trust" value={creator.trustScore} />
              <ScoreCard label="Educational" value={creator.educationalScore} />
            </div>
            <div className="mt-4 rounded-md border border-border bg-background p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Recommendation</span>
                <span className={`text-sm font-semibold ${aiRecommendationTone[creator.aiRecommendation]}`}>
                  {creator.aiRecommendation}
                </span>
              </div>
              <p className="text-sm text-foreground/90">{creator.aiReasoning}</p>
            </div>
          </Panel>

          {/* Notes */}
          <Panel title="Internal notes">
            <p className="whitespace-pre-wrap text-sm text-foreground/90">
              {creator.internalNotes || "No internal notes yet."}
            </p>
          </Panel>

          {/* Workflow history */}
          <Panel title="Workflow history">
            {creator.workflowHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No workflow events yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {[...creator.workflowHistory].reverse().map((e) => (
                  <li key={e.id} className="flex items-start gap-3 py-3 text-sm">
                    <span className={`status-pill ${creatorStatusTone[e.status]}`}>{e.status}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground">
                        {e.actor} · {new Date(e.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </div>
                      {e.note ? <div className="mt-0.5">{e.note}</div> : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Contact history */}
          <Panel title="Contact history">
            {creator.contactHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contact yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {[...creator.contactHistory].reverse().map((c) => (
                  <li key={c.id} className="py-3 text-sm">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">{c.channel}</span>
                      <span className="text-xs text-muted-foreground">
                        {c.actor} · {new Date(c.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <p className="mt-1 text-foreground/90">{c.summary}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5 text-sm">
            <Meta label="Status">
              <span className={`status-pill ${creatorStatusTone[creator.status]}`}>{creator.status}</span>
            </Meta>
            <Meta label="AI Recommendation">
              <span className={`font-medium ${aiRecommendationTone[creator.aiRecommendation]}`}>
                {creator.aiRecommendation}
              </span>
            </Meta>
            <Meta label="Supervisor">{creator.supervisor}</Meta>
            <Meta label="Relationship Owner">{creator.relationshipOwner}</Meta>
            <Meta label="Research By">{creator.researchBy}</Meta>
            <Meta label="Last Contact">
              {creator.lastContactDate
                ? new Date(creator.lastContactDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                : "—"}
            </Meta>
            <Meta label="Next Follow-up">
              {creator.nextFollowUpDate
                ? new Date(creator.nextFollowUpDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                : "—"}
            </Meta>
            <Meta label="Created">
              {new Date(creator.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </Meta>
            <Meta label="Updated">
              {new Date(creator.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </Meta>
          </div>
        </aside>
      </div>
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

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm text-foreground/90">{children}</div>
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

function ScoreCard({ label, value }: { label: string; value: number }) {
  const tone =
    value >= 85 ? "text-[color:var(--forest)]" : value >= 70 ? "text-[color:var(--gold)]" : "text-destructive";
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-3xl ${tone}`}>{value}</div>
    </div>
  );
}

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
