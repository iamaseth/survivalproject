import { createFileRoute, Link } from "@tanstack/react-router";
import { assets, userById } from "@/lib/mock-data";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/comments")({
  component: CommentsPage,
});

function CommentsPage() {
  const all = assets
    .flatMap((a) => a.comments.map((c) => ({ ...c, asset: a })))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div>
      <PageHeader
        eyebrow="Conversations"
        title="Comments"
        description="Every discussion thread across the hub — assets, leads, decisions, and tasks."
      />
      {all.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
          No comments yet.
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {all.map((c) => {
            const author = userById(c.authorId);
            return (
              <li key={c.id} className="flex gap-3 px-5 py-4">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {author?.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className="font-medium">{author?.name}</span>
                    <span className="text-muted-foreground">on</span>
                    <Link to="/assets/$id" params={{ id: c.asset.id }} className="font-medium hover:text-primary">
                      {c.asset.title}
                    </Link>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{c.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
