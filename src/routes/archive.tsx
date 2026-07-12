import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { AssetList } from "@/components/AssetList";

export const Route = createFileRoute("/archive")({
  component: () => (
    <div>
      <PageHeader
        eyebrow="History"
        title="Published Archive"
        description="Published and archived materials. Only Seth can restore or permanently remove records."
      />
      <AssetList filter={(a) => a.status === "Published" || a.status === "Archived"} />
    </div>
  ),
});
