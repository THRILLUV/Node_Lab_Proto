-- yrgaj SQL 에디터에서 1회 실행

alter table nl_profiles add column if not exists nickname text;
alter table nl_profiles add column if not exists age_band text;
alter table nl_profiles add column if not exists over14 boolean;
alter table nl_profiles add column if not exists terms_version text;
alter table nl_profiles add column if not exists privacy_version text;
alter table nl_profiles add column if not exists marketing_opt_in boolean;
alter table nl_profiles add column if not exists consented_at timestamptz;
