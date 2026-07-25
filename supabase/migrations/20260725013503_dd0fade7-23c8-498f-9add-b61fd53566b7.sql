
-- 1) app_user_connections: add owner-scoped policies
CREATE POLICY "Users read own app connection"
  ON public.app_user_connections FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own app connection"
  ON public.app_user_connections FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own app connection"
  ON public.app_user_connections FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own app connection"
  ON public.app_user_connections FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 2) gmail_messages: replace overly permissive team read policy
DROP POLICY IF EXISTS "Team can read all creator gmail messages" ON public.gmail_messages;
CREATE POLICY "Team members can read creator gmail messages"
  ON public.gmail_messages FOR SELECT TO authenticated
  USING (creator_id IS NOT NULL AND private.is_team_member(auth.uid()));

-- 3) gmail_poll_state: add owner-scoped write policies
CREATE POLICY "Users insert own poll state"
  ON public.gmail_poll_state FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own poll state"
  ON public.gmail_poll_state FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own poll state"
  ON public.gmail_poll_state FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
