# TheFitSaathi

Production deployment instructions for mandatory email verification and booking notifications are in [PRODUCTION_AUTH_NOTIFICATIONS.md](./PRODUCTION_AUTH_NOTIFICATIONS.md).

TheFitSaathi is a fitness marketplace built with Next.js, Express-compatible serverless API routes, Prisma, Supabase PostgreSQL, Tailwind CSS, and Vercel Blob. Account and provider registration, identity verification, and coach or dojo booking are free, with no platform or hidden charges. Supabase PostgreSQL is the production application database. In production, uploaded public images and private encrypted files are stored in Vercel Blob; local disk storage is only a development fallback.

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

- `NEXT_PUBLIC_SITE_URL`: set to the canonical production origin `https://thefitsaathi.com`.
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

## Free services and marketplace purchases

TheFitSaathi does not charge for account registration, coach registration, dojo or gym registration, seller registration, identity verification, or coach and dojo booking. These flows do not require a wallet recharge, UPI transfer, transaction ID, payment screenshot, platform fee, or hidden charge.

Marketplace product purchases remain separate. Before a shop order is placed, the customer must see the product total, delivery total, and any other mandatory order amount. Shop order payment, receipt, and refund records must never be used to gate or activate the free registration, verification, or booking flows.

## Supabase database

Run the Prisma migrations against your Supabase PostgreSQL database:

```powershell
npm run db:migrate
```

The Prisma migrations create the app schema, map physical table names to Supabase-friendly names, and install Row Level Security policies. In particular, direct Supabase clients can select only active public columns from `dojos`; verification-document records remain inaccessible to `anon` and `authenticated` roles.

Supabase Auth is supported for new signups and password reset when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set. The browser client uses Supabase's default persistent storage with automatic token refresh and URL-session detection. Use the same two environment values for the frontend and backend, and configure the deployed `NEXT_PUBLIC_SITE_URL` as an allowed Site URL/Redirect URL in Supabase Auth.

Application sessions are also protected by HttpOnly cookies: a short-lived access cookie and a 30-day persistent refresh cookie. On startup the app restores the Supabase browser session when configured, checks `/auth/me`, and automatically uses `/auth/refresh` before deciding that a user is signed out. Cookies and Supabase storage are cleared only by manual logout or when the provider/session is invalid.

## Storage and production

## Vercel deployment

This repo is now designed to deploy as a single Vercel Next.js project:

1. Create a Supabase project and copy its PostgreSQL connection string into Vercel as `DATABASE_URL`.
2. Connect a Vercel Blob store and keep `BLOB_READ_WRITE_TOKEN` available to the project.
3. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ATTENDANCE_QR_SECRET`, and `NEXT_PUBLIC_SITE_URL`.
4. Do not set `NEXT_PUBLIC_API_URL` unless you intentionally want to call a separate external API.
5. Vercel should use `npm run build`, which deploys pending Prisma migrations, regenerates the client, and then runs `next build`. Set `DIRECT_URL` (or `POSTGRES_URL_NON_POOLING`) for migrations when `DATABASE_URL` uses a transaction pooler.

Provider registration uploads use Vercel Blob's authenticated client-upload flow. The browser validates and compresses one file at a time, requests a short-lived upload token from `/api/provider-uploads`, uploads directly to the private Blob store, and then submits only storage path strings to `/api/coaches` or `/api/dojos`. Image bytes and Base64 data never pass through those Vercel registration functions. The Blob read/write token remains server-only.

Local development uses the same path-only registration contract with a one-file-at-a-time fallback under `PRIVATE_UPLOAD_PATH/provider-registration`; that directory is never exposed by the static `/uploads` route. Public coach and dojo photos are streamed through profile-media API endpoints. Certificates and Aadhaar files are served only through authenticated, owner/admin-checked, `no-store` document endpoints, and raw private paths are excluded from public provider responses.

For Vercel deployments, connect a private Blob store and set `BLOB_READ_WRITE_TOKEN` (plus `BLOB_STORE_ID` when the integration supplies it). No Supabase Storage bucket or storage-policy migration is used by this flow. Keep `ENABLE_AADHAAR_VERIFICATION` and `NEXT_PUBLIC_ENABLE_AADHAAR_VERIFICATION` equal so the dojo form and server validation agree.
