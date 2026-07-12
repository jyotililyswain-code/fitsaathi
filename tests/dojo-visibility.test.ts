import assert from "node:assert/strict";
import test from "node:test";
import { dojoModerationData, publicDojo, publicDojoWhere } from "../lib/dojo-visibility";

test("public dojo queries require both approved status fields", () => {
  const where = publicDojoWhere({ search: "FitSaathi Test", city: "Pune", category: "Karate" });
  assert.equal(where.status, "approved");
  assert.equal(where.approved, true);
  assert.ok(where.OR);
  assert.deepEqual(dojoModerationData("approved"), { status: "approved", approved: true });
  assert.deepEqual(dojoModerationData("rejected"), { status: "rejected", approved: false });
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
    status: "approved",
    approved: true
  });
  assert.equal(output.imagePath, "/api/dojos/dojo-id/business-photo");
  assert.equal(output.verified, true);
  assert.ok(!("ownerId" in output));
  assert.ok(!("phoneNumber" in output));
  assert.ok(!("certificatePath" in output));
  assert.ok(!JSON.stringify(output).includes("private.webp"));
});
