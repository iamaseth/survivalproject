import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { AssetList } from "@/components/AssetList";

export const Route = createFileRoute("/email")({
  component: () => (
    <div>
      <PageHeader eyebrow="Category" title="Email & Klaviyo" description="Lead magnets, welcome flows, campaign emails, and Klaviyo specs." />
      <AssetList filter={(a) => a.category === "Email & Klaviyo"} />
    </div>
  ),
});
