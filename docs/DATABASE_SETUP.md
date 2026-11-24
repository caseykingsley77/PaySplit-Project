# Fix: Supabase database has not been initialized

## Confirmed production fault

The PaySplit dashboard returned HTTP 500 because the connected Supabase project has no PaySplit application tables. The backend returned **PGRST205** for public.profiles, public.wallets, split_rules and other tables, and **PGRST202** for the account_balance function.

This is not a browser cache problem.

## One-time fix for the fresh PaySplit database

1. Open the Supabase project matching the NEXT_PUBLIC_SUPABASE_URL configured in Vercel → PaySplit → Settings → Environment Variables.
2. Open **SQL Editor** in that same Supabase project.
3. Open [supabase/setup.sql](../supabase/setup.sql), copy the entire file, paste it into SQL Editor and select **Run**.
4. The script creates PaySplit's tables and functions, installs the account bootstrap trigger, and backfills Auth users who registered before database setup.
5. Verify [PaySplit database health](https://paysplit-project.vercel.app/api/health). Every readiness flag should be true.
6. Return to [PaySplit dashboard](https://paysplit-project.vercel.app/dashboard), sign in and select **Retry** if needed.

**Security:** This creates zero-balance ledger accounts; it does not mint money, bypass KYC or initiate real transfers.

**Important:** setup.sql is for a fresh project. It deliberately refuses to run if public.profiles already exists. For an existing database, only apply reviewed migrations in supabase/migrations. Do not delete financial tables to rerun setup.

## If the health check still fails

- If every table is missing, make sure the Vercel Supabase URL points to the same Supabase project in which you executed SQL.
- If only profile_migration is false, run supabase/migrations/20261125_profile_setup.sql.
- If only account_balance is false, inspect the account_balance function in supabase/schema.sql.
- If SQL fails, check the SQL Editor error. Do not rerun partial commands or drop tables without investigating.

## Users who signed up before schema setup

These users exist in Supabase Auth but may not have PaySplit profile or ledger rows because the bootstrap trigger was missing. setup.sql includes an idempotent backfill to create missing records without modifying existing balances.

## Diagnostics

GET /api/health returns availability flags only, not user data or credentials. Sensitive query errors remain in Vercel server logs.
