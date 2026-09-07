# Promotion OS Foundation

## Decision

Use the existing Survival Influencer Lovable project and `iamaseth/survivalproject` repository as the master application shell.

The long-term product is one Promotion OS with one login and three brand workspaces:

- Survival Tabs
- Swedish Bitters
- MicrobeBio

Survival Tabs is the first active brand. Swedish Bitters and MicrobeBio remain disabled in the selector until their data models and permissions are ready.

## Initial module structure

Survival Tabs:

- Influencers
- Content
- Preparedness Book
- Video
- Campaigns
- Communications
- Templates
- Analytics
- Settings

## Data safety

This branch does not migrate, copy, delete, or alter production data.

Current sources remain authoritative while consolidation is staged:

- Influencer CRM: existing Lovable-managed Supabase attached to Survival Influencer.
- Content Operations: external Supabase `gjtfgyyqjeosjzwukjfm` (`survival-tabs-content-os`).
- Preparedness Studio: existing Lovable-managed Supabase attached to `prep-guide-forge`.
- Video: existing Survival Influencer asset workflow plus later integration with Content Operations campaign/story data.

## Canonical backend direction

The external Content Operations Supabase currently has the broadest promotion-oriented schema and is the leading candidate for the long-term canonical Promotion OS backend. Before migration, add a neutral brand/workspace layer and map all imported tables to `brand_id` or equivalent ownership boundaries.

Do not repoint the Influencer or Preparedness apps until backups, schema mapping, authentication/RLS mapping, and validation checks are complete.

## Migration order

1. Master shell and navigation only.
2. Neutral brand/workspace schema design.
3. Shared authentication and role mapping.
4. Content module connection to external Content Operations Supabase.
5. Influencer schema/data migration and validation.
6. Preparedness Book schema/data migration and validation.
7. Video workflow integration.
8. Enable Swedish Bitters and MicrobeBio workspaces.
9. Retire legacy apps/databases only after parity checks pass.

## Security note

Two old Knowledge Center backup tables in the Content Operations Supabase currently have RLS disabled. Remediation must be handled separately and intentionally because enabling RLS without policies can block legitimate access.
