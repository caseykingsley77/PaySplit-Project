-- Run AFTER supabase/schema.sql for existing installations.
-- Salary setup information is informational; confirmed provider pay-ins are
-- the only source of funds that can enter the financial ledger.
alter table public.profiles
  add column if not exists employer_name text not null default '',
  add column if not exists expected_salary_kobo bigint check (expected_salary_kobo is null or expected_salary_kobo > 0),
  add column if not exists phone_number text not null default '',
  add column if not exists country text not null default 'Nigeria',
  add column if not exists notifications_preferences jsonb not null default '{"push":true,"email":true,"sms":false}'::jsonb;


-- A Supabase Auth user may already exist if email signup happened before
-- PaySplit's application schema was installed. Backfill these users safely.
-- This does not credit funds, alter financial history or bypass verification.
insert into public.profiles(id,full_name)
select u.id,coalesce(u.raw_user_meta_data->>'full_name','')
from auth.users u
on conflict (id) do nothing;

insert into public.ledger_accounts(user_id,code,label,kind)
select u.id,defaults.code,defaults.label,defaults.kind
from auth.users u
cross join (values
 ('salary','Salary account','salary'),
 ('pending','Outgoing transfers','pending'),
 ('clearing','Provider pay-in clearing','clearing'),
 ('external','External payments clearing','external')
) as defaults(code,label,kind)
on conflict (user_id,code) do nothing;

-- Make new tables/columns immediately visible to Supabase's PostgREST API.
notify pgrst, 'reload schema';
