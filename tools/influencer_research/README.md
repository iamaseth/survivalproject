# BoBo Research Importer (GitHub-first)

The script `tools/influencer_research/import_md.py` imports BoBo Tab Clipper Markdown, a directory of Markdown files, or ZIP archives into a **separate local SQLite research database**. No Lovable credits, login, or external services required.

## Run

```bash
python3 tools/influencer_research/import_md.py --db ./influencer-research.sqlite '/path/to/tiktok-(3).zip'
python3 tools/influencer_research/import_md.py --db ./influencer-research.sqlite '/path/to/more-clips.zip'
```

Use `--dry-run` to parse into an in-memory database without writing a file.

## Data model

`creators`, `captures` (raw Markdown + SHA256 + parsed JSON), `profile_snapshots`, `videos`, `video_observations`, `hashtags`, `evidence`, `ai_reviews`, `human_decisions`, `import_errors`.

Import is idempotent by SHA256. Re-captures with changed data create new snapshots and video observations, not duplicate creators. The parser only stores fields actually present in captured text; it does not invent video transcripts or engagement data. Existing manual decisions are never modified by the importer.

## Verified fixture

Using 14 profile Markdown files from `tiktok-(3).zip`: 14 creators, 318 distinct videos, 0 errors; second import: 14 duplicates skipped, 0 new creators/videos. This is a local verification, **not** a live CRM sync.

## Remaining integration

- Confirm the actual approved qualification rubric and AI model credentials before automated qualification.
- Add a reviewed AI runner that writes versioned `ai_reviews` and never writes `human_decisions`.
- Implement a secure CRM sync adapter after mapping the actual writable database tables; `influencer_workflow` is a read-only view and cannot be updated directly.
- Keep SQLite files, captures, API keys and credentials out of GitHub. Audit tracked `.env` files and rotate exposed secrets.
- Before processing bulk captures, add parser fixture coverage for alternate clipping formats and back up the research database.
