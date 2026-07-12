import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { AssetList } from "@/components/AssetList";

export const Route = createFileRoute("/website")({
  component: () => (
    <div>
      <PageHeader
        eyebrow="Category"
        title="Website & Shopify"
        description="Copy, technical implementation, and Shopify configuration assets. Tuan is the assignee once approved."
      />
      <AssetList filter={(a) => a.category === "Website Copy" || a.category === "Website Technical"} />
    </div>
  ),
});
