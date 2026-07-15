import { dashboardPathForRole } from "@/lib/roles";

export const GOOGLE_OAUTH_ERRORS = {
  cancelled: "google_cancelled",
  invalidCallback: "google_callback_invalid",
  failed: "google_signin_failed",
  unavailable: "google_account_unavailable",
  providerAccess: "google_access_unavailable",
  profile: "google_profile_failed"
} as const;

export type GoogleOAuthErrorCode = typeof GOOGLE_OAUTH_ERRORS[keyof typeof GOOGLE_OAUTH_ERRORS];

export function googleOAuthErrorMessage(code: string | null) {
  if (code === GOOGLE_OAUTH_ERRORS.cancelled) return "Google sign-in was cancelled.";
  if (code === GOOGLE_OAUTH_ERRORS.invalidCallback) return "Google sign-in could not be completed. Please try again.";
  if (code === GOOGLE_OAUTH_ERRORS.unavailable) return "This account is not available. Contact TheFitSaathi support.";
  if (code === GOOGLE_OAUTH_ERRORS.providerAccess) return "This Google account is not currently allowed to access the application.";
  if (code === GOOGLE_OAUTH_ERRORS.profile) return "Your account was signed in, but we could not load your profile.";
  if (code === GOOGLE_OAUTH_ERRORS.failed) return "Google sign-in failed. Please try again.";
  return "";
}

export function callbackErrorCode(searchParams: URLSearchParams) {
  const providerError = searchParams.get("error");
  const providerCode = searchParams.get("error_code");
  if ([providerError, providerCode].some((value) => value === "access_blocked" || value === "unauthorized_client")) {
    return GOOGLE_OAUTH_ERRORS.providerAccess;
  }
  if (providerError) return providerError === "access_denied" ? GOOGLE_OAUTH_ERRORS.cancelled : GOOGLE_OAUTH_ERRORS.failed;
  if (!searchParams.get("code")) return GOOGLE_OAUTH_ERRORS.invalidCallback;
  return null;
}

export function safeOAuthRedirect(value: string | null | undefined, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;

  try {
    const parsed = new URL(value, "https://thefitsaathi.com");
    if (parsed.origin !== "https://thefitsaathi.com") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function oauthDestination(role: string, next: string | null | undefined) {
  const roleDashboard = dashboardPathForRole(role);
  return role === "customer" ? safeOAuthRedirect(next, roleDashboard) : roleDashboard;
}
