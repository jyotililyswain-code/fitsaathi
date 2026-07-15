"use client";

import { useState, type FormEvent } from "react";
import { localApi } from "@/lib/local-api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactPage() {
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const message = String(formData.get("message") || "").trim();

    setSuccess("");
    setError("");

    if (name.length < 2) return setError("Please enter your name.");
    if (!EMAIL_PATTERN.test(email)) return setError("Please enter a valid email address.");
    if (message.length < 10) return setError("Please enter a message of at least 10 characters.");

    setLoading(true);
    try {
      await localApi("/contact", {
        method: "POST",
        body: JSON.stringify({ name, email, message })
      });
      formElement.reset();
      setSuccess("Your inquiry has been sent successfully.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to send inquiry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-white">Contact TheFitSaathi</h1>
      <p className="mt-3 text-zinc-400">Send an inquiry for coach onboarding, dojo approval, or customer support.</p>

      <form onSubmit={submit} className="mt-8 rounded-2xl border border-white/10 bg-white/[0.05] p-6" noValidate>
        <label htmlFor="contact-name" className="mb-2 block text-sm font-medium text-zinc-300">Name</label>
        <input id="contact-name" name="name" required minLength={2} autoComplete="name" placeholder="Your name" className="field" />

        <label htmlFor="contact-email" className="mb-2 mt-4 block text-sm font-medium text-zinc-300">Email</label>
        <input id="contact-email" name="email" required type="email" autoComplete="email" placeholder="you@example.com" className="field" />

        <label htmlFor="contact-message" className="mb-2 mt-4 block text-sm font-medium text-zinc-300">Message</label>
        <textarea id="contact-message" name="message" required minLength={10} rows={5} placeholder="How can we help?" className="field" />

        <button type="submit" disabled={loading} className="mt-5 rounded-xl bg-acid px-5 py-3 font-semibold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400">
          {loading ? "Sending..." : "Send inquiry"}
        </button>

        {success ? <p role="status" className="mt-4 text-sm text-acid">{success}</p> : null}
        {error ? <p role="alert" className="mt-4 text-sm text-red-400">{error}</p> : null}
      </form>
    </main>
  );
}
