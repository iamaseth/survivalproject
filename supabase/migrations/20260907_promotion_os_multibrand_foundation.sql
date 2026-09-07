-- DRAFT ONLY. Do not apply to production yet.
-- Promotion OS multi-brand foundation for exactly three brands:
-- Survival Tabs, Swedish Bitters, MicrobeBio.

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brand_memberships (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner','admin','editor','reviewer','viewer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, user_id)
);

create table if not exists public.brand_settings (
  brand_id uuid primary key references public.brands(id) on delete cascade,
  website_url text,
  shop_url text,
  contact_email text,
  logo_url text,
  short_description text,
  default_cta text,
  default_hashtags text[] not null default '{}',
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.promotion_modules (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  module_key text not null check (module_key in ('influencers','content','book','video','campaigns','outreach','assets','analytics','ai_research')),
  is_enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, module_key)
);

alter table public.brands enable row level security;
alter table public.brand_memberships enable row level security;
alter table public.brand_settings enable row level security;
alter table public.promotion_modules enable row level security;

-- Helper: user belongs to brand and membership is active.
create or replace function public.is_brand_member(target_brand_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.brand_memberships bm
    where bm.brand_id = target_brand_id
      and bm.user_id = auth.uid()
      and bm.is_active = true
  );
$$;

create or replace function public.has_brand_role(target_brand_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.brand_memberships bm
    where bm.brand_id = target_brand_id
      and bm.user_id = auth.uid()
      and bm.is_active = true
      and bm.role = any(allowed_roles)
  );
$$;

create policy "members can view brands"
on public.brands for select
using (public.is_brand_member(id));

create policy "members can view their memberships"
on public.brand_memberships for select
using (user_id = auth.uid() or public.has_brand_role(brand_id, array['owner','admin']));

create policy "owners admins manage memberships"
on public.brand_memberships for all
using (public.has_brand_role(brand_id, array['owner','admin']))
with check (public.has_brand_role(brand_id, array['owner','admin']));

create policy "members can view brand settings"
on public.brand_settings for select
using (public.is_brand_member(brand_id));

create policy "owners admins manage brand settings"
on public.brand_settings for all
using (public.has_brand_role(brand_id, array['owner','admin']))
with check (public.has_brand_role(brand_id, array['owner','admin']));

create policy "members can view modules"
on public.promotion_modules for select
using (public.is_brand_member(brand_id));

create policy "owners admins manage modules"
on public.promotion_modules for all
using (public.has_brand_role(brand_id, array['owner','admin']))
with check (public.has_brand_role(brand_id, array['owner','admin']));

-- Seed exactly the three intended brands. Safe to re-run.
insert into public.brands (slug, name)
values
  ('survival-tabs', 'Survival Tabs'),
  ('swedish-bitters', 'Swedish Bitters'),
  ('microbebio', 'MicrobeBio')
on conflict (slug) do update set name = excluded.name, updated_at = now();

-- Enable Survival Tabs modules first. Other brands remain staged until their migrations are ready.
insert into public.promotion_modules (brand_id, module_key, is_enabled)
select b.id, m.module_key, true
from public.brands b
cross join (values
  ('influencers'),
  ('content'),
  ('book'),
  ('video'),
  ('campaigns'),
  ('outreach'),
  ('assets'),
  ('analytics'),
  ('ai_research')
) as m(module_key)
where b.slug = 'survival-tabs'
on conflict (brand_id, module_key) do update set is_enabled = excluded.is_enabled, updated_at = now();

insert into public.promotion_modules (brand_id, module_key, is_enabled)
select b.id, m.module_key, false
from public.brands b
cross join (values
  ('influencers'),
  ('content'),
  ('book'),
  ('video'),
  ('campaigns'),
  ('outreach'),
  ('assets'),
  ('analytics'),
  ('ai_research')
) as m(module_key)
where b.slug in ('swedish-bitters','microbebio')
on conflict (brand_id, module_key) do nothing;

-- IMPORTANT NEXT PHASE, intentionally NOT included here:
-- 1. Add brand_id to reusable operational tables after table-by-table audit.
-- 2. Backfill existing Survival Tabs rows with the Survival Tabs brand id.
-- 3. Add NOT NULL and foreign keys only after validating row counts.
-- 4. Migrate Influencer and Preparedness Studio data preserving IDs/timestamps.
-- 5. Repoint app modules only after data validation.
