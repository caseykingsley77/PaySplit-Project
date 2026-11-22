# PaySplit — tools and architecture decisions

## Stack

| Tool | Role | Why |
| --- | --- | --- |
| Next.js 15 + React 19 + TypeScript | Web app + backend API | One deployable app, shared typed validation and UI, convenient deployment to Vercel Hobby |
| Supabase Auth | Real email/password sign-up and session management | Managed identity service with JWT validation on every protected API route; no local fake sign-in |
| Supabase PostgreSQL | Persistent relational data, transactions and immutable ledger journals | Atomic row locks, database constraints, unique idempotency keys, row-level security, proper minor-unit arithmetic |
| Paystack test APIs | Pay-in, bank lookup, dedicated virtual accounts and transfers | Nigeria-oriented payment sandbox; all test credentials remain on the server |
| Dojah | Nigerian NIN/BVN and liveness verification | Hosted verification capability; server-side verification gates any financial disbursement |
| Vercel Hobby | Candidate free hosting target | Deploys Next.js app and API routes from the same repository; actual project/environment setup is still required |
| Vitest | Financial calculation tests | Fast unit tests for determinism, insufficient funds and rounding |
| GitHub Actions | CI | Reproducible tests and production build after each push |
| Figma | UI design reference | The supplied file is access-restricted to the Figma connector. Current UI is a custom responsive implementation, **not** a verified design match. |

## Financial decisions

1. NGN amounts are stored as **integer kobo**. Percentage rules use integer basis points: 10% = 1,000, with rounding half-up to the nearest kobo.
2. The ledger consists of **immutable journal postings**. Positive postings increase account allocation, negative postings decrease it. Every journal must sum to zero; salary, wallet and pending balances are calculated from postings.
3. Incoming Paystack transactions are verified server-side. Duplicated provider references are rejected/ignored by unique constraints and the idempotent confirmation RPC.
4. Split execution locks the user profile and specific salary payment, and its run is unique by salary ID. Rules process by ascending priority and creation order. Fixed values must fit fully; insufficient rules are skipped and subsequent rules are considered.
5. A beneficiary transfer moves a salary allocation to **pending** immediately, not to an external recipient. A provider-confirmed success settles pending to external; definitive failure releases pending back into salary. Indeterminate errors hold funds pending reconciliation.
6. An expected payday is informational. Automation is **event-driven on confirmed salary receipts**, not a blind monthly cron debit.
7. Provider adapters live in `src/lib/providers.ts`; the allocation logic and database ledger are independent of Paystack API schemas.

## Trade-offs / follow-up work

- Dedicated virtual account provisioning depends on Paystack sandbox eligibility; never invent an account number.
- Dojah's product-specific widget and verification response need exact setup in the candidate's Dojah dashboard. The app deliberately keeps users pending until server-side identity **and** liveness verification passes.
- Additional production work: webhook reconciliation polling, outbox/queue for transfer processing, transactional email delivery, scheduled reminder notifications, admin/pay-in console, audit trail for non-financial actions, rate limits, and full integration/contract/E2E tests.
- A ledger-centric backend is more work than a mutable `balance` column but makes money movement traceable and transactionally correct.
- This is an assessment sandbox app and **not a licensed production fintech**.
