import crypto from "node:crypto";
import Razorpay from "razorpay";

type RazorpayOrderInput = {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
};

export function razorpaySettings() {
  return {
    enabled: String(process.env.RAZORPAY_ENABLED || "true").toLowerCase() !== "false",
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
    currency: process.env.RAZORPAY_CURRENCY || "INR"
  };
}

export function requireRazorpayClient() {
  const settings = razorpaySettings();
  if (!settings.enabled) throw Object.assign(new Error("Razorpay is disabled."), { status: 503 });
  if (!settings.keyId || !settings.keySecret) throw Object.assign(new Error("Razorpay disabled/missing keys."), { status: 500 });
  return { ...settings, client: new Razorpay({ key_id: settings.keyId, key_secret: settings.keySecret }) };
}

export async function createRazorpayOrder(input: RazorpayOrderInput) {
  const { client, currency, keyId } = requireRazorpayClient();
  const order = await client.orders.create({
    amount: input.amountPaise,
    currency,
    receipt: input.receipt.slice(0, 40),
    notes: input.notes || {}
  });
  return { order, currency, keyId };
}

export async function fetchCapturedPayment(paymentId: string, expectedOrderId: string, expectedAmountPaise: number) {
  const { client, currency } = requireRazorpayClient();
  let payment = await client.payments.fetch(paymentId);
  if (payment.order_id !== expectedOrderId || Number(payment.amount) !== expectedAmountPaise || payment.currency !== currency) {
    throw Object.assign(new Error("Payment details did not match the saved order."), { status: 400 });
  }
  if (payment.status === "authorized") payment = await client.payments.capture(paymentId, expectedAmountPaise, currency);
  if (payment.status !== "captured") throw Object.assign(new Error("Payment is not captured yet."), { status: 409 });
  return payment;
}

export function verifyRazorpayPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const { keySecret } = razorpaySettings();
  if (!keySecret) throw Object.assign(new Error("Razorpay disabled/missing keys."), { status: 500 });
  const expected = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

export function verifyRazorpayWebhookSignature(payload: Buffer, signature: string) {
  const { webhookSecret } = razorpaySettings();
  if (!webhookSecret) throw Object.assign(new Error("Razorpay webhook secret is not configured."), { status: 500 });
  const expected = crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex");
  return safeEqual(expected, signature);
}

function safeEqual(expected: string, actual: string) {
  return expected.length === actual.length && crypto.timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(actual, "utf8"));
}
