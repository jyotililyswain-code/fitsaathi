"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { safeAuthRedirect } from "@/lib/auth-redirect";

type AuthMode = "login" | "signup";

export function AuthModeTabs({ current }: { current: AuthMode }) {
  const [returnPath, setReturnPath] = useState("");

  useEffect(() => {
    setReturnPath(
      safeAuthRedirect(
        new URLSearchParams(window.location.search).get("next"),
        "",
      ),
    );
  }, []);

  const hrefFor = (href: string) =>
    returnPath ? `${href}?next=${encodeURIComponent(returnPath)}` : href;

  return (
    <nav
      aria-label="Choose authentication mode"
      className="grid w-full max-w-md grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1"
    >
      <AuthModeLink href={hrefFor("/login")} active={current === "login"}>
        Log In
      </AuthModeLink>
      <AuthModeLink href={hrefFor("/signup")} active={current === "signup"}>
        Sign Up
      </AuthModeLink>
    </nav>
  );
}

function AuthModeLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`focus-ring rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition duration-200 ${
        active
          ? "bg-acid text-ink"
          : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}
