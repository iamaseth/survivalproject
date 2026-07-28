
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  segment text,
  subject text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET DEFAULT DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team can read email_templates" ON public.email_templates
  FOR SELECT TO authenticated
  USING (private.is_team_member(auth.uid()));

CREATE POLICY "team can insert email_templates" ON public.email_templates
  FOR INSERT TO authenticated
  WITH CHECK (private.is_team_member(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "team can update email_templates" ON public.email_templates
  FOR UPDATE TO authenticated
  USING (private.is_team_member(auth.uid()))
  WITH CHECK (private.is_team_member(auth.uid()));

CREATE POLICY "creator or exec can delete email_templates" ON public.email_templates
  FOR DELETE TO authenticated
  USING (
    private.is_team_member(auth.uid())
    AND (created_by = auth.uid() OR private.has_role(auth.uid(), 'executive'::app_role))
  );

-- Standard updated_at trigger
CREATE TRIGGER trg_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-unapprove on content edit. Approval is a separate RPC path, so any
-- direct UPDATE that changes user-editable fields must reset approval.
CREATE OR REPLACE FUNCTION public.email_templates_unapprove_on_edit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (NEW.name IS DISTINCT FROM OLD.name)
     OR (NEW.segment IS DISTINCT FROM OLD.segment)
     OR (NEW.subject IS DISTINCT FROM OLD.subject)
     OR (NEW.body IS DISTINCT FROM OLD.body) THEN
    NEW.approved_by := NULL;
    NEW.approved_at := NULL;
    NEW.active := false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_email_templates_unapprove
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.email_templates_unapprove_on_edit();

-- Approval RPC: only executive or partnership_manager may approve.
CREATE OR REPLACE FUNCTION public.approve_email_template(_id uuid)
RETURNS public.email_templates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  _row public.email_templates;
BEGIN
  IF NOT (private.has_role(auth.uid(), 'executive'::app_role)
       OR private.has_role(auth.uid(), 'partnership_manager'::app_role)) THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;

  UPDATE public.email_templates
     SET approved_by = auth.uid(),
         approved_at = now(),
         active = true
   WHERE id = _id
  RETURNING * INTO _row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_email_template(uuid) TO authenticated;
