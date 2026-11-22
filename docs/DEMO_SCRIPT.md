# Product Demo Walkthrough (3–5 Minutes)

**0:00–0:30 — Product and approach.** Open the live URL and explain the salary-split goal, stack, and test-mode banner.

**0:30–1:00 — Auth and onboarding.** Create or sign in to a real Supabase user. Show verification status and how KYC blocks disbursements until provider-approved.

**1:00–1:45 — Destinations and rules.** Create a wallet and beneficiary (Paystack bank-account lookup), then add fixed and percentage rules. Explain rule priority and original-salary percentage base.

**1:45–2:50 — Pay-in and split.** Complete a sandbox Paystack checkout or send a test deposit to the dedicated collection account. Show the signed webhook receiving a confirmed pay-in and the automatic split. If account provisioning fails, show the provider response and recovery path.

**2:50–3:45 — Accounting and history.** Show available salary, wallet balance, pending payouts, the transaction timeline, and CSV statement. Demonstrate why a webhook replay or duplicate Run Now cannot double-disburse.

**3:45–4:30 — Technical quality.** Walk through the ledger schema, SQL atomic split function, unit tests and CI, API security, and provider adapters.

**4:30–5:00 — Trade-offs.** Summarize provider configuration, deployment considerations and remaining integration work.

Verify each demonstrated flow against the configured sandbox. Show pending payments using their actual provider-confirmed status.
