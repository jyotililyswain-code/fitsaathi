"use client";

import { FileLock2, ShieldCheck, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { socialApi } from "@/lib/social";

export default function VerificationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent) return setMessage("Accept private verification processing before uploading documents.");
    const form = new FormData(event.currentTarget);
    const photos = form.getAll("profilePhotos").filter((value): value is File => value instanceof File && value.size > 0);
    if (photos.length < 4) return setMessage("Upload at least four real profile photos.");
    setLoading(true);
    setMessage("");
    try {
      await socialApi("/verification", { method: "POST", body: form });
      router.replace("/complete-profile");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verification submission failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthGuard>
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="mb-8 grid gap-2 sm:grid-cols-4">
          {["Account", "Interests", "Verification", "Complete"].map((step, index) => (
            <div key={step} className={`rounded-2xl border px-4 py-3 text-sm ${index === 2 ? "border-acid bg-acid/10 text-acid" : "border-white/10 text-zinc-400"}`}>
              <span className="mr-2 font-black">{index + 1}</span>{step}
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]">
          <section>
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-acid text-ink"><ShieldCheck /></div>
            <h1 className="mt-5 text-4xl font-black text-white">Verify your identity</h1>
            <p className="mt-4 leading-7 text-zinc-400">
              Verification is required before your profile appears in TheFitSaathi Life. Members only see your verified badge, age, gender, interests, bio and public photos.
            </p>
            <div className="mt-6 rounded-2xl border border-acid/20 bg-acid/5 p-5">
              <p className="flex items-center gap-2 font-semibold text-white"><FileLock2 className="text-acid" />Private by design</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Aadhaar, age proof and selfie files are encrypted and stored outside public uploads. Only authorized admins can review them.
              </p>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.04] p-5 text-sm leading-6 text-zinc-400">
              Identity verification is completely free, with no charges or hidden fees. Approval is manual, and automated checks only flag blurry, duplicate or suspicious submissions for review.
            </div>
          </section>

          <form onSubmit={submit} className="rounded-[2rem] border border-white/10 bg-white/[.04] p-6">
            <Upload name="aadhaarFront" label="Aadhaar front image" />
            <Upload name="aadhaarBack" label="Aadhaar back image" />
            <Upload name="ageProof" label="Birth certificate or age proof" />
            <Upload name="selfie" label="Live-style selfie verification" />
            <Upload name="profilePhotos" label="Minimum four real profile photos" multiple />
            <Upload name="introVideo" label="Short introduction video (optional)" required={false} accept="video/mp4,video/webm" />

            <label className="mt-5 flex gap-3 rounded-2xl border border-white/10 p-4 text-sm leading-6 text-zinc-300">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-5 w-5 accent-acid" />
              <span>I consent to private verification processing. I understand documents are not shown publicly and admin review makes the final decision.</span>
            </label>

            <button disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-acid px-5 py-4 font-bold text-ink disabled:opacity-50">
              <UploadCloud />{loading ? "Encrypting and submitting..." : "Submit secure verification"}
            </button>
            {message ? <p className="mt-4 text-sm text-zinc-300">{message}</p> : null}
          </form>
        </div>
      </main>
    </AuthGuard>
  );
}

function Upload({ name, label, multiple = false, required = true, accept = "image/jpeg,image/png,image/webp" }: { name: string; label: string; multiple?: boolean; required?: boolean; accept?: string }) {
  return (
    <label className="mt-3 block rounded-xl border border-white/10 bg-ink p-4">
      <span className="text-sm font-semibold text-white">{label}{required ? " *" : ""}</span>
      <input name={name} type="file" accept={accept} multiple={multiple} required={required} className="mt-3 block w-full text-sm text-zinc-400 file:mr-3 file:rounded-full file:border-0 file:bg-acid file:px-3 file:py-2 file:font-semibold file:text-ink" />
    </label>
  );
}
