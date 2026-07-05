import type { MetadataRoute } from "next";
import { policies } from "@/lib/policies";

const staticRoutes = [
  "",
  "/coaches",
  "/dojos",
  "/booking",
  "/become-a-coach",
  "/register-dojo",
  "/marketplace",
  "/products",
  "/seller/register",
  "/about",
  "/contact",
  "/faq",
  "/policies",
  "/login",
  "/signup"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const lastModified = new Date("2026-06-29");

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified,
      changeFrequency: route === "" ? "weekly" as const : "monthly" as const,
      priority: route === "" ? 1 : 0.7
    })),
    ...policies.map((policy) => ({
      url: `${siteUrl}/policies/${policy.slug}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.5
    }))
  ];
}
