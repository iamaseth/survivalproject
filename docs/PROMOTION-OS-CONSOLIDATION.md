# Promotion OS consolidation plan

## Goal

Evolve the existing Survival Influencer Lovable app into a shared Promotion OS for three brands:

- Survival Tabs
- Swedish Bitters
- MicrobeBio

The first complete implementation is Survival Tabs, with four work areas:

- Influencers
- Content
- Preparedness Studio / Book
- Video

The system should use one login, one canonical Supabase backend, shared promotional resources, and brand-separated data.

## Foundation app

Lovable project: Survival Influencer
Project ID: `2d7f9356-04a7-4000-bd94-816d039b0754`
GitHub: `iamaseth/survivalproject`

Reason: this app already contains authentication, team roles, creator CRM, outreach, approvals, assets, messages, analytics, and general operational navigation. It is the strongest existing shell for the master app.

## Existing data sources

### Survival Influencer Lovable Cloud database

Important current tables include:

- `youtube_candidates` (~1061)
- `creators` (~165)
- `creators_archive` (~250)
- `reviewed_creators` (~11)
- `creator_workspace`
- outreach, email, team, role, and audit tables

This database remains untouched until migration scripts and validation checks are ready.

### Preparedness Studio Lovable Cloud database

Current data includes approximately:

- `parts` 25
- `chapters` 68
- `lessons` 479
- `inspiration_items` 35
- `sources`
- `studio_settings`
- checklist and quiz tables

This database remains untouched until migration scripts and validation checks are ready.

### Survival Tabs Content external Supabase

Project: `gjtfgyyqjeosjzwukjfm` (`survival-tabs-content-os`)

This is the richest current Survival Tabs promotion/content backend and includes real operational data such as:

- `kc_articles` 197
- `legacy_blog_reference` 1520
- `legacy_blog_metrics` 885
- `kc_catalog_classification` 1520
- `social_campaigns` 24
- `social_content_items` 130
- `social_assets` 83
- `campaign_idea_history` 29
- `news_items` 295
- metrics, social accounts, brand profile, user-role tables, integration registry, and related workflow tables

## Canonical backend recommendation

Use `survival-tabs-content-os` (`gjtfgyyqjeosjzwukjfm`) as the starting canonical database rather than the Lovable-managed Influencer database.

Reason:

1. It already contains the broadest promotion-oriented schema and the largest set of real operational Survival Tabs content data.
2. It is directly owned and accessible as a normal Supabase project rather than being tied to one Lovable project's managed cloud database.
3. It already contains content, social, campaign, metrics, news, brand, user, and integration structures that align with the future Promotion OS.
4. Influencer and Book schemas can be migrated into it as separate modules without forcing content data to move first.

The master Lovable app and the canonical database therefore do not need to be the same existing project. The UI foundation is Survival Influencer; the backend foundation is the external Survival Tabs Content Supabase project.

## Target architecture

Promotion OS

- Master authentication
- Brand selector
  - Survival Tabs
  - Swedish Bitters
  - MicrobeBio
- Shared modules
  - Influencers / Partnerships
  - Content / SEO / Articles
  - Video / Social
  - Campaigns / Promotions
  - Email / Outreach
  - Assets / Brand Library
  - Analytics / Results
  - AI Research / Ideas
- Brand-specific modules
  - Survival Tabs Preparedness Studio / Book

## Data isolation

Do not mix brand business data. Introduce a shared brand/workspace layer before onboarding Swedish Bitters or MicrobeBio.

Recommended common entities:

- `brands`
- `brand_memberships`
- `brand_settings`
- `brand_assets`

New multi-brand operational tables should reference `brand_id` where appropriate. Existing Survival Tabs tables should not be mass-altered blindly; add brand scoping incrementally only after dependency analysis.

## Migration sequence

### Phase 1 — architecture and shell

1. Keep production apps and databases unchanged.
2. Work only on `promotion-os-foundation` branch.
3. Add brand/project context to the master app shell.
4. Preserve all existing Influencer routes and behavior.
5. Add module navigation placeholders for Content, Book, and Video without moving data yet.

### Phase 2 — canonical auth and shared brand layer

1. Inventory auth users in Influencer, Book, and Content systems.
2. Choose canonical auth identities in `gjtfgyyqjeosjzwukjfm`.
3. Create the brand/workspace tables and RLS policies by migration.
4. Test access with existing Survival Tabs users before any source app is retired.

### Phase 3 — Influencer migration

1. Export full schema and row counts from the Lovable Influencer DB.
2. Recreate required creator/outreach/team tables in the canonical database.
3. Preserve IDs and timestamps where possible.
4. Migrate data in FK-safe order.
5. Validate row counts, duplicates, and creator workspace references.
6. Point the Promotion OS Influencer module at the canonical DB.
7. Keep the old Lovable DB read-only until validation is complete.

### Phase 4 — Content module

1. Reuse the existing `survival-tabs-content-os` tables directly.
2. Port the proven Content UI/routes into the master app.
3. Do not duplicate Knowledge Center or social campaign data.
4. Preserve Shopify draft-only safeguards and current source-of-truth rules.

### Phase 5 — Book migration

1. Export the Book schema and rows.
2. Recreate Book tables in the canonical database under clear names if collisions exist.
3. Preserve Part → Chapter → Lesson relationships and ordering.
4. Migrate inspiration, sources, checklist, quiz, visual/audio metadata.
5. Validate counts and lesson hierarchy before switching the UI.

### Phase 6 — Video module

Build Video as a native Promotion OS module using shared resources from:

- Knowledge Center / Content
- Campaigns
- Brand assets
- Influencers
- Book / Preparedness content where useful

Avoid creating a fourth independent database.

### Phase 7 — multi-brand rollout

After Survival Tabs is stable:

1. Add Swedish Bitters as a second brand.
2. Add MicrobeBio as a third brand.
3. Reuse the same promotion modules, with brand-specific configuration and data.
4. Add specialized modules only where a brand genuinely requires them.

## Safety rules

- No destructive migration until source backups exist.
- No production table drops during consolidation.
- No source Lovable database is retired until row-count and relationship validation passes.
- No duplicate Knowledge Center data.
- No Lovable build-credit usage without explicit approval.
- Database DDL must be applied as versioned migrations, not ad-hoc production SQL.
- Existing production apps remain usable throughout the migration.

## Current security issue discovered during audit

Two point-in-time backup tables in `survival-tabs-content-os` currently have RLS disabled:

- `public.kc_articles_backup_20260827_legacy_protection`
- `public.kc_articles_backup_20260827_mapping_repair`

Do not change them automatically during consolidation. Decide separately whether to enable RLS and what policies, if any, should permit access.

## Immediate next implementation step

On `promotion-os-foundation`, add a non-destructive master shell to the existing Survival Influencer app:

- Promotion OS branding
- brand selector with Survival Tabs active and Swedish Bitters / MicrobeBio marked as future brands
- Survival Tabs module selector: Influencers, Content, Book, Video
- existing Creator CRM navigation nested under Influencers

Do not repoint Supabase credentials or migrate data in this first UI step.
