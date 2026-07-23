// Real Gmail composer, AI drafter, and cached conversation history for a creator.
// Uses the signed-in user's Gmail via the App User Connector.
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, Mail, MailCheck, Send, Sparkles, RefreshCw, AlertCircle, MailX, ShieldAlert } from "lucide-react";
import type { CreatorRow } from "@/lib/creator-partnerships";
import { useWorkspace, logConfirmedGmailSend } from "@/lib/creator-workspace";
import { computeStage } from "@/lib/creator-workflow";
import { useAuth } from "@/lib/current-user";
import {
  getGmailConnectionStatus,
  sendGmailToCreator,
  generateEmailDraft,
  listCreatorMessages,
  pollGmailForReplies,
  type DraftMode,
} from "@/lib/gmail.functions";

const DRAFT_MODES: DraftMode[] = [
  "Initial Outreach", "Follow-up", "Thank You", "Shipping",
  "Campaign Invitation", "Collaboration Proposal",
  "Rewrite", "Shorter", "Friendlier", "More Professional",
];

type Msg = {
  id: string; gmail_message_id: string; gmail_thread_id: string | null;
  direction: string; from_email: string | null; from_name: string | null;
  to_emails: string[]; subject: string | null; snippet: string | null;
  sent_at: string | null; label_ids: string[];
};

type ConnStatus =
  | { kind: "loading" }
  | { kind: "disconnected" }
  | { kind: "connected"; needsReconnect: boolean; email: string | null; lastErrorReason: string | null; lastErrorStatus: number | null };

export function GmailPanel({ c }: { c: CreatorRow }) {
  const auth = useAuth();
  const ws = useWorkspace(c);
  const stage = computeStage(c, ws);

  const status = useServerFn(getGmailConnectionStatus);
  const send = useServerFn(sendGmailToCreator);
  const draft = useServerFn(generateEmailDraft);
  const list = useServerFn(listCreatorMessages);
  const poll = useServerFn(pollGmailForReplies);

  const [conn, setConn] = useState<ConnStatus>({ kind: "loading" });
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<DraftMode>("Initial Outreach");
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pollErr, setPollErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [s, r] = await Promise.all([status(), list({ data: { creatorId: c.id } })]);
    if (!s.connected) setConn({ kind: "disconnected" });
    else setConn({
      kind: "connected",
      needsReconnect: s.needsReconnect,
      email: s.emailAddress,
      lastErrorReason: s.lastErrorReason ?? null,
      lastErrorStatus: s.lastErrorStatus ?? null,
    });
    setMsgs(r.messages as Msg[]);
    setLoading(false);
  }, [c.id, list, status]);

  useEffect(() => { refresh(); }, [refresh]);

  const senderFirstName = auth.status === "authenticated"
    ? auth.profile.fullName.split(/\s+/)[0]
    : "The team";

  const onGenerate = async () => {
    setErr(null); setDrafting(true);
    try {
      const r = await draft({
        data: {
          mode, creatorName: c.name,
          creatorHandle: c.instagram ?? c.tiktok ?? undefined,
          creatorNiche: c.segment ?? undefined,
          senderFirstName, existingDraft: body || undefined,
        },
      });
      if (r.subject) setSubject(r.subject);
      setBody(r.body);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setErr(m); toast.error("Draft failed", { description: m });
    } finally { setDrafting(false); }
  };

  const onSend = async () => {
    if (!c.email) {
      const m = "This creator has no email address on file.";
      setErr(m); toast.error(m); return;
    }
    if (!subject.trim() || !body.trim()) {
      const m = "Subject and body are required.";
      setErr(m); toast.error(m); return;
    }
    setErr(null); setSending(true);
    const stageLabel = labelHint(stage);
    try {
      const res = await send({
        data: {
          creatorId: c.id, creatorEmail: c.email, creatorName: c.name,
          subject: subject.trim(), body: body.trim(), stage,
        },
      });
      if (!res.ok) {
        // Gmail reported failure — do NOT mark waiting-for-reply.
        const summary = res.needsReconnect
          ? `Gmail rejected the send (${res.status}). Reconnect Gmail to fix.`
          : `Gmail send failed (${res.status}).`;
        setErr(`${summary} ${res.reason}`);
        toast.error("Send failed", { description: `${summary} ${res.reason}` });
        await refresh();
        return;
      }
      // Confirmed send — this is the ONLY path that flips waitingForReply.
      logConfirmedGmailSend(c, {
        messageId: res.messageId,
        threadId: res.threadId,
        subject: subject.trim(),
        stageLabel,
        actor: (auth.status === "authenticated" && auth.profile.teamId) ? auth.profile.teamId : undefined,
      });
      toast.success("Email sent", {
        description: `To ${c.name} · ${c.email} · Gmail id ${res.messageId.slice(0, 8)}…`,
      });
      setSubject(""); setBody("");
      await refresh();
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setErr(m); toast.error("Send failed", { description: m });
    } finally { setSending(false); }
  };

  const onCheckReplies = async () => {
    setPollErr(null);
    try {
      const r = await poll();
      if ("polled" in r && !r.polled) {
        const reason = ("errorReason" in r ? r.errorReason : undefined) ?? r.reason;
        setPollErr(`Gmail reply check failed (${"status" in r ? r.status : "?"}): ${reason}`);
        toast.error("Reply sync failed", { description: reason });
      } else if (r.polled) {
        toast.success(`Checked Gmail`, { description: `${r.stored} new message${r.stored === 1 ? "" : "s"} stored` });
      }
      await refresh();
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setPollErr(m); toast.error("Reply sync failed", { description: m });
    }
  };

  const isConnected = conn.kind === "connected";
  const needsReconnect = conn.kind === "connected" && conn.needsReconnect;

  return (
    <div className="space-y-6">
      {conn.kind === "disconnected" ? (
        <ConnectBanner />
      ) : needsReconnect ? (
        <ReconnectBanner reason={conn.lastErrorReason} status={conn.lastErrorStatus} />
      ) : null}

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Send via your Gmail</div>
            <h3 className="font-display text-base">Compose email to {c.name}</h3>
            {c.email ? (
              <div className="mt-0.5 text-xs text-muted-foreground">To: {c.email}</div>
            ) : (
              <div className="mt-0.5 text-xs text-red-600">No email address on this creator's record.</div>
            )}
          </div>
          {isConnected && !needsReconnect ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
              <MailCheck className="h-3 w-3" /> Gmail connected
            </span>
          ) : null}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select
            value={mode} onChange={(e) => setMode(e.target.value as DraftMode)}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          >
            {DRAFT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <button
            onClick={onGenerate} disabled={drafting || !isConnected || needsReconnect}
            className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--gold)]/20 px-3 py-1.5 text-sm font-medium text-[color:var(--forest)] hover:bg-[color:var(--gold)]/30 disabled:opacity-60"
          >
            {drafting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {body ? "Rewrite with AI" : "Generate draft"}
          </button>
          <span className="text-[11px] text-muted-foreground">Gemini 2.5 Flash · Signed by {senderFirstName}</span>
        </div>

        <input
          value={subject} onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="mb-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        <textarea
          value={body} onChange={(e) => setBody(e.target.value)}
          placeholder="Write your email or generate a draft above."
          rows={12}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed focus:border-ring focus:ring-2 focus:ring-ring/30"
        />

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-[11px] text-muted-foreground">
            On confirmed send: applies Gmail label <span className="font-medium">{labelHint(stage)}</span>, updates workflow, logs to timeline.
          </div>
          <button
            onClick={onSend}
            disabled={sending || !c.email || !isConnected || needsReconnect || !subject.trim() || !body.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-[color:var(--forest)] px-4 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send from my Gmail
          </button>
        </div>
        {err ? (
          <div className="mt-3 flex items-start gap-1.5 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span>{err}</span>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Conversation history</div>
            <h3 className="font-display text-base">Gmail thread with {c.name}</h3>
          </div>
          <button
            onClick={onCheckReplies}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-secondary"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Check for replies
          </button>
        </div>

        {pollErr ? (
          <div className="mb-3 flex items-start gap-1.5 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span>{pollErr}</span>
          </div>
        ) : null}

        {loading ? (
          <div className="grid place-items-center py-8"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : msgs.length === 0 ? (
          <div className="rounded-md border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
            No emails yet with {c.name}. Send one above — it'll appear here and in your Gmail Sent folder.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {msgs.map((m) => (
              <li key={m.id} className="flex items-start gap-3 py-3">
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                  m.direction === "sent" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                }`}>
                  {m.direction === "sent" ? <MailCheck className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium">
                      {m.direction === "sent" ? `You → ${c.name}` : `${m.from_name ?? m.from_email ?? c.name} → you`}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {m.sent_at ? new Date(m.sent_at).toLocaleString() : ""}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-sm font-medium">{m.subject ?? "(no subject)"}</div>
                  <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{m.snippet ?? ""}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ConnectBanner() {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-2 text-sm text-amber-900">
        <MailX className="mt-0.5 h-4 w-4" />
        <div>
          <div className="font-medium">Gmail isn't connected.</div>
          <div className="text-xs">Connect your Gmail in Settings to send outreach and sync replies.</div>
        </div>
      </div>
      <Link to="/settings" className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700">
        Connect Gmail
      </Link>
    </div>
  );
}

function ReconnectBanner({ reason, status }: { reason: string | null; status: number | null }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-2 text-sm text-red-900">
        <ShieldAlert className="mt-0.5 h-4 w-4" />
        <div>
          <div className="font-medium">Gmail connection needs attention.</div>
          <div className="text-xs">Reconnect Gmail to restore sending and reply syncing.</div>
          {reason ? <div className="mt-1 text-[11px] text-red-700">Last error {status ?? ""}: {reason}</div> : null}
        </div>
      </div>
      <Link to="/settings" className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
        Reconnect Gmail
      </Link>
    </div>
  );
}

function labelHint(stage: string): string {
  const s = stage.toLowerCase();
  if (s.includes("complete") || s.includes("partnership")) return "Completed";
  if (s.includes("campaign") || s.includes("negotiat")) return "Campaign";
  if (s.includes("waiting") || s.includes("follow")) return "Waiting Reply";
  if (s.includes("outreach") || s.includes("contact") || s.includes("sent")) return "Outreach";
  return "Creator Partnerships";
}
