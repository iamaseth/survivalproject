import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, Mail, MailCheck, Inbox } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { listRecentMessages, pollGmailForReplies, getGmailConnectionStatus } from "@/lib/gmail.functions";
import { CREATORS } from "@/lib/creator-partnerships";

export const Route = createFileRoute("/communications")({
  head: () => ({
    meta: [
      { title: "Communications — Survival Tabs" },
      { name: "description", content: "Every creator email — sent, received, and drafted — in one place." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CommunicationsPage,
});

type Row = {
  id: string; gmail_message_id: string; creator_id: string | null;
  direction: string; from_email: string | null; from_name: string | null;
  subject: string | null; snippet: string | null; sent_at: string | null; user_id: string;
};

function CommunicationsPage() {
  const list = useServerFn(listRecentMessages);
  const poll = useServerFn(pollGmailForReplies);
  const status = useServerFn(getGmailConnectionStatus);

  const [messages, setMessages] = useState<Row[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [filter, setFilter] = useState<"all" | "sent" | "received">("all");

  const refresh = useCallback(async () => {
    const [s, r] = await Promise.all([status(), list()]);
    setConnected(s.connected);
    setMessages(r.messages as Row[]);
    setLoading(false);
  }, [list, status]);

  useEffect(() => { refresh(); }, [refresh]);

  const doPoll = async () => {
    setPolling(true);
    try { await poll(); await refresh(); } finally { setPolling(false); }
  };

  const creatorName = (id: string | null) => id ? (CREATORS.find((c) => c.id === id)?.name ?? id) : null;

  const filtered = messages.filter((m) =>
    filter === "all" ? true : filter === "sent" ? m.direction === "sent" : m.direction === "received",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Communications"
        title="Team inbox"
        description="Every creator email across the team — pulled from each teammate's own Gmail."
        actions={
          <button
            onClick={doPoll}
            disabled={polling || !connected}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-secondary disabled:opacity-60"
          >
            {polling ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Check for replies
          </button>
        }
      />

      {connected === false ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Your Gmail isn't connected yet. <Link to="/settings" className="underline">Connect it in Settings</Link> to sync your creator emails.
        </div>
      ) : null}

      <div className="flex items-center gap-1 border-b border-border">
        {(["all", "received", "sent"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`border-b-2 px-3 py-2 text-sm transition ${
              filter === k
                ? "border-[color:var(--forest)] text-[color:var(--forest)]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {k === "all" ? "All messages" : k === "received" ? "Received" : "Sent"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid place-items-center py-16 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          <Inbox className="mb-2 h-6 w-6" />
          No messages yet. Click "Check for replies" to pull the latest from connected inboxes.
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {filtered.map((m) => (
            <MessageRow key={m.id} m={m} creatorName={creatorName(m.creator_id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function MessageRow({ m, creatorName }: { m: Row; creatorName: string | null }) {
  const Icon = m.direction === "sent" ? MailCheck : Mail;
  const inner = (
    <div className="flex items-start gap-3 p-4 hover:bg-secondary/40">
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
        m.direction === "sent" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
      }`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 truncate text-sm">
            <span className="font-medium">
              {m.direction === "sent" ? `To: ${creatorName ?? m.from_email ?? "creator"}` : (m.from_name ?? m.from_email ?? "Unknown")}
            </span>
            {creatorName ? <span className="ml-2 rounded bg-[color:var(--forest)]/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[color:var(--forest)]">{creatorName}</span> : null}
          </div>
          <div className="shrink-0 text-xs text-muted-foreground">
            {m.sent_at ? new Date(m.sent_at).toLocaleString() : ""}
          </div>
        </div>
        <div className="mt-0.5 truncate text-sm font-medium text-foreground">{m.subject ?? "(no subject)"}</div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">{m.snippet ?? ""}</div>
      </div>
    </div>
  );
  return m.creator_id ? (
    <Link to="/creators/$id" params={{ id: m.creator_id }} className="block">{inner}</Link>
  ) : inner;
}
