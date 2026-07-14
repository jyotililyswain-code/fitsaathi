const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string) {
  const trimmed = value.trim();
  if (!emailPattern.test(trimmed) || trimmed.includes(" ")) return null;
  const separator = trimmed.lastIndexOf("@");
  const local = trimmed.slice(0, separator);
  const domain = trimmed.slice(separator + 1).toLowerCase();
  if (!local || !domain || local.length > 64 || trimmed.length > 254) return null;
  return `${local}@${domain}`.toLowerCase();
}

export function maskEmail(value: string) {
  const normalized = normalizeEmail(value);
  if (!normalized) return "your email address";
  const [local, domain] = normalized.split("@");
  const visible = local.length <= 2 ? local.slice(0, 1) : local.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(3, Math.min(8, local.length - visible.length)))}@${domain}`;
}

export function isStrongPassword(value: string) {
  return value.length >= 8 && value.length <= 100 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
}
