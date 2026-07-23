import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/campaigns")({
  head: () => ({
    meta: [
      { title: "Campaigns — Survival Tabs" },
      { name: "description", content: "Coordinate paid creator campaigns, deliverables and budgets." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CampaignsPage,
});

function CampaignsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Campaigns"
        title="Paid Creator Campaigns"
        description="Plan, schedule and track compensated creator collaborations. Wired up in a future release."
      />
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Campaign management is coming next. For now, individual campaign notes live on each creator's profile under Creator Partnerships.
      </div>
    </div>
  );
}
