import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { importProspects, countProspects } from "@/lib/prospects.functions";
import { parseProspectsPaste } from "@/lib/prospects-parse";

export function ImportProspectsSection() {
  const runImport = useServerFn(importProspects);
  const getCount = useServerFn(countProspects);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ rows: number; skippedNoDomain: number } | null>(null);
  const [result, setResult] = useState<{ inserted: number; skipped: number; total: number } | null>(null);
  const [totalInDb, setTotalInDb] = useState<number | null>(null);

  const doPreview = () => {
    const parsed = parseProspectsPaste(text);
    setPreview({ rows: parsed.rows.length, skippedNoDomain: parsed.skippedNoDomain });
    setResult(null);
  };

  const doImport = async () => {
    const parsed = parseProspectsPaste(text);
    if (parsed.rows.length === 0) {
      toast.error("No valid rows detected. Ensure a Website or Email column exists.");
      return;
    }
    setBusy(true);
    try {
      const res = await runImport({ data: { rows: parsed.rows } });
      setResult(res);
      toast.success(`${res.inserted} new prospects added, ${res.skipped} skipped (already exist).`);
      const c = await getCount();
      setTotalInDb(c.count);
    } catch (e: any) {
      toast.error(e?.message ?? "Import failed");
    } finally {
      setBusy(false);
    }
  };

  const refreshCount = async () => {
    try { const c = await getCount(); setTotalInDb(c.count); } catch {}
  };

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg flex items-center gap-2"><Upload className="h-4 w-4" /> Import prospects</h2>
          <p className="text-xs text-muted-foreground">
            Paste CSV or Google Sheets rows (with a header row). Dedup key is the <strong>normalized website domain</strong> — existing rows are never overwritten. Safe to re-run any time as the list grows.
          </p>
        </div>
        <button onClick={refreshCount} className="text-xs text-muted-foreground hover:text-foreground">
          {totalInDb === null ? "Check total" : `${totalInDb} in database`}
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setPreview(null); setResult(null); }}
        placeholder={"Paste including the header row. Recognized columns: Company, Website, Contact, Email, Phone, Stage, Source, Notes"}
        className="h-40 w-full rounded-md border border-input bg-background p-2 font-mono text-xs"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          onClick={doPreview}
          disabled={!text.trim() || busy}
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-50"
        >
          Preview
        </button>
        <button
          onClick={doImport}
          disabled={!text.trim() || busy}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Import prospects
        </button>
        {preview ? (
          <span className="text-xs text-muted-foreground">
            {preview.rows} row{preview.rows === 1 ? "" : "s"} ready
            {preview.skippedNoDomain > 0 ? ` · ${preview.skippedNoDomain} without a website/email will be skipped` : ""}
          </span>
        ) : null}
      </div>

      {result ? (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-emerald-300 bg-emerald-50/50 p-3 text-xs text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4" />
          <div>
            <div><strong>{result.inserted}</strong> new prospects added, <strong>{result.skipped}</strong> skipped (already exist).</div>
            <div className="mt-0.5 text-emerald-800/80">Existing rows were not modified. Re-running this import will only add newly added rows.</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
