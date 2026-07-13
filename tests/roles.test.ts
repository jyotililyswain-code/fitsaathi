import assert from "node:assert/strict";
import test from "node:test";
import { dashboardPathForRole, resolveStoredRole } from "../lib/roles";

test("specialized userRole overrides a stale customer role", () => {
  assert.equal(resolveStoredRole({ role: "customer", userRole: "coach" }), "coach");
  assert.equal(resolveStoredRole({ role: "customer", userRole: "seller" }), "seller");
});

test("dashboard paths match provider roles", () => {
  const paths = new Map([
    ["customer", "/dashboard"],
    ["coach", "/coach-dashboard"],
    ["dojo", "/dojo-dashboard"],
    ["seller", "/seller-dashboard"],
    ["admin", "/super-admin-dashboard"],
    ["super_admin", "/super-admin-dashboard"],
    ["moderator", "/super-admin-dashboard"],
    ["support_admin", "/super-admin-dashboard"],
    ["unknown", "/dashboard"],
  ]);

  for (const [role, path] of paths) {
    assert.equal(dashboardPathForRole(role), path, role);
  }
});
