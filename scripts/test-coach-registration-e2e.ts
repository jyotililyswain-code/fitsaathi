import "dotenv/config";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const baseUrl = (process.env.COACH_E2E_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const password = `Test-${crypto.randomUUID()}!`;
const suffix = crypto.randomUUID();
const userIds: string[] = [];
let coachId = "";
let ownerToken = "";
const uploadedPaths: string[] = [];

async function login(email: string) {
  const response = await fetch(`${baseUrl}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  if (response.status !== 200) throw new Error(`Login failed (${response.status}): ${await response.text()}`);
  return (await response.json() as { accessToken: string }).accessToken;
}

async function uploadImage(token: string, kind: "profile" | "aadhaar-front") {
  const source = fs.readFileSync(path.join(process.cwd(), "public", "scroll-art", "dumbbell.jpg"));
  const bytes = new Uint8Array(source.byteLength);
  bytes.set(source);
  const body = new FormData();
  body.set("registrationType", "coach");
  body.set("kind", kind);
  body.set("file", new File([bytes.buffer], `${kind}.jpg`, { type: "image/jpeg" }));
  const response = await fetch(`${baseUrl}/api/provider-uploads/local`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body });
  if (response.status !== 201) throw new Error(`${kind} upload failed (${response.status}): ${await response.text()}`);
  const storedPath = (await response.json() as { data: { path: string } }).data.path;
  uploadedPaths.push(storedPath);
  return storedPath;
}

function localPrivateFile(storedPath: string) {
  return path.join(process.cwd(), "server", "private", "provider-registration", storedPath.slice("local-private:".length));
}

async function main() {
  const passwordHash = await bcrypt.hash(password, 4);
  const [owner, other] = await prisma.$transaction([
    prisma.user.create({ data: { name: "E2E Coach Owner", email: `coach-owner-${suffix}@example.invalid`, passwordHash, role: "customer" } }),
    prisma.user.create({ data: { name: "E2E Other User", email: `coach-other-${suffix}@example.invalid`, passwordHash, role: "customer" } }),
  ]);
  userIds.push(owner.id, other.id);
  ownerToken = await login(owner.email);
  const otherToken = await login(other.email);
  const profilePhotoPath = await uploadImage(ownerToken, "profile");
  const aadhaarFrontPath = await uploadImage(ownerToken, "aadhaar-front");
  const registrationBody = {
    name: `E2E Coach ${suffix.slice(0, 8)}`,
    phoneNumber: "9876543210",
    category: "Strength",
    city: "Delhi",
    availableDays: ["Monday", "Wednesday"],
    availableTimings: ["6:00 AM"],
    bio: "Temporary automated coach registration.",
    profilePhotoPath,
    aadhaarFrontPath,
    acceptedTerms: true,
  };

  const registration = await fetch(`${baseUrl}/api/coaches`, { method: "POST", headers: { Authorization: `Bearer ${ownerToken}`, "Content-Type": "application/json" }, body: JSON.stringify(registrationBody) });
  if (registration.status !== 201) throw new Error(`Registration failed (${registration.status}): ${await registration.text()}`);
  coachId = (await registration.json() as { data: { coachId: string } }).data.coachId;

  const stored = await prisma.coach.findUniqueOrThrow({ where: { id: coachId } });
  const verification = await prisma.providerVerification.findUniqueOrThrow({ where: { profileType_profileId: { profileType: "coach", profileId: coachId } } });
  assert.equal(stored.ownerId, owner.id);
  assert.equal(stored.photoPath, profilePhotoPath);
  assert.equal(verification.aadhaarFrontPath, aadhaarFrontPath);
  assert.equal(verification.aadhaarBackPath, null, "optional Aadhaar back must remain optional");
  assert.equal(verification.certificatePath, null, "optional coach certificate must remain optional");

  const publicCoachResponse = await fetch(`${baseUrl}/api/coaches/${coachId}`);
  const publicCoach = await publicCoachResponse.json() as Record<string, unknown>;
  assert.equal(publicCoach.photoPath, `/api/coaches/${coachId}/photo`);
  assert.ok(!("phoneNumber" in publicCoach));
  assert.ok(!JSON.stringify(publicCoach).includes("aadhaar-front"));

  const documentUrl = `${baseUrl}/api/provider-verifications/coach/${coachId}/aadhaar-front`;
  assert.equal((await fetch(documentUrl)).status, 401);
  assert.equal((await fetch(documentUrl, { headers: { Authorization: `Bearer ${otherToken}` } })).status, 403);
  assert.equal((await fetch(documentUrl, { headers: { Authorization: `Bearer ${ownerToken}` } })).status, 200);

  const duplicate = await fetch(`${baseUrl}/api/coaches`, { method: "POST", headers: { Authorization: `Bearer ${ownerToken}`, "Content-Type": "application/json" }, body: JSON.stringify(registrationBody) });
  assert.equal(duplicate.status, 409);

  const deleted = await fetch(`${baseUrl}/api/coaches/${coachId}`, { method: "DELETE", headers: { Authorization: `Bearer ${ownerToken}` } });
  assert.equal(deleted.status, 204);
  coachId = "";
  for (const storedPath of uploadedPaths) assert.equal(fs.existsSync(localPrivateFile(storedPath)), false, `${storedPath} should be removed with the coach profile`);
  console.info("coach.registration_e2e_passed", { pathOnlyJson: true, optionalAadhaarBack: true, duplicatePrevented: true, privateAadhaarProtected: true, cleanupVerified: true });
}

main().finally(async () => {
  if (coachId && ownerToken) await fetch(`${baseUrl}/api/coaches/${coachId}`, { method: "DELETE", headers: { Authorization: `Bearer ${ownerToken}` } }).catch(() => undefined);
  for (const storedPath of uploadedPaths) if (storedPath.startsWith("local-private:")) fs.rmSync(localPrivateFile(storedPath), { force: true });
  if (userIds.length) {
    await prisma.providerVerification.deleteMany({ where: { ownerId: { in: userIds } } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
  await prisma.$disconnect();
});
