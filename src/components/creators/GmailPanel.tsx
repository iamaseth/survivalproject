// Real Gmail composer, AI drafter, and cached conversation history for a creator.
// Uses the signed-in user's Gmail via the App User Connector.
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Loader2, Mail, MailCheck, Send, Sparkles, RefreshCw, AlertCircle, MailX } from "lucide-react";
import type { CreatorRow } from "@/lib/creator-partnerships";
import { useWorkspace, addActivity, updateWorkspace } from "@/lib/creator-workspace";
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

export function GmailPanel({ c }: { c: CreatorRow }) {
  const auth = useAuth();
  const ws = useWorkspace(c);
  const stage = computeStage(c, ws);

  const status = useServerFn(getGmailConnectionStatus);
  const send = useServerFn(sendGmailToCreator);
  const draft = useServerFn(generateEmailDraft);
  const list = useServerFn(listCreatorMessages);
  const poll = useServerFn(pollGmailForReplies);

  const [connected, setConnected] = useState<boolean | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<DraftMode>("Initial Outreach");
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [s, r] = await Promise.all([status(), list({ data: { creatorId: c.id } })]);
    setConnected(s.connected);
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
          mode,
          creatorName: c.name,
          creatorHandle: c.username ?? undefined,
          creatorNiche: c.segment ?? undefined,
          senderFirstName,
          existingDraft: body || undefined,
        },
      });
      if (r.subject) setSubject(r.subject);
      setBody(r.body);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setDrafting(false); }
  };

  const onSend = async () => {
    if (!c.email) { setErr("This creator has no email address on file."); return; }
    if (!subject.trim() || !body.trim()) { setErr("Subject and body are required."); return; }
    setErr(null); setSending(true);
    try {
      await send({
        data: {
          creatorId: c.id, creatorEmail: c.email, creatorName: c.name,
          subject: subject.trim(), body: body.trim(), stage,
        },
      });
      // Log to the local workspace + activity timeline so the workflow moves forward.
      updateWorkspace(c, {
        outreachStatus: "Sent",
        lastContactDate: new Date().toISOString().slice(0, 10),
        emailDraftCreated: true,
      });
      addActivity(c, {
        kind: "email_sent",
        action: `Sent Gmail: "${subject.trim().slice(0, 80)}"`,
        notes: `via ${auth.status === "authenticated" ? auth.profile.email : "connected Gmail"} · label ${labelHint(stage)}`,
      });
      setNotice("Sent from your Gmail. It's in your Sent folder and the creator timeline is updated.");
      setSubject(""); setBody("");
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setSending(false); }
  };

  const onCheckReplies = async () => {
    try { await poll(); await refresh(); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <div className="space-y-6">
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
          {connected === false ? (
            <Link to="/settings" className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-200">
              <MailX className="h-3.5 w-3.5" /> Connect your Gmail
            </Link>
          ) : connected ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
              <MailCheck className="h-3 w-3" /> Gmail connected
            </span>
          ) : null}
        </div>

        {/* AI drafter */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select
            value={mode} onChange={(e) => setMode(e.target.value as DraftMode)}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          >
            {DRAFT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <button
            onClick={onGenerate} disabled={drafting || connected === false}
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
            On send: applies Gmail label <span className="font-medium">{labelHint(stage)}</span>, updates workflow, logs to timeline.
          </div>
          <button
            onClick={onSend}
            disabled={sending || !c.email || connected === false || !subject.trim() || !body.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-[color:var(--forest)] px-4 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send from my Gmail
          </button>
        </div>
        {err ? (
          <div className="mt-3 inline-flex items-start gap-1.5 rounded-md bg-red-50 px-3 py-1.5 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5" /> {err}
          </div>
        ) : null}
        {notice ? <div className="mt-3 text-xs text-emerald-700">{notice}</div> : null}
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

function labelHint(stage: string): string {
  const s = stage.toLowerCase();
  if (s.includes("complete") || s.includes("partnership")) return "Completed";
  if (s.includes("campaign") || s.includes("negotiat")) return "Campaign";
  if (s.includes("waiting") || s.includes("follow")) return "Waiting Reply";
  if (s.includes("outreach") || s.includes("contact") || s.includes("sent")) return "Outreach";
  return "Creator Partnerships";
}
