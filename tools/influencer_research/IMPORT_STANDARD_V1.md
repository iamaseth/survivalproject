# Survival Tabs Creator Research Import Standard v1.0 (LOCKED)

**Purpose:** Preserve every captured research detail for influencer outreach across TikTok, YouTube, Facebook, Instagram, websites and other public channels.

**Canonical schema:** 144 columns in `survival-tabs-creator-import-standard-v1.zip` (ChatGPT Library), file `schema.json`. **Do not invent, rename, reorder or remove columns in future batches.** Any new field must be preserved in `custom_attributes` / original raw Markdown until a versioned, backward-compatible migration is approved.

**Input:** 10–500+ Obsidian Markdown profile captures per batch, or an archive of them. **Output:** one CSV using the same schema and an errors report. Include original Markdown and full structured video/caption/hashtag data. Do not infer missing email, followers, or contact details.

**Identity:** Match existing creators by normalized platform URL/handle and cross-platform verified links. Never create duplicate creator rows merely because a creator has several platforms. Ambiguous matches go to manual review.

**Preservation:** Import is research-only. Merge populated verified research fields without clearing previous populated fields; preserve raw capture history and provenance. Do not overwrite `workflow_status`, manual approval/rejection, assignments, contact history, DM/email drafts, replies, or follow-ups. Only `workflow_status` controls sections 1–7.

**Outreach:** Store *all* verified public contact routes (TikTok, YouTube, Facebook, Instagram, website, public business email) and channel-specific attempts. Failed outreach through one channel must not mark every channel as exhausted. Never automatically send outreach.

**Acceptance tests:** exact header/version; idempotent reimport; zero lost raw captures; accurate video URL/caption/hashtag associations; duplicate and error reports; manual decisions unchanged. Do not upload into production without a verified field-mapped merge procedure. A generic CSV append or replace is unsafe.

**Current status:** A reusable 144-column offline parser and 14-profile validation package are saved in ChatGPT Library. Existing GitHub `tools/influencer_research/import_md.py` is a *different SQLite staging importer* and must not be confused with the 144-column CSV parser. The Lovable frontend/importer has **not** been verified to accept all 144 columns; database migration added 43 research fields but this does not prove full 144-column CSV mapping.
