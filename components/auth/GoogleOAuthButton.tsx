"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { safeOAuthRedirect } from "@/lib/google-oauth";
import { supabase } from "@/lib/supabase";

export function GoogleOAuthButton() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function continueWithGoogle() {
    if (loading) return;
    setLoading(true);
    setErrorMessage("");

    if (!supabase) {
      setErrorMessage("Google sign-in is temporarily unavailable.");
      setLoading(false);
      return;
    }

    try {
      const next = safeOAuthRedirect(new URLSearchParams(window.location.search).get("next"));
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", next);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: {
            prompt: "select_account"
          }
        }
      });

      if (error) throw error;
    } catch {
      setErrorMessage("Google sign-in could not be started. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void continueWithGoogle()}
        disabled={loading}
        aria-busy={loading}
        className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white px-4 py-3 font-semibold text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-wait disabled:opacity-70"
      >
        {loading ? (
          <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <GoogleIcon />
        )}
        <span>{loading ? "Connecting to Google..." : "Continue with Google"}</span>
      </button>
      {errorMessage ? <p role="alert" className="mt-3 text-sm text-red-300">{errorMessage}</p> : null}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.5Z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.3l-3.3-2.6c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.5 14a6 6 0 0 1 0-3.9V7.4H3.1a10 10 0 0 0 0 9.2L6.5 14Z" />
      <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.7 9.7 0 0 0 12 2a10 10 0 0 0-8.9 5.4l3.4 2.7A5.9 5.9 0 0 1 12 5.9Z" />
    </svg>
  );
}
