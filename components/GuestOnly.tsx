"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useSessionUser } from "@/lib/auth-client";
import { dashboardPathForRole } from "@/lib/roles";

export function GuestOnly({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, checking } = useSessionUser();

  useEffect(() => {
    if (!checking && user) router.replace(dashboardPathForRole(user.role));
  }, [checking, router, user]);

  if (checking || user) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-4 text-sm text-zinc-400">
        {checking ? "Restoring your session..." : "Opening your account..."}
      </main>
    );
  }

  return <>{children}</>;
}
