import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, CheckCircle2, XCircle, Loader2, LogOut } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/current-user";
import { connectAppUser } from "@/integrations/lovable/appUserConnectorClient";
import {
  getGmailConnectionStatus,
  startGmailConnect,
  saveGmailConnection,
  disconnectGmail,
} from "@/lib/gmail.functions";

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Survival Tabs Team Hub" },
      { name: "description", content: "Connect your Gmail and manage personal workspace settings." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const auth = useAuth();
  const status = useServerFn(getGmailConnectionStatus);
  const start = useServerFn(startGmailConnect);
  const save = useServerFn(saveGmailConnection);
  const disconnect = useServerFn(disconnectGmail);

  const [connState, setConnState] = useState<
    | { kind: "loading" }
    | { kind: "disconnected" }
    | { kind: "connected"; email: string | null; lastPolledAt: string | null }
  >({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const s = await status();
      if (s.connected) setConnState({ kind: "connected", email: s.emailAddress, lastPolledAt: s.lastPolledAt });
      else setConnState({ kind: "disconnected" });
    } catch (e) {
      setConnState({ kind: "disconnected" });
      setMsg(e instanceof Error ? e.message : String(e));
    }
  }, [status]);

  useEffect(() => { refresh(); }, [refresh]);

  const onConnect = async () => {
    setBusy(true); setMsg(null);
    try {
      const result = await connectAppUser({
        connectorId: "google_mail",
        gatewayBaseUrl: GATEWAY_BASE_URL,
        start: (targetOrigin) => start({ data: { targetOrigin } }),
      });
      if (!result.success) { setMsg(result.error ?? "Connection failed"); return; }
      if (!result.connectionAPIKey) { setMsg("Offline access disabled — cannot store connection."); return; }
      const r = await save({ data: { connectionAPIKey: result.connectionAPIKey } });
      setMsg(`Gmail connected as ${r.emailAddress ?? "your account"}.`);
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  const onDisconnect = async () => {
    if (!confirm("Disconnect your Gmail from Survival Tabs Hub?")) return;
    setBusy(true); setMsg(null);
    try { await disconnect(); setMsg("Gmail disconnected."); await refresh(); }
    catch (e) { setMsg(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Settings" title="Your workspace" description="Personal integrations and preferences." />

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-secondary">
            <Mail className="h-6 w-6 text-[color:var(--forest)]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg">Gmail</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect your Gmail so outreach is sent from your own inbox, replies land in the creator timeline
              automatically, and Gmail labels (Creator Partnerships, Outreach, Waiting Reply, Campaign, Completed)
              are applied for you.
            </p>

            {connState.kind === "loading" ? (
              <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking connection…
              </div>
            ) : connState.kind === "connected" ? (
              <div className="mt-4 space-y-2">
                <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Connected{connState.email ? ` as ${connState.email}` : ""}
                </div>
                {connState.lastPolledAt ? (
                  <div className="text-xs text-muted-foreground">
                    Last checked for replies: {new Date(connState.lastPolledAt).toLocaleString()}
                  </div>
                ) : null}
                <button
                  onClick={onDisconnect}
                  disabled={busy}
                  className="mt-3 inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-secondary disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" /> Disconnect Gmail
                </button>
              </div>
            ) : (
              <div className="mt-4">
                <div className="inline-flex items-center gap-2 rounded-md bg-amber-50 px-3 py-1.5 text-sm text-amber-800">
                  <XCircle className="h-4 w-4" /> Not connected
                </div>
                <div className="mt-3">
                  <button
                    onClick={onConnect}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-md bg-[color:var(--forest)] px-4 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    Connect my Gmail
                  </button>
                </div>
              </div>
            )}

            {msg ? <p className="mt-3 text-xs text-muted-foreground">{msg}</p> : null}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-lg">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">Managed via Google sign-in.</p>
        {auth.status === "authenticated" ? (
          <div className="mt-3 text-sm">
            <div><span className="text-muted-foreground">Name:</span> {auth.profile.fullName}</div>
            <div><span className="text-muted-foreground">Email:</span> {auth.profile.email}</div>
            <div><span className="text-muted-foreground">Role:</span> {auth.profile.roleLabel}</div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
