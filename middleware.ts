import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
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
    "/admin",
    "/owner",
    "/super-admin-dashboard",
    "/dashboard",
    "/seller-dashboard",
    "/coach-dashboard",
    "/dojo-dashboard",
    "/profile",
    "/settings",
    "/api",
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

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
