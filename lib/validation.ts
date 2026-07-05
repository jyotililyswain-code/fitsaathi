export function isValidIndianPhone(value: string) {
  return /^[6-9]\d{9}$/.test(normalizePhone(value));
}

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "").slice(-10);
}
