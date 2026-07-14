require("dotenv/config");

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const jwt = require("jsonwebtoken");
const path = require("node:path");
const test = require("node:test");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
const nextUrl = "http://localhost:3000";

async function request(base, route, options = {}, expected = [200]) {
  const response = await fetch(`${base}${route}`, options);
  const text = await response.text();
  let body = text;
  try { body = text ? JSON.parse(text) : null; } catch {}
  assert.ok(expected.includes(response.status), `${options.method || "GET"} ${route}: expected ${expected.join("/")}, received ${response.status}: ${text}`);
  return body;
}

const json = (method, body, token) => ({ method, headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });

async function register(stamp, label) {
  const email = `flow-${label}-${stamp}@example.test`;
  const user = await prisma.user.create({ data: { name: `Flow ${label}`, email, emailNormalized: email, emailVerified: true, emailVerifiedAt: new Date(), accountStatus: "active", phone: `90000000${label.length}0`, birthDate: new Date("2012-01-01") } });
  return { email, id: user.id, session: { accessToken: testToken(user) } };
}

function testToken(user) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET must match the local API for this integration test.");
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });
}

async function uploadProviderFile(token, registrationType, kind, fileName = "test.jpg", contentType = "image/jpeg") {
  const form = new FormData();
  form.set("registrationType", registrationType);
  form.set("kind", kind);
  const image = fs.readFileSync(path.join(process.cwd(), "public", "scroll-art", "dumbbell.jpg"));
  form.set("file", new Blob([image], { type: contentType }), fileName);
  const uploaded = await request(apiUrl, "/provider-uploads/local", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: form }, [201]);
  return uploaded.data.path;
}

async function providerBody(kind, account, uploaded) {
  if (kind === "coach") {
    const profilePhotoPath = await uploadProviderFile(account.session.accessToken, "coach", "profile");
    uploaded.push(profilePhotoPath);
    const aadhaarFrontPath = await uploadProviderFile(account.session.accessToken, "coach", "aadhaar-front");
    uploaded.push(aadhaarFrontPath);
    return { name: "Flow Coach", phoneNumber: "9876543210", category: "Strength", city: "Delhi", availableDays: ["Monday"], availableTimings: ["6:00 AM", "7:00 PM"], bio: "Automated provider flow test.", acceptedTerms: true, profilePhotoPath, aadhaarFrontPath };
  }
  const businessPhotoPath = await uploadProviderFile(account.session.accessToken, "dojo", "logo");
  uploaded.push(businessPhotoPath);
  const certificatePath = await uploadProviderFile(account.session.accessToken, "dojo", "certificate");
  uploaded.push(certificatePath);
  return { establishmentType: "DOJO", name: "Flow Dojo", ownerName: "Flow Owner", email: account.email, phoneNumber: "9876543211", category: "Karate", address: "12 Flow Street", city: "Delhi", state: "Delhi", pincode: "110001", experience: "8 years", description: "Automated dojo flow test.", acceptedTerms: true, businessPhotoPath, certificatePath };
}

function storedFile(filePath) {
  if (String(filePath).startsWith("local-private:")) return path.join(process.cwd(), "server", "private", "provider-registration", String(filePath).slice("local-private:".length));
  return path.join(process.cwd(), "server", "uploads", String(filePath).replace(/^\/uploads\//, ""));
}

test("PostgreSQL provider, booking, attendance, dashboard, and admin flows work across Next and Express", async () => {
  const stamp = Date.now();
  const userIds = [];
  const uploaded = [];
  let coachId, dojoId, bookingId;
  try {
    const coachAccount = await register(stamp, "coach"); userIds.push(coachAccount.id);
    const coachResult = await request(apiUrl, "/coaches", json("POST", await providerBody("coach", coachAccount, uploaded), coachAccount.session.accessToken), [201]);
    coachId = coachResult.profile.id;
    const coachToken = coachResult.session.accessToken;
    assert.equal((await request(apiUrl, "/coaches?limit=100")).some(item => item.id === coachId), false, "an unapproved coach must not appear publicly");
    assert.equal((await request(apiUrl, `/coaches/${coachId}`, json("PUT", { bio: "Updated PostgreSQL coach bio." }, coachToken))).bio, "Updated PostgreSQL coach bio.");

    const dojoAccount = await register(stamp, "dojo"); userIds.push(dojoAccount.id);
    const dojoResult = await request(apiUrl, "/dojos", json("POST", await providerBody("dojo", dojoAccount, uploaded), dojoAccount.session.accessToken), [201]);
    dojoId = dojoResult.profile.id;
    assert.equal(await prisma.payment.count({ where: { purpose: "dojo_registration", targetId: dojoId } }), 0);
    const dojoToken = dojoResult.session.accessToken;
    const publicDojo = await request(apiUrl, `/dojos/${dojoId}`);
    assert.equal(publicDojo.id, dojoId);
    assert.equal("accountNumberLast4" in publicDojo, false, "public dojo records must not expose payout details");
    assert.equal("phoneNumber" in publicDojo, false, "public dojo records must not expose phone numbers");
    assert.equal((await request(apiUrl, `/dojos/${dojoId}`, json("PUT", { description: "Updated PostgreSQL dojo." }, dojoToken))).description, "Updated PostgreSQL dojo.");

    const admin = await register(stamp, "admin"); userIds.push(admin.id);
    const adminUser = await prisma.user.update({ where: { id: admin.id }, data: { role: "admin" } });
    const adminSession = { accessToken: testToken(adminUser) };
    assert.equal((await prisma.dojo.findUniqueOrThrow({ where: { id: dojoId } })).registrationPaymentStatus, "not_required");
    assert.equal((await request(apiUrl, `/admin/providers/coach/${coachId}/status`, json("PATCH", { status: "approved" }, adminSession.accessToken))).verified, true);
    assert.equal((await request(apiUrl, `/admin/providers/dojo/${dojoId}/status`, json("PATCH", { status: "active" }, adminSession.accessToken))).approved, true);
    const publicCoach = (await request(apiUrl, "/coaches?limit=100")).find(item => item.id === coachId);
    assert.ok(publicCoach, "an approved coach should appear in the public coach list");
    assert.equal("phoneNumber" in publicCoach, false, "public coach records must not expose phone numbers");
    assert.equal("coachPayout" in publicCoach, false, "public coach records must not expose provider payouts");
    assert.equal((await request(apiUrl, `/coaches/${coachId}`)).id, coachId);

    const customer = await register(stamp, "customer"); userIds.push(customer.id);
    const bookingDate = new Date();
    bookingDate.setUTCDate(bookingDate.getUTCDate() + ((8 - bookingDate.getUTCDay()) % 7 || 7));
    const preferredDate = bookingDate.toISOString().slice(0, 10);
    const preferredTime = "06:00";
    const booking = await request(nextUrl, "/api/bookings/create", json("POST", { targetType: "coach", targetId: coachId, name: "Flow Customer", phone: "9876543212", city: "Delhi", classType: "home", packageType: "trial", preferredDate, preferredTime, acceptedTerms: true, acceptedPrivacy: true, idempotencyKey: crypto.randomUUID() }, customer.session.accessToken), [201]);
    bookingId = booking.bookingId;
    assert.equal(await prisma.payment.count({ where: { bookingId } }), 0);
    const confirmedBooking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } });
    assert.equal(confirmedBooking.paymentStatus, "not_required");
    assert.equal(confirmedBooking.amount, 0);
    assert.equal(confirmedBooking.platformFee, 0);
    assert.equal(confirmedBooking.status, "confirmed");
    assert.ok((await request(apiUrl, "/bookings", { headers: { authorization: `Bearer ${customer.session.accessToken}` } })).some(item => item.id === bookingId));
    assert.equal((await request(nextUrl, "/api/bookings/status", json("POST", { bookingId, status: "accepted" }, coachToken))).booking.status, "accepted");
    const qr = await request(nextUrl, "/api/attendance/token", json("POST", { bookingId }, customer.session.accessToken));
    const scan = await request(nextUrl, "/api/attendance/scan", json("POST", { bookingId, code: qr.code }, coachToken));
    assert.equal(scan.bookingId, bookingId);
    await request(nextUrl, "/api/attendance/scan", json("POST", { bookingId, code: qr.code }, coachToken), [409]);
    assert.ok((await request(apiUrl, "/dashboard/summary", { headers: { authorization: `Bearer ${customer.session.accessToken}` } })).attendance >= 1);
    assert.equal((await request(nextUrl, "/api/bookings/status", json("POST", { bookingId, status: "completed" }, coachToken))).booking.status, "completed");

    const verificationFiles = await prisma.providerVerification.findMany({ where: { ownerId: { in: [coachAccount.id, dojoAccount.id] } } });
    for (const item of verificationFiles) uploaded.push(item.aadhaarFrontPath, item.aadhaarBackPath, item.certificatePath);
    uploaded.push((await prisma.coach.findUnique({ where: { id: coachId } })).photoPath, (await prisma.dojo.findUnique({ where: { id: dojoId } })).imagePath);

    await prisma.booking.delete({ where: { id: bookingId } }); bookingId = null;
    await request(apiUrl, `/coaches/${coachId}`, { method: "DELETE", headers: { authorization: `Bearer ${coachToken}` } }, [204]); coachId = null;
    await request(apiUrl, `/dojos/${dojoId}`, { method: "DELETE", headers: { authorization: `Bearer ${dojoToken}` } }, [204]); dojoId = null;
    for (const filePath of uploaded.filter(Boolean)) assert.equal(fs.existsSync(storedFile(filePath)), false, `${filePath} should be removed with its provider`);
  } finally {
    if (bookingId) await prisma.booking.deleteMany({ where: { id: bookingId } });
    await prisma.adminLog.deleteMany({ where: { actorId: { in: userIds } } });
    await prisma.providerVerification.deleteMany({ where: { ownerId: { in: userIds } } });
    if (coachId) await prisma.coach.deleteMany({ where: { id: coachId } });
    if (dojoId) await prisma.dojo.deleteMany({ where: { id: dojoId } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    for (const filePath of uploaded.filter(Boolean)) fs.rmSync(storedFile(filePath), { force: true });
    await prisma.$disconnect();
  }
});
