# Move Creators + Workspace to Supabase (team-shared)

Goal: retire `window.localStorage` and hardcoded `CREATORS` for operational data. Everything shared across Rena, Vina, Seth, Perry — live.

## 1. New tables (one migration)

**`public.creators`** — one row per creator. Columns mirror every field on `CreatorRow` in `src/lib/creator-partnerships.ts` (id text PK from existing seed id, code, name, category, platform, email, website, amazon, priority, followers, engagement, contactedDate, responseState, outreachOwner, perryApproval, normalizedSampleStatus, contactMethod, researchNotes, renaNotes, perryComments, recommendedOffer, nextFollowUpDate, responseFollowup, lastResearched, all remaining CreatorRow fields — nothing dropped). `created_at`, `updated_at`.

**`public.creator_workspace`** — one row per `creator_id` (FK → creators.id, unique). Every field on `CreatorWorkspace` type: assignedTo, assignedDate, currentOwner, outreachStatus, contactMethod, emailDraftCreated, emailSent, dateSent, lastContactDate, emailOverride, nextFollowUpDate, followUpCount, waitingForReply, noResponse, responded, gmailMessageId, gmailThreadId, gmailConfirmedAt, savedGmailDraft (jsonb), sampleRequired, addressReceived, sampleShipped, trackingNumber, deliveryStatus, all shippingXxx cols, carrier, contentPromised, contentReceived, publishedPlatforms (jsonb), publishDate, teamNotes, aiRecommendation, researchNotes, executiveNotes, activity (jsonb array), createdBy/Role/At, lastModifiedBy/Role/At, lastActivityBy, supervisor, doNotContact, created_at, updated_at.

**RLS (both tables):** team-member read + write via `private.is_team_member(auth.uid())`, same pattern as `sales_prospects`. `service_role` full. `authenticated` GRANTs.

**Seed:** migration includes `INSERT` for every row currently in `CREATORS_SEED` (via generated SQL from the seed file — I'll generate it as part of the migration).

## 2. Server functions

New `src/lib/creators.functions.ts`:
- `listCreators()` — returns all creators (team-member RLS).
- `importCreators({ rows })` — insert-only, dedup by `code` (fallback normalized website domain). Same shape as `importProspects`.
- `upsertCreator({ row })` — for AI research flow (insert on new code/domain, otherwise skip; mirror importProspects behavior).

New `src/lib/creator-workspace.functions.ts`:
- `listWorkspaces()` — returns all rows keyed by creator_id.
- `getWorkspace({ creatorId })`.
- `updateWorkspace({ creatorId, patch })` — upsert with `updated_at`; on first insert stamps createdBy/Role from `context.userId` → profile.
- `appendActivity({ creatorId, activity })` — jsonb append + status side-effects (mirror current `addActivity` switch).
- `migrateLocalWorkspace({ overrides })` — one-time upload: for each `(creator_id, override)`, fill only fields currently NULL/default in DB; return `{ merged, conflicted: [{creatorId, field, localValue, dbValue}] }` for manual review.

## 3. Client rewrite of `src/lib/creator-workspace.ts`

Keep the exported API surface (`useWorkspace`, `getWorkspace`, `updateWorkspace`, `addActivity`, `logConfirmedGmailSend`, `isWaitingForReply`, `dashboardCounts`, `useDashboardCounts`, `waitingForReplyCreators`, reset helpers). Under the hood:
- Replace the localStorage cache with a TanStack Query-backed store: one `useQuery(['workspaces'])` that returns `Record<creatorId, CreatorWorkspace>`, hydrated from `listWorkspaces`.
- `useWorkspace(c)` reads from that cache, merged with `defaultsFor(c)`.
- Mutations call server fns, then `queryClient.invalidateQueries(['workspaces'])`.
- Existing synchronous callers keep working because reads still go through `getWorkspace(c)` against the in-memory Query cache snapshot.

Similar switch for creators: replace static `CREATORS` import with `useCreators()` hook backed by `listCreators`. A synchronous `getCreatorsSnapshot()` reads the query cache for legacy call sites (dashboard counts, waitingForReplyCreators). Test-creator seeding continues to work locally (test creators live in-memory + optionally upserted to DB when Test Mode is on).

## 4. One-time localStorage → DB migration

On app boot (once per browser, tracked by `localStorage['st.workspace.migrated.v1']`):
1. Read `st.creator-workspace.v1`.
2. Call `migrateLocalWorkspace({ overrides })`.
3. On success, delete the old key and set the migrated flag.
4. If the server returns conflicts, surface a Settings-page banner: "N workspace fields differ between your browser and the team database — review". Never silently overwrite DB values.

Runs independently in each teammate's browser so Rena/Vina/Seth's local data all flows up.

## 5. AI research → creators table

Any existing "add creator" / AI research path now calls `upsertCreator` (insert-only via `code` or normalized domain), so new creators appear team-wide immediately.

## 6. Settings: "Import creators" tool

Add `ImportCreatorsSection` mirroring `ImportProspectsSection` (paste CSV/TSV, preview, submit, show inserted/skipped). Dedup by `code` else normalized website domain.

## Out of scope this pass

Gmail send/receive, poll, team inbox — untouched. ROI/content-tracking spec — deferred as requested. Knowledge Center guides table — not part of this scope (spec mentions guides but the explicit goal is creators + workspace; leaving guides for a follow-up unless you want it folded in).

## Technical notes

- Migration is one SQL file: tables + GRANTs + RLS + policies + INSERT of current CREATORS_SEED.
- `activity` and `publishedPlatforms` and `savedGmailDraft` as `jsonb`.
- Timestamps use `timestamptz` with `set_updated_at` trigger.
- All server fns use `requireSupabaseAuth`; RLS enforces team membership.
- No breaking changes to `GmailPanel.tsx`, `creators.$id.tsx`, dashboard — public API of `creator-workspace.ts` preserved.

Want me to also fold `knowledge-data.ts` guides into this migration, or keep that separate?