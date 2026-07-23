
-- Gmail send failure audit log + polling error state
CREATE TABLE public.gmail_send_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sender_email text,
  creator_id text,
  creator_name text,
  recipient text,
  action text NOT NULL DEFAULT 'send',
  http_status int,
  error_reason text,
  subject text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.gmail_send_errors TO authenticated;
GRANT ALL ON public.gmail_send_errors TO service_role;
ALTER TABLE public.gmail_send_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own gmail send errors"
  ON public.gmail_send_errors FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Add polling-error columns to gmail_poll_state (idempotent)
ALTER TABLE public.gmail_poll_state
  ADD COLUMN IF NOT EXISTS last_error_status int,
  ADD COLUMN IF NOT EXISTS last_error_reason text,
  ADD COLUMN IF NOT EXISTS last_error_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_success_at timestamptz;
