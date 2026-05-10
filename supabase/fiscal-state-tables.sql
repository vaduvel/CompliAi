-- Sprint 9 — supplemental Supabase tables for fiscal module + recent stores.
--
-- These tables match the `createAdaptiveStorage(localPrefix, supabaseTable)`
-- contract: each row = `{ org_id text, state jsonb, updated_at timestamptz }`.
-- The application persists/reads via `lib/server/storage-adapter.ts`.
--
-- IMPORTANT: `cron_status` and `dora`/`whistleblowing` follow the SAME pattern
-- as `public.plans` — they store either a global key (`org_id = 'global'`) or
-- per-org snapshots, depending on the store. RLS rules are scoped accordingly.
--
-- Apply this file in Supabase SQL editor. Idempotent — re-runs are safe.

-- 1. cron_status — platform-wide (single row with org_id = 'global').
--    Tracks last-run record per cron handler for the admin observability page.
create table if not exists public.cron_status (
  org_id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists cron_status_set_updated_at on public.cron_status;
create trigger cron_status_set_updated_at
before update on public.cron_status
for each row
execute function public.set_updated_at();

alter table public.cron_status enable row level security;

-- Read: any authenticated user (page is gated separately by middleware/role)
drop policy if exists cron_status_authenticated_select on public.cron_status;
create policy cron_status_authenticated_select
on public.cron_status
for select
to authenticated
using (true);

-- Write: only service_role (cron handlers use SUPABASE_SERVICE_ROLE_KEY)
drop policy if exists service_role_full_access_cron_status on public.cron_status;
create policy service_role_full_access_cron_status
on public.cron_status
as permissive
for all
to service_role
using (true)
with check (true);


-- 2. dora — per-org DORA compliance state.
create table if not exists public.dora (
  org_id text primary key references public.organizations(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists dora_set_updated_at on public.dora;
create trigger dora_set_updated_at
before update on public.dora
for each row
execute function public.set_updated_at();

alter table public.dora enable row level security;

drop policy if exists dora_member_select on public.dora;
create policy dora_member_select
on public.dora
for select
to authenticated
using (org_id in (select org_id from public.current_user_org_ids()));

drop policy if exists dora_operator_write on public.dora;
create policy dora_operator_write
on public.dora
for all
to authenticated
using (
  public.current_user_has_org_role(
    org_id,
    array['owner', 'partner_manager', 'compliance', 'reviewer']::public.compliscan_role[]
  )
)
with check (
  public.current_user_has_org_role(
    org_id,
    array['owner', 'partner_manager', 'compliance', 'reviewer']::public.compliscan_role[]
  )
);

drop policy if exists service_role_full_access_dora on public.dora;
create policy service_role_full_access_dora
on public.dora
as permissive
for all
to service_role
using (true)
with check (true);


-- 3. whistleblowing — per-org whistleblowing state.
create table if not exists public.whistleblowing (
  org_id text primary key references public.organizations(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists whistleblowing_set_updated_at on public.whistleblowing;
create trigger whistleblowing_set_updated_at
before update on public.whistleblowing
for each row
execute function public.set_updated_at();

alter table public.whistleblowing enable row level security;

drop policy if exists whistleblowing_member_select on public.whistleblowing;
create policy whistleblowing_member_select
on public.whistleblowing
for select
to authenticated
using (org_id in (select org_id from public.current_user_org_ids()));

drop policy if exists whistleblowing_operator_write on public.whistleblowing;
create policy whistleblowing_operator_write
on public.whistleblowing
for all
to authenticated
using (
  public.current_user_has_org_role(
    org_id,
    array['owner', 'partner_manager', 'compliance']::public.compliscan_role[]
  )
)
with check (
  public.current_user_has_org_role(
    org_id,
    array['owner', 'partner_manager', 'compliance']::public.compliscan_role[]
  )
);

drop policy if exists service_role_full_access_whistleblowing on public.whistleblowing;
create policy service_role_full_access_whistleblowing
on public.whistleblowing
as permissive
for all
to service_role
using (true)
with check (true);


-- 4. alert_preferences — per-org user alert preferences.
create table if not exists public.alert_preferences (
  org_id text primary key references public.organizations(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists alert_preferences_set_updated_at on public.alert_preferences;
create trigger alert_preferences_set_updated_at
before update on public.alert_preferences
for each row
execute function public.set_updated_at();

alter table public.alert_preferences enable row level security;

drop policy if exists alert_preferences_member_select on public.alert_preferences;
create policy alert_preferences_member_select
on public.alert_preferences
for select
to authenticated
using (org_id in (select org_id from public.current_user_org_ids()));

drop policy if exists alert_preferences_operator_write on public.alert_preferences;
create policy alert_preferences_operator_write
on public.alert_preferences
for all
to authenticated
using (
  public.current_user_has_org_role(
    org_id,
    array['owner', 'partner_manager', 'compliance', 'reviewer', 'viewer']::public.compliscan_role[]
  )
)
with check (
  public.current_user_has_org_role(
    org_id,
    array['owner', 'partner_manager', 'compliance', 'reviewer', 'viewer']::public.compliscan_role[]
  )
);

drop policy if exists service_role_full_access_alert_preferences on public.alert_preferences;
create policy service_role_full_access_alert_preferences
on public.alert_preferences
as permissive
for all
to service_role
using (true)
with check (true);


-- 5. agent_feedback — per-org agent feedback log.
create table if not exists public.agent_feedback (
  org_id text primary key references public.organizations(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists agent_feedback_set_updated_at on public.agent_feedback;
create trigger agent_feedback_set_updated_at
before update on public.agent_feedback
for each row
execute function public.set_updated_at();

alter table public.agent_feedback enable row level security;

drop policy if exists agent_feedback_member_select on public.agent_feedback;
create policy agent_feedback_member_select
on public.agent_feedback
for select
to authenticated
using (org_id in (select org_id from public.current_user_org_ids()));

drop policy if exists agent_feedback_operator_write on public.agent_feedback;
create policy agent_feedback_operator_write
on public.agent_feedback
for all
to authenticated
using (
  public.current_user_has_org_role(
    org_id,
    array['owner', 'partner_manager', 'compliance']::public.compliscan_role[]
  )
)
with check (
  public.current_user_has_org_role(
    org_id,
    array['owner', 'partner_manager', 'compliance']::public.compliscan_role[]
  )
);

drop policy if exists service_role_full_access_agent_feedback on public.agent_feedback;
create policy service_role_full_access_agent_feedback
on public.agent_feedback
as permissive
for all
to service_role
using (true)
with check (true);


-- 6. cabinet_templates_state — per-org cabinet template overrides.
create table if not exists public.cabinet_templates_state (
  org_id text primary key references public.organizations(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists cabinet_templates_state_set_updated_at on public.cabinet_templates_state;
create trigger cabinet_templates_state_set_updated_at
before update on public.cabinet_templates_state
for each row
execute function public.set_updated_at();

alter table public.cabinet_templates_state enable row level security;

drop policy if exists cabinet_templates_state_member_select on public.cabinet_templates_state;
create policy cabinet_templates_state_member_select
on public.cabinet_templates_state
for select
to authenticated
using (org_id in (select org_id from public.current_user_org_ids()));

drop policy if exists cabinet_templates_state_operator_write on public.cabinet_templates_state;
create policy cabinet_templates_state_operator_write
on public.cabinet_templates_state
for all
to authenticated
using (
  public.current_user_has_org_role(
    org_id,
    array['owner', 'partner_manager', 'compliance']::public.compliscan_role[]
  )
)
with check (
  public.current_user_has_org_role(
    org_id,
    array['owner', 'partner_manager', 'compliance']::public.compliscan_role[]
  )
);

drop policy if exists service_role_full_access_cabinet_templates_state on public.cabinet_templates_state;
create policy service_role_full_access_cabinet_templates_state
on public.cabinet_templates_state
as permissive
for all
to service_role
using (true)
with check (true);
