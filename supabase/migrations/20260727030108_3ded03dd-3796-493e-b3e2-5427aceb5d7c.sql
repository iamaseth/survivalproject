CREATE TABLE public.sales_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_domain text NOT NULL UNIQUE,
  company_name text,
  website text,
  contact_name text,
  contact_email text,
  phone text,
  stage text,
  source text,
  notes text,
  raw_row jsonb,
  imported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_prospects TO authenticated;
GRANT ALL ON public.sales_prospects TO service_role;

ALTER TABLE public.sales_prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_members_read_prospects" ON public.sales_prospects
  FOR SELECT TO authenticated USING (private.is_team_member(auth.uid()));
CREATE POLICY "team_members_insert_prospects" ON public.sales_prospects
  FOR INSERT TO authenticated WITH CHECK (private.is_team_member(auth.uid()));
CREATE POLICY "team_members_update_prospects" ON public.sales_prospects
  FOR UPDATE TO authenticated USING (private.is_team_member(auth.uid())) WITH CHECK (private.is_team_member(auth.uid()));
CREATE POLICY "team_members_delete_prospects" ON public.sales_prospects
  FOR DELETE TO authenticated USING (private.is_team_member(auth.uid()));

CREATE TRIGGER set_sales_prospects_updated_at
  BEFORE UPDATE ON public.sales_prospects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX sales_prospects_created_at_idx ON public.sales_prospects (created_at DESC);