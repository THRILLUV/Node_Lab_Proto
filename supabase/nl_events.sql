-- Companion bus. Applied on gnuswrvxilwcitleizdx.

create table if not exists public.nl_events (
  id bigint generated always as identity primary key,
  session_id text not null,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists nl_events_session_id_idx on public.nl_events (session_id);

alter table public.nl_events enable row level security;

drop policy if exists nl_events_public_insert on public.nl_events;
create policy nl_events_public_insert on public.nl_events for insert with check (true);

drop policy if exists nl_events_public_read on public.nl_events;
create policy nl_events_public_read on public.nl_events for select using (true);

alter table public.nl_events replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'nl_events'
  ) then
    alter publication supabase_realtime add table public.nl_events;
  end if;
end $$;
