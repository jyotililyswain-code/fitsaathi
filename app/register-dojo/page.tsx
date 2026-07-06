"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CategorySelect } from "@/components/CategorySelect";
import { ManualUpiPayment } from "@/components/ManualUpiPayment";
import { useSessionUser } from "@/lib/auth-client";
import { localApi, notifyAuthChanged } from "@/lib/local-api";
import { DOJO_REGISTRATION_FEE } from "@/lib/pricing";
import { isValidIndianPhone, normalizePhone } from "@/lib/validation";

type ProviderSubmissionStage = "refreshing_session" | "saving_profile" | "uploading_aadhar" | "uploading_aadhaar" | "uploading_attachments" | "saving_verification";
const stageLabels: Record<ProviderSubmissionStage, string> = {
  refreshing_session: "Checking your session...",
  saving_profile: "Creating dojo profile...",
  uploading_aadhar: "Saving Aadhar verification...",
  uploading_aadhaar: "Saving Aadhar verification...",
  uploading_attachments: "Uploading optional attachments...",
  saving_verification: "Saving verification record..."
};

export default function RegisterDojoPage() {
  const router = useRouter();
  const { user } = useSessionUser();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<ProviderSubmissionStage | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return setMessage("Please login before registering a dojo.");

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
    formData.set("phoneNumber", phoneNumber);

    try {
      setStage("uploading_attachments");
      await localApi<{ session: { accessToken: string; refreshToken: string; user: unknown } }>("/dojos", { method: "POST", body: formData });
      notifyAuthChanged();
      setMessage("Payment submitted successfully. Your booking/registration is confirmed.");
      router.push("/dojo-dashboard");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit dojo right now.");
    } finally {
      setLoading(false);
      setStage(null);
    }
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <section>
        <p className="text-sm text-acid">Register dojo</p>
        <h1 className="mt-2 text-4xl font-bold text-white">Add an academy with honest traction</h1>
        <p className="mt-4 leading-7 text-zinc-400">Approval, rating, student count, inquiries, and revenue begin empty or zero. They update only from real platform activity.</p>
      </section>
      <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/[0.05] p-6">
        <input name="name" required placeholder="Dojo or academy name" className="field" />
        <input name="ownerName" required placeholder="Owner name" className="field mt-3" />
        <input name="email" type="email" required placeholder="Owner email" className="field mt-3" />
        <input name="phoneNumber" type="tel" required pattern="[6-9][0-9]{9}" placeholder="Phone number" className="field mt-3" />
        <CategorySelect className="mt-3" />
        <input name="address" required placeholder="Full address" className="field mt-3" />
        <input name="city" required placeholder="City" className="field mt-3" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input name="state" required placeholder="State" className="field" />
          <input name="pincode" required pattern="[0-9]{6}" placeholder="Pincode" className="field" />
        </div>
        <input name="price" type="number" min="0" placeholder="Package price in INR" className="field mt-3" />
        <input name="experience" required placeholder="Experience, e.g. 8 years" className="field mt-3" />
        <input name="gstNumber" placeholder="GST number (optional)" className="field mt-3" />
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <input name="accountHolder" required placeholder="Account holder" className="field" />
          <input name="accountNumber" required placeholder="Account number" className="field" />
          <input name="ifsc" required placeholder="IFSC" className="field" />
        </div>
        <textarea name="description" rows={5} placeholder="Description" className="field mt-3" />
        <div className="mt-4 rounded-xl border border-acid/30 bg-acid/10 p-4">
          <p className="text-sm font-semibold text-white">One-time registration payment</p>
          <p className="mt-1 text-2xl font-semibold text-white">Rs. {DOJO_REGISTRATION_FEE}</p>
          <p className="mt-1 text-sm text-zinc-300">Required before submission. Enter the UPI transaction ID after payment.</p>
        </div>
        <ManualUpiPayment amountLabel={`Rs. ${DOJO_REGISTRATION_FEE}`} className="mt-4" />
        <FileField name="photo" label="Dojo photo" accept="image/png,image/jpeg,image/webp" />
        <FileField name="certificate" label="Registration certificate or ownership proof" accept="image/png,image/jpeg,image/webp" />
        <FileField name="aadharFront" label="Aadhar front image for dojo verification" accept="image/png,image/jpeg,image/webp" required />
        <FileField name="aadharBack" label="Aadhar back image (optional)" accept="image/png,image/jpeg,image/webp" />
        <button disabled={loading} className="mt-5 rounded-xl bg-acid px-5 py-3 font-semibold text-ink disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400">
          {loading ? "Submitting dojo..." : "I have paid and want to submit dojo"}
        </button>
        {loading && stage ? <p className="mt-3 text-sm text-acid">{stageLabels[stage]}</p> : null}
        {message ? <p className="mt-4 text-sm text-zinc-300">{message}</p> : null}
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
