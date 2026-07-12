import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { AssetList } from "@/components/AssetList";
import { Plus, Upload } from "lucide-react";

export const Route = createFileRoute("/assets")({
  component: Assets,
});

function Assets() {
  return (
    <div>
      <PageHeader
        eyebrow="Library"
        title="Assets"
        description="Every piece of work in the hub. Filter by category, status, or owner."
        actions={
          <>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">
              <Upload className="h-4 w-4" /> Upload
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" /> New asset
            </button>
          </>
        }
      />
      <AssetList />
    </div>
  );
}
