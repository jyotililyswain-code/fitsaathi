import type { Metadata } from "next";

// SEO URLs must never depend on VERCEL_URL or a Preview environment variable.
// The production origin is deliberately pinned so canonicals, structured data,
// robots.txt and sitemap.xml always agree.
export const siteUrl = "https://fitsaathi.com";

export const seoConfig = {
  siteName: "FitSaathi",
  siteUrl,
  defaultTitle:
    "FitSaathi – Find Fitness Coaches, Gyms and Sports Academies",
  defaultDescription:
    "FitSaathi helps people discover fitness coaches, personal trainers, martial arts trainers, gyms, dojos and sports academies across India.",
  defaultKeywords: [
    "FitSaathi",
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
  logo: "/fitsaathi-logo.svg",
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

export function canonicalUrl(path = "/") {
  const parsed = new URL(path, siteUrl);
  const pathname = parsed.pathname === "/" ? "/" : parsed.pathname.replace(/\/$/, "");
  return `${siteUrl}${pathname}`;
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
  const imageUrl = absoluteUrl(image);

  return {
    title,
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
      title,
      description,
      images: [
        {
          url: imageUrl,
          alt: `${seoConfig.siteName} fitness coach booking platform`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
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
  },
  description:
    "FitSaathi helps people find fitness coaches, martial arts trainers, gyms, dojos and sports academies across India.",
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
  phoneNumber?: string | null;
  isPhoneVerified?: boolean;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
};

export function sportsActivityLocationJsonLd(location: SportsLocationInput) {
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
    ...(location.image ? { image: absoluteUrl(location.image) } : {}),
    ...(location.isPhoneVerified && location.phoneNumber
      ? { telephone: location.phoneNumber }
      : {}),
    address: postalAddress,
  };
}
