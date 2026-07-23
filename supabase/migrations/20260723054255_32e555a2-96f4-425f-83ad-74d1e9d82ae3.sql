
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actor_email text,
  actor_name text,
  actor_role text,
  action text NOT NULL,
  reset_type text,
  affected_records jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own audit rows"
  ON public.admin_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Executives read all audit rows"
  ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'executive'::public.app_role));

CREATE POLICY "Users read own audit rows"
  ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX admin_audit_log_created_idx ON public.admin_audit_log (created_at DESC);
