"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { localApi } from "@/lib/local-api";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); try { const form = new FormData(event.currentTarget); const result = await localApi<{ message: string }>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email: String(form.get("email")) }) }); setMessage(result.message); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not process the request."); } finally { setLoading(false); } }
  return <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12"><form onSubmit={submit} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl"><p className="text-sm text-acid">Account security</p><h1 className="mt-2 text-3xl font-bold text-white">Reset your password</h1><p className="mt-3 text-sm leading-6 text-zinc-400">Enter your email. Until outbound email is configured, an administrator can reset local accounts securely.</p><input name="email" type="email" required placeholder="Email" className="focus-ring mt-6 w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-white"/><button disabled={loading} className="mt-5 w-full rounded-xl bg-acid px-4 py-3 font-semibold text-ink disabled:bg-zinc-700">{loading ? "Checking..." : "Request reset"}</button>{message ? <p className="mt-4 text-sm text-zinc-300">{message}</p> : null}<p className="mt-4 text-sm"><Link className="text-acid" href="/login">Back to login</Link></p></form></main>;
}
