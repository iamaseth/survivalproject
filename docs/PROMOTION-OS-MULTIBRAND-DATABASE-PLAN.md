# Promotion OS Multi-brand Database Plan

Status: design complete, not applied to production.

## Canonical backend

Use external Supabase project `gjtfgyyqjeosjzwukjfm` (`survival-tabs-content-os`) as the future canonical Promotion OS backend.

Reason: it already contains the broadest promotion-domain schema and real Survival Tabs content/social data. We will generalize it rather than discard it.

## Top-level brands

Exactly three brands are in scope:

- Survival Tabs
- Swedish Bitters
- MicrobeBio

No other projects are included unless scope changes explicitly.

## Foundation tables

The draft migration creates:

- `brands`
- `brand_memberships`
- `brand_settings`
- `promotion_modules`
- `is_brand_member()` helper
- `has_brand_role()` helper
- RLS policies around brand membership and role

This provides one login and one database while keeping each brand's data logically separated.

## Reusable modules

Shared module keys:

- influencers
- content
- book
- video
- campaigns
- outreach
- assets
- analytics
- ai_research

Survival Tabs starts enabled. Swedish Bitters and MicrobeBio are staged disabled until data/model migration is complete.

## Existing systems and migration order

### 1. Content Supabase — keep as canonical base

Existing production data includes Knowledge Center, social campaigns, social content, social assets, metrics, legacy blog reference, news, brand profile, integrations and users.

Do not copy this data elsewhere first. Generalize it in place carefully by adding brand ownership only after audit/backfill validation.

### 2. Survival Influencer Lovable database — migrate into canonical backend

Important source tables include:

- youtube_candidates
- creators
- creators_archive
- reviewed_creators
- creator_workspace
- outreach_campaigns
- outreach_queue_items
- email_templates
- gmail_messages and supporting state/error tables
- user/team role/profile tables where still needed

Preserve IDs, timestamps, workflow status and relationships where possible. Deduplicate auth/team concepts against the canonical membership model instead of blindly copying duplicate user tables.

### 3. Preparedness Studio Lovable database — migrate as Survival Tabs book module

Existing tables include:

- parts
- chapters
- lessons
- inspiration_items
- checklist_items
- quiz_questions
- sources
- studio_settings

These should all receive `brand_id`, with current rows backfilled to Survival Tabs during migration.

### 4. Video

No separate standalone Lovable Video database was found. Treat Video as a reusable Promotion OS module using shared campaigns/assets/content infrastructure rather than inventing another database.

## Safe schema conversion pattern

For every reusable production table:

1. Add nullable `brand_id uuid`.
2. Backfill existing rows to Survival Tabs.
3. Verify zero NULL rows and exact row counts.
4. Add foreign key to `brands(id)`.
5. Add useful indexes such as `(brand_id, status)` or `(brand_id, updated_at)` where appropriate.
6. Update unique constraints that are currently global to become brand-scoped where needed, e.g. `unique (brand_id, article_code)`.
7. Add/replace RLS policies using brand membership.
8. Only then make `brand_id NOT NULL`.
9. Update application queries to always operate within selected brand context.
10. Validate before enabling Swedish Bitters or MicrobeBio.

## Tables that should become brand-scoped first

Priority group A:

- kc_articles
- social_campaigns
- social_content_items
- social_assets
- campaign_idea_history
- news_items
- social_accounts
- brand profile/settings replacement

Priority group B:

- influencer tables after import
- book tables after import
- analytics/metrics tables
- integration configuration where provider accounts differ by brand

Some global infrastructure should remain global, especially auth users and possibly secret registries, while mappings/configurations should reference brand where necessary.

## Critical constraints

- No direct destructive migration.
- No old database retirement until exact row-count and relationship validation passes.
- Preserve existing IDs when feasible.
- One auth identity may belong to multiple brands through `brand_memberships`.
- MicrobeBio field/farm operational data is not automatically part of Promotion OS. Only promotional data belongs here unless explicitly designed otherwise.
- Shopify remains Survival Tabs publishing destination/source for storefront state where currently designed.

## Known security issue

Two legacy backup tables in the current Content Supabase have RLS disabled:

- `kc_articles_backup_20260827_legacy_protection`
- `kc_articles_backup_20260827_mapping_repair`

Do not change them automatically. Enabling RLS without policies may block intended access. Handle as a separate approved security cleanup.

## Next implementation checkpoint

Before applying the foundation migration:

1. Review the draft SQL in `supabase/migrations/20260907_promotion_os_multibrand_foundation.sql`.
2. Inspect existing RLS/auth assumptions in Content Supabase and Survival Influencer.
3. Produce the table-by-table `brand_id` conversion migration as a separate migration.
4. Test on a Supabase development branch if the user approves the branch cost.
5. Only after successful validation consider production application.
