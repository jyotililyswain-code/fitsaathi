import { readJsonResponse } from "@/lib/http";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "");
const AUTH_EVENT = "fitsaathi-auth";
const noRefreshPaths = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/auth/forgot-password",
]);
type RefreshResult = "refreshed" | "invalid" | "unavailable";
let refreshRequest: Promise<RefreshResult> | null = null;

export class SessionRecoveryUnavailableError extends Error {
  constructor() {
    super("The saved session could not be checked. Check your connection and try again.");
    this.name = "SessionRecoveryUnavailableError";
  }
}

export type LocalUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  registrationIntent?: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string | null;
  accountStatus?: string;
  notificationOnboardingCompleted?: boolean;
};

export function notifyAuthChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTH_EVENT));
}

export function onLocalSessionChange(handler: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(AUTH_EVENT, handler);
  return () => window.removeEventListener(AUTH_EVENT, handler);
}

export async function localApi<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    credentials: "include",
    headers: {
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init.headers
    }
  });

  if (response.status === 401 && retry && !noRefreshPaths.has(path)) {
    const refreshResult = await refreshLocalSession();
    if (refreshResult === "refreshed") {
      if (path !== "/auth/me") notifyAuthChanged();
      return localApi<T>(path, init, false);
    }
    if (refreshResult === "unavailable") throw new SessionRecoveryUnavailableError();
    if (path !== "/auth/me") notifyAuthChanged();
  }

  return readJsonResponse<T>(response, "API request failed.");
}

async function refreshLocalSession() {
  if (!refreshRequest) {
    refreshRequest = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      cache: "no-store",
      credentials: "include",
    })
      .then((response) =>
        response.ok
          ? "refreshed" as const
          : response.status === 401
            ? "invalid" as const
            : "unavailable" as const,
      )
      .catch(() => "unavailable" as const)
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
}

export const apiFetch = localApi;

export { API_URL, AUTH_EVENT };
