-- Billing / usage tables. Do not ALTER public.profiles.
-- Apply on existing project rccewveplhbgkhrxloui.

create table if not exists public.nl_usage_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  kind text not null,
  delta int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.nl_plans (
  code text primary key,
  price_krw int not null default 0
);

insert into public.nl_plans (code, price_krw) values ('free', 0), ('pro', 9900)
  on conflict (code) do nothing;

create table if not exists public.nl_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_code text not null references public.nl_plans (code),
  status text not null default 'active',
  current_period_end date
);

create table if not exists public.nl_variants (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.nl_items (id) on delete cascade,
  request_id text,
  passed boolean not null default false,
  shown boolean not null default false
);

alter table public.nl_usage_ledger enable row level security;
alter table public.nl_subscriptions enable row level security;
alter table public.nl_variants enable row level security;
alter table public.nl_plans enable row level security;

drop policy if exists nl_plans_read on public.nl_plans;
create policy nl_plans_read on public.nl_plans for select using (true);

drop policy if exists nl_usage_own on public.nl_usage_ledger;
create policy nl_usage_own on public.nl_usage_ledger
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists nl_subs_own on public.nl_subscriptions;
create policy nl_subs_own on public.nl_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
