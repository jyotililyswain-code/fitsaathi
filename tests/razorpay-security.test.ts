import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { verifyRazorpayPaymentSignature, verifyRazorpayWebhookSignature } from "../lib/razorpay-security";

test("accepts a valid Razorpay payment signature", () => {
  const secret = "test_secret";
  const signature = crypto.createHmac("sha256", secret).update("order_123|pay_123").digest("hex");
  assert.equal(verifyRazorpayPaymentSignature("order_123", "pay_123", signature, secret), true);
});

test("rejects tampered payment identifiers and signatures", () => {
  const secret = "test_secret";
  const signature = crypto.createHmac("sha256", secret).update("order_123|pay_123").digest("hex");
  assert.equal(verifyRazorpayPaymentSignature("order_123", "pay_tampered", signature, secret), false);
  assert.equal(verifyRazorpayPaymentSignature("order_123", "pay_123", "bad", secret), false);
});

test("verifies the raw webhook body and rejects modified payloads", () => {
  const secret = "webhook_secret";
  const payload = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_123" } } } });
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  assert.equal(verifyRazorpayWebhookSignature(payload, signature, secret), true);
  assert.equal(verifyRazorpayWebhookSignature(`${payload} `, signature, secret), false);
});
