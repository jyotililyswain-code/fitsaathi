# TheFitSaathi local backend

Next.js runs on `http://localhost:3000` and serves the API under `/api`. The old Express app is still available as a standalone local backend on `http://localhost:5000`, but Vercel uses the same Express routes through `pages/api/[...path].ts` serverless handlers.

## First-time setup

Create the `fitsaathi` database, copy `.env.example` to `.env`, and set `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `ATTENDANCE_QR_SECRET`.

```powershell
npm install
npm run db:generate
npm run db:migrate
npm run dev:frontend
```

## Health and data

- Health check: `http://localhost:3000/api/health`
- Prisma Studio: `npm run db:studio`
- Development seed UI: `http://localhost:3000/dev/seed`
- PostgreSQL backup: `pg_dump -U postgres -d fitsaathi -F c -f fitsaathi.backup`

Local uploads are compressed to WebP and stored under `server/uploads`. On Vercel, uploads require Vercel Blob and are stored outside the serverless filesystem.
