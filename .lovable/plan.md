# Two tracks: AI Research UI + ROI/Content Tracking

Scope is exactly the two items you named. Knowledge Center guides table is explicitly deferred to Module B.

---

## Track 1 — Wire the AI-research UI to `upsertCreatorFromResearch`

The server fn already exists (`src/lib/creators.functions.ts::upsertCreatorFromResearch`, insert-only, dedup by `code` then `normalized_domain`). No UI reaches it today. Add one.

**New: `src/components/creators/ResearchDrawer.tsx`**
- Trigger: "Research a new creator" button in the header of `/creators` (visible to Seth + executives; anyone can submit but Seth is the natural user).
- Two modes in the drawer:
  1. **Manual entry** — form fields matching `ResearchCreatorInput` (name, code, website/normalized_domain, segment, platforms, email + socials, priority, amazon, recommended offer, research notes).
  2. **AI assist** — a "Paste URL, bio, or notes" textarea. Calls a new `researchCreatorDraft` server fn (Lovable AI Gateway, `google/gemini-3.5-flash`, structured `Output.object` with the same fields as `ResearchCreatorInput`). Result populates the form; user reviews and edits before submitting.
- Domain normalization uses the existing helper in `src/lib/prospects-parse.ts` client-side so the preview shows what the dedup key will be.
- Submit → `upsertCreatorFromResearch` → toast (`created: true` = "Added to roster", `false` = "Already in roster, opening existing"), invalidate the creators query, `navigate` to `/creators/$id`.

**New: `src/lib/ai-research.functions.ts`**
- `researchCreatorDraft({ input })` — `createServerFn` + `requireSupabaseAuth`. Uses shared `createLovableAiGatewayProvider` (create `src/lib/ai-gateway.server.ts` if missing) + `generateText` with `Output.object` returning the draft fields. Prompt clamps notes length in text (not schema).
- Errors: 429/402 surface as toasts in the drawer; on any AI failure the form stays open and the user can still submit manually.

**Also updated: `src/routes/creators.tsx`** — add the "Research a new creator" button next to the existing "Import from Google Sheet" button.

---

## Track 2 — ROI / Content Tracking on `creator_workspace`

One migration adds four concerns. All fields live on `creator_workspace` (per your spec), gated by existing `is_team_member` RLS.

### 2a. Contact-attempt log
New `jsonb` column `contact_attempts` (default `[]`). Each entry:
```
{ id, at, channel: "email"|"dm"|"call"|"other", direction: "outbound"|"inbound",
  subject?, summary, actor, actorName?, gmailMessageId?, gmailThreadId? }
```
- Distinct from `activity` (which is workflow events). Contact attempts are the audit trail of *contact touches only* — used for follow-up cadence and ROI attribution.
- `logConfirmedGmailSend` in `creator-workspace.ts` also appends an `outbound/email` contact attempt (deduped by `gmailMessageId`), so the Gmail flow auto-populates it.
- New UI card on `/creators/$id` **Communications tab**: "Contact log" table (channel · direction · date · summary · linked Gmail thread when present) with a "Log manual attempt" button (call, in-person, DM).

### 2b. Content tracking
New columns:
- `content_pieces jsonb default '[]'` — array of:
  ```
  { id, platform: "instagram"|"tiktok"|"youtube"|"facebook"|"blog"|"other",
    url, postedAt, format: "post"|"reel"|"story"|"video"|"live"|"article",
    views?, likes?, comments?, shares?, saves?,
    estReach?, metricsUpdatedAt?, notes? }
  ```
- `content_status text` — enum-ish string: `not_promised | promised | in_progress | delivered | published | verified`.
- `content_deadline date` — when the creator committed to post.

UI: new "Content" tab section (replacing the current thin `contentPromised`/`contentReceived` pair) with an add-piece form, per-piece metric editor, and a "Copy metrics from URL" placeholder (no scraper — manual entry now).

Existing `contentPromised` / `contentReceived` / `publishedPlatforms` / `publishDate` are kept for back-compat; the new UI writes into `content_pieces` and derives `contentReceived`/`publishDate` from it.

### 2c. Cost / payout
New columns:
- `deal_type text` — `gifted | flat_fee | commission | hybrid | none` (default `gifted`).
- `sample_cost_usd numeric(10,2)` — cost of the Survival Tabs sample(s) sent.
- `shipping_cost_usd numeric(10,2)`.
- `flat_fee_usd numeric(10,2)`.
- `commission_rate numeric(5,4)` — 0..1.
- `commission_sales_usd numeric(12,2)` — sales attributed to creator (manual entry for now).
- `payout_notes text`.

Derived server-side (kept simple, computed in a helper — no generated column, so the UI can override):
- `total_cost_usd = sample_cost_usd + shipping_cost_usd + flat_fee_usd + (commission_rate * commission_sales_usd)`.

UI: new **"Deal & ROI" tab** on `/creators/$id` with the cost inputs and a live-computed total.

### 2d. ROI rollup
New columns on `creator_workspace`:
- `revenue_attributed_usd numeric(12,2)` — manual for v1 (later: linked to Amazon Attribution / affiliate feed).
- `roi_ratio numeric(10,4)` — `revenue_attributed_usd / NULLIF(total_cost_usd,0)`, computed in the client + written back on save so it's queryable for the dashboard.
- `roi_updated_at timestamptz`.

Dashboard integration on `/creators`:
- New Ops card: "Avg ROI (published creators)" — mean `roi_ratio` for creators with `content_status IN ('published','verified')` and `total_cost_usd > 0`.
- New Ops card: "Total spend (30d)" — sum of `total_cost_usd` where `updated_at >= now() - 30d`.
- Sortable "Top ROI" mini-list under the Ops row (top 5 by `roi_ratio`, linking to creator detail).

---

## Technical details

**Migration** (single file):
- `ALTER TABLE public.creator_workspace ADD COLUMN contact_attempts jsonb NOT NULL DEFAULT '[]'::jsonb, ADD COLUMN content_pieces jsonb NOT NULL DEFAULT '[]'::jsonb, ADD COLUMN content_status text, ADD COLUMN content_deadline date, ADD COLUMN deal_type text NOT NULL DEFAULT 'gifted', ADD COLUMN sample_cost_usd numeric(10,2), ADD COLUMN shipping_cost_usd numeric(10,2), ADD COLUMN flat_fee_usd numeric(10,2), ADD COLUMN commission_rate numeric(5,4), ADD COLUMN commission_sales_usd numeric(12,2), ADD COLUMN payout_notes text, ADD COLUMN total_cost_usd numeric(12,2), ADD COLUMN revenue_attributed_usd numeric(12,2), ADD COLUMN roi_ratio numeric(10,4), ADD COLUMN roi_updated_at timestamptz;`
- No new tables, no new policies (existing team-member RLS covers all columns).
- Indexes: `CREATE INDEX creator_workspace_content_status_idx ON public.creator_workspace(content_status);` and `CREATE INDEX creator_workspace_roi_ratio_idx ON public.creator_workspace(roi_ratio DESC NULLS LAST);` — the dashboard rollups scan these.

**Client type extension**:
- Extend `CreatorWorkspace` in `src/lib/creator-workspace.ts` with the new fields + add camel↔snake mappings in `CAMEL_TO_SNAKE`.
- Add helpers: `logContactAttempt(c, entry)`, `addContentPiece(c, piece)`, `updateContentPiece(c, id, patch)`, `computeROI(ws)` (pure), `useROIRollup()` (mean + top-5, memoized off the workspace cache).

**Server fns** (add to `src/lib/creator-workspace.functions.ts`):
- Existing `upsertWorkspace` already handles arbitrary patches — the new columns pass through without changes. No new server fn required for track 2.

**UI files touched**:
- `src/routes/creators.$id.tsx` — new "Deal & ROI" tab; expand Communications tab with contact log; expand Content tab with pieces.
- `src/routes/creators.tsx` — Research button + two new Ops cards + Top ROI mini-list.
- `src/components/creators/ResearchDrawer.tsx` (new).
- `src/components/creators/ContactLog.tsx` (new).
- `src/components/creators/ContentPieces.tsx` (new).
- `src/components/creators/DealROI.tsx` (new).

**Out of scope this pass** (as you said):
- Knowledge Center guides table — deferred to Module B.
- Amazon Attribution / affiliate auto-import — revenue is manual entry for v1.
- No changes to Gmail send/receive, poll, or team inbox.

---

## Order of operations (single response)
1. Migration (columns + indexes) — awaits your approval.
2. After approval: extend workspace types + helpers, add server fn for AI drafting, build the four new components, wire the two routes.
3. Typecheck.
