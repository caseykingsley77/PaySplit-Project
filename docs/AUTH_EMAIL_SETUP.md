# PaySplit: OTP-only signup verification

PaySplit's email/password signup uses a **six-digit email OTP**, not a confirmation link. The authentication screen always shows six code inputs and verifies with:

```ts
await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
```

The signup flow uses `supabase.auth.signUp({ email, password, options: { data } })`. The resend button requests `supabase.auth.resend({ type: 'signup', email })`. Codes are one-time use and are checked by Supabase, not the frontend.

## Required Supabase dashboard configuration

**Updating the React app alone cannot change what Supabase emails.** Configure the actual hosted project's template:

1. Open [Supabase authentication templates](https://supabase.com/dashboard/project/qunakncthxfyujdydzmx/auth/templates).
2. Select **Confirm signup** (not Magic Link). Leave **Confirm email** turned on in Authentication → Sign In / Providers → Email.
3. Set the subject to `{{ .Token }} is your PaySplit verification code`.
4. Replace the template body with [supabase/email-templates/confirm-signup.html](../supabase/email-templates/confirm-signup.html). The critical variable is **`{{ .Token }}`**. Do **not** include `{{ .ConfirmationURL }}` or confirmation buttons/links.
5. Save the template and send a test signup using a fresh email address.

In Supabase's confirmation template, `{{ .Token }}` is the six-digit OTP generated for the signup. The user reads it and enters it in the PaySplit interface. `verifyOtp` returns the session on success.

## Deliverability / SMTP

Supabase's default mail service has restrictions and low sending limits. To register arbitrary customers reliably, enable **Custom SMTP** in Supabase's authentication settings and configure an approved provider (Resend, Postmark, Brevo, Amazon SES, etc.). Verify your sending domain's SPF and DKIM records.

If the OTP does not arrive, inspect Supabase **Auth Logs**, the SMTP provider's message status, spam/promotions folders, and any email rate-limit errors. The client shows a confirmation that sending was *requested*, not proof of delivery.

## Testing

1. Open [PaySplit registration](https://paysplit-project.vercel.app/auth?mode=signup).
2. Create an account with an email address that is not already registered.
3. Check that the email contains **six digits** and **no confirmation link**.
4. Enter each digit (or paste the six-digit code) into PaySplit and select **Verify email**.
5. Confirm that Supabase marks the user email as verified and that PaySplit opens the welcome/setup screen.
6. To test resend, use the **Click to resend** control with normal cooldown/rate limits.

Existing users with previously confirmed emails can sign in normally; they do not need to verify again.

**Security:** Never disable email confirmation merely to get through signup, never log the OTP or store it in the PaySplit database, and never put SMTP passwords or Supabase secret keys in frontend code.

## Supabase references

- [Email templates and `{{ .Token }}`](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Sign-in verification via OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Resend confirmation](https://supabase.com/docs/reference/javascript/auth-resend)
- [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
