import { readJsonResponse } from "@/lib/http";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "");
const AUTH_EVENT = "fitsaathi-auth";

export type LocalUser = { id: string; name: string; email: string; role: string };

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

  if (response.status === 401 && retry && !path.startsWith("/auth/")) {
    const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      cache: "no-store",
      credentials: "include"
    });
    if (refreshResponse.ok) {
      notifyAuthChanged();
      return localApi<T>(path, init, false);
    }
    notifyAuthChanged();
  }

  return readJsonResponse<T>(response, "API request failed.");
}

export const apiFetch = localApi;

export { API_URL, AUTH_EVENT };
