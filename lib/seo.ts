import type { Metadata } from "next";

const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://fitsaathi.vercel.app";

export const siteUrl = configuredSiteUrl.replace(/\/$/, "");

export const seoConfig = {
  siteName: "FitSaathi",
  siteUrl,
  futureDomainNote: "Use NEXT_PUBLIC_SITE_URL when available",
  defaultTitle: "FitSaathi - Find Fitness Coaches, Dojos & Trainers Near You",
  defaultDescription:
    "Book trusted home fitness coaches, yoga trainers, martial arts teachers, dojos, and fitness services with FitSaathi.",
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
  defaultOpenGraphImage: "/scroll-art/karate-punch-woman.jpg",
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

export function generateSeoMetadata({
  title = seoConfig.defaultTitle,
  description = seoConfig.defaultDescription,
  path = "/",
  keywords = [...seoConfig.defaultKeywords],
  image = seoConfig.defaultOpenGraphImage,
  noIndex = false,
}: SeoMetadataInput = {}): Metadata {
  const canonical = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: seoConfig.siteName,
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
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
  };
}

export const organizationJsonLd = {
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  name: seoConfig.siteName,
  url: siteUrl,
  email: "priyanshuswain2000@gmail.com",
  telephone: "8447640449",
  description:
    "FitSaathi is a fitness marketplace for finding home fitness coaches, personal trainers, yoga trainers, martial arts classes, dojos, and fitness services.",
  sameAs: [],
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
