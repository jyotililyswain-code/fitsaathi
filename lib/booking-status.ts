export const PAYMENT_INFO_STATUSES = new Set(["confirmed", "active", "accepted"]);

export function normalizeBookingStatus(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export function isPaymentInfoEligible(value: unknown) {
  return PAYMENT_INFO_STATUSES.has(normalizeBookingStatus(value));
}
