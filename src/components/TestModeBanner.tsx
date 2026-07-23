import { AlertTriangle } from "lucide-react";
import { useTestMode } from "@/lib/test-mode";

export function TestModeBanner() {
  const tm = useTestMode();
  if (!tm.enabled) return null;
  return (
    <div className="flex items-center gap-3 border-b border-amber-300 bg-amber-100 px-6 py-2 text-xs text-amber-900">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <span className="font-semibold uppercase tracking-wider">Test Mode</span>
        <span className="ml-2">
          All new activity, drafts, emails, and workflow edits are tagged with session
          <span className="ml-1 font-mono">{tm.sessionId}</span>
          {tm.startedAt ? <span className="ml-1 opacity-70">(started {new Date(tm.startedAt).toLocaleString()})</span> : null}
          . Wipe this session anytime from Settings → Data Management.
        </span>
      </div>
    </div>
  );
}
