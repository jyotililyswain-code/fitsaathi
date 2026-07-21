import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/fitsaathi-owner",
          "/faq",
          "/contact",
          "/api/coaches/*/photo",
          "/api/dojos/*/business-photo",
        ],
        disallow: [
          "/admin",
          "/owner",
          "/super-admin-dashboard",
          "/dashboard",
          "/seller-dashboard",
          "/coach-dashboard",
          "/dojo-dashboard",
          "/api",
          "/auth",
          "/profile",
          "/settings",
          "/chat",
          "/orders",
          "/wallet",
          "/checkout",
          "/cart",
          "/invites",
          "/attendance",
          "/verification",
          "/complete-profile",
          "/life",
          "/booking",
          "/setup",
          "/login",
          "/signup",
          "/forgot-password",
          "/account",
          "/payment",
          "/test",
          "/tests",
          "/dev",
          "/preview",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
