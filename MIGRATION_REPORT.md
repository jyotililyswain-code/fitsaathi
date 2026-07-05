# PostgreSQL source-of-truth migration report

Date: 2026-07-03

## Result

PostgreSQL through Prisma is the only application database. The final source audit returns no matches for the legacy database SDK, database client operations, or initialization calls in `app`, `components`, `lib`, `server`, `tests`, environment files, or `package.json`.

Remaining legacy database dependencies: **none**. Authentication is now local JWT authentication backed by the `User` and `RefreshToken` tables. Uploads use local server storage. Push notifications are not implemented.

## Files modified

- Database/backend: `server/prisma/schema.prisma`, all three committed migrations through `20260703092422_dojo_registration_fields`, `server/src/index.ts`, `server/src/auth.ts`, and `server/src/uploads.ts`.
- Shared application code: `lib/prisma.ts`, `lib/server-auth.ts`, `lib/local-api.ts`, `lib/auth-client.ts`, `lib/data.ts`, `lib/hooks.ts`, `lib/cart.ts`, and `lib/policies.ts`.
- Next API routes: `app/api/admin/action/route.ts`, both attendance routes, both booking routes, `app/api/coach/bookings/route.ts`, `app/api/marketplace/orders/route.ts`, and the Razorpay order/failure/verify/webhook routes.
- Authentication/UI: `components/AuthGuard.tsx`, `components/Header.tsx`, `components/ScrollImageReel.tsx`, `app/login/page.tsx`, `app/signup/page.tsx`, `app/forgot-password/page.tsx`, and `app/globals.css`.
- Provider/customer flows: coach and dojo registration, detail, listing, dashboard, booking, attendance, contact, customer dashboard, orders, checkout, seller registration/detail/dashboard, development seed, setup, home, and super-admin pages.
- Tests/config/docs: `tests/local-api.integration.test.cjs`, `tests/postgres-flows.integration.test.cjs`, `tests/prisma-models.integration.test.cjs`, `.env`, `.env.example`, `.env.local`, `package.json`, `package-lock.json`, `README.md`, and `LOCAL_BACKEND.md`.
- Deleted: all `lib/firebase*`, `lib/firestore*`, `lib/provider-uploads.ts`, `lib/provider-submission.ts`, `lib/marketplace-uploads.ts`, `lib/demo-seed.ts`, `.firebaserc`, `firebase.json`, `firestore.rules`, `firestore.indexes.json`, and `storage.rules`.

## Former legacy database usage inventory

The migration found direct or supporting legacy usage in these files before conversion:

- API routes: `app/api/admin/action/route.ts`, `app/api/attendance/scan/route.ts`, `app/api/attendance/token/route.ts`, `app/api/bookings/create/route.ts`, `app/api/bookings/status/route.ts`, `app/api/coach/bookings/route.ts`, `app/api/marketplace/orders/route.ts`, and all Razorpay order/failure/verify/webhook handlers.
- Pages: attendance, coach/dojo registration and dashboards, booking, checkout, contact, customer dashboard, development seed, coach/dojo/seller details and listings, forgot password, login, signup, orders, seller registration/dashboard, setup, and super-admin dashboard.
- Components: `components/AuthGuard.tsx`, `components/Header.tsx`.
- Helpers: `lib/data.ts`, `lib/hooks.ts`, `lib/cart.ts`, `lib/demo-seed.ts`, `lib/firebase.ts`, `lib/firebase-actions.ts`, `lib/firebase-admin.ts`, `lib/firebase-errors.ts`, `lib/firebase-storage-errors.ts`, `lib/firestore-rest.ts`, `lib/firestore-write.ts`, `lib/marketplace-uploads.ts`, `lib/provider-submission.ts`, and `lib/provider-uploads.ts`.
- Configuration: `.env`, `.env.example`, `.env.local`, `.firebaserc`, `firebase.json`, `firestore.indexes.json`, `firestore.rules`, `storage.rules`, `package.json`, `README.md`, and `LOCAL_BACKEND.md`.

## Prisma additions

The schema now includes PostgreSQL models for `Coach`, `Dojo`, `ProviderVerification`, `Booking`, `Attendance`, `ProviderReview`, `ChatRequest`, `ContactMessage`, `PlatformSettings`, and `Report`, plus expanded relations and fields on users, sellers, products, orders, payments, notifications, and carts.

Migration `20260703092422_dojo_registration_fields` was generated and applied after the source-of-truth migration. Prisma reports all three committed migrations applied and the schema up to date.

## Code removed

- Browser and Admin SDK initialization.
- Database SDK reads, writes, updates, deletes, listeners, REST fallbacks, and duplicate write helpers.
- Cloud storage upload adapters and database deployment rules/indexes.
- Public and server credential environment keys for the removed service.
- `firebase`, `firebase-admin`, and `firebase-tools` packages plus the rules deployment script (561 transitive packages removed).

## Code added or converted

- Shared Prisma singleton and server JWT authorization for Next route handlers.
- Express CRUD for coaches, dojos, sellers, products, orders, bookings, carts, notifications, dashboards, platform settings, contact messages, and chat requests.
- Prisma-only Next handlers for payment lifecycle, booking creation/status, attendance, marketplace checkout, and admin actions.
- Local access/refresh sessions with hashed refresh tokens, revocation, role enforcement, and policy acceptance persistence.
- Local multipart image processing and deletion for seller, product, coach, dojo, and verification files.
- Public API response filtering so phone numbers, verification paths, bank details, provider payouts, and seller cost prices are not exposed.
- Idempotent PostgreSQL development seed.
- Full model lifecycle test plus cross-server integration coverage.

## Verified features

- Authentication: registration, login, refresh, logout, account checks, role changes, and policy acceptance.
- Coach and dojo: create, read, update, approval, dashboard booking access, and delete with file cleanup.
- Booking and attendance: paid booking creation, provider acceptance/completion, QR generation, provider scan, class-window validation, and replay rejection.
- Marketplace: seller registration/verification, product CRUD/moderation, cart CRUD, order creation, inventory decrement, seller order management, and admin snapshot/settings.
- Customer, coach, dojo, seller, and super-admin dashboard data comes from PostgreSQL.
- Contact messages, chat requests, notifications, uploads, and all 23 Prisma models.

## Verification evidence

- `npm run db:generate`: passed.
- `prisma migrate status`: database schema up to date.
- `npm run lint`: passed with no warnings or errors.
- `npm test`: 9/9 passed.
- `npm run test:db-models`: every Prisma model CRUD lifecycle passed.
- `npm run test:local-api`: both cross-server integration suites passed.
- `npm run build`: production build passed; all 60 static/dynamic routes generated.
- `npm run dev`: frontend listening on 3000 and backend on 5000.
- Browser smoke test: home and the PostgreSQL-backed Coaches page render correctly; the Owner popover displays `priyanshuswain` and closes with Escape. Earlier flow checks also covered coach/dojo listings, marketplace, signup, login, attendance, protected dashboards, and logout.

## Remaining manual work

1. Razorpay: obtain Test Mode keys from Razorpay Dashboard → Account & Settings → API Keys. Paste the key ID into `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID`, the secret into `RAZORPAY_KEY_SECRET`, and configure a webhook secret in `RAZORPAY_WEBHOOK_SECRET`. Payment code cannot contact Razorpay until these external credentials are supplied.
2. Historical cloud data: no cloud export or service credentials were supplied, so existing remote records—if any—were not imported. Export them before deleting the old cloud project, then write/run a one-time importer into the new Prisma tables.
3. Password recovery: the local endpoint deliberately returns a non-enumerating response, but outbound reset email is not configured. Add an email provider and expiring reset-token model before production.
4. Production private storage: move Aadhaar and verification files from local disk to access-controlled object storage.
5. Dependency maintenance: the current production audit flags advisories in the Next.js 14 dependency tree. The automatic remediation is a breaking Next.js 16 upgrade, so it should be handled as a separate framework-upgrade task with a full regression pass.
