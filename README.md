# FitSaathi

FitSaathi is a fitness marketplace built with Next.js, Express-compatible serverless API routes, Prisma, PostgreSQL, Tailwind CSS, Razorpay, and Vercel Blob. PostgreSQL is the application database. In production, uploaded public images and private encrypted files are stored in Vercel Blob; local disk storage is only a development fallback.

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

- `DATABASE_URL`: PostgreSQL connection string used by Prisma. On Vercel, use your production Postgres URL. The app also falls back to `POSTGRES_PRISMA_URL`, `POSTGRES_URL`, or `POSTGRES_URL_NON_POOLING` when `DATABASE_URL` is not set.
- `JWT_SECRET`: long random access-token signing secret.
- `JWT_REFRESH_SECRET`: separate long random refresh-token signing secret.
- `ATTENDANCE_QR_SECRET`: separate long random HMAC secret for attendance QR codes.
- `NEXT_PUBLIC_API_URL`: optional external API URL. Leave blank on Vercel so the site uses its built-in `/api` routes.
- `FRONTEND_ORIGIN`: frontend origin allowed by Express CORS.
- `UPLOAD_PATH`: local upload directory.
- `PRIVATE_UPLOAD_PATH`: local encrypted private-file directory.
- `BLOB_READ_WRITE_TOKEN` / `BLOB_STORE_ID`: Vercel Blob credentials for production uploads.

Optional external services:

- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`: Razorpay server credentials.
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`: the same Razorpay key ID exposed to checkout.
- `RAZORPAY_WEBHOOK_SECRET`: secret assigned to the Razorpay webhook.
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

Razorpay server routes create and verify payment orders, persist payment state through Prisma, and reject duplicate booking/order consumption. Configure a webhook for `/api/razorpay/webhook` and subscribe to payment, order, and refund events. Use Test Mode credentials for local QA.

## Storage and production

## Vercel deployment

This repo is now designed to deploy as a single Vercel Next.js project:

1. Connect a PostgreSQL database. Set `DATABASE_URL`, or connect Vercel Postgres so `POSTGRES_PRISMA_URL` / `POSTGRES_URL` are injected.
2. Connect a Vercel Blob store and keep `BLOB_READ_WRITE_TOKEN` available to the project.
3. Set `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ATTENDANCE_QR_SECRET`, Razorpay keys, and `NEXT_PUBLIC_SITE_URL`.
4. Do not set `NEXT_PUBLIC_API_URL` unless you intentionally want to call a separate external API.
5. Vercel should use `npm run build`, which runs `prisma generate` before `next build`.

Public uploads are saved as Blob URLs. Sensitive verification/message files are encrypted first and saved in private Blob paths.
