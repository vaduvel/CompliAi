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

