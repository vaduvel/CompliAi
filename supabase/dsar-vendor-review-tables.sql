-- Migration: dsar_state + vendor_review_state tables
-- Aceleași pattern ca nis2_state

-- ── dsar_state ─────────────────────────────────────────────────────────────

create table if not exists public.dsar_state (
  org_id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.dsar_state_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists dsar_state_updated_at on public.dsar_state;
create trigger dsar_state_updated_at
before update on public.dsar_state
for each row execute function public.dsar_state_set_updated_at();

alter table public.dsar_state enable row level security;

drop policy if exists "service role full access on dsar_state" on public.dsar_state;
create policy "service role full access on dsar_state"
on public.dsar_state as permissive for all to service_role using (true) with check (true);

-- ── vendor_review_state ────────────────────────────────────────────────────

create table if not exists public.vendor_review_state (
  org_id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.vendor_review_state_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists vendor_review_state_updated_at on public.vendor_review_state;
create trigger vendor_review_state_updated_at
before update on public.vendor_review_state
for each row execute function public.vendor_review_state_set_updated_at();

alter table public.vendor_review_state enable row level security;

drop policy if exists "service role full access on vendor_review_state" on public.vendor_review_state;
create policy "service role full access on vendor_review_state"
on public.vendor_review_state as permissive for all to service_role using (true) with check (true);
