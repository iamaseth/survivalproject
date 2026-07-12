import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { AssetList } from "@/components/AssetList";

export const Route = createFileRoute("/seo")({
  component: () => (
    <div>
      <PageHeader eyebrow="Category" title="SEO & Articles" description="Long-form content, article briefs, and SEO implementation." />
      <AssetList filter={(a) => a.category === "SEO & Articles"} />
    </div>
  ),
});
