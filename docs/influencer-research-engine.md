# Influencer Research Engine — GitHub-first

## Authority
- GitHub is the source of truth for code, schema migrations, tests, parser, AI qualification rubric, and deployment instructions.
- PostgreSQL is the source of truth for research and CRM data. GitHub is not a live database.
- No Lovable build dependency or Lovable credits required. Existing live CRM is untouched until an explicitly tested integration is ready.
- Manual approvals/rejections are immutable to automated imports. AI does not send outreach.

## Processing pipeline
1. Accept ZIP, directory, or single Markdown exports from BoBo Tab Clipper.
2. Parse YAML frontmatter and profile body; preserve exact raw source and SHA-256 checksum.
3. Normalize TikTok handle and upsert canonical creator identity. Preserve source URLs and timestamps.
4. Extract profile snapshots, links, follower statistics, emails, videos, captions, hashtags, product/brand mentions, and evidence provenance into relational tables; use JSONB for unrecognized fields.
5. AI qualification runs against a versioned rubric and stores evidence, model/version, confidence, rationale, and recommendation; missing evidence is explicitly flagged, not invented.
6. AI recommendations map to Section 2 (ai_screened), Section 5 (second_look), Section 6 (rejected). Existing human decisions always take precedence.
7. Produce auditable import results and CRM-compatible exports or a validated sync adapter.

## Schema modules (PostgreSQL migrations)
- creators (canonical identity, platform, normalized handle, stable identifiers)
- creator_profiles (timestamped snapshots, bio, metrics, raw metadata)
- creator_contacts (public contact channel, value, provenance, verified_at)
- source_captures (exact markdown, checksum, captured_at, parser version, ingestion run)
- creator_videos (canonical URL/video ID, caption, metrics, timestamp, thumbnail)
- video_hashtags (normalized tags, video FK)
- evidence_items (source capture/video FK, type, excerpt, confidence, metadata)
- brand_mentions (brand, product, sponsorship signals, evidence FK)
- qualification_runs (rubric version, model, prompt/version, time, outcome, rationale, confidence)
- workflow_decisions (creator FK, AI suggestion vs human decision, actor, timestamp, history)
- processing_jobs (queue, retries, error, checkpoint, status)
- audit_events (actor, action, old/new values, time)

## Engineering requirements
- Idempotent repeated imports; no duplicate creators or videos; never delete evidence on re-import.
- Preserve all previous captures and AI run history; capture changing follower counts over time.
- Parameterized SQL, schema migrations, tests/fixtures, import CLI, dry-run mode, resumable batches, error reporting.
- Secure environment variables outside Git, restricted database credentials, encrypted backups, and access control.
- No private data or API tokens in GitHub; audit existing tracked .env files and rotate any exposed secrets.
- Develop on feature branch and test against disposable database before touching production.

## First acceptance test
Process the 14 captured Markdown profiles: 3 qualified, 10 rejected, 1 second-look, while retaining full raw and parsed evidence. Confirm zero manual decisions changed and no duplicate rows after repeat import.

## Operational principle
Capture once, store fully, analyze repeatedly. The original Markdown is an audit artifact, not the operational interface.
