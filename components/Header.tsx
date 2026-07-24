"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Activity, LogOut, Menu, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CustomerCareButton } from "@/components/CustomerCareModal";
import { logoutSession, useSessionUser } from "@/lib/auth-client";
import { dashboardPathForRole } from "@/lib/roles";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const sharedNav = [
  ["Home", "/"],
  ["Find Coach", "/find-coach"],
  ["Dojos", "/dojos"],
  ["Shop", "/shop"],
] as const;

const registrationNav = [
  ["Become a Coach", "/become-a-coach"],
  ["Register as Seller", "/register-seller"],
  ["Register Dojo / Gym", "/register-dojo"],
] as const;

const companyNav = [
  ["About TheFitSaathi", "/about"],
  ["FAQ", "/faq"],
] as const;

const signedInExtraNav = [
  ["Find Fitness Partner", "/life"],
  ["Booking", "/booking"],
  ["Chat", "/chat"],
] as const;

const publicDesktopNav = sharedNav;

const signedInDesktopNav = [
  ...sharedNav,
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
  const liveDataNav = ["Check Live Data", "/live-data"] as const;
  const visibleNav = signedIn
    ? [
        ...sharedNav,
        ["Dashboard", "/dashboard"] as const,
        liveDataNav,
        ...signedInExtraNav,
        ...registrationNav,
        ...companyNav,
      ]
    : [...sharedNav, liveDataNav, ...registrationNav, ...companyNav];
  const desktopNav = signedIn ? signedInDesktopNav : publicDesktopNav;
  const accountLabel = signedIn ? "My Account" : "Log In / Sign Up";
  const accountHref = signedIn ? dashboardHref(role) : "/login";

  if (pathname.startsWith("/super-admin-dashboard")) return null;

  return (
    <header className="sticky top-0 z-[60] h-[calc(5rem+env(safe-area-inset-top))] w-full border-b border-white/10 bg-ink pt-[env(safe-area-inset-top)] shadow-lg shadow-black/20">
      <nav className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Go to TheFitSaathi homepage"
          onClick={() => setOpen(false)}
          className="focus-ring pointer-events-auto relative z-10 flex min-w-0 shrink-0 cursor-pointer items-center gap-2 rounded-lg text-xl font-bold tracking-tight text-white"
        >
          <Image
            src="/favicon-192x192.png"
            alt="TheFitSaathi logo"
            width={32}
            height={32}
            priority
            className="h-8 w-8 rounded-lg bg-white object-cover"
          />
          <span>
            TheFit<span className="text-acid">Saathi</span>
          </span>
        </Link>
        <div
          className="hidden min-w-0 flex-1 items-center justify-center gap-1 px-3 text-sm font-medium text-zinc-300 xl:flex"
          aria-label="Primary navigation"
        >
          {desktopNav.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={`focus-ring shrink-0 whitespace-nowrap rounded-full px-3 py-2 transition hover:bg-white/[.07] hover:text-white ${pathname === href ? "bg-white/[.08] text-white" : ""}`}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/live-data"
            aria-current={pathname === "/live-data" ? "page" : undefined}
            className={`focus-ring inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-2 font-semibold transition hover:bg-acid hover:text-ink ${
              pathname === "/live-data"
                ? "border-acid bg-acid text-ink"
                : "border-acid/35 text-acid"
            }`}
          >
            <Activity className="h-4 w-4" aria-hidden="true" />
            Check Live Data
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="hidden md:block">
            <CustomerCareButton variant="header" />
          </div>
          {signedIn ? <NotificationBell /> : null}
          {checkingAuth ? (
            <span
              aria-hidden="true"
              className="h-11 w-11 shrink-0 animate-pulse rounded-lg border border-acid/20 bg-white/[0.04] sm:w-[7.75rem]"
            />
          ) : (
            <Link
              href={accountHref}
              aria-label={accountLabel}
              title={accountLabel}
              className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-acid bg-transparent px-3 text-acid transition hover:bg-acid hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:w-[7.75rem]"
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
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/15 text-white transition hover:border-acid/50 hover:text-acid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid disabled:cursor-wait disabled:opacity-60"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
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
          className="safe-area-bottom absolute inset-x-0 top-full max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain border-t border-white/10 bg-ink px-4 py-4 shadow-2xl shadow-black/60"
        >
          <div className="mx-auto grid max-w-7xl gap-2 text-sm text-zinc-200 sm:grid-cols-2 lg:grid-cols-3">
            {visibleNav.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={pathname === href ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-xl border px-4 py-3 transition hover:border-acid/40 hover:bg-white/[.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid ${pathname === href ? "border-acid/40 bg-acid/[.08] text-white" : "border-white/10"}`}
              >
                {href === "/live-data" ? (
                  <Activity
                    className="mr-2 h-4 w-4 shrink-0 text-acid"
                    aria-hidden="true"
                  />
                ) : null}
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
