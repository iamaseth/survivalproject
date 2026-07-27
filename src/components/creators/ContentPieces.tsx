import { useState } from "react";
import { ExternalLink, Trash2, Plus } from "lucide-react";
import type { CreatorRow } from "@/lib/creator-partnerships";
import { addContentPiece, removeContentPiece, updateContentPiece, useWorkspace, type ContentFormat, type ContentPlatform } from "@/lib/creator-workspace";

const PLATFORMS: ContentPlatform[] = ["instagram", "tiktok", "youtube", "facebook", "blog", "podcast", "other"];
const FORMATS: ContentFormat[] = ["post", "reel", "story", "video", "short", "live", "article", "episode", "other"];

export function ContentPieces({ c }: { c: CreatorRow }) {
  const ws = useWorkspace(c);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ platform: "instagram" as ContentPlatform, format: "post" as ContentFormat, url: "", postedAt: "" });

  const add = () => {
    if (!form.url.trim()) return;
    addContentPiece(c, {
      platform: form.platform, format: form.format,
      url: form.url.trim(), postedAt: form.postedAt || null,
      views: null, likes: null, comments: null, shares: null, saves: null, estReach: null,
      metricsUpdatedAt: null, notes: null,
    });
    setForm({ ...form, url: "", postedAt: "" });
    setOpen(false);
  };

  const num = (v: string) => (v === "" ? null : Number(v));

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Published content ({ws.contentPieces.length})</h3>
        <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs hover:bg-secondary">
          <Plus className="h-3 w-3" /> Add piece
        </button>
      </div>

      {open && (
        <div className="mb-3 grid gap-2 rounded-md border border-dashed border-input p-3 md:grid-cols-4">
          <label className="text-xs">Platform
            <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as ContentPlatform })} className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1 text-sm">
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="text-xs">Format
            <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value as ContentFormat })} className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1 text-sm">
              {FORMATS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="text-xs md:col-span-2">URL
            <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1 text-sm" />
          </label>
          <label className="text-xs">Posted
            <input type="date" value={form.postedAt} onChange={(e) => setForm({ ...form, postedAt: e.target.value })} className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1 text-sm" />
          </label>
          <div className="md:col-span-4 flex justify-end">
            <button onClick={add} className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90">Add</button>
          </div>
        </div>
      )}

      {ws.contentPieces.length === 0 ? (
        <p className="text-xs text-muted-foreground">No content logged yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-muted-foreground">
              <tr>
                <th className="p-1 text-left">Platform</th><th className="p-1 text-left">Format</th>
                <th className="p-1 text-left">URL</th><th className="p-1 text-left">Posted</th>
                <th className="p-1 text-right">Views</th><th className="p-1 text-right">Likes</th>
                <th className="p-1 text-right">Comments</th><th className="p-1 text-right">Reach</th><th />
              </tr>
            </thead>
            <tbody>
              {ws.contentPieces.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-1">{p.platform}</td>
                  <td className="p-1">{p.format}</td>
                  <td className="p-1">
                    {p.url ? <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">{p.url.slice(0, 32)}<ExternalLink className="h-3 w-3" /></a> : "—"}
                  </td>
                  <td className="p-1">{p.postedAt ?? "—"}</td>
                  {(["views", "likes", "comments", "estReach"] as const).map((k) => (
                    <td key={k} className="p-1 text-right">
                      <input
                        type="number" min={0}
                        value={p[k] ?? ""}
                        onChange={(e) => updateContentPiece(c, p.id, { [k]: num(e.target.value) } as any)}
                        className="w-20 rounded border border-input bg-background px-1 py-0.5 text-right text-xs"
                      />
                    </td>
                  ))}
                  <td className="p-1 text-right">
                    <button onClick={() => removeContentPiece(c, p.id)} className="rounded p-1 text-muted-foreground hover:text-red-700"><Trash2 className="h-3 w-3" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
