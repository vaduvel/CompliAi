-- ============================================================
-- CompliAI — Approval / Review Queue Schema (P0-A)
-- Idempotent schema for:
-- - pending_actions
-- - review_cycles
-- - user_autonomy_settings
-- - scheduled_reports
-- Mirrors the live Supabase truth and keeps repo truth in sync.
-- ============================================================

create extension if not exists pgcrypto;

-- ────────────────────────────────────────────────────────────
-- Tables
-- ────────────────────────────────────────────────────────────

create table if not exists public.pending_actions (
  id uuid primary key default gen_random_uuid(),
  org_id text not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  action_type text not null,
  risk_level text not null default 'medium',
  status text not null default 'pending',
  original_data jsonb,
  proposed_data jsonb,
  diff_summary text,
  explanation text,
  source_finding_id text,
  source_document_id text,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  decided_at timestamptz,
  decided_by uuid references public.profiles(id) on delete set null,
  decided_by_email text,
  decision_note text,
  executed_at timestamptz,
  execution_result jsonb,
  audit_trail jsonb not null default '[]'::jsonb
);

create table if not exists public.review_cycles (
  id uuid primary key default gen_random_uuid(),
  org_id text not null references public.organizations(id) on delete cascade,
  finding_id text not null,
  finding_type_id text,
  review_type text not null default 'scheduled',
  status text not null default 'upcoming',
  scheduled_at timestamptz not null,
  completed_at timestamptz,
  completed_by uuid references public.profiles(id) on delete set null,
  outcome text,
  reopened_finding_id text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_autonomy_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  org_id text not null references public.organizations(id) on delete cascade,
  low_risk_policy text not null default 'auto',
  medium_risk_policy text not null default 'semi',
  high_risk_policy text not null default 'manual',
  critical_risk_policy text not null default 'manual',
  category_overrides jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(user_id, org_id)
);

create table if not exists public.scheduled_reports (
  id uuid primary key default gen_random_uuid(),
  org_id text not null references public.organizations(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  report_type text not null,
  frequency text not null,
  client_org_ids text[] not null default '{}'::text[],
  recipient_emails text[] not null default '{}'::text[],
  next_run_at timestamptz not null,
  last_run_at timestamptz,
  last_run_status text,
  requires_approval boolean not null default false,
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- Indexes
-- ────────────────────────────────────────────────────────────

create index if not exists idx_pending_actions_org on public.pending_actions(org_id);
create index if not exists idx_pending_actions_status on public.pending_actions(status) where status = 'pending';
create index if not exists idx_pending_actions_expires on public.pending_actions(expires_at) where status = 'pending';

create index if not exists idx_review_cycles_org on public.review_cycles(org_id);
create index if not exists idx_review_cycles_due on public.review_cycles(status, scheduled_at)
  where status in ('upcoming', 'due', 'overdue');

create index if not exists idx_scheduled_reports_org on public.scheduled_reports(org_id);
create index if not exists idx_scheduled_reports_next on public.scheduled_reports(next_run_at)
  where enabled = true;

-- ────────────────────────────────────────────────────────────
-- Triggers
-- ────────────────────────────────────────────────────────────

drop trigger if exists user_autonomy_settings_set_updated_at on public.user_autonomy_settings;
create trigger user_autonomy_settings_set_updated_at
before update on public.user_autonomy_settings
for each row execute function public.set_updated_at();

drop trigger if exists scheduled_reports_set_updated_at on public.scheduled_reports;
create trigger scheduled_reports_set_updated_at
before update on public.scheduled_reports
for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- RLS
-- ────────────────────────────────────────────────────────────

alter table public.pending_actions enable row level security;
alter table public.review_cycles enable row level security;
alter table public.user_autonomy_settings enable row level security;
alter table public.scheduled_reports enable row level security;

drop policy if exists "org_member_access" on public.pending_actions;
create policy "org_member_access" on public.pending_actions
for all to authenticated
using (org_id in (select org_id from public.current_user_org_ids()))
with check (
  public.current_user_has_org_role(
    org_id,
    array['owner', 'partner_manager', 'compliance', 'reviewer']::public.compliscan_role[]
  )
);

drop policy if exists "org_member_access" on public.review_cycles;
create policy "org_member_access" on public.review_cycles
for all to authenticated
using (org_id in (select org_id from public.current_user_org_ids()))
with check (
  public.current_user_has_org_role(
    org_id,
    array['owner', 'partner_manager', 'compliance', 'reviewer']::public.compliscan_role[]
  )
);

drop policy if exists "own_settings" on public.user_autonomy_settings;
create policy "own_settings" on public.user_autonomy_settings
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "org_member_access" on public.scheduled_reports;
create policy "org_member_access" on public.scheduled_reports
for all to authenticated
using (org_id in (select org_id from public.current_user_org_ids()))
with check (
  public.current_user_has_org_role(
    org_id,
    array['owner', 'partner_manager', 'compliance']::public.compliscan_role[]
  )
);

-- Service role full access — aligns with live SQL editor setup
drop policy if exists "service_full_access" on public.pending_actions;
create policy "service_full_access" on public.pending_actions
for all to service_role
using (true)
with check (true);

drop policy if exists "service_full_access" on public.review_cycles;
create policy "service_full_access" on public.review_cycles
for all to service_role
using (true)
with check (true);

drop policy if exists "service_full_access" on public.user_autonomy_settings;
create policy "service_full_access" on public.user_autonomy_settings
for all to service_role
using (true)
with check (true);

drop policy if exists "service_full_access" on public.scheduled_reports;
create policy "service_full_access" on public.scheduled_reports
for all to service_role
using (true)
with check (true);
