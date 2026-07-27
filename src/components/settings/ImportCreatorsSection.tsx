import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { importCreators, type CreatorImportRow } from "@/lib/creators.functions";
import { normalizeDomain } from "@/lib/prospects-parse";

// Very small CSV/TSV parser mirroring parseProspectsPaste behaviour: first
// non-empty line is the header. Column mapping is case/space-insensitive.
function parseCreatorsPaste(text: string): { rows: CreatorImportRow[]; skippedNoKey: number } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { rows: [], skippedNoKey: 0 };
  const delim = lines[0].includes("\t") ? "\t" : ",";
  const split = (l: string) => {
    if (delim === "\t") return l.split("\t");
    const out: string[] = []; let cur = ""; let inQ = false;
    for (let i = 0; i < l.length; i++) {
      const ch = l[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { out.push(cur); cur = ""; continue; }
      cur += ch;
    }
    out.push(cur);
    return out;
  };
  const header = split(lines[0]).map((h) => h.trim().toLowerCase());
  const pick = (row: string[], ...keys: string[]) => {
    for (const k of keys) {
      const idx = header.indexOf(k);
      if (idx >= 0 && row[idx] !== undefined) return row[idx].trim();
    }
    return "";
  };
  const rows: CreatorImportRow[] = [];
  let skipped = 0;
  for (let i = 1; i < lines.length; i++) {
    const cells = split(lines[i]);
    const code = pick(cells, "code", "creator code", "id");
    const website = pick(cells, "website", "url", "domain");
    const email = pick(cells, "email");
    const dom = normalizeDomain(website) || normalizeDomain(email);
    if (!code && !dom) { skipped++; continue; }
    rows.push({
      code: code || null,
      normalized_domain: dom || null,
      name: pick(cells, "name", "creator", "channel") || code || dom,
      segment: pick(cells, "segment", "niche") || null,
      primary_platforms: pick(cells, "platforms", "primary platforms") || null,
      email: email || null,
      facebook: pick(cells, "facebook", "fb") || null,
      instagram: pick(cells, "instagram", "ig") || null,
      tiktok: pick(cells, "tiktok", "tt") || null,
      youtube: pick(cells, "youtube", "yt") || null,
      priority: pick(cells, "priority") || null,
      amazon: pick(cells, "amazon") || null,
      research_notes: pick(cells, "notes", "research notes") || null,
      outreach_owner: pick(cells, "owner", "outreach owner") || null,
    });
  }
  return { rows, skippedNoKey: skipped };
}

export function ImportCreatorsSection() {
  const runImport = useServerFn(importCreators);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ rows: number; skipped: number } | null>(null);
  const [result, setResult] = useState<{ inserted: number; skipped: number; total: number } | null>(null);

  const doPreview = () => {
    const parsed = parseCreatorsPaste(text);
    setPreview({ rows: parsed.rows.length, skipped: parsed.skippedNoKey });
    setResult(null);
  };

  const doImport = async () => {
    const parsed = parseCreatorsPaste(text);
    if (parsed.rows.length === 0) {
      toast.error("No valid rows detected. Provide a Code or Website column.");
      return;
    }
    setBusy(true);
    try {
      const res = await runImport({ data: { rows: parsed.rows } });
      setResult(res);
      toast.success(`${res.inserted} new creators added, ${res.skipped} skipped (already exist).`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2">
        <h2 className="font-display text-lg flex items-center gap-2"><Upload className="h-4 w-4" /> Import creators</h2>
        <p className="text-xs text-muted-foreground">
          Paste CSV/TSV rows (with a header). Dedup key is <strong>Code</strong> first, then normalized website domain — existing creators are never overwritten. Newly added creators live in the team database.
        </p>
      </div>
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setPreview(null); setResult(null); }}
        placeholder="Recognized columns: Code, Name, Segment, Platforms, Email, Facebook, Instagram, TikTok, YouTube, Priority, Amazon, Owner, Website, Notes"
        className="h-40 w-full rounded-md border border-input bg-background p-2 font-mono text-xs"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button onClick={doPreview} disabled={!text.trim() || busy}
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-50">
          Preview
        </button>
        <button onClick={doImport} disabled={!text.trim() || busy}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Import creators
        </button>
        {preview ? (
          <span className="text-xs text-muted-foreground">
            {preview.rows} row{preview.rows === 1 ? "" : "s"} ready
            {preview.skipped > 0 ? ` · ${preview.skipped} without Code or Website will be skipped` : ""}
          </span>
        ) : null}
      </div>
      {result ? (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-emerald-300 bg-emerald-50/50 p-3 text-xs text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4" />
          <div>
            <strong>{result.inserted}</strong> new creators added, <strong>{result.skipped}</strong> skipped (already exist).
          </div>
        </div>
      ) : null}
    </section>
  );
}
