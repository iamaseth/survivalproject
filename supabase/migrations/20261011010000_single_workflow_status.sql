-- Preserve old status values before UI/API cleanup. Idempotent.
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS legacy_status_archive jsonb NOT NULL DEFAULT '{}'::jsonb;
UPDATE public.creators SET legacy_status_archive =
  COALESCE(legacy_status_archive,'{}'::jsonb) ||
  jsonb_strip_nulls(jsonb_build_object(
    'research_status',research_status,
    'qualification_status',qualification_status,
    'seth_approval_status',seth_approval_status,
    'personalization_status',personalization_status,
    'sample_status',sample_status,
    'tuan_affiliate_status',tuan_affiliate_status))
WHERE legacy_status_archive='{}'::jsonb AND
(research_status IS NOT NULL OR qualification_status IS NOT NULL OR seth_approval_status IS NOT NULL OR personalization_status IS NOT NULL OR sample_status IS NOT NULL OR tuan_affiliate_status IS NOT NULL);
COMMENT ON COLUMN public.creators.workflow_status IS 'Single authoritative influencer workflow: research, ai_screened, approved, sent, second_look, rejected, backup. Human decisions override AI suggestions.';
COMMENT ON COLUMN public.creators.legacy_status_archive IS 'Archived historical status values. Do not drop legacy columns until all app readers/writers have migrated.';
