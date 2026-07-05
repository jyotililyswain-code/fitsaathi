import assert from "node:assert/strict";
import test from "node:test";
import { dashboardPathForRole, resolveStoredRole } from "../lib/roles";

test("specialized userRole overrides a stale customer role", () => {
  assert.equal(resolveStoredRole({ role: "customer", userRole: "coach" }), "coach");
  assert.equal(resolveStoredRole({ role: "customer", userRole: "seller" }), "seller");
});

test("dashboard paths match provider roles", () => {
  assert.equal(dashboardPathForRole("coach"), "/coach-dashboard");
  assert.equal(dashboardPathForRole("seller"), "/seller-dashboard");
});
