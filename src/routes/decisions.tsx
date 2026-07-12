import { createFileRoute } from "@tanstack/react-router";
import { decisions } from "@/lib/mock-data";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/decisions")({
  component: Decisions,
});

function Decisions() {
  return (
    <div>
      <PageHeader
        eyebrow="Governance"
        title="Decisions Needed"
        description="Open questions blocking or shaping the campaign. Seth proposes, Perry decides."
      />
      <div className="space-y-3">
        {decisions.map((d) => (
          <div key={d.id} className="rounded-lg border border-border bg-card p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
              <div className="min-w-0">
                <h3 className="font-display text-lg text-foreground">{d.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d.description}</p>
                {d.proposal ? (
                  <div className="mt-3 rounded-md border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/10 px-3 py-2 text-sm">
                    <span className="text-[11px] uppercase tracking-wider text-[color:var(--gold)]">Proposal</span>
                    <div className="text-foreground">{d.proposal}</div>
                  </div>
                ) : null}
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div className="uppercase tracking-wider">Owner</div>
                <div className="mt-0.5 font-medium text-foreground">{d.owner}</div>
                <div className="mt-2 uppercase tracking-wider">Status</div>
                <div className="mt-0.5 font-medium text-foreground">{d.status}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
