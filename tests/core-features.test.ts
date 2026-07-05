import assert from "node:assert/strict";
import test from "node:test";
import { createAttendanceToken, verifyAttendanceToken } from "../lib/attendance";
import { getCoachCustomerPrice, getPriceBreakdown, toPaise } from "../lib/pricing";
import { isValidIndianPhone, normalizePhone } from "../lib/validation";

test("attendance QR tokens verify, reject tampering, and expire", () => {
  const now = Date.now();
  const token = createAttendanceToken({ bookingId: "booking-1", coachId: "coach-1", customerId: "customer-1", classStartIso: new Date(now).toISOString() }, "attendance-test-secret");
  const valid = verifyAttendanceToken(token, "attendance-test-secret", now);
  assert.equal(valid.ok, true);
  assert.equal(valid.ok && valid.payload.bookingId, "booking-1");
  assert.equal(verifyAttendanceToken(`${token}tampered`, "attendance-test-secret", now).ok, false);
  assert.equal(verifyAttendanceToken(token, "attendance-test-secret", now + 121_000).ok, false);
});

test("attendance QR rejects scans outside the class window", () => {
  const now = Date.now();
  const token = createAttendanceToken({ bookingId: "booking-2", coachId: "coach-2", customerId: "customer-2", classStartIso: new Date(now + 60 * 60 * 1000).toISOString() }, "attendance-test-secret");
  assert.equal(verifyAttendanceToken(token, "attendance-test-secret", now).ok, false);
});

test("pricing calculates rupees, paise, and stored customer totals", () => {
  assert.deepEqual(getPriceBreakdown(1_000), { originalPrice: 1_000, platformFee: 700, totalPrice: 1_700, finalPrice: 1_700, coachPayout: 1_100 });
  assert.equal(toPaise(1_700), 170_000);
  assert.equal(getCoachCustomerPrice({ customerPrice: 2_400, baseFee: 1_000 }), 2_400);
  assert.equal(getCoachCustomerPrice({ baseFee: 1_000 }), 1_700);
});

test("Indian phone normalization and validation are consistent", () => {
  assert.equal(normalizePhone("+91 98765-43210"), "9876543210");
  assert.equal(isValidIndianPhone("+91 98765-43210"), true);
  assert.equal(isValidIndianPhone("12345"), false);
});
