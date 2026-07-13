import "dotenv/config";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const baseUrl = (process.env.DOJO_E2E_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const password = `Test-${crypto.randomUUID()}!`;
const suffix = crypto.randomUUID();
const testName = `E2E Taekwondo Dojo ${suffix.slice(0, 8)}`;
const userIds: string[] = [];
let dojoId = "";
let ownerToken = "";

function registrationBody() {
  const body = new FormData();
  const fields: Record<string, string> = {
    establishmentType: "MARTIAL_ARTS_ACADEMY",
    name: testName,
    ownerName: "E2E Test Owner",
    email: `dojo-owner-${suffix}@example.invalid`,
    phoneNumber: "9876543210",
    category: "Taekwondo",
    address: "Test business address",
    city: "Delhi",
    state: "Delhi",
    pincode: "110001",
    experience: "5 years",
    description: "Temporary automated test registration"
  };
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  body.set("photo", new File([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "business.png", { type: "image/png" }));
  body.set("certificate", new File([Buffer.from("%PDF-1.4\n% temporary ownership proof\n%%EOF")], "ownership.pdf", { type: "application/pdf" }));
  return body;
}

async function login(email: string) {
  const response = await fetch(`${baseUrl}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  if (response.status !== 200) throw new Error(`Login failed (${response.status}): ${await response.text()}`);
  return (await response.json() as { accessToken: string }).accessToken;
}

async function main() {
  const passwordHash = await bcrypt.hash(password, 4);
  const [owner, other, admin] = await prisma.$transaction([
    prisma.user.create({ data: { name: "E2E Test Owner", email: `dojo-owner-${suffix}@example.invalid`, passwordHash, role: "customer" } }),
    prisma.user.create({ data: { name: "E2E Other User", email: `dojo-other-${suffix}@example.invalid`, passwordHash, role: "customer" } }),
    prisma.user.create({ data: { name: "E2E Admin", email: `dojo-admin-${suffix}@example.invalid`, passwordHash, role: "admin" } })
  ]);
  userIds.push(owner.id, other.id, admin.id);
  ownerToken = await login(owner.email);
  const otherToken = await login(other.email);
  const adminToken = await login(admin.email);

  const registration = await fetch(`${baseUrl}/api/dojos`, { method: "POST", headers: { Authorization: `Bearer ${ownerToken}` }, body: registrationBody() });
  if (registration.status !== 201) throw new Error(`Registration failed (${registration.status}): ${await registration.text()}`);
  const payload = await registration.json() as { profile: { id: string } };
  dojoId = payload.profile.id;

  const stored = await prisma.dojo.findUniqueOrThrow({ where: { id: dojoId }, include: { owner: false } });
  const verification = await prisma.providerVerification.findUniqueOrThrow({ where: { profileType_profileId: { profileType: "dojo", profileId: dojoId } } });
  assert.equal(stored.approved, true);
  assert.equal(stored.status, "active");
  assert.equal(stored.verified, false);
  assert.equal(stored.registrationPaymentStatus, "not_required");
  assert.equal(stored.originalPrice, 0);
  assert.equal(await prisma.payment.count({ where: { purpose: "dojo_registration", targetId: dojoId } }), 0);
  assert.ok(stored.approvedAt);
  assert.ok(verification.certificatePath);

  const publicSearch = await fetch(`${baseUrl}/api/dojos?search=${encodeURIComponent(testName)}`, { cache: "no-store" });
  const publicRows = await publicSearch.json() as Array<Record<string, unknown>>;
  assert.equal(publicRows.length, 1);
  assert.equal(publicRows[0].id, dojoId);
  assert.ok(!("phoneNumber" in publicRows[0]));
  assert.ok(!("certificatePath" in publicRows[0]));
  assert.ok(!JSON.stringify(publicRows[0]).includes("ownership-proof"));

  const duplicate = await fetch(`${baseUrl}/api/dojos`, { method: "POST", headers: { Authorization: `Bearer ${ownerToken}` }, body: registrationBody() });
  assert.equal(duplicate.status, 409);

  const otherEdit = await fetch(`${baseUrl}/api/dojos/${dojoId}`, { method: "PUT", headers: { Authorization: `Bearer ${otherToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ name: "Unauthorized edit", approved: true, status: "active", verified: true }) });
  assert.equal(otherEdit.status, 403);
  const afterOtherEdit = await prisma.dojo.findUniqueOrThrow({ where: { id: dojoId } });
  assert.equal(afterOtherEdit.name, testName);
  assert.equal(afterOtherEdit.verified, false);

  const ownerEdit = await fetch(`${baseUrl}/api/dojos/${dojoId}`, { method: "PUT", headers: { Authorization: `Bearer ${ownerToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ description: "Owner-updated description", approved: false, status: "suspended", verified: true, registrationPaymentStatus: "failed" }) });
  assert.equal(ownerEdit.status, 200);
  const afterOwnerEdit = await prisma.dojo.findUniqueOrThrow({ where: { id: dojoId } });
  assert.equal(afterOwnerEdit.description, "Owner-updated description");
  assert.equal(afterOwnerEdit.status, "active");
  assert.equal(afterOwnerEdit.approved, true);
  assert.equal(afterOwnerEdit.verified, false);

  assert.equal((await fetch(`${baseUrl}/api/dojos/${dojoId}/verification-document`)).status, 401);
  assert.equal((await fetch(`${baseUrl}/api/dojos/${dojoId}/verification-document`, { headers: { Authorization: `Bearer ${otherToken}` } })).status, 403);
  assert.equal((await fetch(`${baseUrl}/api/dojos/${dojoId}/verification-document`, { headers: { Authorization: `Bearer ${ownerToken}` } })).status, 200);

  const suspension = await fetch(`${baseUrl}/api/admin/action`, { method: "POST", headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "provider_status", targetId: dojoId, value: "suspended", reason: "Automated rollback test" }) });
  if (suspension.status !== 200) throw new Error(`Suspension failed (${suspension.status}): ${await suspension.text()}`);
  const suspended = await prisma.dojo.findUniqueOrThrow({ where: { id: dojoId } });
  assert.equal(suspended.status, "suspended");
  assert.equal(suspended.approved, false);
  const afterSuspension = await fetch(`${baseUrl}/api/dojos?search=${encodeURIComponent(testName)}`, { cache: "no-store" });
  assert.equal((await afterSuspension.json() as unknown[]).length, 0);
  console.info("dojo.registration_e2e_passed", { activeOnCreate: true, publicImmediately: true, duplicatePrevented: true, crossOwnerEditDenied: true, privateProofProtected: true, adminSuspensionRemovedListing: true });
}

main().finally(async () => {
  if (dojoId && ownerToken) await fetch(`${baseUrl}/api/dojos/${dojoId}`, { method: "DELETE", headers: { Authorization: `Bearer ${ownerToken}` } }).catch(() => undefined);
  if (userIds.length) {
    await prisma.adminLog.deleteMany({ where: { actorId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
  await prisma.$disconnect();
});
