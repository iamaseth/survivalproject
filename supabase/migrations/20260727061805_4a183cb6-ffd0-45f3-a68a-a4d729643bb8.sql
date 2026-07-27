
-- ============ creators ============
CREATE TABLE public.creators (
  id text PRIMARY KEY,
  code text,
  name text NOT NULL,
  segment text,
  primary_platforms text,
  primary_source text,
  reach_signal text,
  email text,
  contact_route text,
  contact_confidence text,
  research_status text,
  priority text,
  amazon text,
  research_notes text,
  last_researched text,
  seth_next_action text,
  outreach_owner text,
  perry_comments text,
  amazon_confidence text,
  monetization text,
  verification_evidence text,
  contacted_date text,
  contact_method text,
  response_followup text,
  sample_status text,
  rena_notes text,
  tuan_affiliate_status text,
  creator_code text,
  technical_notes text,
  recent_activity_check text,
  full_verification text,
  verification_date text,
  followers_signal text,
  target_audience text,
  geography text,
  geography_confidence text,
  facebook text,
  instagram text,
  tiktok text,
  youtube text,
  other_platform text,
  recommended_offer text,
  partnership_tier text,
  offer_confidence text,
  offer_reasoning text,
  normalized_domain text,
  imported_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX creators_code_key ON public.creators (lower(code)) WHERE code IS NOT NULL AND code <> '';
CREATE UNIQUE INDEX creators_normalized_domain_key ON public.creators (normalized_domain) WHERE normalized_domain IS NOT NULL AND normalized_domain <> '';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.creators TO authenticated;
GRANT ALL ON public.creators TO service_role;

ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team can read creators"
  ON public.creators FOR SELECT TO authenticated
  USING (private.is_team_member(auth.uid()));

CREATE POLICY "team can insert creators"
  ON public.creators FOR INSERT TO authenticated
  WITH CHECK (private.is_team_member(auth.uid()));

CREATE POLICY "team can update creators"
  ON public.creators FOR UPDATE TO authenticated
  USING (private.is_team_member(auth.uid()))
  WITH CHECK (private.is_team_member(auth.uid()));

CREATE POLICY "team can delete creators"
  ON public.creators FOR DELETE TO authenticated
  USING (private.is_team_member(auth.uid()));

CREATE TRIGGER creators_set_updated_at
  BEFORE UPDATE ON public.creators
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ creator_workspace ============
CREATE TABLE public.creator_workspace (
  creator_id text PRIMARY KEY,
  assigned_to text,
  assigned_date text,
  current_owner text,
  outreach_status text,
  contact_method text,
  email_draft_created boolean NOT NULL DEFAULT false,
  email_sent boolean NOT NULL DEFAULT false,
  date_sent text,
  last_contact_date text,
  email_override text,
  next_follow_up_date text,
  follow_up_count integer NOT NULL DEFAULT 0,
  waiting_for_reply boolean NOT NULL DEFAULT false,
  no_response boolean NOT NULL DEFAULT false,
  responded boolean NOT NULL DEFAULT false,
  gmail_message_id text,
  gmail_thread_id text,
  gmail_confirmed_at timestamptz,
  saved_gmail_draft jsonb,
  sample_required boolean NOT NULL DEFAULT false,
  address_received boolean NOT NULL DEFAULT false,
  sample_shipped boolean NOT NULL DEFAULT false,
  tracking_number text,
  delivery_status text,
  shipping_name text,
  shipping_company text,
  shipping_address1 text,
  shipping_address2 text,
  shipping_city text,
  shipping_state text,
  shipping_postal_code text,
  shipping_country text,
  carrier text,
  content_promised text,
  content_received boolean NOT NULL DEFAULT false,
  published_platforms jsonb NOT NULL DEFAULT '[]'::jsonb,
  publish_date text,
  team_notes text,
  ai_recommendation text,
  research_notes text,
  executive_notes text,
  activity jsonb NOT NULL DEFAULT '[]'::jsonb,
  do_not_contact boolean NOT NULL DEFAULT false,
  supervisor text,
  created_by text,
  created_by_role text,
  last_modified_by text,
  last_modified_by_role text,
  last_modified_at timestamptz,
  last_activity_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_workspace TO authenticated;
GRANT ALL ON public.creator_workspace TO service_role;

ALTER TABLE public.creator_workspace ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team can read creator_workspace"
  ON public.creator_workspace FOR SELECT TO authenticated
  USING (private.is_team_member(auth.uid()));

CREATE POLICY "team can insert creator_workspace"
  ON public.creator_workspace FOR INSERT TO authenticated
  WITH CHECK (private.is_team_member(auth.uid()));

CREATE POLICY "team can update creator_workspace"
  ON public.creator_workspace FOR UPDATE TO authenticated
  USING (private.is_team_member(auth.uid()))
  WITH CHECK (private.is_team_member(auth.uid()));

CREATE POLICY "team can delete creator_workspace"
  ON public.creator_workspace FOR DELETE TO authenticated
  USING (private.is_team_member(auth.uid()));

CREATE TRIGGER creator_workspace_set_updated_at
  BEFORE UPDATE ON public.creator_workspace
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
