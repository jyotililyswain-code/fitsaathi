import assert from "node:assert/strict";
import test from "node:test";
import { MANUAL_PAYMENT_PAID_STATUS, MANUAL_UPI_ID, MANUAL_UPI_METHOD, manualPaymentData } from "../lib/manual-upi";

test("manual UPI payment data is paid immediately", () => {
  const payment = manualPaymentData("123456789012", 499, "/uploads/payments/receipt.jpg");

  assert.equal(MANUAL_UPI_ID, "7065223868-2@ibl");
  assert.equal(payment.provider, "UPI_MANUAL");
  assert.equal(payment.paymentMethod, MANUAL_UPI_METHOD);
  assert.equal(payment.status, MANUAL_PAYMENT_PAID_STATUS);
  assert.equal(payment.paymentStatus, MANUAL_PAYMENT_PAID_STATUS);
  assert.equal(payment.amountPaid, 499);
  assert.equal(payment.transactionId, "123456789012");
  assert.equal(payment.paymentScreenshotPath, "/uploads/payments/receipt.jpg");
  assert.ok(payment.paidAt instanceof Date);
});
