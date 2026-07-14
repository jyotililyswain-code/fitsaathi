import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("production builds deploy database migrations before compiling the application", () => {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8")) as {
    scripts: Record<string, string>;
  };
  assert.match(packageJson.scripts.build, /^npm run db:migrate:deploy &&/);
  assert.equal(packageJson.scripts["db:migrate:deploy"], "node scripts/migrate-if-configured.cjs");
});

test("the deployment migration guard fails closed on Vercel without DATABASE_URL", () => {
  const source = fs.readFileSync("scripts/migrate-if-configured.cjs", "utf8");
  assert.match(source, /if \(!process\.env\.VERCEL\)/);
  assert.match(source, /skipping automatic deployment migrations/);
  assert.match(source, /process\.exit\(1\)/);
  assert.match(source, /migrate", "deploy"/);
});
