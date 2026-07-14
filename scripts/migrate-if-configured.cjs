const { spawnSync } = require("node:child_process");
const path = require("node:path");

if (!process.env.VERCEL) {
  console.log("Not running on Vercel; skipping automatic deployment migrations.");
  process.exit(0);
}

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("DATABASE_URL is required during a Vercel build so database migrations run before deployment.");
  process.exit(1);
}

const prismaCli = require.resolve("prisma/build/index.js");
const schema = path.join("server", "prisma", "schema.prisma");
const result = spawnSync(
  process.execPath,
  [prismaCli, "migrate", "deploy", "--schema", schema],
  { env: process.env, stdio: "inherit" },
);

if (result.error) {
  console.error("Could not start Prisma migration deployment.", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
