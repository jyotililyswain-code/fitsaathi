import "server-only";
import { put } from "@vercel/blob";
import { sanitizeText } from "@/lib/security";

const screenshotTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);

export type PaymentRequestBody = Record<string, unknown> | FormData;

export async function readPaymentRequest(request: Request): Promise<PaymentRequestBody> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.toLowerCase().includes("multipart/form-data")) return request.formData();
  return request.json();
}

export function paymentValue(body: PaymentRequestBody, key: string, maxLength = 120) {
  const value = body instanceof FormData ? body.get(key) : body[key];
  return sanitizeText(value, maxLength);
}

export function paymentBoolean(body: PaymentRequestBody, key: string) {
  const value = body instanceof FormData ? body.get(key) : body[key];
  return value === true || value === "true" || value === "on";
}

export function requireTransactionId(value: string) {
  const transactionId = sanitizeText(value, 80);
  if (transactionId.length < 6) throw new Error("TRANSACTION_ID_REQUIRED");
  return transactionId;
}

export async function storePaymentScreenshot(body: PaymentRequestBody, fieldName: string, folder: string) {
  if (!(body instanceof FormData)) return null;
  const value = body.get(fieldName);
  if (!(value instanceof File) || value.size === 0) return null;
  const extension = screenshotTypes.get(value.type);
  if (!extension) throw new Error("INVALID_PAYMENT_SCREENSHOT");
  if (value.size > 5 * 1024 * 1024) throw new Error("PAYMENT_SCREENSHOT_TOO_LARGE");
  const blobEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN || (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID));
  if (!blobEnabled) return null;
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
  const blob = await put(`payments/${safeFolder}/${Date.now()}-${crypto.randomUUID()}.${extension}`, value, {
    access: "private",
    contentType: value.type,
    addRandomSuffix: true
  });
  return blob.pathname;
}
