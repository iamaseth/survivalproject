// Persistent app-wide banner that surfaces Gmail connection health.
// Polls the connection status every 60s and shows a red banner when Gmail
// requires reconnection (401/403 from send or reply-polling).
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ShieldAlert } from "lucide-react";
import { getGmailConnectionStatus } from "@/lib/gmail.functions";

export function GmailHealthBanner() {
  const status = useServerFn(getGmailConnectionStatus);
  const [state, setState] = useState<{ show: boolean; reason: string | null; status: number | null }>({
    show: false, reason: null, status: null,
  });

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const s = await status();
        if (cancelled) return;
        if (s.connected && s.needsReconnect) {
          setState({ show: true, reason: s.lastErrorReason ?? null, status: s.lastErrorStatus ?? null });
        } else {
          setState({ show: false, reason: null, status: null });
        }
      } catch { /* ignore */ }
    };
    tick();
    const iv = window.setInterval(tick, 60_000);
    return () => { cancelled = true; window.clearInterval(iv); };
  }, [status]);

  if (!state.show) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-900">
      <div className="flex items-start gap-2">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <div className="font-medium">
            Gmail connection needs attention. Reconnect Gmail to restore sending and reply syncing.
          </div>
          {state.reason ? (
            <div className="mt-0.5 text-[11px] text-red-700">
              Last Gmail error{state.status ? ` (${state.status})` : ""}: {state.reason}
            </div>
          ) : null}
        </div>
      </div>
      <Link
        to="/settings"
        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
      >
        Reconnect Gmail
      </Link>
    </div>
  );
}
