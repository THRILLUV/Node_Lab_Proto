-- NodeLab member row. Additive. Do not ALTER public.profiles / members / system_accounts / audits.

create table if not exists public.nl_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tier text not null default 'free',
  exam_track text,
  tutor_mode text,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.nl_profiles enable row level security;

drop policy if exists nl_profiles_own on public.nl_profiles;
create policy nl_profiles_own on public.nl_profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

comment on table public.nl_profiles is
  'NodeLab member profile. Signup consent columns arrive in 20260903090001.';
