// Surfaces conflicts captured by the one-time localStorage → DB workspace
// migration. Each row lets the operator explicitly pick "keep local" (writes
// the browser value into the DB) or "keep DB" (discards the local value).
// Conflicts persist in localStorage until every one has been resolved so
// nothing is silently lost when Rena/Vina's browsers migrate.
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getWorkspaceMigrationConflicts,
  clearWorkspaceMigrationConflicts,
} from "@/lib/creator-workspace";
import { upsertWorkspace } from "@/lib/creator-workspace.functions";
import { CREATORS } from "@/lib/creator-partnerships";

type Conflict = { creatorId: string; field: string; local: unknown; db: unknown };
const LS_KEY = "st.workspace.migration.conflicts.v1";

function fmt(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string") return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}

function saveList(list: Conflict[]) {
  if (typeof window === "undefined") return;
  if (list.length === 0) {
    clearWorkspaceMigrationConflicts();
  } else {
    window.localStorage.setItem(LS_KEY, JSON.stringify(list));
  }
}

function creatorName(id: string): string {
  return CREATORS.find((c) => c.id === id)?.name ?? id;
}

export function WorkspaceMigrationConflictsBanner() {
  const upsert = useServerFn(upsertWorkspace);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => { setConflicts(getWorkspaceMigrationConflicts()); }, []);

  if (conflicts.length === 0) return null;

  const keyOf = (c: Conflict) => `${c.creatorId}:${c.field}`;

  const removeOne = (c: Conflict) => {
    const next = conflicts.filter((x) => keyOf(x) !== keyOf(c));
    setConflicts(next);
    saveList(next);
  };

  const keepDB = (c: Conflict) => { removeOne(c); };

  const keepLocal = async (c: Conflict) => {
    setBusyKey(keyOf(c));
    try {
      const patch: Record<string, unknown> = { creator_id: c.creatorId };
      patch[c.field] = c.local;
      await upsert({ data: { patch: patch as never } });
      toast.success(`Kept local value for ${creatorName(c.creatorId)} — ${c.field}`);
      removeOne(c);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally { setBusyKey(null); }
  };

  const dismissAll = () => {
    if (!confirm(`Discard ${conflicts.length} unresolved local value${conflicts.length === 1 ? "" : "s"}? The database values will be kept.`)) return;
    setConflicts([]);
    saveList([]);
  };

  return (
    <section className="rounded-xl border border-amber-300 bg-amber-50/60 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg text-amber-900">
            Workspace migration — {conflicts.length} field{conflicts.length === 1 ? "" : "s"} need your review
          </h2>
          <p className="mt-1 text-sm text-amber-900/80">
            When this browser uploaded its local workspace changes to the team database, the values below
            already existed in the database with different content. Pick which version to keep for each row —
            nothing is discarded until you decide.
          </p>
          <div className="mt-4 space-y-2">
            {conflicts.map((c) => {
              const k = keyOf(c);
              const busy = busyKey === k;
              return (
                <div key={k} className="rounded-md border border-amber-200 bg-white p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate">
                        {creatorName(c.creatorId)} <span className="text-muted-foreground font-normal">· {c.field}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => keepLocal(c)}
                        disabled={busy}
                        className="inline-flex items-center gap-1 rounded-md bg-[color:var(--forest)] px-2.5 py-1 text-[11px] font-medium text-white hover:opacity-95 disabled:opacity-60"
                      >
                        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        Keep local
                      </button>
                      <button
                        onClick={() => keepDB(c)}
                        disabled={busy}
                        className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1 text-[11px] font-medium hover:bg-secondary disabled:opacity-60"
                      >
                        <X className="h-3 w-3" /> Keep DB
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded border border-border bg-secondary/40 p-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Local (this browser)</div>
                      <div className="mt-1 break-words font-mono text-[11px]">{fmt(c.local)}</div>
                    </div>
                    <div className="rounded border border-border bg-secondary/40 p-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Database (team)</div>
                      <div className="mt-1 break-words font-mono text-[11px]">{fmt(c.db)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3">
            <button
              onClick={dismissAll}
              className="text-[11px] text-amber-900/70 underline hover:text-amber-900"
            >
              Dismiss all and keep database values
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
