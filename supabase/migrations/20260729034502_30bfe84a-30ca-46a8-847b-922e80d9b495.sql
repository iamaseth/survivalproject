ALTER TABLE public.creator_workspace
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'Not Reviewed',
  ADD COLUMN IF NOT EXISTS important_flag boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS important_note text;

ALTER TABLE public.creator_workspace
  DROP CONSTRAINT IF EXISTS creator_workspace_review_status_check;
ALTER TABLE public.creator_workspace
  ADD CONSTRAINT creator_workspace_review_status_check
  CHECK (review_status IN ('Not Reviewed','Flagged for Second Look','Approved to Send','Skip'));

CREATE INDEX IF NOT EXISTS creator_workspace_review_status_idx
  ON public.creator_workspace (review_status);
CREATE INDEX IF NOT EXISTS creator_workspace_important_flag_idx
  ON public.creator_workspace (important_flag) WHERE important_flag = true;

-- One-time bulk reassignment: Vina's creators -> Rena.
UPDATE public.creator_workspace
   SET assigned_to = 'RENA',
       current_owner = CASE WHEN current_owner = 'VINA' THEN 'RENA' ELSE current_owner END,
       updated_at = now()
 WHERE assigned_to = 'VINA';

UPDATE public.creator_workspace
   SET current_owner = 'RENA',
       updated_at = now()
 WHERE current_owner = 'VINA';