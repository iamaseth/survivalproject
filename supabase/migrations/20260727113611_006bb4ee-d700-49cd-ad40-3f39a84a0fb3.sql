ALTER TABLE public.creator_workspace
  ADD COLUMN IF NOT EXISTS contact_attempts jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS content_pieces jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS content_status text,
  ADD COLUMN IF NOT EXISTS content_deadline date,
  ADD COLUMN IF NOT EXISTS deal_type text NOT NULL DEFAULT 'gifted',
  ADD COLUMN IF NOT EXISTS sample_cost_usd numeric(10,2),
  ADD COLUMN IF NOT EXISTS shipping_cost_usd numeric(10,2),
  ADD COLUMN IF NOT EXISTS flat_fee_usd numeric(10,2),
  ADD COLUMN IF NOT EXISTS commission_rate numeric(5,4),
  ADD COLUMN IF NOT EXISTS commission_sales_usd numeric(12,2),
  ADD COLUMN IF NOT EXISTS payout_notes text,
  ADD COLUMN IF NOT EXISTS total_cost_usd numeric(12,2),
  ADD COLUMN IF NOT EXISTS revenue_attributed_usd numeric(12,2),
  ADD COLUMN IF NOT EXISTS roi_ratio numeric(10,4),
  ADD COLUMN IF NOT EXISTS roi_updated_at timestamptz;

CREATE INDEX IF NOT EXISTS creator_workspace_content_status_idx
  ON public.creator_workspace(content_status);
CREATE INDEX IF NOT EXISTS creator_workspace_roi_ratio_idx
  ON public.creator_workspace(roi_ratio DESC NULLS LAST);