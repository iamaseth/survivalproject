# Promotion OS checkpoint

Date: 2026-09-07
Branch: `promotion-os-foundation`

## Completed in this branch

- Reframed the existing Survival Influencer application shell as **Promotion OS**.
- Added a brand selector with Survival Tabs active and Swedish Bitters / MicrobeBio visibly staged but disabled.
- Reorganized navigation around promotion modules: Influencers, Content, Preparedness Book, Video, Campaigns, Communications, Templates, Analytics, Settings.
- Preserved the existing creator CRM, outreach, Gmail, analytics, authentication and role logic.
- Added a Preparedness Book bridge page that links to the current Preparedness Studio while leaving its database untouched.
- Adapted the existing Video Production route into the Promotion OS Video module without removing current asset tracking.
- Added architecture documentation and migration order.

## Not done yet

- No production database migrations.
- No authentication migration.
- No Content Supabase repointing.
- No Influencer data copy.
- No Preparedness Studio data copy.
- No legacy application retirement.
- No Swedish Bitters or MicrobeBio data enabled.

## Next safe step

Design and review the neutral multi-brand schema for the canonical Supabase backend, including brands/workspaces, memberships/roles, and `brand_id` ownership boundaries. Then connect the Content module first because its external Supabase already contains the broadest promotion-oriented data model.
