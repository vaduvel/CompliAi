-- Supplemental runtime state tables for cloud-first production.
-- `plans` intentionally stays without FK because the current storage layer
-- persists a single global snapshot under `org_id = 'global'`.
-- Other org-scoped stores follow the existing `public.org_state` pattern.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.plans (
  org_id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications_state (
  org_id text primary key references public.organizations(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.nis2_state (
  org_id text primary key references public.organizations(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_runs (
  org_id text primary key references public.organizations(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_reviews (
  org_id text primary key references public.organizations(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists plans_set_updated_at on public.plans;
create trigger plans_set_updated_at
before update on public.plans
for each row
execute function public.set_updated_at();

drop trigger if exists notifications_state_set_updated_at on public.notifications_state;
create trigger notifications_state_set_updated_at
before update on public.notifications_state
for each row
execute function public.set_updated_at();

drop trigger if exists nis2_state_set_updated_at on public.nis2_state;
create trigger nis2_state_set_updated_at
before update on public.nis2_state
for each row
execute function public.set_updated_at();

drop trigger if exists agent_runs_set_updated_at on public.agent_runs;
create trigger agent_runs_set_updated_at
before update on public.agent_runs
for each row
execute function public.set_updated_at();

drop trigger if exists vendor_reviews_set_updated_at on public.vendor_reviews;
create trigger vendor_reviews_set_updated_at
before update on public.vendor_reviews
for each row
execute function public.set_updated_at();

alter table public.plans enable row level security;
alter table public.notifications_state enable row level security;
alter table public.nis2_state enable row level security;
alter table public.agent_runs enable row level security;
alter table public.vendor_reviews enable row level security;

drop policy if exists notifications_state_member_select on public.notifications_state;
create policy notifications_state_member_select
on public.notifications_state
for select
to authenticated
using (
  org_id in (select org_id from public.current_user_org_ids())
);

drop policy if exists notifications_state_operator_write on public.notifications_state;
create policy notifications_state_operator_write
on public.notifications_state
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

drop policy if exists nis2_state_member_select on public.nis2_state;
create policy nis2_state_member_select
on public.nis2_state
for select
to authenticated
using (
  org_id in (select org_id from public.current_user_org_ids())
);

drop policy if exists nis2_state_operator_write on public.nis2_state;
create policy nis2_state_operator_write
on public.nis2_state
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

drop policy if exists agent_runs_member_select on public.agent_runs;
create policy agent_runs_member_select
on public.agent_runs
for select
to authenticated
using (
  org_id in (select org_id from public.current_user_org_ids())
);

drop policy if exists agent_runs_operator_write on public.agent_runs;
create policy agent_runs_operator_write
on public.agent_runs
for all
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

drop policy if exists vendor_reviews_member_select on public.vendor_reviews;
create policy vendor_reviews_member_select
on public.vendor_reviews
for select
to authenticated
using (
  org_id in (select org_id from public.current_user_org_ids())
);

drop policy if exists vendor_reviews_operator_write on public.vendor_reviews;
create policy vendor_reviews_operator_write
on public.vendor_reviews
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

drop policy if exists service_role_full_access_plans on public.plans;
create policy service_role_full_access_plans
on public.plans
as permissive
for all
to service_role
using (true)
with check (true);

drop policy if exists service_role_full_access_notifications_state on public.notifications_state;
create policy service_role_full_access_notifications_state
on public.notifications_state
as permissive
for all
to service_role
using (true)
with check (true);

drop policy if exists service_role_full_access_nis2_state on public.nis2_state;
create policy service_role_full_access_nis2_state
on public.nis2_state
as permissive
for all
to service_role
using (true)
with check (true);

drop policy if exists service_role_full_access_agent_runs on public.agent_runs;
create policy service_role_full_access_agent_runs
on public.agent_runs
as permissive
for all
to service_role
using (true)
with check (true);

drop policy if exists service_role_full_access_vendor_reviews on public.vendor_reviews;
create policy service_role_full_access_vendor_reviews
on public.vendor_reviews
as permissive
for all
to service_role
using (true)
with check (true);
