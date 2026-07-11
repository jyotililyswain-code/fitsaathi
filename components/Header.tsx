"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, UserRound, X } from "lucide-react";
import { useState } from "react";
import { CustomerCareButton } from "@/components/CustomerCareModal";
import { logoutSession, useSessionUser } from "@/lib/auth-client";
import { dashboardPathForRole } from "@/lib/roles";
import { OwnerPopover } from "@/components/OwnerPopover";

const nav = [
  ["Home", "/home"],
  ["Find Fitness Partner", "/life"],
  ["Find Coach", "/find-coach"],
  ["Become a Coach", "/become-a-coach"],
  ["Register as Seller", "/register-seller"],
  ["Register Dojo / Gym", "/register-dojo"],
  ["Dojos", "/dojos"],
  ["Booking", "/booking"],
  ["Shop", "/shop"],
  ["Pamphlet", "/pamphlet"],
  ["Chat", "/chat"],
  ["Dashboard", "/dashboard"],
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const { user, checking: checkingAuth } = useSessionUser();
  const role = user?.role || "customer";

  async function logout() {
    await logoutSession();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const signedIn = Boolean(user);
  const menuAuthControls = signedIn ? (
    <>
      <span className="max-w-40 truncate text-sm text-zinc-300">
        {user?.email}
      </span>
      {["admin", "super_admin", "moderator", "support_admin"].includes(role) ? (
        <Link
          href="/admin/social"
          className="rounded-full border border-royal/40 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-royal/20"
        >
          Social Admin
        </Link>
      ) : null}
      <Link
        href={dashboardHref(role)}
        className="rounded-full bg-acid px-4 py-2 text-sm font-semibold text-ink shadow-glow transition hover:bg-white"
      >
        {dashboardLabel(role)}
      </Link>
      <button
        type="button"
        onClick={logout}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-acid/40 hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </>
  ) : (
    <LoginShortcut onNavigate={() => setOpen(false)} />
  );

  if (pathname.startsWith("/super-admin-dashboard")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/75 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-screen-2xl items-center justify-between gap-2 px-2 py-4 min-[380px]:px-3 sm:px-6 lg:px-8">
        <Link
          href="/home"
          className="shrink-0 text-xl font-bold tracking-tight text-white"
        >
          Fit<span className="text-acid">Saathi</span>
        </Link>
        <div
          className="hidden min-w-0 flex-1 items-center justify-center gap-3 overflow-hidden px-3 text-xs font-medium text-zinc-300 2xl:flex"
          aria-label="Primary navigation"
        >
          {nav.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={`whitespace-nowrap rounded-full px-2.5 py-2 transition hover:bg-white/[.05] hover:text-white ${pathname === href ? "bg-white/[.06] text-white" : ""}`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <CustomerCareButton variant="header" />
          <HeaderAuthShortcut userRole={role} signedIn={signedIn} checkingAuth={checkingAuth} />
          <OwnerPopover />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-xl border border-white/10 p-2 text-white transition hover:border-acid/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid 2xl:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>
      {open ? (
        <div className="border-t border-white/10 bg-ink px-4 py-4 2xl:hidden">
          <div className="mx-auto grid max-w-7xl gap-3 text-sm text-zinc-300">
            {nav.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/10 px-4 py-3"
              >
                {label}
              </Link>
            ))}
            <CustomerCareButton variant="menu" />
            {checkingAuth ? (
              <div className="h-12 animate-pulse rounded-xl border border-acid/20 bg-acid/[0.06]" aria-hidden="true" />
            ) : signedIn ? (
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
                <Link
                  href={dashboardHref(role)}
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-acid px-4 py-3 text-center font-semibold text-ink"
                >
                  {dashboardLabel(role)}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-center"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              menuAuthControls
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function HeaderAuthShortcut({
  userRole,
  signedIn,
  checkingAuth,
}: {
  userRole: string;
  signedIn: boolean;
  checkingAuth: boolean;
}) {
  if (checkingAuth) {
    return (
      <span
        className="inline-flex h-10 w-10 shrink-0 animate-pulse rounded-lg border border-acid/20 bg-acid/[0.06] min-[380px]:w-[5.5rem] md:w-[9.25rem]"
        aria-hidden="true"
      />
    );
  }

  if (signedIn) {
    return <DashboardShortcut role={userRole} />;
  }

  return <LoginShortcut />;
}

function LoginShortcut({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/login"
      onClick={onNavigate}
      aria-label="Login or create an account"
      className={headerShortcutClassName}
    >
      <UserRound className="h-4 w-4" aria-hidden="true" />
      <span className="hidden text-sm font-semibold min-[380px]:inline md:hidden">Login</span>
      <span className="hidden text-sm font-semibold md:inline">Login / Sign Up</span>
    </Link>
  );
}

function DashboardShortcut({ role }: { role: string }) {
  return (
    <Link
      href={dashboardHref(role)}
      aria-label={dashboardLabel(role)}
      className={headerShortcutClassName}
    >
      <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
      <span className="hidden text-sm font-semibold min-[380px]:inline">Dashboard</span>
    </Link>
  );
}

const headerShortcutClassName =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-acid/30 bg-acid/[0.06] px-2.5 text-acid transition hover:border-acid/60 hover:bg-acid/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid sm:px-3";

function dashboardHref(role: string) {
  return dashboardPathForRole(role);
}

function dashboardLabel(role: string) {
  if (role === "coach") return "Open Coach Dashboard";
  if (role === "dojo") return "Open Dojo Dashboard";
  if (["admin", "super_admin", "moderator", "support_admin"].includes(role))
    return "Open Admin";
  if (role === "seller") return "Open Seller Dashboard";
  return "Open Dashboard";
}
