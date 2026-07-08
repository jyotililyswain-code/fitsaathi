import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/owner",
        "/super-admin-dashboard",
        "/dashboard",
        "/seller-dashboard",
        "/coach-dashboard",
        "/dojo-dashboard",
        "/api",
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
        "/login",
        "/signup",
        "/forgot-password",
        "/payment-success",
        "/payment-failure",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrlFromAbsolute(),
  };
}

function siteUrlFromAbsolute() {
  return absoluteUrl("/").replace(/\/$/, "");
}
