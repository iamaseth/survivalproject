
-- 1) Move has_role() out of the public (API-exposed) schema into a private schema.
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Lock down execute: only postgres/service_role can call directly; RLS policies
-- (evaluated by the database) invoke it fine because it is SECURITY DEFINER
-- and we grant execute to the roles that evaluate policies.
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Helper: is the given user any kind of Survival Tabs team member?
CREATE OR REPLACE FUNCTION private.is_team_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

REVOKE ALL ON FUNCTION private.is_team_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_team_member(uuid) TO authenticated, service_role;

-- Drop the public.has_role wrapper (no policies currently reference it).
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 2) profiles: replace "any authenticated can read all" with self + team-visible-to-team.
DROP POLICY IF EXISTS "Authenticated can read profiles" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Team members can read teammate profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    private.is_team_member(auth.uid())
    AND private.is_team_member(id)
  );

-- 3) team_role_assignments: only Executives can view the allow-list.
DROP POLICY IF EXISTS "Authenticated can read team assignments" ON public.team_role_assignments;

CREATE POLICY "Executives can read team assignments"
  ON public.team_role_assignments
  FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'executive'::public.app_role));

-- 4) user_roles: users can see their own row; Executives see all.
DROP POLICY IF EXISTS "Authenticated can read roles" ON public.user_roles;

CREATE POLICY "Users can read own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Executives can read all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'executive'::public.app_role));
