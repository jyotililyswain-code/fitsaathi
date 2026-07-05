export function configureDatabaseUrl() {
  if (process.env.DATABASE_URL) return;
  process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || "";
}
