import { useState, type ReactNode } from "react";
import { Phone, Mail, MessageCircle, User, ArrowUpRight, ArrowDownLeft, Trash2, Plus } from "lucide-react";
import type { CreatorRow } from "@/lib/creator-partnerships";
import { logContactAttempt, removeContactAttempt, useWorkspace, type ContactChannel, type ContactDirection } from "@/lib/creator-workspace";

const CHANNEL_ICON: Record<ContactChannel, ReactNode> = {
  email: <Mail className="h-3 w-3" />,
  dm: <MessageCircle className="h-3 w-3" />,
  call: <Phone className="h-3 w-3" />,
  in_person: <User className="h-3 w-3" />,
  other: <MessageCircle className="h-3 w-3" />,
};

export function ContactLog({ c }: { c: CreatorRow }) {
  const ws = useWorkspace(c);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    at: new Date().toISOString().slice(0, 10),
    channel: "email" as ContactChannel,
    direction: "outbound" as ContactDirection,
    subject: "",
    summary: "",
  });

  const submit = () => {
    if (!form.summary.trim()) return;
    logContactAttempt(c, {
      channel: form.channel,
      direction: form.direction,
      subject: form.subject || null,
      summary: form.summary.trim(),
      at: new Date(form.at).toISOString(),
    });
    setForm({ ...form, subject: "", summary: "" });
    setOpen(false);
  };

  const sorted = [...ws.contactAttempts].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Contact attempts ({ws.contactAttempts.length})</h3>
        <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs hover:bg-secondary">
          <Plus className="h-3 w-3" /> Log attempt
        </button>
      </div>

      {open && (
        <div className="mb-3 grid gap-2 rounded-md border border-dashed border-input p-3 md:grid-cols-2">
          <label className="text-xs">Date
            <input type="date" value={form.at} onChange={(e) => setForm({ ...form, at: e.target.value })} className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1 text-sm" />
          </label>
          <label className="text-xs">Channel
            <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as ContactChannel })} className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1 text-sm">
              <option value="email">Email</option><option value="dm">DM</option><option value="call">Call</option><option value="in_person">In-person</option><option value="other">Other</option>
            </select>
          </label>
          <label className="text-xs">Direction
            <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value as ContactDirection })} className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1 text-sm">
              <option value="outbound">Outbound</option><option value="inbound">Inbound</option>
            </select>
          </label>
          <label className="text-xs">Subject
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1 text-sm" />
          </label>
          <label className="text-xs md:col-span-2">Summary
            <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={2} className="mt-0.5 w-full rounded-md border border-input bg-background p-2 text-sm" />
          </label>
          <div className="md:col-span-2 flex justify-end">
            <button onClick={submit} className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90">Save</button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground">No contact attempts yet. Gmail sends log automatically.</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((a) => (
            <li key={a.id} className="rounded-md border border-border bg-background p-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5">
                      {a.direction === "outbound" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                      {a.direction}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5">{CHANNEL_ICON[a.channel]}{a.channel}</span>
                    <span>{a.at.slice(0, 10)}</span>
                    {a.actor ? <span>· {a.actor}</span> : null}
                  </div>
                  {a.subject ? <div className="text-xs font-medium">{a.subject}</div> : null}
                  <div className="whitespace-pre-wrap text-sm">{a.summary}</div>
                </div>
                <button onClick={() => removeContactAttempt(c, a.id)} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-red-700">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
