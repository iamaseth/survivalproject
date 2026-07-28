-- Add new role for Shopify Content editors (Tuan, Hoang - Module B)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'shopify_content_editor';

-- (commit enum add before using it)
COMMIT;
BEGIN;

INSERT INTO public.team_role_assignments (email, role, display_name) VALUES
  ('renas1503@gmail.com', 'partnership_manager', 'Rena'),
  ('vinapanda777@gmail.com', 'partnership_coordinator', 'Vina'),
  ('ellezolie@atp.com', 'executive', 'Perry'),
  ('atp@globenetcapitalgroup.com', 'executive', 'Perry'),
  ('alvisslohasfarms@gmail.com', 'shopify_content_editor', 'Tuan'),
  ('hoanglohasfarms@gmail.com', 'shopify_content_editor', 'Hoang')
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  display_name = EXCLUDED.display_name;

-- Backfill user_roles for any of the above users who have already signed up
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, tra.role
FROM auth.users u
JOIN public.team_role_assignments tra ON lower(tra.email) = lower(u.email)
WHERE tra.email IN (
  'renas1503@gmail.com','vinapanda777@gmail.com','ellezolie@atp.com',
  'atp@globenetcapitalgroup.com','alvisslohasfarms@gmail.com','hoanglohasfarms@gmail.com'
)
ON CONFLICT (user_id, role) DO NOTHING;