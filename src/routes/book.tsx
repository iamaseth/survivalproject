import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Preparedness Book — Promotion OS" },
      { name: "description", content: "Preparedness Studio migration bridge." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BookPage,
});

function BookPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Promotion OS · Survival Tabs"
        title="Preparedness Book"
        description="This module is being migrated from the existing Preparedness Studio without changing its production data yet."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-secondary p-2"><BookOpen className="h-5 w-5" /></div>
            <div>
              <h2 className="font-display text-lg">Current source remains live</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Parts, chapters, lessons, inspiration items, sources, workbook content, audio and quiz structures remain in the Preparedness Studio database until the migration is validated.
              </p>
            </div>
          </div>
          <a
            href="https://prep-guide-forge.lovable.app"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Open current Preparedness Studio <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Migration status</div>
          <div className="mt-2 text-lg font-medium">Bridge only</div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            No book records have been copied, edited or deleted from this branch.
          </p>
        </div>
      </div>
    </div>
  );
}
