# PaySplit: email confirmation setup and troubleshooting

PaySplit uses Supabase Auth for email-password registration. The website supports **confirmation links** (recommended default) and an optional **email verification code**.

## 1. Check the email confirmation settings

In your Supabase project:
1. Go to **Authentication → Sign In / Providers → Email**. Keep **Confirm email** enabled.
2. Go to **Authentication → Email Templates → Confirm sign up**.
3. Ensure the template contains a working confirmation link. For example:

```html
<h2>Confirm your PaySplit email</h2>
<p>Click below to activate your account:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

PaySplit now shows a *click the link* instruction after registration. Once Supabase verifies the confirmation link, the browser is redirected back to the PaySplit app.

If you also want a code in the email, add an OTP token line to that same template:

```html
<p>Or enter this verification code in PaySplit: <strong>{{ .Token }}</strong></p>
```

The confirmation screen has a **My email contains a six-digit code** option. Leave this collapsed when the template sends a link only.

## 2. Configure your redirect URL

In **Authentication → URL Configuration**:

- **Site URL:** `https://paysplit-project.vercel.app`
- **Redirect URLs:** `https://paysplit-project.vercel.app/auth?confirmed=1`

This matches the `emailRedirectTo` parameter used by signup and resend.

## 3. Set up outgoing email

Supabase's built-in SMTP is for basic testing, is restricted to authorized addresses (typically members of your Supabase organization), and has low sending limits. **For signup emails to arbitrary customers, configure a custom SMTP provider.**

In Supabase go to **Project Settings → Authentication → SMTP Settings** (or **Authentication → SMTP Settings**, depending on dashboard version), enable **Custom SMTP**, and supply your email provider's host, port, username, password and verified sender address.

Supported examples include Resend, Postmark, Brevo, SendGrid and Amazon SES. Verify the sending domain with SPF, DKIM and DMARC as directed by your provider. Store SMTP credentials in Supabase's settings, not in the GitHub repository or frontend code.

## 4. Diagnose missing email

1. Open **Supabase → Logs → Auth Logs** around the time of signup or resend.
2. Look for provider or SMTP errors, especially `email_address_not_authorized`, `email_rate_limit_exceeded` and delivery failures.
3. Inspect your SMTP provider's message activity, including rejected/bounced messages.
4. Check the intended inbox's Spam, Promotions, Social and All Mail folders.
5. Avoid repeated resend clicks while under a rate limit. Fix the email provider configuration before trying again.

Supabase accepting an auth request does **not** guarantee final delivery to the inbox. PaySplit now describes successful resend API responses as *requested*, rather than declaring the message delivered.

## 5. Test the complete registration

1. Use a fresh test email address.
2. Register at `https://paysplit-project.vercel.app/auth?mode=signup`.
3. Confirm that the email provider accepted and delivered the email.
4. Click the confirmation link or enter the code if the template includes `{{ .Token }}`.
5. Check that the user becomes email-confirmed in Supabase Authentication → Users.
6. Sign in and verify the PaySplit dashboard loads.

**Do not disable email confirmation to bypass delivery problems.** For a fintech-oriented app, verified addresses, throttling and proper SMTP configuration are important.

### Reference

- Supabase email templates: https://supabase.com/docs/guides/auth/auth-email-templates
- Supabase SMTP setup: https://supabase.com/docs/guides/auth/auth-smtp
- Supabase redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Supabase Auth rate limits: https://supabase.com/docs/guides/auth/rate-limits
