
## Approved Email Templates

Reusable, human-approved outreach templates that get merged into the composer with no AI call. The existing "Generate AI draft" flow stays exactly as it is — the template picker sits next to it as a faster/cheaper alternative.

### 1. Database (`email_templates`)

New table `public.email_templates`:

- `id` uuid PK
- `name` text (required, unique per active template)
- `segment` text nullable (free-form; e.g. `Pet`, `Fitness`, `Outdoor`, or empty = `General`)
- `subject` text
- `body` text (supports merge fields `{{creator_name}}`, `{{platform}}`, `{{handle}}`, `{{segment}}`, `{{sender_first_name}}`)
- `created_by` uuid → auth.users
- `approved_by` uuid nullable → auth.users
- `approved_at` timestamptz nullable
- `active` bool default false — flips true only when `approved_by` is set; goes back to false on any edit to `subject`/`body`/`name`/`segment`
- `created_at`, `updated_at` timestamptz with the standard `set_updated_at` trigger

RLS (all `TO authenticated`, gated by `private.is_team_member`):

- Any team member can SELECT.
- Any team member can INSERT (their own `created_by = auth.uid()`).
- Any team member can UPDATE — but a trigger clears `approved_by`/`approved_at` and sets `active=false` whenever a non-approver field changes, so re-approval is required.
- Only executive or partnership_manager can APPROVE (a separate `approve_email_template(id)` SECURITY DEFINER function that stamps `approved_by = auth.uid()`, `approved_at = now()`, `active = true`).
- Only the creator or executive can DELETE.

Standard GRANTs (`SELECT/INSERT/UPDATE/DELETE` to `authenticated`, `ALL` to `service_role`).

### 2. Server functions (`src/lib/templates.functions.ts`)

All use `.middleware([requireSupabaseAuth])`; RLS enforces access.

- `listTemplates({ activeOnly?: boolean, segment?: string })` — for the picker and the Templates page.
- `upsertTemplate({ id?, name, segment, subject, body })` — create or edit.
- `approveTemplate({ id })` — calls the RPC; server checks role via `private.has_role`.
- `deleteTemplate({ id })`.

No AI code is touched.

### 3. New route: `/templates`

`src/routes/templates.tsx` under existing nav (no auth layout in this project — the shell handles gating). Add a `Templates` nav item to `src/components/AppShell.tsx` between Communications and Knowledge Center, icon `FileText`.

Page layout:

- Header + "New template" button (opens the editor drawer).
- List/table of templates with columns: Name · Segment · Status (Draft / Approved / Needs re-approval) · Updated · Created by · Actions.
- Row actions: Edit, Approve (visible only to executive / partnership_manager, and only when not already active), Delete (creator or executive).
- Editor drawer: fields for Name, Segment (free-text with datalist of existing segments + "General"), Subject, Body (textarea with a merge-field cheat sheet under it), a live "Preview with sample creator" panel that substitutes merge fields, and a Save button.
- Editing an approved template shows a clear warning that saving requires re-approval before it can be used.

Visibility rule: research managers and coordinators see the page but only get Approve/Delete when their role permits (hide, don't disable — matches existing conventions).

### 4. GmailPanel integration

`src/components/creators/GmailPanel.tsx` — add a third button in the same button row as `Generate AI draft` and `Save as Gmail draft`:

- Button label: `Use approved template` (icon `FileText`).
- Opens a small popover/menu listing active templates. If the creator has a segment, matching-segment templates come first, then General.
- Empty state: "No approved templates yet — create one in Templates."
- Selecting a template substitutes merge fields (client-side, pure string replace) using the current `CreatorRow` + signed-in user's first name and fills `subject`/`body`, overwriting whatever's there after a lightweight confirm if the body is non-empty.
- No server call to the AI gateway. No workspace mutation until the user actually saves the draft / sends (existing paths handle that).

Merge substitutions (undefined → empty string, trimmed):

```text
{{creator_name}}       → c.name
{{platform}}           → first of c.instagram/tiktok/youtube/facebook that exists
{{handle}}             → same, but the handle string only
{{segment}}            → c.segment ?? "your niche"
{{sender_first_name}}  → auth.profile.fullName.split(" ")[0]
```

### 5. Non-goals (out of scope for this change)

- No AI-assisted template authoring.
- No versioning/history of past template edits.
- No per-role template libraries — one shared list, filtered by segment.
- No template analytics.

### Technical details

- Migration path: single migration file with table + trigger + RPC + policies + grants.
- The unapprove-on-edit trigger fires `BEFORE UPDATE OF subject, body, name, segment` and only when the row was already approved.
- `approve_email_template` runs `SECURITY DEFINER` with `SET search_path = public, private`, checks `private.has_role(auth.uid(), 'executive') OR private.has_role(auth.uid(), 'partnership_manager')`, raises `insufficient_privilege` otherwise.
- Merge substitution is a pure function `applyMergeFields(text, ctx)` in `src/lib/templates.ts` so both the Templates preview and GmailPanel share one implementation.
- Nav gets a `Templates` entry; no route lives under an auth layout in this codebase — the AppShell already blocks unauthenticated / unroled users.
