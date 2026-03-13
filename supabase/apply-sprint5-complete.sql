-- CompliScan Sprint 5 - one-shot SQL for Supabase SQL Editor
-- Apply this file in the Supabase SQL Editor when preparing the live project
-- for cloud-first identity, tenancy, org state and evidence registry.

-- Legacy fallback schema used by older paths
create schema if not exists compliscan;

create table if not exists compliscan.app_state (
  org_id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function compliscan.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_state_set_updated_at on compliscan.app_state;
create trigger app_state_set_updated_at
before update on compliscan.app_state
for each row
execute function compliscan.set_updated_at();

alter table compliscan.app_state enable row level security;

drop policy if exists "service role full access on app_state" on compliscan.app_state;
create policy "service role full access on app_state"
on compliscan.app_state
as permissive
for all
to service_role
using (true)
with check (true);

-- Sprint 5 operational foundation
create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id text primary key,
  slug text unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'compliscan_role'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.compliscan_role as enum ('owner', 'compliance', 'reviewer', 'viewer');
  end if;
end $$;

create table if not exists public.memberships (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id text not null references public.organizations(id) on delete cascade,
  role public.compliscan_role not null default 'viewer',
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, org_id)
);

create table if not exists public.org_state (
  org_id text primary key references public.organizations(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.evidence_objects (
  id uuid primary key default gen_random_uuid(),
  attachment_id text not null unique,
  org_id text not null references public.organizations(id) on delete cascade,
  task_id text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  kind text not null,
  storage_provider text not null default 'supabase_private',
  storage_key text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

alter table public.evidence_objects
  add column if not exists attachment_id text;

create index if not exists memberships_org_id_idx on public.memberships(org_id);
create index if not exists memberships_user_id_idx on public.memberships(user_id);
create index if not exists evidence_objects_org_id_idx on public.evidence_objects(org_id);
create index if not exists evidence_objects_task_id_idx on public.evidence_objects(task_id);
create unique index if not exists evidence_objects_attachment_id_idx on public.evidence_objects(attachment_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
before update on public.organizations
for each row
execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists memberships_set_updated_at on public.memberships;
create trigger memberships_set_updated_at
before update on public.memberships
for each row
execute function public.set_updated_at();

drop trigger if exists org_state_set_updated_at on public.org_state;
create trigger org_state_set_updated_at
before update on public.org_state
for each row
execute function public.set_updated_at();

create or replace function public.current_user_org_ids()
returns table(org_id text)
language sql
stable
security definer
set search_path = public
as $$
  select m.org_id
  from public.memberships m
  where m.user_id = auth.uid()
    and m.status = 'active'
$$;

revoke all on function public.current_user_org_ids() from public;
grant execute on function public.current_user_org_ids() to authenticated, service_role;

create or replace function public.current_user_has_org_role(
  target_org_id text,
  allowed_roles public.compliscan_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.org_id = target_org_id
      and m.status = 'active'
      and m.role = any(allowed_roles)
  )
$$;

revoke all on function public.current_user_has_org_role(text, public.compliscan_role[]) from public;
grant execute on function public.current_user_has_org_role(text, public.compliscan_role[]) to authenticated, service_role;

create or replace function public.storage_object_org_id(object_name text)
returns text
language sql
immutable
set search_path = public, storage
as $$
  select nullif((storage.foldername(object_name))[1], '')
$$;

revoke all on function public.storage_object_org_id(text) from public;
grant execute on function public.storage_object_org_id(text) to authenticated, service_role;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.org_state enable row level security;
alter table public.evidence_objects enable row level security;

drop policy if exists organizations_member_select on public.organizations;
create policy organizations_member_select
on public.organizations
for select
to authenticated
using (
  id in (select org_id from public.current_user_org_ids())
);

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists memberships_member_select on public.memberships;
create policy memberships_member_select
on public.memberships
for select
to authenticated
using (
  org_id in (select org_id from public.current_user_org_ids())
);

drop policy if exists memberships_admin_update on public.memberships;
create policy memberships_admin_update
on public.memberships
for update
to authenticated
using (
  public.current_user_has_org_role(
    org_id,
    array['owner', 'compliance']::public.compliscan_role[]
  )
)
with check (
  public.current_user_has_org_role(
    org_id,
    array['owner', 'compliance']::public.compliscan_role[]
  )
);

drop policy if exists org_state_member_select on public.org_state;
create policy org_state_member_select
on public.org_state
for select
to authenticated
using (
  org_id in (select org_id from public.current_user_org_ids())
);

drop policy if exists org_state_operator_write on public.org_state;
create policy org_state_operator_write
on public.org_state
for all
to authenticated
using (
  public.current_user_has_org_role(
    org_id,
    array['owner', 'compliance', 'reviewer']::public.compliscan_role[]
  )
)
with check (
  public.current_user_has_org_role(
    org_id,
    array['owner', 'compliance', 'reviewer']::public.compliscan_role[]
  )
);

drop policy if exists evidence_objects_member_select on public.evidence_objects;
create policy evidence_objects_member_select
on public.evidence_objects
for select
to authenticated
using (
  org_id in (select org_id from public.current_user_org_ids())
);

drop policy if exists evidence_objects_operator_insert on public.evidence_objects;
create policy evidence_objects_operator_insert
on public.evidence_objects
for insert
to authenticated
with check (
  public.current_user_has_org_role(
    org_id,
    array['owner', 'compliance', 'reviewer']::public.compliscan_role[]
  )
  and (
    uploaded_by is null
    or uploaded_by = auth.uid()
  )
);

drop policy if exists evidence_objects_operator_update on public.evidence_objects;
create policy evidence_objects_operator_update
on public.evidence_objects
for update
to authenticated
using (
  public.current_user_has_org_role(
    org_id,
    array['owner', 'compliance', 'reviewer']::public.compliscan_role[]
  )
)
with check (
  public.current_user_has_org_role(
    org_id,
    array['owner', 'compliance', 'reviewer']::public.compliscan_role[]
  )
  and (
    uploaded_by is null
    or uploaded_by = auth.uid()
  )
);

drop policy if exists evidence_objects_operator_delete on public.evidence_objects;
create policy evidence_objects_operator_delete
on public.evidence_objects
for delete
to authenticated
using (
  public.current_user_has_org_role(
    org_id,
    array['owner', 'compliance', 'reviewer']::public.compliscan_role[]
  )
);

drop policy if exists service_role_full_access_organizations on public.organizations;
create policy service_role_full_access_organizations
on public.organizations
as permissive
for all
to service_role
using (true)
with check (true);

drop policy if exists service_role_full_access_profiles on public.profiles;
create policy service_role_full_access_profiles
on public.profiles
as permissive
for all
to service_role
using (true)
with check (true);

drop policy if exists service_role_full_access_memberships on public.memberships;
create policy service_role_full_access_memberships
on public.memberships
as permissive
for all
to service_role
using (true)
with check (true);

drop policy if exists service_role_full_access_org_state on public.org_state;
create policy service_role_full_access_org_state
on public.org_state
as permissive
for all
to service_role
using (true)
with check (true);

drop policy if exists service_role_full_access_evidence_objects on public.evidence_objects;
create policy service_role_full_access_evidence_objects
on public.evidence_objects
as permissive
for all
to service_role
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('compliscan-evidence-private', 'compliscan-evidence-private', false)
on conflict (id) do nothing;

drop policy if exists evidence_bucket_authenticated_select on storage.objects;
create policy evidence_bucket_authenticated_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'compliscan-evidence-private'
  and public.storage_object_org_id(name) in (select org_id from public.current_user_org_ids())
);

drop policy if exists evidence_bucket_operator_insert on storage.objects;
create policy evidence_bucket_operator_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'compliscan-evidence-private'
  and public.current_user_has_org_role(
    public.storage_object_org_id(name),
    array['owner', 'compliance', 'reviewer']::public.compliscan_role[]
  )
);

drop policy if exists evidence_bucket_operator_update on storage.objects;
create policy evidence_bucket_operator_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'compliscan-evidence-private'
  and public.current_user_has_org_role(
    public.storage_object_org_id(name),
    array['owner', 'compliance', 'reviewer']::public.compliscan_role[]
  )
)
with check (
  bucket_id = 'compliscan-evidence-private'
  and public.current_user_has_org_role(
    public.storage_object_org_id(name),
    array['owner', 'compliance', 'reviewer']::public.compliscan_role[]
  )
);

drop policy if exists evidence_bucket_operator_delete on storage.objects;
create policy evidence_bucket_operator_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'compliscan-evidence-private'
  and public.current_user_has_org_role(
    public.storage_object_org_id(name),
    array['owner', 'compliance', 'reviewer']::public.compliscan_role[]
  )
);

drop policy if exists evidence_bucket_service_role_all on storage.objects;
create policy evidence_bucket_service_role_all
on storage.objects
as permissive
for all
to service_role
using (bucket_id = 'compliscan-evidence-private')
with check (bucket_id = 'compliscan-evidence-private');
