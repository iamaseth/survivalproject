import { createFileRoute } from "@tanstack/react-router";
import { leads, priorityTone } from "@/lib/mock-data";
import { PageHeader } from "@/components/PageHeader";
import { Download, ExternalLink, Upload } from "lucide-react";

export const Route = createFileRoute("/leads")({
  component: Leads,
});

const reviewTone: Record<string, string> = {
  Researching: "bg-muted text-muted-foreground",
  Hold: "bg-secondary text-secondary-foreground",
  "Approved for Rena": "bg-[color:var(--olive)]/20 text-[color:var(--forest)]",
  Rejected: "bg-destructive/10 text-destructive",
};

function Leads() {
  return (
    <div>
      <PageHeader
        eyebrow="Outreach"
        title="Influencer Leads"
        description="Only leads marked Approved for Rena appear in her outreach queue."
        actions={
          <>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">
              <Upload className="h-4 w-4" /> Import CSV
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">
              <Download className="h-4 w-4" /> Export
            </button>
          </>
        }
      />

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[1400px] text-sm">
          <thead className="border-b border-border bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-3 font-medium">Priority</th>
              <th className="px-3 py-3 font-medium">Creator</th>
              <th className="px-3 py-3 font-medium">Platforms</th>
              <th className="px-3 py-3 font-medium">Niche</th>
              <th className="px-3 py-3 font-medium">Why fit</th>
              <th className="px-3 py-3 font-medium">Angle</th>
              <th className="px-3 py-3 font-medium">Review</th>
              <th className="px-3 py-3 font-medium">Outreach</th>
              <th className="px-3 py-3 font-medium">Next action</th>
              <th className="px-3 py-3 font-medium">Profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.map((l) => (
              <tr key={l.id} className="align-top hover:bg-secondary/40">
                <td className={`px-3 py-3 text-xs font-medium ${priorityTone[l.priority]}`}>{l.priority}</td>
                <td className="px-3 py-3">
                  <div className="font-medium">{l.creator}</div>
                  <div className="text-xs text-muted-foreground">{l.handle}</div>
                </td>
                <td className="px-3 py-3 text-xs text-muted-foreground">{l.platforms.join(", ")}</td>
                <td className="px-3 py-3 text-xs">{l.niche}</td>
                <td className="px-3 py-3 text-xs text-muted-foreground">{l.whyFit}</td>
                <td className="px-3 py-3 text-xs">{l.angle}</td>
                <td className="px-3 py-3">
                  <span className={`status-pill ${reviewTone[l.reviewDecision]}`}>{l.reviewDecision}</span>
                </td>
                <td className="px-3 py-3 text-xs text-muted-foreground">{l.outreach}</td>
                <td className="px-3 py-3 text-xs">{l.nextAction}</td>
                <td className="px-3 py-3">
                  <a
                    href={l.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
