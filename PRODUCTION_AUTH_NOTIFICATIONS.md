# TheFitSaathi production setup: email verification and booking notifications

The code is complete, but hosted email delivery, VAPID secrets, the database migration, and the production domain must be configured before release. TheFitSaathi's canonical production origin is `https://thefitsaathi.com`.

## Architecture audit

- Next.js `15.5.18`, React `18.3.1`, TypeScript strict mode, App Router. A Pages Router catch-all mounts the existing Express API for legacy routes.
- Supabase JavaScript `2.110.0`. Supabase Auth is the password and email-confirmation authority. Prisma/PostgreSQL stores the application profile and role state; it no longer stores password hashes.
- New registrations create `pending_email_verification` profiles. `/auth/verify-email` calls the server, the server calls `verifyOtp({ email, token, type: "email" })`, verifies `email_confirmed_at`, updates the application profile, and only then issues the HttpOnly TheFitSaathi session.
- Coach, dojo/gym, and seller registration remain their existing separate profile flows. Email verification activates the login account; professional approval/listing status remains in the provider-specific table.
- Booking creation is the App Router handler at `/api/bookings/create`; status transitions are `/api/bookings/status`. The old Express mutation is disabled. The booking transaction writes the booking, in-app notification, and push outbox atomically.
- There was no prior manifest, service worker, browser push, or realtime client. `public/sw.js` is the only service worker and does not cache requests or private data.

## Supabase dashboard

### Email provider and mandatory confirmation

1. Open the correct Supabase project.
2. Go to **Authentication > Sign In / Providers > Email**.
3. Keep **Enable Email provider** on.
4. Turn **Confirm email** on. Do not enable automatic email confirmation. The server fails closed if signup returns an already-confirmed session.
5. Keep password sign-in enabled.
6. Set the email OTP/token expiry to the security period you support; 600 seconds is a practical production starting point. Keep the per-address resend interval at 60 seconds or longer.

### URL configuration

In **Authentication > URL Configuration**:

- **Site URL:** `https://thefitsaathi.com`
- Add exact production redirects:
  - `https://thefitsaathi.com/auth/verify-email`
  - `https://thefitsaathi.com/login`
- Add local development redirects:
  - `http://localhost:3000/auth/verify-email`
  - `http://localhost:3000/login`
- If Vercel previews must send auth email, add the preview pattern recommended for your account: `https://*-<team-or-account-slug>.vercel.app/**`. Prefer exact URLs for production.

Set `NEXT_PUBLIC_SITE_URL=https://thefitsaathi.com` in Vercel Production. For local development, use `http://localhost:3000`.

### Confirmation OTP email

Go to **Authentication > Email Templates > Confirm signup**.

- Subject: `Your TheFitSaathi verification code`
- Body:

```html
<h2>Welcome to TheFitSaathi</h2>
<p>Your email verification code is:</p>
<p style="font-size:32px;font-weight:700;letter-spacing:8px">{{ .Token }}</p>
<p>Enter this six-digit code on the TheFitSaathi verification page.</p>
<p>If you did not request this code, you can ignore this email.</p>
```

`{{ .Token }}` is the supported Supabase confirmation-template variable. Do not put the OTP into a URL. Save the template and send a real test signup before release.

### Custom SMTP

The Supabase test mailer is not suitable for production and currently permits only a small number of messages and team-authorized recipients. In **Authentication > Emails > SMTP Settings**:

1. Choose a transactional provider such as Resend, Postmark, SES, SendGrid, Brevo, or another SMTP service.
2. Verify an authentication sending domain, preferably a dedicated subdomain such as `auth.<your-domain>`.
3. Publish the provider's SPF and DKIM records; add a suitable DMARC policy.
4. Enable custom SMTP and enter the provider-supplied host, port, username, and password.
5. Sender name: `TheFitSaathi`.
6. Sender email: a verified address such as `no-reply@auth.<your-domain>`.
7. Disable click tracking for authentication mail if the provider rewrites links.
8. Never put the SMTP password in this repository or a `NEXT_PUBLIC_*` variable. Supabase stores it in the Auth SMTP configuration.

### Authentication rate limits

Open **Authentication > Rate Limits** after custom SMTP is saved.

- Keep the same-recipient signup/resend interval at 60 seconds or longer.
- Set project-wide email capacity to a value approved by the SMTP provider. Supabase starts custom SMTP projects conservatively (commonly 30 messages/hour); raise it only after the provider has approved the expected volume.
- Keep verification limits enabled. The application additionally limits signup to 5 per IP/10 minutes, resend to 3 per IP/10 minutes, and OTP verification to 10 per IP/10 minutes using PostgreSQL buckets.
- Review CAPTCHA under Auth attack protection before a public campaign.

### Database and Realtime

1. Back up the database or create a restore point.
2. Review and apply `server/prisma/migrations/20260714160000_email_verification_booking_notifications/migration.sql` using the normal deployment (`npm run db:migrate`) or the Supabase SQL editor.
3. The migration aborts if case-insensitive duplicate user emails exist; resolve those records deliberately rather than merging them automatically.
4. It links existing app users to `auth.users` by normalized email. Confirmed Supabase users remain verified; unconfirmed or unmatched users become `pending_email_verification`. Provider approval fields are not overwritten.
5. In **Database > Publications**, confirm that `notifications` is included in `supabase_realtime`. The migration adds it idempotently.
6. In **Database > Tables**, verify RLS is on for `users`, `notifications`, `push_subscriptions`, `notification_outbox`, `coaches`, and `dojos`. Do not add broad `using (true)` policies to the private tables.

## VAPID and browser push

The project uses `web-push` `3.6.7`. Generate one key pair locally:

```bash
npx web-push generate-vapid-keys --json
```

Map the output as follows:

- `publicKey` -> `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (public, browser-visible)
- `privateKey` -> `VAPID_PRIVATE_KEY` (server-only)
- Set `VAPID_SUBJECT` to a monitored contact such as `mailto:security@<your-domain>` or an approved HTTPS origin.

Never log or commit the private key. Keep the same key pair across deployments; rotating it invalidates existing browser subscriptions and users must enable them again.

## Vercel environment variables

Open **Project > Settings > Environment Variables**. Add values to Production and, where required, Preview. Redeploy after changes.

| Variable | Exposure | Source | Local use |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public | Exact production origin | `http://localhost:3000` locally |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase **Project Settings > API** | Required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase publishable/anon key | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Supabase secret/service-role key | Required for safe Auth cleanup; never expose |
| `DATABASE_URL` | Server-only | Supabase pooled runtime connection | Required for runtime |
| `DIRECT_URL` | Server-only | Supabase direct or session-mode connection | Recommended for Prisma migrations; falls back to `POSTGRES_URL_NON_POOLING`, then `DATABASE_URL` |
| `JWT_SECRET` | Server-only | Existing 32+ byte random secret | Required |
| `JWT_REFRESH_SECRET` | Server-only | Different random secret | Required |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public | VAPID `publicKey` | Required for push testing |
| `VAPID_PRIVATE_KEY` | Server-only | Matching VAPID `privateKey` | Required for push delivery |
| `VAPID_SUBJECT` | Server-only | Monitored `mailto:` or HTTPS origin | Required for push delivery |
| `CRON_SECRET` | Server-only | Random 16+ character value | Optional locally; required on Vercel |

Do not put SMTP credentials in Vercel; Supabase Auth sends the OTP and stores SMTP configuration. Apply public variables to Preview only if previews are trusted and their URLs are in the Supabase redirect allow list. Keep service-role, database, VAPID private key, JWT secrets, and cron secret server-only.

After saving variables:

1. Go to **Deployments**, select the intended deployment, and choose **Redeploy**.
2. Confirm the build runs Prisma migrations before `next build`.
3. Confirm the production domain has a valid HTTPS certificate.
4. Open **Settings > Cron Jobs** and confirm `/api/cron/notifications` is scheduled every five minutes.
5. Check Function logs for safe event categories only. Do not paste or search logs using OTPs, passwords, full push endpoints, push keys, document IDs, or private credentials.

## Manual end-to-end release test

Use inboxes you control and synthetic profile data.

1. Register customer, coach, dojo owner, gym owner, and seller intents.
2. Confirm no TheFitSaathi session cookie is issued by signup and protected pages redirect to login.
3. Confirm the email contains a six-digit code; a wrong code and expired code fail; the correct code verifies and signs in.
4. Confirm resend stays disabled for 60 seconds and server rate limiting rejects rapid bypass attempts.
5. Finish each provider profile. Confirm coach approval remains pending where applicable and dojo/gym behavior follows the existing publication policy.
6. In a supported HTTPS browser, open the notification card. Verify no permission prompt appears until **Enable booking notifications** is clicked.
7. Test granted, denied, and unsupported states. Denial must not block dashboard use.
8. Book one coach, dojo, and gym from the customer account. Confirm only the derived owner receives the in-app row, unread increment, realtime refresh, toast, and push.
9. Retry the same booking request/idempotency key and confirm no second booking or notification is created.
10. Accept, reject, reschedule, cancel (both actors), and complete bookings. Confirm customer/provider recipients match the event and no duplicate event key is created.
11. Click a push while a TheFitSaathi tab is open and while closed. Confirm the safe dashboard route opens and unauthorized accounts cannot access the booking.
12. Log out and confirm the current device subscription is removed; sign in as another user and enable notifications again.
13. Test multiple devices, an expired subscription (HTTP 404/410), and a temporary push failure. The booking and in-app notification must survive every push outcome.
14. Delete all temporary records and Auth users after verification.

## Rollback notes

- Roll back application code through a Vercel deployment rollback first.
- The migration intentionally removes legacy application password hashes. They cannot and should not be restored; password authentication remains in Supabase Auth.
- Before dropping notification columns or tables, export notification/outbox/subscription records needed for incident analysis.
- If realtime must be disabled, remove only `notifications` from `supabase_realtime` after confirming no other feature depends on it.
- Drop `notification_outbox` before removing its notification/user foreign keys. Remove RLS policies and grants before removing `authUserId`, verification, subscription-state, notification metadata, or idempotency columns.
- Never roll back by setting all users to verified. Recompute verified state from `auth.users.email_confirmed_at`.
