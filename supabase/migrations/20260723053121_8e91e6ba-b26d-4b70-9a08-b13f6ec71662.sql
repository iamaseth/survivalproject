
-- v6: Gmail App User Connector storage + Gmail message cache

-- 1) Per-user encrypted connection keys (service-role only)
CREATE TABLE public.app_user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connector_id text NOT NULL,
  connection_key_ciphertext text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, connector_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_user_connections TO service_role;
ALTER TABLE public.app_user_connections ENABLE ROW LEVEL SECURITY;
-- No policies: only reachable via service_role from server functions.

CREATE TRIGGER app_user_connections_set_updated_at
BEFORE UPDATE ON public.app_user_connections
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Cached Gmail messages per (user, creator) — powers the Communications
-- module and the per-creator conversation history without hammering Gmail.
CREATE TABLE public.gmail_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  creator_id text,                         -- from creators-seed (legacy id string)
  gmail_message_id text NOT NULL,
  gmail_thread_id text,
  direction text NOT NULL CHECK (direction IN ('sent','received','draft')),
  from_email text,
  from_name text,
  to_emails text[] NOT NULL DEFAULT '{}',
  cc_emails text[] NOT NULL DEFAULT '{}',
  subject text,
  snippet text,
  body_text text,
  has_attachments boolean NOT NULL DEFAULT false,
  label_ids text[] NOT NULL DEFAULT '{}',
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, gmail_message_id)
);
GRANT SELECT ON public.gmail_messages TO authenticated;
GRANT ALL ON public.gmail_messages TO service_role;
ALTER TABLE public.gmail_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own gmail messages"
  ON public.gmail_messages FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- Everyone on the team can also see teammates' creator threads
-- (Perry oversight, Rena supervising Vina, etc.). Comment out if you'd
-- rather each user only sees their own inbox.
CREATE POLICY "Team can read all creator gmail messages"
  ON public.gmail_messages FOR SELECT
  TO authenticated
  USING (creator_id IS NOT NULL);

CREATE INDEX gmail_messages_creator_idx ON public.gmail_messages(creator_id, sent_at DESC);
CREATE INDEX gmail_messages_user_idx ON public.gmail_messages(user_id, sent_at DESC);

-- 3) Per-user polling state + cached Gmail label ids
CREATE TABLE public.gmail_poll_state (
  user_id uuid PRIMARY KEY,
  last_history_id text,
  last_polled_at timestamptz,
  label_ids jsonb NOT NULL DEFAULT '{}'::jsonb,
  email_address text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gmail_poll_state TO authenticated;
GRANT ALL ON public.gmail_poll_state TO service_role;
ALTER TABLE public.gmail_poll_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own poll state"
  ON public.gmail_poll_state FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER gmail_poll_state_set_updated_at
BEFORE UPDATE ON public.gmail_poll_state
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
