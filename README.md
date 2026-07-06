# FitSaathi

FitSaathi is a fitness marketplace built with Next.js, Express-compatible serverless API routes, Prisma, Supabase PostgreSQL, Tailwind CSS, manual UPI payments, and Vercel Blob. Supabase PostgreSQL is the production application database. In production, uploaded public images and private encrypted files are stored in Vercel Blob; local disk storage is only a development fallback.

## Run locally

```powershell
npm install
npm run db:generate
npm run db:migrate
npm run dev:frontend
```

The frontend and API both run at `http://localhost:3000`; the API is available under `http://localhost:3000/api`. Confirm the API and database with `http://localhost:3000/api/health`.

You can still run the standalone Express backend for local debugging with `npm run dev:backend`, but it is no longer required for the website to work.

## Environment

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL`: Supabase PostgreSQL connection string used by Prisma. On Vercel, use the Supabase pooled connection string. The app also falls back to `POSTGRES_PRISMA_URL`, `POSTGRES_URL`, or `POSTGRES_URL_NON_POOLING` when `DATABASE_URL` is not set.
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL used by the browser/server Supabase client.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key used by Supabase Auth/client access.
- `JWT_SECRET`: long random access-token signing secret.
- `JWT_REFRESH_SECRET`: separate long random refresh-token signing secret.
- `ATTENDANCE_QR_SECRET`: separate long random HMAC secret for attendance QR codes.
- `NEXT_PUBLIC_API_URL`: optional external API URL. Leave blank on Vercel so the site uses its built-in `/api` routes.
- `FRONTEND_ORIGIN`: frontend origin allowed by Express CORS.
- `UPLOAD_PATH`: local upload directory.
- `PRIVATE_UPLOAD_PATH`: local encrypted private-file directory.
- `BLOB_READ_WRITE_TOKEN` / `BLOB_STORE_ID`: Vercel Blob credentials for production uploads.

Optional external services:

- `NEXT_PUBLIC_SITE_URL`: canonical production site URL.
- `NEXT_PUBLIC_GA_ID`: optional Google Analytics measurement ID.

## Database commands

```powershell
npm run db:generate
npm run db:migrate
npm run db:status
npm run db:studio
```

Use `npm run db:migrate:dev -- --name descriptive_name` when creating a schema migration during development. Use `npm run db:migrate` to apply committed migrations.

## Verification

```powershell
npm run lint
npm test
npm run test:db-models
# with npm run dev:frontend active:
npm run test:local-api
npm run build
```

The integration suites cover every Prisma model plus authentication, provider registration and approval, bookings, attendance, marketplace CRUD, cart, orders, seller/admin dashboards, uploads, and role enforcement.

## Payments

Payments use manual PhonePe / UPI transfer to `7065223868-2@ibl`. Customers submit a unique UPI transaction/reference ID and can attach a screenshot. Payments remain `pending_verification`; only an administrator can mark them paid or rejected. A verified booking/order becomes `confirmed`. Razorpay credentials and webhooks are not required.

## Supabase database

Run the Prisma migrations against your Supabase PostgreSQL database:

```powershell
npm run db:migrate
```

The Prisma migrations create the app schema and map the physical table names to Supabase-friendly names such as `users`, `coaches`, `bookings`, `orders`, `payments`, `seller_accounts`, and `refresh_tokens`. After that, run `supabase/migrations/20260705161000_fitsaathi_rls.sql` in the Supabase SQL editor to enable Row Level Security policies for direct Supabase client access.

Supabase Auth is supported for new signups and password reset when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set. Existing custom JWT cookies remain in place so the current login UI and protected routes keep working.

## Storage and production

## Vercel deployment

This repo is now designed to deploy as a single Vercel Next.js project:

1. Create a Supabase project and copy its PostgreSQL connection string into Vercel as `DATABASE_URL`.
2. Connect a Vercel Blob store and keep `BLOB_READ_WRITE_TOKEN` available to the project.
3. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ATTENDANCE_QR_SECRET`, and `NEXT_PUBLIC_SITE_URL`.
4. Do not set `NEXT_PUBLIC_API_URL` unless you intentionally want to call a separate external API.
5. Vercel should use `npm run build`, which runs `prisma generate` before `next build`.

Public uploads are saved as Blob URLs. Sensitive verification/message files are encrypted first and saved in private Blob paths.
