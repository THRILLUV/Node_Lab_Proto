-- Signup consent + nickname. Same meaning as docs/eng/sql/nl-signup-consent.sql.

alter table public.nl_profiles add column if not exists nickname text;
alter table public.nl_profiles add column if not exists age_band text;
alter table public.nl_profiles add column if not exists over14 boolean;
alter table public.nl_profiles add column if not exists terms_version text;
alter table public.nl_profiles add column if not exists privacy_version text;
alter table public.nl_profiles add column if not exists marketing_opt_in boolean;
alter table public.nl_profiles add column if not exists consented_at timestamptz;
