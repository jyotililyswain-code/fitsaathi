import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const productionHost = "thefitsaathi.com";

export function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname.toLowerCase();
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0];
  const isProductionDeployment = process.env.VERCEL_ENV === "production";
  const isLegacyOrAliasHost =
    hostname === "www.thefitsaathi.com" ||
    hostname === "fitsaathi.com" ||
    hostname === "www.fitsaathi.com" ||
    hostname.endsWith(".vercel.app");

  if (
    isProductionDeployment &&
    (isLegacyOrAliasHost ||
      hostname !== productionHost ||
      forwardedProtocol === "http")
  ) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.protocol = "https:";
    canonicalUrl.hostname = productionHost;
    canonicalUrl.port = "";
    return NextResponse.redirect(canonicalUrl, 308);
  }

  const protectedPrefixes = [
    "/admin",
    "/owner",
    "/super-admin-dashboard",
    "/dashboard",
    "/seller-dashboard",
    "/coach-dashboard",
    "/dojo-dashboard",
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
    "/account",
    "/payment",
    "/test",
    "/tests",
    "/dev",
    "/preview",
  ];
  const isProtectedPage = protectedPrefixes.some(
    (prefix) =>
      request.nextUrl.pathname === prefix ||
      request.nextUrl.pathname.startsWith(`${prefix}/`),
  );
  const hasSessionCookie =
    request.cookies.has("fitsaathi_access") ||
    request.cookies.has("fitsaathi_refresh");
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  const response =
    isProtectedPage && !hasSessionCookie
      ? NextResponse.redirect(loginUrl)
      : NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store");
  }

  const privatePrefixes = [
    ...protectedPrefixes,
    "/api",
    "/login",
    "/signup",
    "/forgot-password",
    "/auth",
  ];
  if (
    privatePrefixes.some(
      (prefix) =>
        request.nextUrl.pathname === prefix ||
        request.nextUrl.pathname.startsWith(`${prefix}/`),
    )
  ) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  if (process.env.VERCEL_ENV === "preview") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
