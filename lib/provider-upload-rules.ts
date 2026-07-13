export type ProviderRegistrationType = "coach" | "dojo";
export type ProviderFileKind = "profile" | "logo" | "certificate" | "aadhaar-front" | "aadhaar-back" | "gallery";

export type ProviderFileRule = {
  label: string;
  allowedContentTypes: readonly string[];
  maximumSizeInBytes: number;
  maximumSourceSizeInBytes: number;
  maximumImageDimension: number;
  quality: number;
};

const MB = 1024 * 1024;
const imageTypes = ["image/jpeg", "image/png", "image/webp"] as const;

const rules: Record<ProviderFileKind, ProviderFileRule> = {
  profile: {
    label: "Profile photo",
    allowedContentTypes: imageTypes,
    maximumSizeInBytes: 2 * MB,
    maximumSourceSizeInBytes: 20 * MB,
    maximumImageDimension: 1400,
    quality: 0.78,
  },
  logo: {
    label: "Business photo",
    allowedContentTypes: imageTypes,
    maximumSizeInBytes: 2 * MB,
    maximumSourceSizeInBytes: 20 * MB,
    maximumImageDimension: 1400,
    quality: 0.8,
  },
  certificate: {
    label: "Certificate or ownership proof",
    allowedContentTypes: [...imageTypes, "application/pdf"],
    maximumSizeInBytes: 5 * MB,
    maximumSourceSizeInBytes: 20 * MB,
    maximumImageDimension: 1600,
    quality: 0.82,
  },
  "aadhaar-front": {
    label: "Aadhaar front image",
    allowedContentTypes: imageTypes,
    maximumSizeInBytes: 2 * MB,
    maximumSourceSizeInBytes: 20 * MB,
    maximumImageDimension: 1600,
    quality: 0.82,
  },
  "aadhaar-back": {
    label: "Aadhaar back image",
    allowedContentTypes: imageTypes,
    maximumSizeInBytes: 2 * MB,
    maximumSourceSizeInBytes: 20 * MB,
    maximumImageDimension: 1600,
    quality: 0.82,
  },
  gallery: {
    label: "Gallery image",
    allowedContentTypes: imageTypes,
    maximumSizeInBytes: 2 * MB,
    maximumSourceSizeInBytes: 20 * MB,
    maximumImageDimension: 1400,
    quality: 0.78,
  },
};

const kindsByRegistration: Record<ProviderRegistrationType, readonly ProviderFileKind[]> = {
  coach: ["profile", "certificate", "aadhaar-front", "aadhaar-back"],
  dojo: ["logo", "certificate", "aadhaar-front", "aadhaar-back", "gallery"],
};

export function providerFileRule(registrationType: ProviderRegistrationType, kind: ProviderFileKind) {
  if (!kindsByRegistration[registrationType].includes(kind)) return null;
  return rules[kind];
}

export function isProviderRegistrationType(value: unknown): value is ProviderRegistrationType {
  return value === "coach" || value === "dojo";
}

export function isProviderFileKind(value: unknown): value is ProviderFileKind {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(rules, value);
}

export function extensionForContentType(contentType: string) {
  return ({
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
  } as Record<string, string>)[contentType] || "bin";
}

export function providerBlobPathname(
  registrationType: ProviderRegistrationType,
  userId: string,
  kind: ProviderFileKind,
  uniqueId: string,
  contentType: string,
) {
  return `${registrationType}/${userId}/${kind}/${uniqueId}.${extensionForContentType(contentType)}`;
}

export function isOwnedProviderPath(
  storedPath: string,
  registrationType: ProviderRegistrationType,
  userId: string,
  kind?: ProviderFileKind,
) {
  if (!storedPath || storedPath.length > 500 || /^(?:data:|blob:|https?:)/i.test(storedPath)) return false;
  const relative = storedPath.startsWith("local-private:") ? storedPath.slice("local-private:".length) : storedPath;
  const prefix = `${registrationType}/${userId}/${kind ? `${kind}/` : ""}`;
  if (!relative.startsWith(prefix)) return false;
  const suffix = relative.slice(prefix.length);
  return suffix.length > 4 && !suffix.includes("..") && !suffix.includes("\\") && !suffix.startsWith("/");
}

export function containsInlineFileData(value: unknown): boolean {
  if (typeof value === "string") return /^data:/i.test(value.trim()) || /^[A-Za-z0-9+/]{8192,}={0,2}$/.test(value.trim());
  if (Array.isArray(value)) return value.some(containsInlineFileData);
  if (value && typeof value === "object") return Object.values(value).some(containsInlineFileData);
  return false;
}
