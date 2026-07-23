import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  creatorById,
  OUTREACH_TEMPLATES,
  renderTemplate,
  priorityTone,
  ownerTone,
  perryTone,
  sampleTone,
  responseTone,
  isOverdue,
  type CreatorRow,
} from "@/lib/creator-partnerships";
import {
  useWorkspace,
  updateWorkspace,
  addActivity,
  type Activity,
  type OutreachStatus,
  type DeliveryStatus,
} from "@/lib/creator-workspace";
import { PageHeader } from "@/components/PageHeader";
import { ArrowLeft, ExternalLink, Mail, Copy, Send, Truck, ShieldCheck, Clock, AlertCircle, UserCheck, FileText, ListChecks, StickyNote } from "lucide-react";

export const Route = createFileRoute("/creators/$id")({
  loader: ({ params }) => {
    const c = creatorById(params.id);
    if (!c) throw notFound();
    return { creator: c };
  },
  head: ({ loaderData }) => {
    const c = loaderData?.creator;
    const title = c ? `${c.name} — Survival Tabs Partnerships` : "Creator — Survival Tabs";
    const desc = c ? `${c.segment ?? "Creator"} · Owner ${c.outreachOwner ?? "unassigned"} · ${c.responseState}` : "Creator partnership record";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  errorComponent: ({ error, reset }) => (
    <div className="p-8">
      <p className="text-sm text-destructive">Error loading creator: {String(error)}</p>
      <button onClick={reset} className="mt-2 text-sm underline">Retry</button>
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-8">
      <p className="text-sm">Creator not found.</p>
      <Link to="/creators" className="mt-2 inline-block text-sm text-primary underline">Back to Creator Partnerships</Link>
    </div>
  ),
  component: CreatorDetail,
});

type Tab = "overview" | "assignment" | "outreach" | "email" | "shipping" | "content" | "approval" | "activity" | "notes" | "raw";

function CreatorDetail() {
  const { creator: c } = Route.useLoaderData();
  const [tab, setTab] = useState<Tab>("overview");
  const overdue = isOverdue(c);
  const ws = useWorkspace(c);

  return (
    <div>
      <Link to="/creators" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Creator Partnerships
      </Link>

      <PageHeader
        eyebrow={`${c.id} · Supervisor RENA · Owner ${ws.currentOwner ?? "Unassigned"}`}
        title={c.name}
        description={c.segment ?? undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded px-2 py-1 text-[11px] ${priorityTone(c.priority)}`}>{c.priority ?? "No priority"}</span>
            <span className={`inline-flex rounded px-2 py-1 text-[11px] ${ownerTone(ws.currentOwner)}`}>{ws.currentOwner ?? "Unassigned"}</span>
            <span className={`inline-flex rounded px-2 py-1 text-[11px] ${perryTone(c.perryApproval)}`}>
              Perry: {c.perryApproval}
            </span>
          </div>
        }
      />

      {/* Snapshot */}
      <section className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        <SnapshotCard icon={<Mail className="h-4 w-4" />} label="Outreach" value={ws.outreachStatus} tone="bg-secondary text-secondary-foreground" />
        <SnapshotCard icon={<Truck className="h-4 w-4" />} label="Delivery" value={ws.deliveryStatus} tone={sampleTone(c.normalizedSampleStatus)} />
        <SnapshotCard
          icon={<Clock className="h-4 w-4" />}
          label="Next follow-up"
          value={ws.nextFollowUpDate ?? "—"}
          tone={overdue ? "bg-red-100 text-red-800" : "bg-secondary text-secondary-foreground"}
          extra={overdue ? <span className="ml-1 inline-flex items-center gap-1 text-[10px] text-red-700"><AlertCircle className="h-3 w-3" /> Overdue</span> : null}
        />
        <SnapshotCard icon={<ShieldCheck className="h-4 w-4" />} label="Perry (advisory)" value={c.perryApproval} tone={perryTone(c.perryApproval)} />
      </section>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-1 border-b border-border">
        {(
          [
            ["overview", "Overview"],
            ["assignment", "Assignment"],
            ["outreach", "Outreach"],
            ["email", "Draft email"],
            ["shipping", "Shipping"],
            ["content", "Content"],
            ["activity", "Activity timeline"],
            ["notes", "Internal notes"],
            ["approval", "Perry notes"],
            ["raw", "All sheet fields"],
          ] as [Tab, string][]
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`border-b-2 px-3 py-2 text-sm transition ${
              tab === k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview c={c} />}
      {tab === "assignment" && <AssignmentPanel c={c} />}
      {tab === "outreach" && <OutreachPanel c={c} />}
      {tab === "email" && <EmailDrafter c={c} />}
      {tab === "shipping" && <Shipping c={c} />}
      {tab === "content" && <ContentPanel c={c} />}
      {tab === "activity" && <ActivityTimeline c={c} />}
      {tab === "notes" && <InternalNotes c={c} />}
      {tab === "approval" && <PerryApprovalPanel c={c} />}
      {tab === "raw" && <RawFields c={c} />}
    </div>
  );
}

function SnapshotCard({ icon, label, value, tone, extra }: { icon: React.ReactNode; label: string; value: string; tone: string; extra?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">{icon}{label}</div>
      <div className={`inline-flex rounded px-2 py-1 text-xs font-medium ${tone}`}>{value}</div>
      {extra}
    </div>
  );
}

function Overview({ c }: { c: CreatorRow }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Identity & reach">
        <KV k="Segment" v={c.segment} />
        <KV k="Primary platforms" v={c.primaryPlatforms} />
        <KV k="Reach / location" v={c.reachSignal} />
        <KV k="Followers signal" v={c.followersSignal} />
        <KV k="Target audience" v={c.targetAudience} />
        <KV k="Geography" v={c.geography} />
        <KV k="Geo confidence" v={c.geographyConfidence} />
        <div className="mt-2 flex flex-wrap gap-2">
          {c.instagram && <PlatformLink label="Instagram" url={c.instagram} />}
          {c.youtube && <PlatformLink label="YouTube" url={c.youtube} />}
          {c.tiktok && <PlatformLink label="TikTok" url={c.tiktok} />}
          {c.facebook && <PlatformLink label="Facebook" url={c.facebook} />}
          {c.otherPlatform && <PlatformLink label="Other" url={c.otherPlatform} />}
        </div>
      </Card>

      <Card title="Contact">
        <KV k="Email" v={c.email} mono />
        <KV k="Contact route" v={c.contactRoute} link />
        <KV k="Confidence" v={c.contactConfidence} />
        <KV k="Preferred method" v={c.contactMethod} />
        <KV k="Amazon" v={c.amazon} />
        <KV k="Monetization" v={c.monetization} />
      </Card>

      <Card title="Research">
        <KV k="Status" v={c.researchStatus} />
        <KV k="Last researched" v={c.lastResearched} />
        <KV k="Research notes" v={c.researchNotes} />
        <KV k="Seth next action" v={c.sethNextAction} />
        <KV k="Verification" v={c.fullVerification} />
        <KV k="Verified on" v={c.verificationDate} />
      </Card>

      <Card title="Offer & partnership">
        <KV k="Recommended offer" v={c.recommendedOffer} />
        <KV k="Partnership tier" v={c.partnershipTier} />
        <KV k="Offer confidence" v={c.offerConfidence} />
        <KV k="Reasoning" v={c.offerReasoning} />
        <KV k="Tuan affiliate" v={c.tuanAffiliateStatus} />
        <KV k="Creator code / link" v={c.creatorCode} />
      </Card>

      {c.renaNotes ? (
        <Card title="Rena notes" full>
          <p className="text-sm">{c.renaNotes}</p>
        </Card>
      ) : null}
      {c.perryComments ? (
        <Card title="Perry comments" full>
          <p className="text-sm">{c.perryComments}</p>
        </Card>
      ) : null}
    </div>
  );
}

function OutreachHistory({ c }: { c: CreatorRow }) {
  return (
    <Card title="Outreach timeline">
      {c.outreachHistory.length === 0 ? (
        <p className="text-sm text-muted-foreground">No outreach recorded yet. Draft the first message in the Email tab.</p>
      ) : (
        <ol className="space-y-3">
          {c.outreachHistory.map((e) => (
            <li key={e.id} className="rounded-md border border-border bg-secondary/40 p-3">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-card px-1.5 py-0.5 font-medium text-foreground">{e.actor}</span>
                  <span>{e.channel}</span>
                  {e.subject ? <span className="text-foreground">· {e.subject}</span> : null}
                </div>
                <span>{e.at}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{e.body}</p>
            </li>
          ))}
        </ol>
      )}
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <KV k="Contacted date" v={c.contactedDate} />
        <KV k="Contact method" v={c.contactMethod} />
        <KV k="Response / follow-up" v={c.responseFollowup} />
      </div>
    </Card>
  );
}

function EmailDrafter({ c }: { c: CreatorRow }) {
  const owner = c.outreachOwner ?? "RENA";
  const [tplId, setTplId] = useState(OUTREACH_TEMPLATES[0].id);
  const tpl = OUTREACH_TEMPLATES.find((t) => t.id === tplId)!;
  const rendered = useMemo(() => renderTemplate(tpl, c, owner), [tpl, c, owner]);
  const [subject, setSubject] = useState(rendered.subject);
  const [body, setBody] = useState(rendered.body);
  const [dirty, setDirty] = useState(false);
  const useRendered = () => {
    setSubject(rendered.subject);
    setBody(rendered.body);
    setDirty(false);
  };

  const to = c.email ?? "";
  const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <aside className="rounded-lg border border-border bg-card p-3">
        <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">Templates</div>
        <ul className="space-y-1">
          {OUTREACH_TEMPLATES.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => {
                  setTplId(t.id);
                  const r = renderTemplate(t, c, owner);
                  setSubject(r.subject);
                  setBody(r.body);
                  setDirty(false);
                }}
                className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${
                  tplId === t.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                }`}
              >
                {t.name}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 text-[11px] text-muted-foreground">
          <div>Signing as <strong>{owner}</strong></div>
          <div>Perry gate: <strong>{c.perryApproval}</strong></div>
          {c.perryApproval !== "Approved" && c.normalizedSampleStatus === "Approval Pending" ? (
            <div className="text-red-700">Hold — Perry must approve before shipping.</div>
          ) : null}
        </div>
      </aside>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-2 grid grid-cols-[70px_1fr] items-center gap-2 text-sm">
          <label className="text-muted-foreground">To</label>
          <input
            value={to}
            readOnly
            className="rounded-md border border-input bg-secondary/40 px-2 py-1.5 font-mono text-xs"
          />
          <label className="text-muted-foreground">Subject</label>
          <input
            value={subject}
            onChange={(e) => { setSubject(e.target.value); setDirty(true); }}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
        </div>
        <textarea
          value={body}
          onChange={(e) => { setBody(e.target.value); setDirty(true); }}
          className="h-72 w-full rounded-md border border-input bg-background p-2 text-sm"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a
            href={gmail}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 ${!to ? "pointer-events-none opacity-50" : ""}`}
          >
            <Send className="h-4 w-4" /> Open in Gmail
          </a>
          <a
            href={mailto}
            className={`inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-secondary ${!to ? "pointer-events-none opacity-50" : ""}`}
          >
            <Mail className="h-4 w-4" /> Default mail app
          </a>
          <button
            onClick={() => { navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`); }}
            className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-secondary"
          >
            <Copy className="h-4 w-4" /> Copy
          </button>
          {dirty ? (
            <button onClick={useRendered} className="text-xs text-muted-foreground underline">Reset to template</button>
          ) : null}
          {!to ? <span className="text-xs text-red-700">No verified email on file — use contact route instead.</span> : null}
        </div>
      </div>
    </div>
  );
}

function Shipping({ c }: { c: CreatorRow }) {
  const stages: { key: string; label: string; done: boolean }[] = [
    { key: "approval", label: "Perry approves sample", done: c.perryApproval === "Approved" },
    { key: "await", label: "Awaiting shipping address", done: ["Address Received", "Shipped", "Delivered"].includes(c.normalizedSampleStatus) },
    { key: "address", label: "Address received", done: ["Address Received", "Shipped", "Delivered"].includes(c.normalizedSampleStatus) },
    { key: "shipped", label: "Sample shipped", done: ["Shipped", "Delivered"].includes(c.normalizedSampleStatus) },
    { key: "delivered", label: "Delivered", done: c.normalizedSampleStatus === "Delivered" },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Shipping status">
        <div className="mb-3">
          <span className={`inline-flex rounded px-2 py-1 text-sm font-medium ${sampleTone(c.normalizedSampleStatus)}`}>{c.normalizedSampleStatus}</span>
        </div>
        <ol className="space-y-2">
          {stages.map((s, i) => (
            <li key={s.key} className="flex items-center gap-2 text-sm">
              <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${s.done ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{i + 1}</span>
              <span className={s.done ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
            </li>
          ))}
        </ol>
      </Card>
      <Card title="From master sheet">
        <KV k="Sample status (raw)" v={c.sampleStatus} />
        <KV k="Recommended offer" v={c.recommendedOffer} />
        <KV k="Partnership tier" v={c.partnershipTier} />
        <KV k="Rena notes" v={c.renaNotes} />
      </Card>
    </div>
  );
}

function PerryApprovalPanel({ c }: { c: CreatorRow }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Approval state">
        <div className="mb-3">
          <span className={`inline-flex rounded px-2 py-1 text-sm font-medium ${perryTone(c.perryApproval)}`}>{c.perryApproval}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Perry sets strategy and provides final sign-off before samples ship or affiliate terms are confirmed. Rena and Vina do not proceed to shipping or affiliate confirmation without an approval here.
        </p>
      </Card>
      <Card title="Perry's comments">
        {c.perryComments ? <p className="whitespace-pre-wrap text-sm">{c.perryComments}</p> : <p className="text-sm text-muted-foreground">No comments recorded yet.</p>}
      </Card>
    </div>
  );
}

function RawFields({ c }: { c: CreatorRow }) {
  const rows: [string, string | null][] = [
    ["Creator ID", c.id], ["Creator", c.name], ["Segment", c.segment], ["Primary Platforms", c.primaryPlatforms],
    ["Primary Source", c.primarySource], ["Reach / Location Signal", c.reachSignal], ["Verified Public Email", c.email],
    ["Official Contact Route", c.contactRoute], ["Contact Confidence", c.contactConfidence], ["Research Status", c.researchStatus],
    ["Priority", c.priority], ["Amazon", c.amazon], ["Research Notes / Next Check", c.researchNotes], ["Last Researched", c.lastResearched],
    ["Seth Next Action", c.sethNextAction], ["Outreach Owner", c.outreachOwner], ["Perry Comments", c.perryComments],
    ["Amazon Confidence", c.amazonConfidence], ["Monetization", c.monetization], ["Verification Evidence", c.verificationEvidence],
    ["Contacted Date", c.contactedDate], ["Contact Method", c.contactMethod], ["Response / Follow-up", c.responseFollowup],
    ["Sample Status", c.sampleStatus], ["Rena Notes", c.renaNotes], ["Tuan Affiliate Status", c.tuanAffiliateStatus],
    ["Creator Code / Link", c.creatorCode], ["Technical Notes", c.technicalNotes], ["Recent Activity Check", c.recentActivityCheck],
    ["Full Verification Result", c.fullVerification], ["Verification Evidence / Date", c.verificationDate],
    ["Current Followers / Reach Signal", c.followersSignal], ["Main Target Audience", c.targetAudience],
    ["Likely Audience Geography", c.geography], ["Geography Confidence", c.geographyConfidence],
    ["Facebook URL", c.facebook], ["Instagram URL", c.instagram], ["TikTok URL", c.tiktok], ["YouTube URL", c.youtube],
    ["Other Platform + URL", c.otherPlatform], ["Recommended Offer", c.recommendedOffer],
    ["Estimated Partnership Tier", c.partnershipTier], ["Offer Confidence", c.offerConfidence], ["Offer Reasoning", c.offerReasoning],
  ];
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-border">
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td className="w-64 bg-secondary/40 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">{k}</td>
              <td className="whitespace-pre-wrap px-3 py-2 text-sm">{v ?? <span className="text-muted-foreground">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Card({ title, children, full }: { title: string; children: React.ReactNode; full?: boolean }) {
  return (
    <section className={`rounded-lg border border-border bg-card p-4 ${full ? "md:col-span-2" : ""}`}>
      <h3 className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function KV({ k, v, mono, link }: { k: string; v: string | null | undefined; mono?: boolean; link?: boolean }) {
  return (
    <div className="mb-1.5 grid grid-cols-[140px_1fr] gap-2 text-sm">
      <div className="text-xs text-muted-foreground">{k}</div>
      <div className={mono ? "font-mono text-xs" : ""}>
        {v ? (
          link ? (
            <a href={v} target="_blank" rel="noreferrer" className="text-primary hover:underline">{v}</a>
          ) : (
            v
          )
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
}

function PlatformLink({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-xs hover:bg-secondary"
    >
      {label} <ExternalLink className="h-3 w-3" />
    </a>
  );
}
