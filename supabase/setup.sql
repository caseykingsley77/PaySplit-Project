-- PAY SPLIT | ONE-TIME INITIAL SETUP
-- Run in the SQL Editor of the Supabase project connected to PaySplit.
-- This script is for a fresh project where public.profiles does not exist.
-- Runs atomically and aborts if a PaySplit profile table already exists.
begin;

do $$ begin
 if to_regclass('public.profiles') is not null then
  raise exception 'PaySplit schema already exists. Apply only the required migrations instead.';
 end if;
end $$;

-- Run this in the Supabase SQL editor before starting PaySplit.
-- All writes flow through authenticated server API routes holding the service role key.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  kyc_status text not null default 'not_started' check (kyc_status in ('not_started','pending','approved','rejected')),
  expected_salary_day integer not null default 25 check (expected_salary_day between 1 and 31),
  created_at timestamptz not null default now()
);
create table public.ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null,
  label text not null,
  kind text not null check (kind in ('salary','wallet','pending','clearing','external')),
  unique (user_id,code)
);
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category text not null default 'Savings',
  target_kobo bigint check (target_kobo is null or target_kobo>0),
  ledger_account_id uuid not null unique references public.ledger_accounts(id),
  created_at timestamptz not null default now()
);
create table public.beneficiaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category text not null default 'Family',
  bank_code text not null,
  bank_name text not null,
  account_number text not null,
  account_name text not null,
  recipient_code text,
  created_at timestamptz not null default now()
);
create table public.split_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  destination_type text not null check (destination_type in ('wallet','beneficiary')),
  destination_id uuid not null,
  method text not null check (method in ('fixed','percent')),
  value bigint not null check (value>0),
  priority int not null check (priority between 1 and 10),
  status text not null default 'active' check (status in ('active','paused')),
  created_at timestamptz not null default now(),
  unique(user_id,destination_type,destination_id),
  check(method <> 'percent' or value <= 10000)
);
create table public.collection_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  account_number text unique not null,
  bank_name text not null,
  account_name text not null,
  provider_customer_code text,
  provider_account_id text,
  created_at timestamptz not null default now()
);
create table public.salary_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  provider_reference text not null unique,
  amount_kobo bigint not null check(amount_kobo>0),
  currency text not null default 'NGN' check(currency='NGN'),
  confirmed_at timestamptz not null default now()
);
create table public.split_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  salary_payment_id uuid not null unique references public.salary_payments(id),
  trigger_type text not null check (trigger_type in ('manual','automatic')),
  created_at timestamptz not null default now()
);
create table public.allocations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  run_id uuid not null references public.split_runs(id),
  rule_id uuid references public.split_rules(id) on delete set null,
  destination_type text not null,
  destination_id uuid not null,
  rule_name text not null,
  requested_kobo bigint not null check(requested_kobo>=0),
  status text not null check(status in ('completed','pending','skipped','failed','retrying')),
  provider_reference text unique,
  reason text,
  created_at timestamptz not null default now()
);
create table public.ledger_journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  reference text not null unique,
  description text not null,
  created_at timestamptz not null default now()
);
create table public.ledger_postings (
  id bigint generated always as identity primary key,
  journal_id uuid not null references public.ledger_journals(id),
  ledger_account_id uuid not null references public.ledger_accounts(id),
  amount_kobo bigint not null check(amount_kobo<>0)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.provider_events (
  provider text not null,
  event_key text not null,
  event_type text not null,
  received_at timestamptz not null default now(),
  primary key(provider,event_key)
);
create index on public.ledger_postings(ledger_account_id);
create index on public.salary_payments(user_id,confirmed_at desc);
create index on public.allocations(user_id,created_at desc);
create index on public.split_rules(user_id,status,priority);
create index on public.notifications(user_id,created_at desc);

create or replace function public.profile_bootstrap() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','')) on conflict do nothing;
 insert into public.ledger_accounts(user_id,code,label,kind) values
 (new.id,'salary','Salary account','salary'),
 (new.id,'pending','Outgoing transfers','pending'),
 (new.id,'clearing','Provider pay-in clearing','clearing'),
 (new.id,'external','External payments clearing','external')
 on conflict do nothing;
 return new;
end $$;
create trigger auth_user_created after insert on auth.users for each row execute function public.profile_bootstrap();

-- A journal represents a zero-sum financial movement. Positive amounts increase
-- an account's allocated balance, negative amounts decrease it.
create or replace function public.post_journal(p_user uuid,p_ref text,p_description text,p_lines jsonb)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_journal uuid; v_line jsonb; v_sum bigint:=0; v_acc uuid; v_amount bigint;
begin
 if jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines)<2 then raise exception 'At least two postings required'; end if;
 if exists(select 1 from public.ledger_journals where reference=p_ref) then return false; end if;
 for v_line in select value from jsonb_array_elements(p_lines) loop
  v_acc:=(v_line->>'account_id')::uuid;
  v_amount:=(v_line->>'amount')::bigint;
  if v_amount=0 or not exists(select 1 from public.ledger_accounts where id=v_acc and user_id=p_user) then raise exception 'Invalid ledger posting'; end if;
  v_sum:=v_sum+v_amount;
 end loop;
 if v_sum<>0 then raise exception 'Unbalanced journal: %',v_sum; end if;
 insert into public.ledger_journals(user_id,reference,description) values(p_user,p_ref,p_description) returning id into v_journal;
 for v_line in select value from jsonb_array_elements(p_lines) loop
  insert into public.ledger_postings(journal_id,ledger_account_id,amount_kobo)
  values(v_journal,(v_line->>'account_id')::uuid,(v_line->>'amount')::bigint);
 end loop;
 return true;
end $$;
create or replace function public.account_balance(p_account uuid)
returns bigint language sql stable security definer set search_path=public as $$
 select coalesce(sum(p.amount_kobo),0)::bigint from public.ledger_postings p where p.ledger_account_id=p_account;
$$;

create or replace function public.confirm_salary(p_user uuid,p_reference text,p_amount bigint)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_salary uuid; v_clearing uuid; v_inserted boolean:=false;
begin
 if p_amount<=0 then raise exception 'Invalid amount'; end if;
 -- Locks serialise credit and allocation operations for this user.
 perform 1 from public.profiles where id=p_user for update;
 select id into v_id from public.salary_payments where provider_reference=p_reference;
 if v_id is null then
  insert into public.salary_payments(user_id,provider_reference,amount_kobo)
  values(p_user,p_reference,p_amount) on conflict do nothing returning id into v_id;
  if v_id is not null then
   v_inserted:=true;
   select id into v_salary from public.ledger_accounts where user_id=p_user and code='salary';
   select id into v_clearing from public.ledger_accounts where user_id=p_user and code='clearing';
   perform public.post_journal(p_user,'payin:'||p_reference,'Confirmed salary receipt',
    jsonb_build_array(jsonb_build_object('account_id',v_salary,'amount',p_amount),
                      jsonb_build_object('account_id',v_clearing,'amount',-p_amount)));
   insert into public.notifications(user_id,title,message) values(p_user,'Salary received','A confirmed salary payment has arrived.');
  end if;
 end if;
 if v_id is null then select id into v_id from public.salary_payments where provider_reference=p_reference; end if;
 if not exists(select 1 from public.salary_payments where id=v_id and user_id=p_user and amount_kobo=p_amount) then
  raise exception 'Conflicting payment reference';
 end if;
 return jsonb_build_object('id',v_id,'inserted',v_inserted);
end $$;

create or replace function public.execute_salary_split(p_user uuid,p_salary_id uuid,p_trigger text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_payment public.salary_payments%rowtype; v_run uuid; v_rule public.split_rules%rowtype;
 v_available bigint; v_request bigint; v_salary_acc uuid; v_target_acc uuid; v_pending_acc uuid;
 v_alloc uuid; v_ready int:=0; v_skipped int:=0;
begin
 if p_trigger not in ('manual','automatic') then raise exception 'Invalid split trigger'; end if;
 perform 1 from public.profiles where id=p_user and kyc_status='approved' for update;
 if not found then raise exception 'KYC approval required before moving money'; end if;
 select * into v_payment from public.salary_payments where id=p_salary_id and user_id=p_user for update;
 if not found then raise exception 'Unknown salary payment'; end if;
 select id into v_run from public.split_runs where salary_payment_id=p_salary_id;
 if v_run is not null then return jsonb_build_object('run_id',v_run,'already_executed',true); end if;
 select id into v_salary_acc from public.ledger_accounts where user_id=p_user and code='salary';
 select id into v_pending_acc from public.ledger_accounts where user_id=p_user and code='pending';
 v_available:=least(v_payment.amount_kobo,public.account_balance(v_salary_acc));
 if v_available<=0 then raise exception 'No unallocated salary available'; end if;
 insert into public.split_runs(user_id,salary_payment_id,trigger_type)
 values(p_user,p_salary_id,p_trigger) returning id into v_run;
 for v_rule in select * from public.split_rules where user_id=p_user and status='active'
  order by priority,created_at,id loop
  if v_rule.method='fixed' then v_request:=v_rule.value;
  else v_request:=(v_payment.amount_kobo*v_rule.value+5000)/10000; end if;
  if v_request<=0 or v_request>v_available then
   insert into public.allocations(user_id,run_id,rule_id,destination_type,destination_id,rule_name,requested_kobo,status,reason)
   values(p_user,v_run,v_rule.id,v_rule.destination_type,v_rule.destination_id,v_rule.name,v_request,'skipped','Insufficient funds or amount rounds to zero');
   v_skipped:=v_skipped+1;
   continue;
  end if;
  if v_rule.destination_type='wallet' then
   select ledger_account_id into v_target_acc from public.wallets where id=v_rule.destination_id and user_id=p_user;
  else
   if not exists(select 1 from public.beneficiaries where id=v_rule.destination_id and user_id=p_user) then raise exception 'Unknown beneficiary'; end if;
   v_target_acc:=v_pending_acc;
  end if;
  if v_target_acc is null then raise exception 'Unknown destination'; end if;
  insert into public.allocations(user_id,run_id,rule_id,destination_type,destination_id,rule_name,requested_kobo,status)
  values(p_user,v_run,v_rule.id,v_rule.destination_type,v_rule.destination_id,v_rule.name,v_request,
   case when v_rule.destination_type='wallet' then 'completed' else 'pending' end)
  returning id into v_alloc;
  perform public.post_journal(p_user,'reserve:'||v_alloc,
   case when v_rule.destination_type='wallet' then 'Move salary into wallet' else 'Reserve beneficiary transfer' end,
   jsonb_build_array(jsonb_build_object('account_id',v_salary_acc,'amount',-v_request),
                     jsonb_build_object('account_id',v_target_acc,'amount',v_request)));
  v_available:=v_available-v_request;
  v_ready:=v_ready+1;
 end loop;
 insert into public.notifications(user_id,title,message) values(p_user,'Split prepared','Your salary allocation was processed; any external transfers are pending provider confirmation.');
 return jsonb_build_object('run_id',v_run,'already_executed',false,'allocations',v_ready,'skipped',v_skipped);
end $$;

create or replace function public.complete_transfer(p_allocation uuid,p_success boolean,p_provider_ref text,p_reason text default null)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_alloc public.allocations%rowtype; v_from uuid; v_to uuid;
begin
 select * into v_alloc from public.allocations where id=p_allocation for update;
 if not found then raise exception 'Unknown transfer'; end if;
 if v_alloc.destination_type<>'beneficiary' then raise exception 'Not an external transfer'; end if;
 if v_alloc.status in ('completed','failed') then return false; end if;
 if v_alloc.status not in ('pending','retrying') then raise exception 'Transfer is not pending'; end if;
 select id into v_from from public.ledger_accounts where user_id=v_alloc.user_id and code='pending';
 select id into v_to from public.ledger_accounts where user_id=v_alloc.user_id and code=(case when p_success then 'external' else 'salary' end);
 perform public.post_journal(v_alloc.user_id,'settle:'||v_alloc.id,
  case when p_success then 'External transfer settled' else 'External transfer released' end,
  jsonb_build_array(jsonb_build_object('account_id',v_from,'amount',-v_alloc.requested_kobo),
                    jsonb_build_object('account_id',v_to,'amount',v_alloc.requested_kobo)));
 update public.allocations set status=case when p_success then 'completed' else 'failed' end,
 provider_reference=coalesce(p_provider_ref,provider_reference),reason=p_reason where id=p_allocation;
 insert into public.notifications(user_id,title,message) values
 (v_alloc.user_id,case when p_success then 'Transfer completed' else 'Transfer failed' end,
  case when p_success then 'Your beneficiary payment has been confirmed.' else coalesce(p_reason,'Your transfer was not completed. Funds were returned to your salary balance.') end);
 return true;
end $$;

-- Every user-facing table: authenticated users can read ONLY their own data.
do $$ declare t text; begin
 foreach t in array array['ledger_accounts','wallets','beneficiaries','split_rules','collection_accounts','salary_payments','split_runs','allocations','ledger_journals','notifications'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('create policy owner_read on public.%I for select to authenticated using (user_id = auth.uid())',t)
   ;
 end loop;
end $$;

create policy owner_read on public.profiles for select to authenticated using(id=auth.uid());
alter table public.profiles enable row level security;
alter table public.ledger_postings enable row level security;
create policy posting_owner_read on public.ledger_postings for select to authenticated
 using(exists(select 1 from public.ledger_journals j where j.id=journal_id and j.user_id=auth.uid()));
alter table public.provider_events enable row level security;
revoke execute on function public.post_journal(uuid,text,text,jsonb) from public,anon,authenticated;
revoke execute on function public.account_balance(uuid) from public,anon,authenticated;
revoke execute on function public.confirm_salary(uuid,text,bigint) from public,anon,authenticated;
revoke execute on function public.execute_salary_split(uuid,uuid,text) from public,anon,authenticated;
revoke execute on function public.complete_transfer(uuid,boolean,text,text) from public,anon,authenticated;
grant execute on function public.post_journal(uuid,text,text,jsonb) to service_role;
grant execute on function public.account_balance(uuid) to service_role;
grant execute on function public.confirm_salary(uuid,text,bigint) to service_role;
grant execute on function public.execute_salary_split(uuid,uuid,text) to service_role;
grant execute on function public.complete_transfer(uuid,boolean,text,text) to service_role;


-- INITIAL ACCOUNT PROFILE MIGRATION AND PRE-EXISTING USER BACKFILL
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

commit;
