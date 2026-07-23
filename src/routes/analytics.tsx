import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Survival Tabs" },
      { name: "description", content: "Cross-team analytics for creator partnerships, campaigns and content." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Team Analytics"
        description="Outreach conversion, response rates, campaign ROI and content performance — all in one place."
      />
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Analytics dashboards will appear here. In the meantime, the Creator Partnerships dashboard shows per-owner queues and health metrics.
      </div>
    </div>
  );
}
