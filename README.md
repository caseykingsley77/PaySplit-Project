# PaySplit — Salary Automation

A Next.js full-stack fintech sandbox application. Users define how confirmed incoming salary should be allocated between savings wallets and external beneficiaries using prioritized fixed or percentage-based rules. The app keeps an auditable double-entry ledger and holds outgoing transfers pending until provider confirmation.

> **Development status:** The application passes automated unit tests and a production build. Public hosting is configured; end-to-end provider validation remains pending. This project uses payment and identity-verification sandboxes; do not use real funds or sensitive identity documents.

## Features currently implemented

- Supabase Auth email/password signup, sign-in and token-validated backend routes.
- Dashboard, wallets with savings targets, beneficiaries with Paystack bank-account lookup, rules, profile and transaction history.
- Paystack *test mode* collection account provisioning, hosted test salary checkout, signed pay-in webhook and beneficiary-transfer initiation.
- Immutable balanced ledger, integer-kobo amounts, per-salary exactly-once split initiation, deterministic rule priority, skip-on-insufficient-funds and provider-confirmed settlement/reversal.
- KYC pending state and server-side provider verification adapter; no disbursement without explicit approved identity and liveness.
- CSV ledger statement export and financial allocation unit tests.

## Local setup

1. Install Node.js 22 or later, and create a free Supabase project.
2. Run the SQL in [supabase/schema.sql](supabase/schema.sql) using Supabase SQL Editor. **Do this on a new project** — the schema creates tables/functions and a trigger.
3. Run the additional schema migration in [supabase/migrations/20261125_profile_setup.sql](supabase/migrations/20261125_profile_setup.sql) for employer, salary-estimate, phone and notification preferences. This migration is safe to rerun.
4. Copy `.env.example` to `.env.local`; fill in the Supabase URL, public key and server-only service role key.
5. Create Paystack **test** credentials, and put `sk_test_...` in `PAYSTACK_SECRET_KEY`. Register your public `https://YOUR_DOMAIN/api/webhooks/paystack` webhook in Paystack test mode. The webhook endpoint uses HMAC-SHA512 to reject unsigned payloads.
6. Create a Dojah sandbox flow with Nigerian identity and liveness checks. Configure the app, widget and server-side provider verification endpoint for your sandbox product. **See KYC limitation below.**
7. Set `NEXT_PUBLIC_SITE_URL` to your public origin (use `http://localhost:3000` during local development; a local tunnel is needed to receive provider webhooks).
8. Run:

```bash
npm install
npm run dev
npm test
npm run build
```

Open http://localhost:3000. Sign up and verify the email as configured in Supabase Authentication settings.

## Deployment

1. Import this GitHub repository into Vercel Hobby.
2. Set environment variables listed in `.env.example` in Vercel Project Settings; **never** expose the Supabase service-role or Paystack secret keys through `NEXT_PUBLIC_` variables.
3. Set `NEXT_PUBLIC_SITE_URL` to the deployed origin. Add it to Supabase Auth Site URL / redirect allowlist.
4. Register the deployed Paystack webhook URL in the Paystack *test* dashboard.
5. Configure/test your Dojah widget, approved verification endpoint and domain. Complete a full sandbox onboarding and payment round-trip before recording a demo.
6. Check GitHub Actions CI and the deployed app logs. Sandbox provisioning may depend on Paystack account eligibility.

**Public website:** [paysplit-project.vercel.app](https://paysplit-project.vercel.app). The deployed frontend is accessible, but account creation and financial operations require the Supabase project and provider sandbox environment variables. A separate [read-only design preview](https://paysplit-project.vercel.app/preview) displays illustrative sample data and disables all mutations.

## System boundaries

- **Frontend:** `src/app/page.tsx`, `src/app/auth/page.tsx`, `src/app/onboarding/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/admin/page.tsx`, `src/app/paysplit.css`
- **Authenticated API:** `src/app/api/*`; bearer tokens validated server-side via Supabase Auth. Administrator endpoints require verified admin role or an explicit `ADMIN_EMAILS` allowlist, and are read-only.
- **Provider adapters:** `src/lib/paystack.ts`, `src/lib/providers.ts`; no secret keys in browser code.
- **Financial core:** `supabase/schema.sql` and `src/lib/allocations.ts`. The database functions perform money movement atomically.
- **Paystack webhook:** `src/app/api/webhooks/paystack/route.ts` verifies signature and confirms the transaction against Paystack's API before recording funds.
- **KYC:** `src/app/api/kyc/*` requires server-side confirmation of *both* identity and liveness before approving. The onboarding UI launches a secure hosted provider session; raw identification numbers are not stored in the frontend.
- **User experience:** Modal login/registration/email confirmation, progressive verification, financial checklist, dashboard analytics, wallet and beneficiary destinations, searchable transaction history, rules and profile settings.

### Allocation rules

- Every eligible salary is split once, whether initiated automatically from a confirmed pay-in or manually.
- Percentages are stored in **basis points** of the original salary amount (10% = 1000), not a dwindling remainder.
- Rules run in priority order (1 highest), then creation order. Rules that exceed remaining funds are skipped entirely. Unallocated salary remains in salary balance.
- Beneficiary payouts reserve funds pending final provider confirmation. A provider timeout must never be treated as a definitive failure.

## Known limitations and required follow-up

1. **Dojah:** Set the hosted Dojah widget URL as `DOJAH_WIDGET_URL` and the product-specific verification-status endpoint as `DOJAH_VERIFICATION_STATUS_URL`, using `{reference}` placeholder (allowed host: `api.dojah.io`). The response parser currently requires `status: approved`, `identity_verified: true`, and `liveness_verified: true`. This mapping MUST be validated against the specific subscribed Dojah widget/product before the KYC path can approve users. The hosted widget launch URL is wired to the KYC screen; the Dojah response mapping and completion flow still require provider-specific validation.
2. **Paystack:** Dedicated virtual account creation is eligibility-dependent, sandbox transfer balances vary, and asynchronous transfer statuses must be reconciled when webhook delivery is missed. Add a provider reconciliation job or outbox worker to recover from delayed or missed webhook deliveries.
3. **Operational:** Email delivery preferences are saved but outbound notifications, large-data pagination, advanced audit logs, rate limiting, broader integration tests and full accessibility review remain pending. The administrator console is read-only.
4. **Release:** Public frontend hosting is configured. The full provider-connected walkthrough recording is still pending.

See [tool decisions](docs/TOOL_CHOICES.md) and the [demo guide](docs/DEMO_SCRIPT.md).
