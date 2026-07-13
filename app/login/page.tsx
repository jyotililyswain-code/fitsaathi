"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { safeAuthRedirect } from "@/lib/auth-redirect";
import { establishSupabaseSession } from "@/lib/auth-client";
import { POLICY_VERSION, requiredAgreementPolicies } from "@/lib/policies";
import { localApi, notifyAuthChanged } from "@/lib/local-api";
import { dashboardPathForRole } from "@/lib/roles";
import { AuthModeTabs } from "@/components/AuthModeTabs";

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email")).trim().toLowerCase();
    const password = String(formData.get("password"));
    if (!accepted) return setMessage("Please agree to the current FitSaathi policies before signing in.");
    setLoading(true);
    setMessage("");
    try {
      const result = await localApi<{ user: { role: string } }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password, acceptedPolicies: true, acceptedPolicyVersion: POLICY_VERSION }) });
      await establishSupabaseSession(email, password);
      notifyAuthChanged();
      const requestedPath = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
      router.replace(safeAuthRedirect(requestedPath, dashboardPathForRole(result.user.role)));
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      onSubmit={submit}
      button={loading ? "Signing in..." : "Login"}
      disabled={!accepted || loading}
      accepted={accepted}
      onAcceptedChange={setAccepted}
      message={message}
      showPassword={showPassword}
      onShowPasswordChange={setShowPassword}
      footer={<Link className="text-acid" href="/signup">Create an account</Link>}
    />
  );
}

function AuthShell({
  title,
  onSubmit,
  button,
  disabled,
  accepted,
  onAcceptedChange,
  message,
  showPassword,
  onShowPasswordChange,
  footer
}: {
  title: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  button: string;
  disabled: boolean;
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  message: string;
  showPassword: boolean;
  onShowPasswordChange: (show: boolean) => void;
  footer: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <form onSubmit={onSubmit} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
        <AuthModeTabs current="login" />
        <h1 className="mt-6 text-3xl font-bold text-white">{title}</h1>
        <input name="email" type="email" required placeholder="Email" className="focus-ring mt-6 w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-white" />
        <div className="relative mt-3">
          <input name="password" type={showPassword ? "text" : "password"} minLength={8} maxLength={100} required autoComplete="current-password" placeholder="Password" className="focus-ring w-full rounded-xl border border-white/10 bg-ink px-4 py-3 pr-24 text-white" />
          <button type="button" onClick={() => onShowPasswordChange(!showPassword)} className="absolute inset-y-0 right-3 text-xs font-semibold text-acid" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button>
        </div>
        <label className="mt-5 flex cursor-pointer gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-zinc-300 transition hover:border-acid/30">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => onAcceptedChange(event.target.checked)}
            className="mt-1 h-5 w-5 rounded border-white/20 bg-ink text-acid accent-acid"
            aria-describedby="login-policy-agreement"
          />
          <span id="login-policy-agreement">
            I agree to the current FitSaathi policies, including{" "}
            <Link href="/policies/terms" className="font-medium text-acid underline-offset-4 hover:underline">Terms</Link>,{" "}
            <Link href="/policies/privacy" className="font-medium text-acid underline-offset-4 hover:underline">Privacy</Link>,{" "}
            <Link href="/policies/refunds" className="font-medium text-acid underline-offset-4 hover:underline">Refunds</Link>, and{" "}
            <Link href="/policies/community-guidelines" className="font-medium text-acid underline-offset-4 hover:underline">Community Guidelines</Link>.
          </span>
        </label>
        <p className="mt-3 text-xs leading-5 text-zinc-500">Acceptance is stored as policy version {POLICY_VERSION}.</p>
        <button disabled={disabled} className="mt-5 w-full rounded-xl bg-acid px-4 py-3 font-semibold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400">{button}</button>
        {message ? <p className="mt-4 text-sm text-zinc-300">{message}</p> : null}
        <div className="mt-4 flex flex-wrap justify-between gap-3 text-sm text-zinc-400">
          <span>{footer}</span>
          <Link className="text-acid" href="/forgot-password">Forgot password?</Link>
        </div>
      </form>
    </main>
  );
}
