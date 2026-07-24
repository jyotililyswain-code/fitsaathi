import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("public marketplace reads require approved records and active owners", () => {
  const api = source("server/src/app.ts");

  assert.match(
    api,
    /app\.get\("\/api\/products\/:id"[\s\S]*?status: "approved"[\s\S]*?status: \{ in: \["verified", "trusted"\] \}[\s\S]*?accountStatus: "active"/,
  );
  assert.match(
    api,
    /app\.get\("\/api\/sellers\/:id"[\s\S]*?status: \{ in: \["verified", "trusted"\] \}[\s\S]*?accountStatus: "active"/,
  );
  assert.match(api, /ownerId: _ownerId/);
  assert.match(api, /userId: _userId, productId: _productId/);
});

test("marketplace checkout prevents cross-site writes and atomic stock races", () => {
  const route = source("app/api/marketplace/orders/route.ts");

  assert.match(route, /assertSameOrigin\(request\)/);
  assert.match(route, /marketplace-order:\$\{user\.id\}/);
  assert.match(route, /const quantities = new Map<string, number>\(\)/);
  assert.match(route, /product\.updateMany\(\{[\s\S]*stock: \{ gte: item\.quantity \}/);
  assert.match(route, /if \(claim\.count !== 1\) throw new Error\("STOCK_CHANGED"\)/);
  assert.match(route, /removeUploads\(\[screenshotPath\]\)/);
});

test("sensitive mutation and recovery endpoints have abuse controls", () => {
  const server = source("server/src/app.ts");
  const admin = source("app/api/admin/action/route.ts");
  const attendanceToken = source("app/api/attendance/token/route.ts");
  const attendanceScan = source("app/api/attendance/scan/route.ts");

  assert.match(server, /"\/api\/auth\/forgot-password", databaseRateLimit\(5, 10 \* 60_000, "forgot-password"\)/);
  assert.match(server, /"\/api\/contact", databaseRateLimit\(5, 10 \* 60_000, "contact"\)/);
  for (const route of [admin, attendanceToken, attendanceScan]) {
    assert.match(route, /assertSameOrigin\(request\)/);
    assert.match(route, /RequestSecurityError/);
  }
  assert.match(admin, /removeUploads\(product\.images/);
});
