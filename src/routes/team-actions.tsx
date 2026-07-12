import { createFileRoute } from "@tanstack/react-router";
import { tasks, users, userById, priorityTone } from "@/lib/mock-data";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/team-actions")({
  component: TeamActions,
});

function TeamActions() {
  return (
    <div>
      <PageHeader
        eyebrow="Tasks"
        title="Team Actions"
        description="Grouped by person. Only Seth assigns; anyone can update their own status."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {users.map((u) => {
          const uTasks = tasks.filter((t) => t.assigneeId === u.id);
          return (
            <div key={u.id} className="rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3 border-b border-border px-5 py-3">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {u.initials}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium">{u.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{u.title}</div>
                </div>
              </div>
              {uTasks.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-muted-foreground">No tasks assigned.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {uTasks.map((t) => (
                    <li key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <div className="font-medium">{t.title}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">Assigned by {userById("seth")?.name}</div>
                      </div>
                      <div className="text-right text-xs">
                        <div className={`font-medium ${priorityTone[t.priority]}`}>{t.priority}</div>
                        <div className="text-muted-foreground">{t.status}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
