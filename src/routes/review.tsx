import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { AssetList } from "@/components/AssetList";

export const Route = createFileRoute("/review")({
  component: Review,
});

function Review() {
  return (
    <div>
      <PageHeader
        eyebrow="Approval queue"
        title="Needs Boss Review"
        description="Everything Seth has submitted that's waiting on Perry. Only Perry can approve or request changes."
      />
      <AssetList filter={(a) => a.status === "Ready for Boss Review"} />
    </div>
  );
}
