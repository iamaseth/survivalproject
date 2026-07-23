
-- ============ Roles ============
CREATE TYPE public.app_role AS ENUM (
  'executive',
  'research_manager',
  'partnership_manager',
  'partnership_coordinator'
);

-- ============ profiles ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ user_roles ============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read roles"
  ON public.user_roles FOR SELECT TO authenticated USING (true);

-- has_role helper (SECURITY DEFINER to avoid recursion in policies)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============ team_role_assignments (email allow-list) ============
CREATE TABLE public.team_role_assignments (
  email text PRIMARY KEY,
  role public.app_role NOT NULL,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.team_role_assignments TO authenticated;
GRANT ALL ON public.team_role_assignments TO service_role;

ALTER TABLE public.team_role_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read team assignments"
  ON public.team_role_assignments FOR SELECT TO authenticated USING (true);

-- Seed team emails. Update these to the real Google addresses at any time.
INSERT INTO public.team_role_assignments (email, role, display_name) VALUES
  ('perry@survivaltabs.com', 'executive',                'Perry'),
  ('seth@survivaltabs.com',  'research_manager',         'Seth'),
  ('rena@survivaltabs.com',  'partnership_manager',      'Rena'),
  ('vina@survivaltabs.com',  'partnership_coordinator',  'Vina');

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ handle_new_user: on signup create profile + assign role ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _email       text := lower(coalesce(NEW.email, NEW.raw_user_meta_data->>'email'));
  _full_name   text := coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name');
  _avatar      text := coalesce(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture');
  _assigned    public.app_role;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, _email, _full_name, _avatar)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  SELECT role INTO _assigned FROM public.team_role_assignments WHERE email = _email;
  IF _assigned IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, _assigned)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
