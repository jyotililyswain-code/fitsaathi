import test from "node:test";
import assert from "node:assert/strict";
import { calculateBookingPricing, formatBookingMoney, resolveMonthlyFeeRupees } from "../lib/booking-pricing";
import { isPaymentInfoEligible, normalizeBookingStatus } from "../lib/booking-status";

test("first-month pricing calculates the requested ₹1,000 example", () => {
  assert.deepEqual(calculateBookingPricing(1000), {
    monthlyFeePaise: 100000,
    firstMonthPaymentPaise: 50000,
    firstMonthRemainingBalancePaise: 50000,
    continuationPaymentPaise: 150000,
    pricingCurrency: "INR",
    pricingPolicyVersion: "first-month-half-v1",
  });
});

test("first-month pricing calculates ₹2,000 and ₹1,500 examples", () => {
  assert.equal(calculateBookingPricing(2000)?.continuationPaymentPaise, 300000);
  assert.equal(calculateBookingPricing(1500)?.continuationPaymentPaise, 225000);
});

test("odd rupee fees split in integer paise without floating-point drift", () => {
  const pricing = calculateBookingPricing(999);
  assert.equal(pricing?.firstMonthPaymentPaise, 49950);
  assert.equal(pricing?.firstMonthRemainingBalancePaise, 49950);
  assert.equal(pricing?.continuationPaymentPaise, 149850);
  assert.equal(formatBookingMoney(pricing?.continuationPaymentPaise), "₹1,498.50");
});

test("provider fee resolution uses the existing profile fields", () => {
  assert.equal(resolveMonthlyFeeRupees({ baseFee: 1200, customerPrice: 1500 }, "coach"), 1200);
  assert.equal(resolveMonthlyFeeRupees({ originalPrice: 1800, finalPrice: 1800 }, "dojo"), 1800);
  assert.equal(resolveMonthlyFeeRupees({ baseFee: 0, customerPrice: 0 }, "coach"), null);
});

test("payment information uses normalized eligible statuses only", () => {
  assert.equal(normalizeBookingStatus(" CONFIRMED "), "confirmed");
  assert.equal(isPaymentInfoEligible("confirmed"), true);
  assert.equal(isPaymentInfoEligible("active"), true);
  assert.equal(isPaymentInfoEligible("accepted"), true);
  assert.equal(isPaymentInfoEligible("cancelled"), false);
  assert.equal(isPaymentInfoEligible("pending"), false);
});
