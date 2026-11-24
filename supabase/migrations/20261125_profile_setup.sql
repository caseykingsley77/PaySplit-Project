-- Run AFTER supabase/schema.sql for existing installations.
-- Salary setup information is informational; confirmed provider pay-ins are
-- the only source of funds that can enter the financial ledger.
alter table public.profiles
  add column if not exists employer_name text not null default '',
  add column if not exists expected_salary_kobo bigint check (expected_salary_kobo is null or expected_salary_kobo > 0),
  add column if not exists phone_number text not null default '',
  add column if not exists country text not null default 'Nigeria',
  add column if not exists notifications_preferences jsonb not null default '{"push":true,"email":true,"sms":false}'::jsonb;
