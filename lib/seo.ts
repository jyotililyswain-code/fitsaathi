import type { Metadata } from "next";

const OFFICIAL_SITE_URL = "https://thefitsaathi.com";

function configuredSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (!configured) return OFFICIAL_SITE_URL;

  try {
    const parsed = new URL(configured);
    if (
      parsed.protocol === "https:" &&
      parsed.hostname.toLowerCase() === "thefitsaathi.com" &&
      !parsed.port &&
      parsed.pathname === "/" &&
      !parsed.search &&
      !parsed.hash
    ) {
      return parsed.origin;
    }
  } catch {
    // Invalid, preview, or local values must never become production canonicals.
  }

  return OFFICIAL_SITE_URL;
}

export const siteUrl = configuredSiteUrl();
export const brandName = "FitSaathi";
export const brandAlternateNames = [
  "TheFitSaathi",
  "The FitSaathi",
  "Fit Saathi",
] as const;

export const seoConfig = {
  siteName: brandName,
  siteUrl,
  defaultTitle: "FitSaathi – Find Fitness Coaches, Gyms and Sports Academies",
  defaultDescription:
    "Find fitness coaches, personal trainers, gyms, dojos, martial arts academies, yoga instructors and sports training services across India with FitSaathi.",
  defaultKeywords: [
    "FitSaathi",
    "Fit Saathi",
    "TheFitSaathi",
    "fitness coaches India",
    "personal trainers India",
    "gyms India",
    "dojos India",
    "martial arts academies India",
    "sports academies India",
    "yoga instructors India",
    "fitness partner",
    "sports training",
  ],
  defaultOpenGraphImage: "/opengraph-image",
  logo: "/favicon-512x512.png",
} as const;

type SeoMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
  image?: string;
  noIndex?: boolean;
  noFollow?: boolean;
};

const contactOrPrivatePatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\b(?:\+?91[\s-]?)?[6-9]\d{9}\b/g,
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  /\b\d{12,19}\b/g,
] as const;

/**
 * Keeps public, user-authored labels safe for metadata and JSON-LD. It removes
 * markup, control characters, and contact/identity-number patterns before
 * normalizing whitespace and enforcing a search-snippet-friendly length.
 */
export function sanitizeSeoText(value: unknown, maxLength = 160) {
  if (typeof value !== "string") return "";
  let result = value
    .normalize("NFKC")
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ");
  for (const pattern of contactOrPrivatePatterns) result = result.replace(pattern, " ");
  result = result.replace(/\s+/g, " ").trim();
  if (result.length <= maxLength) return result;
  return result.slice(0, maxLength - 1).replace(/\s+\S*$/, "").trimEnd() + "…";
}

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function seoImageUrl(path: string = seoConfig.defaultOpenGraphImage) {
  const value = path.trim();
  if (!value || /^(?:data|blob|javascript):/i.test(value)) {
    return absoluteUrl(seoConfig.defaultOpenGraphImage);
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      const hostname = parsed.hostname.toLowerCase();
      if (
        hostname === "fitsaathi.com" ||
        hostname === "www.fitsaathi.com" ||
        hostname === "www.thefitsaathi.com" ||
        hostname.endsWith(".vercel.app")
      ) {
        return `${siteUrl}${parsed.pathname}${parsed.search}`;
      }
      return parsed.protocol === "https:"
        ? parsed.href
        : absoluteUrl(seoConfig.defaultOpenGraphImage);
    } catch {
      return absoluteUrl(seoConfig.defaultOpenGraphImage);
    }
  }

  return absoluteUrl(value);
}

export function canonicalUrl(path = "/") {
  const parsed = new URL(path, siteUrl);
  const normalizedPath = parsed.pathname.replace(/\/{2,}/g, "/");
  const pathname =
    normalizedPath === "/" ? "/" : normalizedPath.replace(/\/$/, "");
  return `${siteUrl}${pathname}`;
}

export function hasSearchParameters(
  searchParams: Record<string, string | string[] | undefined>,
) {
  return Object.values(searchParams).some((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value),
  );
}

export function generateSeoMetadata({
  title = seoConfig.defaultTitle,
  description = seoConfig.defaultDescription,
  path = "/",
  keywords = [...seoConfig.defaultKeywords],
  image = seoConfig.defaultOpenGraphImage,
  noIndex = false,
  noFollow = noIndex,
}: SeoMetadataInput = {}): Metadata {
  const canonical = canonicalUrl(path);
  const imageUrl = seoImageUrl(image);
  const safeTitle = sanitizeSeoText(title, 75) || seoConfig.defaultTitle;
  const safeDescription =
    sanitizeSeoText(description, 160) || seoConfig.defaultDescription;
  const includesBrand = /fit\s*saathi/i.test(safeTitle);
  const documentTitle = includesBrand
    ? safeTitle
    : `${safeTitle} | ${seoConfig.siteName}`;
  const safeKeywords = keywords
    .map((keyword) => sanitizeSeoText(keyword, 60))
    .filter(Boolean)
    .slice(0, 14);

  return {
    title: { absolute: documentTitle },
    description: safeDescription,
    keywords: safeKeywords,
    alternates: { canonical },
    applicationName: seoConfig.siteName,
    category: "fitness",
    openGraph: {
      type: "website",
      siteName: seoConfig.siteName,
      locale: "en_IN",
      url: canonical,
      title: documentTitle,
      description: safeDescription,
      images: [
        {
          url: imageUrl,
          ...(image === seoConfig.defaultOpenGraphImage
            ? { width: 1200, height: 630, type: "image/png" }
            : {}),
          alt: sanitizeSeoText(`${documentTitle} social preview image`, 120),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: documentTitle,
      description: safeDescription,
      images: [imageUrl],
    },
    robots: noIndex
      ? {
          index: false,
          follow: !noFollow,
          nocache: true,
          googleBot: {
            index: false,
            follow: !noFollow,
            noimageindex: true,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

export const organizationJsonLd = {
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  name: seoConfig.siteName,
  alternateName: [...brandAlternateNames],
  url: `${siteUrl}/`,
  logo: {
    "@type": "ImageObject",
    url: absoluteUrl(seoConfig.logo),
    width: 512,
    height: 512,
  },
  description:
    "An Indian fitness and sports platform for discovering coaches, trainers, gyms, dojos and sports academies.",
  areaServed: { "@type": "Country", name: "India" },
};

export const websiteJsonLd = {
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: `${siteUrl}/`,
  name: seoConfig.siteName,
  alternateName: [...brandAlternateNames],
  description:
    "FitSaathi helps people discover fitness coaches, personal trainers, gyms, dojos, martial arts academies, yoga instructors and sports training services across India.",
  inLanguage: "en-IN",
  publisher: { "@id": `${siteUrl}/#organization` },
};

export const coachBookingServiceJsonLd = {
  "@type": "Service",
  name: "Fitness Coach and Sports Training Discovery",
  description:
    "Discover fitness coaches, personal trainers, yoga instructors, martial arts teachers, gyms, dojos and sports academies in India.",
  areaServed: { "@type": "Country", name: "India" },
  provider: { "@id": `${siteUrl}/#organization` },
};

type SportsLocationInput = {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  image?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
};

export function sportsActivityLocationJsonLd(location: SportsLocationInput) {
  const image =
    location.image && !/^(?:data|blob):/i.test(location.image)
      ? seoImageUrl(location.image)
      : undefined;
  const safeName = sanitizeSeoText(location.name, 100) || "Fitness academy";
  const safeCategory = sanitizeSeoText(location.category, 80) || "fitness";
  const safeCity = sanitizeSeoText(location.city, 80);
  const postalAddress = {
    "@type": "PostalAddress",
    ...(location.address
      ? { streetAddress: sanitizeSeoText(location.address, 120) }
      : {}),
    ...(safeCity ? { addressLocality: safeCity } : {}),
    ...(location.state
      ? { addressRegion: sanitizeSeoText(location.state, 80) }
      : {}),
    ...(location.pincode
      ? { postalCode: sanitizeSeoText(location.pincode, 10) }
      : {}),
    addressCountry: "IN",
  };
  const profilePath = `/dojos/${encodeURIComponent(location.id)}`;

  return {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    "@id": `${canonicalUrl(profilePath)}#sports-location`,
    name: safeName,
    url: canonicalUrl(profilePath),
    description:
      sanitizeSeoText(location.description, 240) ||
      `${safeName} offers ${safeCategory} training${safeCity ? ` in ${safeCity}` : ""}.`,
    sport: safeCategory,
    ...(image ? { image } : {}),
    address: postalAddress,
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: sanitizeSeoText(item.name, 100),
      item: canonicalUrl(item.path),
    })),
  };
}
