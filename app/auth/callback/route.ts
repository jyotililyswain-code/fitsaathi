import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { applicationSessionCookieOptions, issueApplicationSession } from "@/lib/app-session";
import {
  callbackErrorCode,
  GOOGLE_OAUTH_ERRORS,
  oauthDestination,
  type GoogleOAuthErrorCode
} from "@/lib/google-oauth";
import { provisionGoogleProfile } from "@/lib/google-oauth-profile";
import { createSupabaseSsrServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const initialError = callbackErrorCode(request.nextUrl.searchParams);
  if (initialError) return loginErrorResponse(request, initialError);

  const code = request.nextUrl.searchParams.get("code")!;
  const response = loginErrorResponse(request, GOOGLE_OAUTH_ERRORS.failed);
  const supabase = createSupabaseSsrServerClient({
    getAll: () => request.cookies.getAll(),
    setAll: (cookiesToSet, headers) => {
      cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
    }
  });

  if (!supabase) return response;

  let exchange;
  try {
    exchange = await supabase.auth.exchangeCodeForSession(code);
  } catch {
    return response;
  }

  const { data, error } = exchange;
  if (error || !data.user) return response;

  let profile;
  try {
    profile = await provisionGoogleProfile(data.user);
  } catch {
    return loginErrorResponse(request, GOOGLE_OAUTH_ERRORS.profile);
  }

  if (profile.accountStatus !== "active") return loginErrorResponse(request, GOOGLE_OAUTH_ERRORS.unavailable);

  try {
    const session = await issueApplicationSession(profile);
    response.cookies.set("fitsaathi_access", session.accessToken, {
      ...applicationSessionCookieOptions,
      maxAge: 15 * 60
    });
    response.cookies.set("fitsaathi_refresh", session.refreshToken, {
      ...applicationSessionCookieOptions,
      maxAge: 30 * 24 * 60 * 60
    });
    response.headers.set(
      "location",
      new URL(oauthDestination(profile.role, request.nextUrl.searchParams.get("next")), request.url).toString()
    );
    response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate, max-age=0");
    return response;
  } catch {
    return response;
  }
}

function loginErrorResponse(request: NextRequest, code: GoogleOAuthErrorCode) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", code);
  const response = NextResponse.redirect(loginUrl);
  response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate, max-age=0");
  return response;
}
