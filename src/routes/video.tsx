import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { AssetList } from "@/components/AssetList";

export const Route = createFileRoute("/video")({
  component: () => (
    <div>
      <PageHeader eyebrow="Category" title="Video Production" description="Scripts, storyboards, shot lists, and finished cuts." />
      <AssetList filter={(a) => a.category === "Video Production"} />
    </div>
  ),
});
