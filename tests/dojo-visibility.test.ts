import assert from "node:assert/strict";
import test from "node:test";
import { automaticDojoActivation, canManageDojo, dojoModerationData, publicDojo, publicDojoWhere } from "../lib/dojo-visibility";

test("public dojo queries require active and approved status fields", () => {
  const where = publicDojoWhere({ search: "FitSaathi Test", city: "Pune", category: "Karate" });
  assert.equal(where.status, "active");
  assert.equal(where.approved, true);
  assert.ok(where.OR);
  assert.equal(dojoModerationData("active").approved, true);
  assert.equal(dojoModerationData("suspended").approved, false);
  const activation = automaticDojoActivation(new Date("2026-07-12T12:00:00.000Z"));
  assert.deepEqual(activation, { status: "active", approved: true, approvedAt: new Date("2026-07-12T12:00:00.000Z"), verified: false });
});

test("gym searches include records registered with the gym establishment type", () => {
  const where = publicDojoWhere({ search: "gym" });
  assert.ok(Array.isArray(where.OR));
  assert.ok(where.OR.some(condition => "establishmentType" in condition && condition.establishmentType === "GYM"));
});

test("only the owner or an authorized admin can manage a dojo", () => {
  assert.equal(canManageDojo({ id: "owner", role: "dojo" }, "owner"), true);
  assert.equal(canManageDojo({ id: "other", role: "customer" }, "owner"), false);
  assert.equal(canManageDojo({ id: "admin", role: "admin" }, "owner"), true);
});

test("public dojo projection excludes ownership and contact data", () => {
  const output = publicDojo({
    id: "dojo-id",
    name: "FitSaathi Test Dojo",
    description: "Test description",
    category: "Karate",
    address: "Public business address",
    city: "Pune",
    experience: "8 years",
    originalPrice: 1000,
    finalPrice: 1000,
    rating: 0,
    imagePath: "dojo/dojo-id/business-photo/private.webp",
    status: "active",
    approved: true,
    verified: false
  });
  assert.equal(output.imagePath, "/api/dojos/dojo-id/business-photo");
  assert.equal(output.verified, false);
  assert.ok(!("ownerId" in output));
  assert.ok(!("phoneNumber" in output));
  assert.ok(!("certificatePath" in output));
  assert.ok(!JSON.stringify(output).includes("private.webp"));
});
