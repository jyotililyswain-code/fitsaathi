"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useSessionUser } from "@/lib/auth-client";
import { localApi } from "@/lib/local-api";

type RegistrationType = "coach" | "dojo" | "seller";

type RegistrationStatus = {
  exists: boolean;
  canRegister: boolean;
  message?: string;
  manageHref: string;
  manageLabel: string;
  status?: string;
};

export function RegistrationGate({
  type,
  path,
  children,
}: {
  type: RegistrationType;
  path: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, checking } = useSessionUser();
  const [status, setStatus] = useState<RegistrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadStatus = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const result = await localApi<RegistrationStatus>(
        `/registration-status?type=${type}`,
      );
      setStatus(result);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Registration access could not be checked.",
      );
    } finally {
      setLoading(false);
    }
  }, [type, user]);

  useEffect(() => {
    if (checking) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(path)}`);
      return;
    }
    void loadStatus();
  }, [checking, loadStatus, path, reloadKey, router, user]);

  if (checking || (!user && !error) || loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div
          className="animate-pulse rounded-2xl border border-white/10 bg-white/[.05] p-6"
          aria-label="Checking registration access"
        >
          <div className="h-5 w-40 rounded bg-white/10" />
          <div className="mt-5 h-9 w-3/4 rounded bg-white/10" />
          <div className="mt-4 h-4 w-full rounded bg-white/10" />
          <div className="mt-2 h-4 w-2/3 rounded bg-white/10" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <RegistrationNotice
        title="We could not check your registration"
        message={error}
      >
        <button
          type="button"
          onClick={() => setReloadKey((value) => value + 1)}
          className="focus-ring rounded-xl bg-acid px-5 py-3 font-semibold text-ink"
        >
          Try again
        </button>
      </RegistrationNotice>
    );
  }

  if (status?.exists || status?.canRegister === false) {
    return (
      <RegistrationNotice
        title={
          status.exists
            ? "Registration already submitted"
            : "Registration unavailable for this account"
        }
        message={
          status.message ||
          "This account cannot start the selected registration."
        }
      >
        <Link
          href={status.manageHref}
          className="focus-ring inline-flex min-h-11 items-center rounded-xl bg-acid px-5 py-3 font-semibold text-ink"
        >
          {status.manageLabel}
        </Link>
        <Link
          href="/"
          className="focus-ring inline-flex min-h-11 items-center rounded-xl border border-white/15 px-5 py-3 font-semibold text-white"
        >
          Return home
        </Link>
      </RegistrationNotice>
    );
  }

  return <>{children}</>;
}

function RegistrationNotice({
  title,
  message,
  children,
}: {
  title: string;
  message: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-[65vh] max-w-2xl items-center px-4 py-12 sm:px-6">
      <section className="w-full rounded-2xl border border-white/10 bg-white/[.05] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[.18em] text-acid">
          Join TheFitSaathi
        </p>
        <h1 className="mt-3 text-3xl font-black text-white">{title}</h1>
        <p className="mt-4 leading-7 text-zinc-300">{message}</p>
        <div className="mt-6 flex flex-wrap gap-3">{children}</div>
      </section>
    </main>
  );
}
