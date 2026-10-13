# Draft PR notes — Promotion OS foundation

This branch is intentionally non-destructive. It changes the application shell and module framing only. Production databases remain untouched.

Review focus:

- Existing Survival Tabs creator workflows still route correctly.
- Authentication/role handling remains intact.
- Promotion OS brand selector shows Survival Tabs active; Swedish Bitters and MicrobeBio are staged but disabled.
- Preparedness Book opens as a bridge to the current studio until migration.
- Video keeps the current asset list.
- No production Supabase migration is included.
