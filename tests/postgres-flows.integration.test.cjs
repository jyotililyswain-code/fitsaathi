require("dotenv/config");

const assert = require("node:assert/strict");
const fs = require("node:fs");
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
  const created = await request(apiUrl, "/auth/register", json("POST", { name: `Flow ${label}`, email, password: "AuditPass123!", phone: `90000000${label.length}0` }), [201]);
  const session = await request(apiUrl, "/auth/login", json("POST", { email, password: "AuditPass123!" }));
  return { email, id: created.user.id, session };
}

function providerForm(kind) {
  const form = new FormData();
  const fields = kind === "coach"
    ? { name: "Flow Coach", phoneNumber: "9876543210", category: "Strength", city: "Delhi", price: "800", availableDays: "Monday", availableTimings: "6:00 AM, 7:00 PM", bio: "Automated provider flow test." }
    : { name: "Flow Dojo", ownerName: "Flow Owner", phoneNumber: "9876543211", category: "Karate", city: "Delhi", price: "1800", description: "Automated dojo flow test." };
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  const image = fs.readFileSync(path.join(process.cwd(), "public", "scroll-art", "dumbbell.jpg"));
  form.append("photo", new Blob([image], { type: "image/jpeg" }), "photo.jpg");
  form.append("aadharFront", new Blob([image], { type: "image/jpeg" }), "aadhaar.jpg");
  return form;
}

function storedFile(filePath) {
  return path.join(process.cwd(), "server", "uploads", String(filePath).replace(/^\/uploads\//, ""));
}

test("PostgreSQL provider, booking, attendance, dashboard, and admin flows work across Next and Express", async () => {
  const stamp = Date.now();
  const userIds = [];
  const uploaded = [];
  let coachId, dojoId, bookingId, paymentId, dojoPaymentId;
  try {
    const coachAccount = await register(stamp, "coach"); userIds.push(coachAccount.id);
    const coachResult = await request(apiUrl, "/coaches", { method: "POST", headers: { authorization: `Bearer ${coachAccount.session.accessToken}` }, body: providerForm("coach") }, [201]);
    coachId = coachResult.profile.id;
    const coachToken = coachResult.session.accessToken;
    const publicCoach = (await request(apiUrl, "/coaches?limit=100")).find(item => item.id === coachId);
    assert.ok(publicCoach, "new coach should appear in the public coach list");
    assert.equal("phoneNumber" in publicCoach, false, "public coach records must not expose phone numbers");
    assert.equal("coachPayout" in publicCoach, false, "public coach records must not expose provider payouts");
    assert.equal((await request(apiUrl, `/coaches/${coachId}`)).id, coachId);
    assert.equal((await request(apiUrl, `/coaches/${coachId}`, json("PUT", { bio: "Updated PostgreSQL coach bio." }, coachToken))).bio, "Updated PostgreSQL coach bio.");

    const dojoAccount = await register(stamp, "dojo"); userIds.push(dojoAccount.id);
    const dojoOrderId = `order_dojo_flow_${stamp}`;
    const dojoPayment = await prisma.payment.create({ data: { userId: dojoAccount.id, purpose: "dojo_registration", razorpayOrderId: dojoOrderId, razorpayPaymentId: `pay_dojo_flow_${stamp}`, amount: 700, amountPaise: 70000, originalPrice: 700, platformFee: 0, status: "paid", paidAt: new Date() } });
    dojoPaymentId = dojoPayment.id;
    const dojoForm = providerForm("dojo");
    dojoForm.append("email", dojoAccount.email); dojoForm.append("address", "12 Flow Street"); dojoForm.append("state", "Delhi"); dojoForm.append("pincode", "110001"); dojoForm.append("experience", "8 years"); dojoForm.append("accountHolder", "Flow Owner"); dojoForm.append("accountNumber", "123456789012"); dojoForm.append("ifsc", "TEST0001234"); dojoForm.append("razorpayOrderId", dojoOrderId);
    const dojoResult = await request(apiUrl, "/dojos", { method: "POST", headers: { authorization: `Bearer ${dojoAccount.session.accessToken}` }, body: dojoForm }, [201]);
    dojoId = dojoResult.profile.id;
    const dojoToken = dojoResult.session.accessToken;
    const publicDojo = await request(apiUrl, `/dojos/${dojoId}`);
    assert.equal(publicDojo.id, dojoId);
    assert.equal("accountNumberLast4" in publicDojo, false, "public dojo records must not expose payout details");
    assert.equal("phoneNumber" in publicDojo, false, "public dojo records must not expose phone numbers");
    assert.equal((await request(apiUrl, `/dojos/${dojoId}`, json("PUT", { description: "Updated PostgreSQL dojo." }, dojoToken))).description, "Updated PostgreSQL dojo.");

    const admin = await register(stamp, "admin"); userIds.push(admin.id);
    await prisma.user.update({ where: { id: admin.id }, data: { role: "admin" } });
    const adminSession = await request(apiUrl, "/auth/login", json("POST", { email: admin.email, password: "AuditPass123!" }));
    assert.equal((await request(apiUrl, `/admin/providers/coach/${coachId}/status`, json("PATCH", { status: "approved" }, adminSession.accessToken))).verified, true);
    assert.equal((await request(apiUrl, `/admin/providers/dojo/${dojoId}/status`, json("PATCH", { status: "approved" }, adminSession.accessToken))).approved, true);

    const customer = await register(stamp, "customer"); userIds.push(customer.id);
    const razorpayOrderId = `order_flow_${stamp}`;
    const payment = await prisma.payment.create({ data: { userId: customer.id, purpose: "booking", targetType: "coach", targetId: coachId, razorpayOrderId, razorpayPaymentId: `pay_flow_${stamp}`, amount: 1500, amountPaise: 150000, originalPrice: 800, platformFee: 700, coachPayout: 900, status: "paid", paidAt: new Date() } });
    paymentId = payment.id;
    const now = new Date();
    const preferredDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const preferredTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const booking = await request(nextUrl, "/api/bookings/create", json("POST", { targetType: "coach", targetId: coachId, razorpayOrderId, customerName: "Flow Customer", city: "Delhi", classType: "Strength", packageType: "Trial", preferredDate, preferredTime, acceptedTerms: true, acceptedPrivacy: true }, customer.session.accessToken), [201]);
    bookingId = booking.bookingId;
    assert.ok((await request(apiUrl, "/bookings", { headers: { authorization: `Bearer ${customer.session.accessToken}` } })).some(item => item.id === bookingId));
    assert.equal((await request(apiUrl, `/bookings/${bookingId}/status`, json("PATCH", { status: "accepted" }, coachToken))).status, "accepted");
    const qr = await request(nextUrl, "/api/attendance/token", json("POST", { bookingId }, customer.session.accessToken));
    const scan = await request(nextUrl, "/api/attendance/scan", json("POST", { token: qr.token, location: "Flow studio" }, coachToken));
    assert.equal(scan.bookingId, bookingId);
    await request(nextUrl, "/api/attendance/scan", json("POST", { token: qr.token }, coachToken), [409]);
    assert.ok((await request(apiUrl, "/dashboard/summary", { headers: { authorization: `Bearer ${customer.session.accessToken}` } })).attendance >= 1);
    assert.equal((await request(apiUrl, `/bookings/${bookingId}/status`, json("PATCH", { status: "completed" }, coachToken))).status, "completed");

    const verificationFiles = await prisma.providerVerification.findMany({ where: { ownerId: { in: [coachAccount.id, dojoAccount.id] } } });
    for (const item of verificationFiles) uploaded.push(item.aadhaarFrontPath, item.aadhaarBackPath, item.certificatePath);
    uploaded.push((await prisma.coach.findUnique({ where: { id: coachId } })).photoPath, (await prisma.dojo.findUnique({ where: { id: dojoId } })).imagePath);

    await prisma.payment.update({ where: { id: paymentId }, data: { bookingId: null } });
    await prisma.booking.delete({ where: { id: bookingId } }); bookingId = null;
    await request(apiUrl, `/coaches/${coachId}`, { method: "DELETE", headers: { authorization: `Bearer ${coachToken}` } }, [204]); coachId = null;
    await request(apiUrl, `/dojos/${dojoId}`, { method: "DELETE", headers: { authorization: `Bearer ${dojoToken}` } }, [204]); dojoId = null;
    for (const filePath of uploaded.filter(Boolean)) assert.equal(fs.existsSync(storedFile(filePath)), false, `${filePath} should be removed with its provider`);
  } finally {
    if (paymentId) await prisma.payment.deleteMany({ where: { id: paymentId } });
    if (dojoPaymentId) await prisma.payment.deleteMany({ where: { id: dojoPaymentId } });
    if (bookingId) { await prisma.payment.updateMany({ where: { bookingId }, data: { bookingId: null } }); await prisma.booking.deleteMany({ where: { id: bookingId } }); }
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
