import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/content")({
  head: () => ({
    meta: [
      { title: "Content — Survival Tabs" },
      { name: "description", content: "Central library of creator-produced content and internal assets." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ContentPage,
});

function ContentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content"
        title="Content Library"
        description="A single home for creator-produced videos, posts, assets and campaign deliverables."
      />
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Content tracking will live here. Assets are currently managed under the Assets tab; creator posts under each creator's Content section.
      </div>
    </div>
  );
}
