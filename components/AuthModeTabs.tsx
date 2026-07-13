import Link from "next/link";

type AuthMode = "login" | "signup";

export function AuthModeTabs({ current }: { current: AuthMode }) {
  return (
    <nav
      aria-label="Choose authentication mode"
      className="grid w-full max-w-md grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1"
    >
      <AuthModeLink href="/login" active={current === "login"}>
        Log In
      </AuthModeLink>
      <AuthModeLink href="/signup" active={current === "signup"}>
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
