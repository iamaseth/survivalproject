import type { CreatorRow } from "@/lib/creator-partnerships";
import { computeTotalCost, recomputeRoi, updateWorkspace, useWorkspace, type DealType } from "@/lib/creator-workspace";

const DEAL_TYPES: DealType[] = ["gifted", "flat_fee", "commission", "hybrid", "none"];

export function DealROI({ c }: { c: CreatorRow }) {
  const ws = useWorkspace(c);
  const total = computeTotalCost(ws);
  const rev = ws.revenueAttributedUsd ?? 0;
  const roi = total > 0 ? rev / total : null;

  const num = (v: string) => (v === "" ? null : Number(v));
  const patch = (p: Parameters<typeof updateWorkspace>[1]) => { updateWorkspace(c.id, p); recomputeRoi(c); };

  const Field = ({ label, value, onChange, prefix, step = "0.01" }: any) => (
    <label className="block text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="mt-0.5 flex items-center rounded-md border border-input bg-background">
        {prefix ? <span className="pl-2 text-xs text-muted-foreground">{prefix}</span> : null}
        <input
          type="number" step={step} min={0} value={value ?? ""}
          onChange={(e) => onChange(num(e.target.value))}
          className="w-full bg-transparent px-2 py-1 text-sm outline-none"
        />
      </div>
    </label>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Deal</h3>
        <label className="mb-2 block text-xs">Deal type
          <select
            value={ws.dealType}
            onChange={(e) => patch({ dealType: e.target.value as DealType })}
            className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            {DEAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <div className="grid gap-2 md:grid-cols-2">
          <Field label="Sample cost" prefix="$" value={ws.sampleCostUsd} onChange={(v: number | null) => patch({ sampleCostUsd: v })} />
          <Field label="Shipping cost" prefix="$" value={ws.shippingCostUsd} onChange={(v: number | null) => patch({ shippingCostUsd: v })} />
          <Field label="Flat fee" prefix="$" value={ws.flatFeeUsd} onChange={(v: number | null) => patch({ flatFeeUsd: v })} />
          <Field label="Commission rate" prefix="" step="0.001" value={ws.commissionRate} onChange={(v: number | null) => patch({ commissionRate: v })} />
          <Field label="Commission sales" prefix="$" value={ws.commissionSalesUsd} onChange={(v: number | null) => patch({ commissionSalesUsd: v })} />
        </div>
        <label className="mt-2 block text-xs">Payout notes
          <textarea
            value={ws.payoutNotes ?? ""}
            onChange={(e) => patch({ payoutNotes: e.target.value || null })}
            rows={2}
            className="mt-0.5 w-full rounded-md border border-input bg-background p-2 text-sm"
          />
        </label>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">ROI rollup</h3>
        <div className="mb-2 grid gap-2 md:grid-cols-3">
          <Stat label="Total spend" value={`$${total.toFixed(2)}`} />
          <Stat label="Revenue" value={`$${rev.toFixed(2)}`} />
          <Stat label="ROI" value={roi === null ? "—" : `${(roi * 100).toFixed(0)}%`} tone={roi === null ? "" : roi >= 1 ? "text-emerald-700" : "text-amber-800"} />
        </div>
        <Field label="Revenue attributed" prefix="$" value={ws.revenueAttributedUsd} onChange={(v: number | null) => patch({ revenueAttributedUsd: v })} />
        <p className="mt-2 text-[11px] text-muted-foreground">
          Total cost = sample + shipping + flat fee + (rate × sales). Updated {ws.roiUpdatedAt ? new Date(ws.roiUpdatedAt).toLocaleString() : "never"}.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${tone}`}>{value}</div>
    </div>
  );
}
