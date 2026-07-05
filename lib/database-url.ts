import path from "node:path";
import { config as loadEnvFile } from "dotenv";

let localEnv: Record<string, string> | undefined;

function readLocalEnv(name: string) {
  if (process.env.NODE_ENV === "production") return undefined;
  localEnv ||= loadEnvFile({ path: path.join(process.cwd(), ".env") }).parsed || {};
  return localEnv[name];
}

export function configureDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    process.env.DATABASE_URL = url;
    return;
  }

  process.env.DATABASE_URL = [
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    readLocalEnv("DATABASE_URL")
  ].map(value => value?.trim()).find(Boolean) || "";
}
