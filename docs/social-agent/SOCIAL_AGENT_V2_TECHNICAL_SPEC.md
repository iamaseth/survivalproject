# Social Agent V2 — Technical Specification (Draft)
Date: 2026-10-14
Status: Architecture proposal; no production migration authorized.

## Scope and evidence
Reference architecture: krusemediallc/arcads-claude-code (README.md, AGENTS.md, MASTER_CONTEXT.template.md, shared/skills/image-ad-prompting/OVERVIEW.md, skills/arcads-external-api/SKILL.md).
Inspected local GitHub repo: iamaseth/survivalproject (AGENTS.md, package.json). Its package.json confirms React 19, TanStack Start/Router, Supabase JS, React Query, Tailwind and Zod. The actual live creators schema, importer, deployed Lovable route files, background workers and database policies have NOT been verified. Do not infer them from this proposal. No Arcads API credentials or billing have been tested.

## Principles
1. Preserve existing production behavior and data; never rewrite Lovable-connected published git history.
2. One canonical creator row and one primary workflow status. Never create duplicate rows for different queues.
3. Explicit manual creator approval/rejection always overrides automated decisions.
4. Outreach remains draft-only; never send automatically. Publishing and paid generation require human authorization.
5. Use provider adapters, not a hard dependency on Arcads.
6. Store raw evidence, capture timestamps, and provenance; unknown != absent.
7. Implement idempotent jobs with retry, resume and auditing.
8. Keep Survival Tabs and Swedish Bitters brand data isolated, sharing infrastructure only.

## Proposed components (new, not verified existing paths)
- src/features/social-agent/command-center/ — six sections: Research, Influencers, Outreach, Studio, Publishing, Analytics.
- src/features/social-agent/jobs/ — task progress, retries, approvals, activity.
- src/features/social-agent/creator-cache/ — paginated React Query persistence and offline-first read-only cached queue.
- server/social-agent/ — server-only task orchestration, authorization, provider adapters and rate limiting.
- docs/social-agent/skills/ — versioned task contracts and policies.
Paths are suggestions; first map the real TanStack Start project tree and server conventions before implementation.

## Proposed database migrations (NOT executed)
- agent_jobs(id, brand_id, kind, status, input_json, output_json, idempotency_key UNIQUE, attempt_count, next_retry_at, created_by, created_at, updated_at)
- agent_job_steps(id, job_id, step_key, status, input_hash, output_json, error_json, started_at, finished_at, UNIQUE(job_id,step_key,input_hash))
- agent_approvals(id, job_id, action_type, requested_by, decided_by, decision, decision_at, details_json)
- agent_evidence(id, brand_id, subject_type, subject_id, source_url, captured_at, raw_asset_ref, extracted_json, extraction_limits_json)
- creative_assets(id, brand_id, job_id, scene_key, provider, model, prompt_version, source_ref, output_ref, qa_status, cost_estimate, actual_cost)
- competitor_ads(id, brand_id, platform, platform_ad_id, advertiser, source_url, first_seen_at, last_seen_at, metadata_json, UNIQUE(platform,platform_ad_id))
- agent_activity(id, actor_id, brand_id, action, subject_type, subject_id, before_json, after_json, created_at)
All tables require RLS, brand-scoped access, service-role-only privileged writes, bounded retention and secure secret storage. Avoid duplicating existing production tables; map and extend first.

## Task contract
Input: {brand_id, kind, subject_ids, evidence_refs, policy_version, requested_by, budget_limit, idempotency_key}
States: queued -> running -> waiting_approval -> running -> completed; terminal failed/cancelled; recoverable retry_scheduled.
Every external side effect must be idempotent where possible; otherwise reconcile external state before retrying.
Never interpret successful API submission as successful delivery.

## Creator workflow
Discovery -> capture full profile/posts/captions/links -> verified handle merge -> evidence-backed screening -> single status -> manual review -> owner assignment -> draft outreach -> manually recorded result.
Capture public business contact channels (email, website, LinkedIn, Instagram, YouTube, link-in-bio) only when source-backed and permitted. Never overwrite manually reviewed classification. Do not auto-generate DMs during bulk qualification. Preserve existing UI section semantics pending live schema audit.
Mobile queue: load cached first page immediately, cursor pagination, stale-while-revalidate, optimistic actions with rollback, conflict detection, no cached privileged mutation without server confirmation.

## Competitor research
Use official permitted APIs where available. Collect advertiser, creative, platform, date, CTA, public source and extraction limitations; deduplicate by platform ad ID; label inferred strategy separately from observed facts. Never copy protected creative verbatim.

## Studio production
Manifest per episode: episode metadata, brand policy version, scene IDs, scripts, narrator timing, source images, approved refs, generation parameters, video clips, overlay templates, final render, QA checklist, archive pointers.
Pipeline: storyboard -> script -> scene stills -> still QA -> approval -> animation -> audio -> overlays -> FFmpeg render -> video QA -> archive.
Keep text out of generated video source where practical; render typography as deterministic overlays. Retry failed scene, not entire episode. Source preservation is mandatory. Confirm estimated spend before paid API calls; hard-stop at budget cap.
Provider interface: generateImage, generateVideo, pollJob, getCostEstimate, fetchAsset. Arcads is optional and disabled until credentials, costs and license review are completed.

## Skill registry
Versioned skills: competitor-research, creator-discovery, creator-qualification, creator-enrichment, outreach-drafting, inbox-triage, creative-strategy, image-production, video-production, publishing-assistant, performance-analysis.
Each declares input schema, output schema, permissions, evidence requirements, retry policy, human gate, test fixtures and version.

## Rollout sequence and gates
P0: audit live repo tree, deployed routes, actual Supabase schema/RLS, importer, existing queue statuses and data volume. Take backups. Record baseline tests.
P1: add job tables and server-side orchestration behind disabled feature flags; unit tests for idempotency, authorization and retry.
P2: improve mobile creator cache without changing queue eligibility; verify Rena and Seth actions end-to-end.
P3: competitor evidence ingestion in read-only mode; manually inspect sample output.
P4: studio manifest, deterministic overlays and archive; dry-run one existing episode without paid generation.
P5: optional Arcads adapter, cost and consent gates; analytics after source validation.
No production migration until P0 passes. No live creator status updates as test fixtures.

## Acceptance tests
- Manual rejection remains rejected after re-import and rescreening.
- One creator appears in exactly one primary section.
- Sent/rejected actions are not blocked by obsolete second-approval checks.
- Mobile queue renders cached records before network response and resolves conflicts safely.
- Duplicate ZIP captures merge evidence without duplicate creator rows.
- LinkedIn/contact extraction records exact provenance and unknown values.
- Retrying completed scene never regenerates or rebills it.
- Failed step resumes independently.
- All paid calls have confirmed budgets.
- No message is sent and no content published without explicit approval.
- All jobs, decisions, costs and assets are traceable.

## Open questions for P0
Identify actual canonical repository/branch for deployed Social Agent; inspect complete route tree, migrations, RLS, importer, queue actions, worker environment, storage architecture, and existing CI. Compare the schema above against actual tables before proposing SQL or code changes.
