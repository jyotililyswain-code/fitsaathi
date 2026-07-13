"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { CategorySelect } from "@/components/CategorySelect";
import { useSessionUser } from "@/lib/auth-client";
import { localApi, notifyAuthChanged } from "@/lib/local-api";
import { isValidIndianPhone, normalizePhone } from "@/lib/validation";

type ProviderSubmissionStage = "refreshing_session" | "saving_profile" | "uploading_aadhar" | "uploading_aadhaar" | "uploading_attachments" | "saving_verification";
const stageLabels: Record<ProviderSubmissionStage, string> = {
  refreshing_session: "Checking your session...",
  saving_profile: "Creating coach profile...",
  uploading_aadhar: "Saving Aadhar verification...",
  uploading_aadhaar: "Saving Aadhar verification...",
  uploading_attachments: "Uploading optional attachments...",
  saving_verification: "Saving verification record..."
};

export default function BecomeCoachPage() {
  const router = useRouter();
  const { user } = useSessionUser();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<ProviderSubmissionStage | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setMessage("Please sign in before registering as a coach. Returning you to this form after login...");
      router.push("/login?next=%2Fbecome-a-coach");
      return;
    }

    setLoading(true);
    setMessage("");
    setStage("refreshing_session");

    const formData = new FormData(event.currentTarget);
    const phoneNumber = normalizePhone(String(formData.get("phoneNumber")));
    if (!isValidIndianPhone(phoneNumber)) {
      setLoading(false);
      setStage(null);
      return setMessage("Enter a valid 10 digit Indian mobile number.");
    }
    try {
      setStage("uploading_attachments");
      const result = await localApi<{ session: { accessToken: string; refreshToken: string; user: unknown } }>("/coaches", { method: "POST", body: formData });
      notifyAuthChanged();
      setMessage("Coach profile submitted for verification.");
      router.push("/coach-dashboard");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit coach profile right now.");
    } finally {
      setLoading(false);
      setStage(null);
    }
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <section>
        <p className="text-sm text-acid">Become a coach</p>
        <h1 className="mt-2 text-4xl font-bold text-white">Register with real profile details</h1>
        <p className="mt-4 leading-7 text-zinc-400">Coach registration and customer bookings are completely free. FitSaathi adds no registration fee, booking fee, platform charge, or hidden charge.</p>
      </section>
      <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/[0.05] p-6">
        <input name="name" required placeholder="Coach name" className="field" />
        <input name="phoneNumber" type="tel" required pattern="[6-9][0-9]{9}" placeholder="Phone number" className="field mt-3" />
        <CategorySelect className="mt-3" />
        <input name="city" required placeholder="City" className="field mt-3" />
        <div className="mt-3 rounded-xl border border-acid/30 bg-acid/10 p-4 text-sm leading-6 text-zinc-200">
          <strong className="text-acid">Free registration.</strong> Your profile and bookings have a ₹0 FitSaathi charge with no hidden fees.
        </div>
        <fieldset className="mt-3 rounded-xl border border-white/10 bg-ink p-4">
          <legend className="px-1 text-sm font-medium text-white">Available teaching days</legend>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-zinc-300 sm:grid-cols-4">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
              <label key={day} className="flex items-center gap-2">
                <input name="availableDays" type="checkbox" value={day} className="accent-acid" />
                {day}
              </label>
            ))}
          </div>
        </fieldset>
        <input name="availableTimings" required placeholder="Available timings, e.g. 6:00 AM, 7:00 PM" className="field mt-3" />
        <textarea name="bio" rows={5} placeholder="Bio" className="field mt-3" />
        <FileField name="photo" label="Profile photo for bio" accept="image/png,image/jpeg,image/webp" />
        <FileField name="certificate" label="Certificate or achievement proof" accept="image/png,image/jpeg,image/webp" />
        <FileField name="aadharFront" label="Aadhar front image for home coach verification" accept="image/png,image/jpeg,image/webp" required />
        <FileField name="aadharBack" label="Aadhar back image (optional)" accept="image/png,image/jpeg,image/webp" />
        <button disabled={loading} className="mt-5 rounded-xl bg-acid px-5 py-3 font-semibold text-ink disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400">
          {loading ? "Submitting profile..." : "Submit profile"}
        </button>
        {loading && stage ? <p className="mt-3 text-sm text-acid">{stageLabels[stage]}</p> : null}
        {message ? (
          <p className="mt-4 text-sm text-zinc-300">
            {message}
          </p>
        ) : null}
      </form>
    </main>
  );
}

function FileField({ name, label, accept, required = false }: { name: string; label: string; accept: string; required?: boolean }) {
  return (
    <label className="mt-3 block rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm text-zinc-300">
      <span className="block font-medium text-white">{label}{required ? " *" : ""}</span>
      <input name={name} type="file" accept={accept} required={required} className="mt-2 block w-full text-sm text-zinc-400 file:mr-4 file:rounded-full file:border-0 file:bg-acid file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink" />
    </label>
  );
}
