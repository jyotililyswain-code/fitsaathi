"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CustomerCareButton } from "@/components/CustomerCareModal";
import { logoutSession, useSessionUser } from "@/lib/auth-client";
import { dashboardPathForRole } from "@/lib/roles";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const publicNav = [
  ["Home", "/"],
  ["Find Coach", "/find-coach"],
  ["Dojos", "/dojos"],
  ["Shop", "/shop"],
  ["Become a Coach", "/become-a-coach"],
  ["Register as Seller", "/register-seller"],
  ["Register Dojo / Gym", "/register-dojo"],
  ["About", "/about"],
  ["FAQ", "/faq"],
] as const;

const signedInNav = [
  ["Find Fitness Partner", "/life"],
  ["Booking", "/booking"],
  ["Chat", "/chat"],
  ["Dashboard", "/dashboard"],
] as const;

export function Header() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const previousPathnameRef = useRef(pathname);
  const { user, checking: checkingAuth } = useSessionUser();
  const role = user?.role || "customer";

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) setOpen(false);
    previousPathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      menuButtonRef.current?.focus();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  async function logout() {
    await logoutSession();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const signedIn = Boolean(user);
  const visibleNav = signedIn ? [...publicNav, ...signedInNav] : publicNav;
  const accountLabel = signedIn ? "My Account" : "Log In / Sign Up";
  const accountHref = signedIn ? dashboardHref(role) : "/login";

  if (pathname.startsWith("/super-admin-dashboard")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/90 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-screen-2xl items-center justify-between gap-1 px-2 py-3 min-[360px]:px-3 sm:gap-3 sm:px-6 sm:py-4 lg:px-8">
        <Link
          href="/"
          aria-label="Go to FitSaathi homepage"
          onClick={() => setOpen(false)}
          className="pointer-events-auto relative z-10 shrink-0 cursor-pointer text-xl font-bold tracking-tight text-white"
        >
          Fit<span className="text-acid">Saathi</span>
        </Link>
        <div
          className="hidden min-w-0 flex-1 items-center justify-center gap-3 overflow-hidden px-3 text-xs font-medium text-zinc-300 2xl:flex"
          aria-label="Primary navigation"
        >
          {visibleNav.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={`whitespace-nowrap rounded-full px-2.5 py-2 transition hover:bg-white/[.05] hover:text-white ${pathname === href ? "bg-white/[.06] text-white" : ""}`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <CustomerCareButton variant="header" />
          <NotificationBell />
          {checkingAuth ? (
            <span
              aria-hidden="true"
              className="h-11 w-11 shrink-0 animate-pulse rounded-lg border border-acid/20 bg-white/[0.04] sm:w-36"
            />
          ) : (
            <Link
              href={accountHref}
              aria-label={accountLabel}
              title={accountLabel}
              className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-acid bg-transparent px-3 text-acid transition duration-[250ms] hover:scale-[1.03] hover:bg-acid hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:px-2.5 lg:px-3"
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
              <span className="hidden whitespace-nowrap text-sm font-semibold sm:inline">
                {accountLabel}
              </span>
            </Link>
          )}
          <button
            ref={menuButtonRef}
            type="button"
            disabled={!hydrated}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/10 text-white transition hover:border-acid/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid disabled:cursor-wait disabled:opacity-60 2xl:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-primary-navigation"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>
      {open ? (
        <div
          id="mobile-primary-navigation"
          className="safe-area-bottom absolute inset-x-0 top-full max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain border-t border-white/10 bg-ink px-4 py-4 shadow-2xl 2xl:hidden"
        >
          <div className="mx-auto grid max-w-7xl gap-3 text-sm text-zinc-300">
            {visibleNav.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid"
              >
                {label}
              </Link>
            ))}
            <CustomerCareButton variant="menu" />
            {checkingAuth ? null : signedIn ? (
              <>
                {[
                  "admin",
                  "super_admin",
                  "moderator",
                  "support_admin",
                ].includes(role) ? (
                  <Link
                    href="/admin/social"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-royal/40 px-4 py-3 text-center font-semibold text-zinc-100"
                  >
                    Social Admin
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function dashboardHref(role: string) {
  return dashboardPathForRole(role);
}
