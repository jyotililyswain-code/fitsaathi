export const DOJO_FALLBACK_IMAGE = "/scroll-art/karate-silhouette.jpg";

export type DojoImageFit = "contain" | "cover";
export type DojoImagePosition = "top" | "center" | "bottom";

export function resolveDojoImageUrl(
  value?: string | null,
  dojoId?: string,
  apiOrigin = "",
) {
  const storedValue = value?.trim();
  if (!storedValue) return DOJO_FALLBACK_IMAGE;
  if (/^(?:https?:|data:|blob:)/i.test(storedValue)) return storedValue;
  if (storedValue.startsWith("/api/") || storedValue.startsWith("/uploads/")) {
    return `${apiOrigin}${storedValue}`;
  }
  if (storedValue.startsWith("/")) return storedValue;
  return dojoId
    ? `${apiOrigin}/api/dojos/${encodeURIComponent(dojoId)}/business-photo`
    : DOJO_FALLBACK_IMAGE;
}
