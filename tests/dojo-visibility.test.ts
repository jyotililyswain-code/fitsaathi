import assert from "node:assert/strict";
import test from "node:test";
import { automaticDojoActivation, canManageDojo, dojoModerationData, PUBLIC_DOJO_ORDER_BY, publicDojo, publicDojoWhere } from "../lib/dojo-visibility";

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

test("public dojo discovery orders verified listings before newest unverified listings", () => {
  assert.deepEqual(PUBLIC_DOJO_ORDER_BY, [
    { verified: "desc" },
    { createdAt: "desc" },
    { id: "asc" },
  ]);
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
    state: "Maharashtra",
    pincode: "411001",
    experience: "8 years",
    originalPrice: 1000,
    finalPrice: 1000,
    rating: 0,
    imagePath: "dojo/dojo-id/business-photo/private.webp",
    imageFit: "contain",
    imagePosition: "center",
    status: "active",
    approved: true,
    verified: false
  });
  assert.equal(output.imagePath, "/api/dojos/dojo-id/business-photo");
  assert.equal(output.imageFit, "contain");
  assert.equal(output.imagePosition, "center");
  assert.equal(output.verified, false);
  assert.equal(output.address, "Public business address");
  assert.equal(output.city, "Pune");
  assert.equal(output.state, "Maharashtra");
  assert.equal(output.pincode, "411001");
  assert.ok(!("ownerId" in output));
  assert.ok(!("phoneNumber" in output));
  assert.ok(!("certificatePath" in output));
  assert.ok(!JSON.stringify(output).includes("private.webp"));
});

test("legacy full dojo image URLs remain usable without duplicate URL prefixes", () => {
  const output = publicDojo({
    id: "legacy-dojo",
    name: "Legacy Dojo",
    description: null,
    category: "Karate",
    address: null,
    city: "Delhi",
    state: null,
    pincode: null,
    experience: null,
    originalPrice: 0,
    finalPrice: 0,
    rating: 0,
    imagePath: "https://example.supabase.co/storage/v1/object/public/dojo-images/photo.webp",
    imageFit: "contain",
    imagePosition: "center",
    status: "active",
    approved: true,
    verified: false,
  });
  assert.equal(output.imagePath, "https://example.supabase.co/storage/v1/object/public/dojo-images/photo.webp");
});
