import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Sparkles, X, Loader2 } from "lucide-react";
import { researchCreatorDraft, type ResearchDraft } from "@/lib/ai-research.functions";
import { upsertCreatorFromResearch } from "@/lib/creators.functions";
import { hydrateCreatorsFromDB } from "@/lib/creator-partnerships";
import { normalizeDomain } from "@/lib/prospects-parse";

type Mode = "manual" | "ai";

const EMPTY: ResearchDraft = {
  name: null, code: null, normalized_domain: null, segment: null,
  primary_platforms: null, email: null, facebook: null, instagram: null,
  tiktok: null, youtube: null, priority: null, amazon: null,
  recommended_offer: null, research_notes: null,
};

export function ResearchDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const draftFn = useServerFn(researchCreatorDraft);
  const upsertFn = useServerFn(upsertCreatorFromResearch);
  const [mode, setMode] = useState<Mode>("manual");
  const [rawInput, setRawInput] = useState("");
  const [draft, setDraft] = useState<ResearchDraft>(EMPTY);
  const [busy, setBusy] = useState<"draft" | "save" | null>(null);

  if (!open) return null;

  const runAi = async () => {
    if (!rawInput.trim()) { toast.error("Paste some text or a URL first"); return; }
    setBusy("draft");
    try {
      const { draft: d } = await draftFn({ data: { input: rawInput.trim() } });
      setDraft({ ...draft, ...d, normalized_domain: d.normalized_domain ? normalizeDomain(d.normalized_domain) : null });
      toast.success("Draft ready — review before saving");
    } catch (e: any) {
      toast.error(e?.message ?? "AI draft failed");
    } finally { setBusy(null); }
  };

  const save = async () => {
    if (!draft.name?.trim()) { toast.error("Name is required"); return; }
    setBusy("save");
    try {
      const nd = draft.normalized_domain ? normalizeDomain(draft.normalized_domain) : null;
      const row = { ...draft, name: draft.name!.trim(), normalized_domain: nd };
      const { id } = await upsertFn({ data: { row } });
      await hydrateCreatorsFromDB();
      toast.success("Creator saved");
      onClose();
      setDraft(EMPTY); setRawInput("");
      navigate({ to: "/creators/$id", params: { id } });
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally { setBusy(null); }
  };

  const F = (k: keyof ResearchDraft, label: string, placeholder = "") => (
    <label className="block text-xs">
      <span className="text-muted-foreground">{label}</span>
      <input
        value={draft[k] ?? ""}
        onChange={(e) => setDraft({ ...draft, [k]: e.target.value || null })}
        placeholder={placeholder}
        className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/40" />
      <div
        className="flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-5 py-3">
          <div>
            <h2 className="text-lg font-semibold">Research new creator</h2>
            <p className="text-xs text-muted-foreground">Dedupes by creator code + normalized website domain.</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>

        <div className="border-b border-border px-5 pt-3">
          <div className="inline-flex rounded-md border border-input">
            <button onClick={() => setMode("manual")} className={`px-3 py-1.5 text-xs ${mode === "manual" ? "bg-secondary" : ""}`}>Manual</button>
            <button onClick={() => setMode("ai")} className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs ${mode === "ai" ? "bg-secondary" : ""}`}>
              <Sparkles className="h-3 w-3" /> AI assist
            </button>
          </div>
        </div>

        {mode === "ai" && (
          <div className="border-b border-border p-5">
            <label className="mb-1 block text-xs text-muted-foreground">Paste URL, bio, notes, or scraped page text</label>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              rows={5}
              placeholder="e.g. https://survivalpreppers.example — YouTube channel about bugout gear, 120k subs, Amazon storefront…"
              className="w-full rounded-md border border-input bg-background p-2 text-sm"
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={runAi}
                disabled={busy === "draft"}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {busy === "draft" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Generate draft
              </button>
              <span className="text-[11px] text-muted-foreground">Uses Lovable AI. Review every field before saving.</span>
            </div>
          </div>
        )}

        <div className="grid gap-3 p-5 md:grid-cols-2">
          {F("name", "Name *", "Sophos Survival")}
          {F("code", "Code (slug)", "sophos-survival")}
          {F("normalized_domain", "Website domain", "sophossurvival.com")}
          {F("segment", "Segment", "Preparedness · Family")}
          {F("primary_platforms", "Primary platforms", "Instagram, YouTube")}
          {F("email", "Email", "hello@example.com")}
          {F("facebook", "Facebook", "")}
          {F("instagram", "Instagram", "")}
          {F("tiktok", "TikTok", "")}
          {F("youtube", "YouTube", "")}
          {F("priority", "Priority", "High / Medium / Low")}
          {F("amazon", "Amazon", "Yes / No")}
          {F("recommended_offer", "Recommended offer", "Sample + affiliate link")}
          <label className="block text-xs md:col-span-2">
            <span className="text-muted-foreground">Research notes</span>
            <textarea
              value={draft.research_notes ?? ""}
              onChange={(e) => setDraft({ ...draft, research_notes: e.target.value || null })}
              rows={4}
              className="mt-0.5 w-full rounded-md border border-input bg-background p-2 text-sm"
            />
          </label>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-border bg-background px-5 py-3">
          <button onClick={onClose} className="rounded-md border border-input px-3 py-1.5 text-xs">Cancel</button>
          <button
            onClick={save}
            disabled={busy === "save"}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {busy === "save" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Save creator
          </button>
        </div>
      </div>
    </div>
  );
}
