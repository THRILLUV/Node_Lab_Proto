-- NodeLab tables. Do not ALTER public.profiles (other app).
-- Project: gnuswrvxilwcitleizdx (Node_Lab)

create table if not exists public.nl_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tier text not null default 'free',
  exam_track text,
  tutor_mode text,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.nl_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  entry text,
  exam_key text,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists public.nl_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.nl_sessions (id) on delete cascade,
  item_index int not null,
  concept_name text,
  source text
);

create table if not exists public.nl_attempts (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.nl_items (id) on delete cascade,
  choice text,
  created_at timestamptz not null default now()
);

create table if not exists public.nl_ocr_confirms (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.nl_items (id) on delete cascade,
  result text not null,
  confidence numeric,
  confirmed_at timestamptz not null default now()
);

create index if not exists nl_sessions_user_id_idx on public.nl_sessions (user_id);
create index if not exists nl_items_session_id_idx on public.nl_items (session_id);

alter table public.nl_profiles enable row level security;
alter table public.nl_sessions enable row level security;
alter table public.nl_items enable row level security;
alter table public.nl_attempts enable row level security;
alter table public.nl_ocr_confirms enable row level security;

drop policy if exists nl_profiles_own on public.nl_profiles;
create policy nl_profiles_own on public.nl_profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists nl_sessions_own on public.nl_sessions;
drop policy if exists nl_sessions_own_select on public.nl_sessions;
drop policy if exists nl_sessions_own_insert on public.nl_sessions;
drop policy if exists nl_sessions_own_update on public.nl_sessions;
drop policy if exists nl_sessions_own_delete on public.nl_sessions;
create policy nl_sessions_own_select on public.nl_sessions
  for select using (auth.uid() = user_id);
create policy nl_sessions_own_insert on public.nl_sessions
  for insert with check (auth.uid() = user_id);
create policy nl_sessions_own_update on public.nl_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy nl_sessions_own_delete on public.nl_sessions
  for delete using (auth.uid() = user_id);

drop policy if exists nl_sessions_guest_insert on public.nl_sessions;
create policy nl_sessions_guest_insert on public.nl_sessions
  for insert
  with check (user_id is null);

drop policy if exists nl_sessions_guest_select on public.nl_sessions;
create policy nl_sessions_guest_select on public.nl_sessions
  for select using (user_id is null);

drop policy if exists nl_items_via_session on public.nl_items;
create policy nl_items_via_session on public.nl_items
  for all
  using (
    exists (
      select 1 from public.nl_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.nl_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

drop policy if exists nl_attempts_via_item on public.nl_attempts;
create policy nl_attempts_via_item on public.nl_attempts
  for all
  using (
    exists (
      select 1 from public.nl_items i
      join public.nl_sessions s on s.id = i.session_id
      where i.id = item_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.nl_items i
      join public.nl_sessions s on s.id = i.session_id
      where i.id = item_id and s.user_id = auth.uid()
    )
  );

drop policy if exists nl_ocr_via_item on public.nl_ocr_confirms;
create policy nl_ocr_via_item on public.nl_ocr_confirms
  for all
  using (
    exists (
      select 1 from public.nl_items i
      join public.nl_sessions s on s.id = i.session_id
      where i.id = item_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.nl_items i
      join public.nl_sessions s on s.id = i.session_id
      where i.id = item_id and s.user_id = auth.uid()
    )
  );
