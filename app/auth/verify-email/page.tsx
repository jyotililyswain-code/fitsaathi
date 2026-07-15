"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OtpInput } from "@/components/auth/OtpInput";
import { maskEmail } from "@/lib/auth/email";
import { notifyAuthChanged } from "@/lib/local-api";
import { localApi } from "@/lib/local-api";
import { supabase } from "@/lib/supabase";

type VerificationResult = {
  user: { role: string };
  redirectTo: string;
  supabaseSession: { access_token: string; refresh_token: string };
};

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setEmail(sessionStorage.getItem("fitsaathi_pending_email") || "");
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setInterval(() => setCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  async function verify() {
    if (!email || !/^\d{6}$/.test(otp) || loading) return;
    setLoading(true);
    setMessage("");
    try {
      const result = await localApi<VerificationResult>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email, token: otp }),
      });
      if (supabase) {
        const { error } = await supabase.auth.setSession(result.supabaseSession);
        if (error) throw new Error("Your email was verified, but the browser session could not be started. Please sign in.");
      }
      sessionStorage.removeItem("fitsaathi_pending_email");
      sessionStorage.removeItem("fitsaathi_registration_intent");
      setSuccess(true);
      setMessage("Email verified. Opening your TheFitSaathi account…");
      notifyAuthChanged();
      window.setTimeout(() => {
        router.replace(result.redirectTo || "/dashboard");
        router.refresh();
      }, 500);
    } catch (error) {
      setOtp("");
      setMessage(error instanceof Error ? error.message : "The code could not be verified.");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!email || countdown > 0 || resending) return;
    setResending(true);
    setMessage("");
    try {
      const result = await localApi<{ message: string }>("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setOtp("");
      setCountdown(60);
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not resend the verification email.");
    } finally {
      setResending(false);
    }
  }

  function changeEmail() {
    sessionStorage.removeItem("fitsaathi_pending_email");
    sessionStorage.removeItem("fitsaathi_registration_intent");
    router.push("/signup");
  }

  if (!email) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-12">
        <section className="w-full rounded-3xl border border-white/10 bg-white/[.04] p-6 text-center sm:p-8">
          <Logo />
          <h1 className="mt-6 text-3xl font-black text-white">No verification is pending</h1>
          <p className="mt-3 text-zinc-400">Start registration or sign in to resend a code for an existing unverified account.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/signup" className="rounded-full bg-acid px-5 py-3 font-semibold text-ink">Create account</Link>
            <Link href="/login" className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white">Sign in</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[75vh] max-w-xl items-center px-4 py-12">
      <section className="w-full rounded-3xl border border-white/10 bg-white/[.04] p-5 text-center shadow-2xl sm:p-9">
        <Logo />
        <p className="mt-7 text-xs font-bold uppercase tracking-[.22em] text-acid">Account security</p>
        <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">Verify your email</h1>
        <p className="mx-auto mt-3 max-w-md leading-7 text-zinc-400">We sent a six-digit verification code to <strong className="text-zinc-200">{maskEmail(email)}</strong>. Enter the code below to activate your TheFitSaathi account.</p>
        <div className="mt-7"><OtpInput value={otp} onChange={setOtp} disabled={loading || success} /></div>
        <button type="button" onClick={verify} disabled={loading || success || otp.length !== 6} className="mt-7 w-full rounded-xl bg-acid px-5 py-3.5 font-bold text-ink disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400">
          {loading ? "Verifying…" : success ? "Email verified" : "Verify email"}
        </button>
        <button type="button" onClick={resend} disabled={countdown > 0 || resending || loading || success} className="mt-3 w-full rounded-xl border border-white/15 px-5 py-3.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {resending ? "Sending…" : countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
        </button>
        {message ? <p role="status" aria-live="polite" className={`mt-4 text-sm ${success ? "text-acid" : "text-zinc-300"}`}>{message}</p> : null}
        <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
          <button type="button" onClick={changeEmail} disabled={loading} className="text-acid disabled:opacity-50">Change email</button>
          <Link href="/signup" className="text-zinc-400 hover:text-white">Back to signup</Link>
          <Link href="/contact" className="text-zinc-400 hover:text-white">Customer care</Link>
        </div>
      </section>
    </main>
  );
}

function Logo() {
  return <Link href="/home" aria-label="TheFitSaathi home" className="inline-flex text-2xl font-black tracking-tight text-white">TheFit<span className="text-acid">Saathi</span></Link>;
}
