"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
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
  const authControls = signedIn ? (
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
    <>
      <Link
        href="/login"
        className="rounded-full px-4 py-2 text-sm text-zinc-300 transition hover:text-white"
      >
        Login
      </Link>
      <Link
        href="/signup"
        className="rounded-full bg-acid px-4 py-2 text-sm font-semibold text-ink shadow-glow transition hover:bg-white"
      >
        Sign up
      </Link>
    </>
  );

  if (pathname.startsWith("/super-admin-dashboard")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/75 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/home"
          className="text-xl font-bold tracking-tight text-white"
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
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 2xl:flex">
            {checkingAuth ? null : authControls}
          </div>
          <CustomerCareButton variant="header" />
          <OwnerPopover />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-xl border border-white/10 p-2 text-white 2xl:hidden"
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
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-3 text-center"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-acid px-4 py-3 text-center font-semibold text-ink"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

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
