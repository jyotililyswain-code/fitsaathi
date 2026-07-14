"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  localApi,
  notifyAuthChanged,
  onLocalSessionChange,
  type LocalUser,
} from "@/lib/local-api";
import { HttpResponseError } from "@/lib/http";
import { supabase } from "@/lib/supabase";

type AuthSessionContextValue = {
  user: LocalUser | null;
  checking: boolean;
  reload: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

const publicSeoRoutes = new Set([
  "/",
  "/home",
  "/about",
  "/contact",
  "/faq",
  "/find-coach",
  "/coaches",
  "/dojos",
  "/shop",
  "/products",
  "/seller",
  "/get-started",
  "/pamphlet",
  "/policies",
  "/privacy",
  "/terms",
]);
const publicSeoPrefixes = [
  "/coaches/",
  "/dojos/",
  "/products/",
  "/sellers/",
  "/policies/",
];

export function isPublicSeoRoute(pathname: string) {
  return (
    publicSeoRoutes.has(pathname) ||
    publicSeoPrefixes.some((prefix) => pathname.startsWith(prefix))
  );
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const publicPage = isPublicSeoRoute(pathname);
  const [user, setUser] = useState<LocalUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const currentUser = useRef<LocalUser | null>(null);
  const requestId = useRef(0);

  const sync = useCallback(async (showLoading = true) => {
    const currentRequest = ++requestId.current;
    if (showLoading) {
      setChecking(true);
      setSessionError("");
    }

    try {
      const restoredUser = await localApi<LocalUser>("/auth/me");
      if (currentRequest === requestId.current) {
        currentUser.current = restoredUser;
        setUser(restoredUser);
        setSessionError("");
      }
    } catch (error) {
      if (currentRequest === requestId.current) {
        if (error instanceof HttpResponseError && error.status === 401) {
          currentUser.current = null;
          setUser(null);
          setSessionError("");
        } else if (!currentUser.current) {
          setSessionError(error instanceof Error ? error.message : "The saved session could not be checked.");
        }
      }
    } finally {
      if (currentRequest === requestId.current) setChecking(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      // Supabase restores its persisted browser session from its default storage.
      // The HttpOnly application refresh cookie is then recovered by /auth/me.
      if (supabase) await supabase.auth.getSession().catch(() => undefined);
      if (active) await sync(true);
    };

    void bootstrap();
    const unsubscribeLocal = onLocalSessionChange(() => {
      if (active) void sync(true);
    });
    const providerSubscription = supabase?.auth.onAuthStateChange((event) => {
      if (event === "INITIAL_SESSION") return;

      window.setTimeout(() => {
        if (!active) return;
        if (event === "SIGNED_OUT") {
          void clearLocalSession().finally(() => sync(false));
          return;
        }
        void sync(false);
      }, 0);
    }).data.subscription;

    return () => {
      active = false;
      unsubscribeLocal();
      providerSubscription?.unsubscribe();
    };
  }, [sync]);

  return (
    <AuthSessionContext.Provider
      value={{ user, checking, reload: () => sync(true) }}
    >
      {!publicPage && checking ? (
        <main className="grid min-h-screen place-items-center bg-ink px-4 text-sm text-zinc-400">
          Restoring your session...
        </main>
      ) : !publicPage && sessionError && !user ? (
        <main className="grid min-h-screen place-items-center bg-ink px-4 text-center text-sm text-zinc-400">
          <section>
            <p>{sessionError}</p>
            <button type="button" onClick={() => void sync(true)} className="mt-4 rounded-full bg-acid px-5 py-2.5 font-semibold text-ink">Try again</button>
          </section>
        </main>
      ) : children}
    </AuthSessionContext.Provider>
  );
}

export function useSessionUser() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useSessionUser must be used inside AuthSessionProvider.");
  }
  return context;
}

export async function establishSupabaseSession(email: string, password: string) {
  if (!supabase) return;
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) console.warn("supabase_browser_session_unavailable", error.message);
  } catch (error) {
    console.warn("supabase_browser_session_unavailable", error instanceof Error ? error.message : "Unknown provider error");
  }
}

export async function logoutSession() {
  try {
    await unsubscribePushOnLogout();
    await clearLocalSession();
  } finally {
    if (supabase) await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    notifyAuthChanged();
  }
}

async function clearLocalSession() {
  await localApi("/auth/logout", { method: "POST" }, false).catch(() => undefined);
}

async function unsubscribePushOnLogout() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration("/");
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;
    await localApi("/push/unsubscribe", { method: "DELETE", body: JSON.stringify({ endpoint: subscription.endpoint }) }, false).catch(() => undefined);
    await subscription.unsubscribe().catch(() => false);
  } catch {
    // Logout must continue even if this browser cannot reach its push service.
  }
}
