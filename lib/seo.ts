import type { Metadata } from "next";

// SEO URLs must never depend on VERCEL_URL or a Preview environment variable.
// The production origin is deliberately pinned so canonicals, structured data,
// robots.txt and sitemap.xml always agree.
export const siteUrl = "https://thefitsaathi.com";

export const seoConfig = {
  siteName: "TheFitSaathi",
  siteUrl,
  defaultTitle:
    "TheFitSaathi – Find Fitness Coaches, Gyms and Sports Academies",
  defaultDescription:
    "Find fitness coaches, personal trainers, gyms, dojos, martial arts academies, yoga instructors and sports training services with TheFitSaathi.",
  defaultKeywords: [
    "TheFitSaathi",
    "fitness coach near me",
    "home fitness coach",
    "personal trainer at home",
    "yoga trainer near me",
    "karate coach near me",
    "martial arts classes near me",
    "dojo near me",
    "fitness marketplace India",
    "personal training India",
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
};

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function seoImageUrl(
  path: string = seoConfig.defaultOpenGraphImage,
) {
  const value = path.trim();
  if (/^(?:data|blob):/i.test(value)) {
    return absoluteUrl(seoConfig.defaultOpenGraphImage);
  }
  if (/^https?:\/\//i.test(value)) {
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
    return value;
  }
  return absoluteUrl(value);
}

export function canonicalUrl(path = "/") {
  const parsed = new URL(path, siteUrl);
  const pathname = parsed.pathname === "/" ? "/" : parsed.pathname.replace(/\/$/, "");
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
}: SeoMetadataInput = {}): Metadata {
  const canonical = canonicalUrl(path);
  const imageUrl = seoImageUrl(image);
  const includesBrand = title.includes(seoConfig.siteName);
  const documentTitle = includesBrand ? title : `${title} | ${seoConfig.siteName}`;

  return {
    title: { absolute: documentTitle },
    description,
    keywords,
    alternates: { canonical },
    applicationName: seoConfig.siteName,
    category: "fitness",
    openGraph: {
      type: "website",
      siteName: seoConfig.siteName,
      locale: "en_IN",
      url: canonical,
      title: documentTitle,
      description,
      images: [
        {
          url: imageUrl,
          ...(image === seoConfig.defaultOpenGraphImage
            ? { width: 1200, height: 630, type: "image/png" }
            : {}),
          alt: `${documentTitle} social preview image`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: documentTitle,
      description,
      images: [imageUrl],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: { index: false, follow: false, noimageindex: true },
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
  url: siteUrl,
  logo: {
    "@type": "ImageObject",
    url: absoluteUrl(seoConfig.logo),
    width: 512,
    height: 512,
  },
  description:
    "TheFitSaathi helps people find fitness coaches, martial arts trainers, gyms, dojos and sports academies across India.",
  areaServed: { "@type": "Country", name: "India" },
};

export const websiteJsonLd = {
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  name: seoConfig.siteName,
  url: siteUrl,
  publisher: { "@id": `${siteUrl}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/find-coach?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export const coachBookingServiceJsonLd = {
  "@type": "Service",
  name: "Home Fitness Coach Booking",
  description:
    "Find and book home fitness coaches, personal trainers, yoga trainers, martial arts teachers, and dojos in India.",
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
  const image = location.image && !/^(?:data|blob):/i.test(location.image)
    ? seoImageUrl(location.image)
    : undefined;
  const postalAddress = {
    "@type": "PostalAddress",
    ...(location.address ? { streetAddress: location.address } : {}),
    ...(location.city ? { addressLocality: location.city } : {}),
    ...(location.state ? { addressRegion: location.state } : {}),
    ...(location.pincode ? { postalCode: location.pincode } : {}),
    addressCountry: "IN",
  };

  return {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    "@id": `${canonicalUrl(`/dojos/${location.id}`)}#sports-location`,
    name: location.name,
    url: canonicalUrl(`/dojos/${location.id}`),
    description:
      location.description ||
      `${location.name} offers ${location.category} training${location.city ? ` in ${location.city}` : ""}.`,
    sport: location.category,
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
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}
