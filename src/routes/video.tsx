import { createFileRoute } from "@tanstack/react-router";
import { Clapperboard } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { AssetList } from "@/components/AssetList";

export const Route = createFileRoute("/video")({
  head: () => ({
    meta: [
      { title: "Video — Promotion OS" },
      { name: "description", content: "Survival Tabs video production module." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VideoPage,
});

function VideoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Promotion OS · Survival Tabs"
        title="Video"
        description="Short-video concepts, production packages, approved assets and finished cuts in one promotion workflow."
      />

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-secondary p-2"><Clapperboard className="h-5 w-5" /></div>
          <div>
            <h2 className="font-display text-lg">Existing video assets preserved</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              This first Promotion OS pass keeps the existing Video Production asset workflow intact. Later phases will connect Knowledge Center stories, campaign ideas, creator relationships and performance results here.
            </p>
          </div>
        </div>
      </div>

      <AssetList filter={(asset) => asset.category === "Video Production"} />
    </div>
  );
}
