"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useSessionUser } from "@/lib/auth-client";
import { isAdminRole } from "@/lib/admin";
import { dashboardPathForRole } from "@/lib/roles";

export function AuthGuard({ children, role }: { children: ReactNode; role?: "admin" | "coach" | "dojo" | "customer" | "seller" }) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const { user, checking } = useSessionUser();
  const allowedRole = Boolean(!role || (user && (role === "admin" ? isAdminRole(user.role) : user.role === role)));

  useEffect(() => {
    if (!checking && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [checking, pathname, router, user]);

  if (checking) return <main className="mx-auto max-w-3xl px-4 py-12 text-zinc-300">Checking access...</main>;
  if (!user) {
    return <main className="grid min-h-[70vh] place-items-center bg-ink text-sm text-zinc-400">Redirecting to sign in...</main>;
  }
  if (!allowedRole) {
    return <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-12"><section className="rounded-2xl border border-white/10 bg-white/[0.05] p-6"><h1 className="text-3xl font-bold text-white">Access unavailable</h1><p className="mt-3 leading-7 text-zinc-400">This page requires a different TheFitSaathi account role.</p><Link href={dashboardPathForRole(user.role)} className="mt-6 inline-flex rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink">Open my dashboard</Link></section></main>;
  }
  return <>{children}</>;
}
