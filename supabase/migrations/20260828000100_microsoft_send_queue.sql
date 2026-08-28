-- Microsoft 365 send-only outreach queue.
-- Safety goals:
-- 1) staging never sends
-- 2) only explicitly approved batches may be claimed
-- 3) at most one queued item is claimed per worker tick
-- 4) successful sends are paced at least 60 seconds apart
-- 5) no mailbox read/draft capability is represented here

create table if not exists public.microsoft_mail_batches (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id),
  name text not null,
  status text not null default 'staged' check (status in ('staged','approved','paused','completed','cancelled')),
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint microsoft_mail_batches_approval_check check (
    (status = 'approved' and approved_at is not null and approved_by is not null)
    or status <> 'approved'
  )
);

create table if not exists public.microsoft_mail_queue (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.microsoft_mail_batches(id),
  creator_id text not null,
  recipient_email text not null,
  recipient_name text,
  subject text not null,
  body_text text not null,
  status text not null default 'staged' check (status in ('staged','approved','sending','sent','failed','cancelled')),
  approved_at timestamptz,
  claimed_at timestamptz,
  sent_at timestamptz,
  provider_message_id text,
  attempt_count integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (batch_id, creator_id, recipient_email)
);

create table if not exists public.microsoft_mail_send_state (
  singleton boolean primary key default true check (singleton),
  last_successful_send_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.microsoft_mail_send_state (singleton)
values (true)
on conflict (singleton) do nothing;

alter table public.microsoft_mail_batches enable row level security;
alter table public.microsoft_mail_queue enable row level security;
alter table public.microsoft_mail_send_state enable row level security;

-- These tables are server-managed only. Browser clients get no direct access.
revoke all on public.microsoft_mail_batches from anon, authenticated;
revoke all on public.microsoft_mail_queue from anon, authenticated;
revoke all on public.microsoft_mail_send_state from anon, authenticated;

grant all on public.microsoft_mail_batches to service_role;
grant all on public.microsoft_mail_queue to service_role;
grant all on public.microsoft_mail_send_state to service_role;

create index if not exists microsoft_mail_queue_claim_idx
  on public.microsoft_mail_queue (status, created_at)
  where status = 'approved';

-- Atomic claim. SECURITY INVOKER + service_role-only execution keeps the function
-- from becoming a privileged public API endpoint.
create or replace function public.claim_next_microsoft_mail(min_interval_seconds integer default 60)
returns setof public.microsoft_mail_queue
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_item public.microsoft_mail_queue%rowtype;
  v_last timestamptz;
begin
  select last_successful_send_at
    into v_last
  from public.microsoft_mail_send_state
  where singleton = true
  for update;

  if v_last is not null and now() < v_last + make_interval(secs => greatest(min_interval_seconds, 60)) then
    return;
  end if;

  select q.*
    into v_item
  from public.microsoft_mail_queue q
  join public.microsoft_mail_batches b on b.id = q.batch_id
  where q.status = 'approved'
    and q.approved_at is not null
    and b.status = 'approved'
    and b.approved_at is not null
    and b.approved_by is not null
  order by q.created_at asc
  for update of q skip locked
  limit 1;

  if not found then
    return;
  end if;

  update public.microsoft_mail_queue
  set status = 'sending',
      claimed_at = now(),
      attempt_count = attempt_count + 1,
      updated_at = now()
  where id = v_item.id
  returning * into v_item;

  return next v_item;
end;
$$;

revoke all on function public.claim_next_microsoft_mail(integer) from public, anon, authenticated;
grant execute on function public.claim_next_microsoft_mail(integer) to service_role;
