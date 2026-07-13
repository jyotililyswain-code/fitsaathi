"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CategorySelect } from "@/components/CategorySelect";
import { useSessionUser } from "@/lib/auth-client";
import { API_URL, localApi, notifyAuthChanged } from "@/lib/local-api";
import { isValidIndianPhone, normalizePhone } from "@/lib/validation";

const ENABLE_AADHAAR = process.env.NEXT_PUBLIC_ENABLE_AADHAAR_VERIFICATION === "true";

type ProviderSubmissionStage = "refreshing_session" | "saving_profile" | "uploading_aadhar" | "uploading_aadhaar" | "uploading_attachments" | "saving_verification";
const stageLabels: Record<ProviderSubmissionStage, string> = {
  refreshing_session: "Checking your session...",
  saving_profile: "Creating business profile...",
  uploading_aadhar: "Saving Aadhar verification...",
  uploading_aadhaar: "Saving Aadhar verification...",
  uploading_attachments: "Uploading optional attachments...",
  saving_verification: "Saving verification record..."
};

const establishmentTypeOptions = [
  ["DOJO", "Dojo"],
  ["GYM", "Gym"],
  ["FITNESS_STUDIO", "Fitness Studio"],
  ["YOGA_STUDIO", "Yoga Studio"],
  ["MARTIAL_ARTS_ACADEMY", "Martial Arts Academy"],
  ["OTHER", "Other"]
];

export default function RegisterDojoPage() {
  const router = useRouter();
  const { user } = useSessionUser();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<ProviderSubmissionStage | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [establishmentType, setEstablishmentType] = useState("DOJO");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    if (!user) return setMessage("Please login before registering a dojo or gym.");

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
    const photo = formData.get("photo");
    const certificate = formData.get("certificate");
    const fileError = validateRequiredFile(photo, "business photo", false) || validateRequiredFile(certificate, "registration certificate or ownership proof", true);
    if (fileError) { setLoading(false); setStage(null); return setMessage(fileError); }
    if (String(formData.get("establishmentType")) === "OTHER" && !String(formData.get("customEstablishmentType") || "").trim()) {
      setLoading(false);
      setStage(null);
      return setMessage("Enter the establishment type when selecting Other.");
    }

    try {
      await localApi("/auth/me");
      setStage("uploading_attachments");
      await submitRegistration(formData, setUploadProgress);
      notifyAuthChanged();
      setMessage("Your dojo or gym is active and now appears in public search. Document verification remains under review.");
      router.push("/dojo-dashboard");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit dojo or gym registration right now.");
    } finally {
      setLoading(false);
      setStage(null);
      setUploadProgress(0);
    }
  }

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl text-center">
        <p className="text-sm text-acid">Dojo / Gym registration</p>
        <h1 className="mt-2 text-4xl font-bold text-white">Register Your Dojo or Gym</h1>
        <p className="mt-4 leading-7 text-zinc-400">Registration is completely free. There is no payment step, registration fee, platform charge, or hidden charge. Valid registrations go live immediately while document verification remains under review.</p>
      </section>
      <form onSubmit={submit} className="mx-auto w-full max-w-3xl rounded-2xl border border-acid/25 bg-white/[0.05] p-5 sm:p-6">
        <label className="block text-sm font-medium text-zinc-300">
          Establishment Type
          <select name="establishmentType" required value={establishmentType} onChange={(event) => setEstablishmentType(event.target.value)} className="field mt-2">
            {establishmentTypeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {establishmentType === "OTHER" ? <input name="customEstablishmentType" required placeholder="Enter establishment type" className="field mt-3" /> : null}
        <input name="name" required placeholder="Dojo / Gym name" className="field mt-3" />
        <input name="ownerName" required placeholder="Business owner" className="field mt-3" />
        <input name="email" type="email" required placeholder="Owner email" className="field mt-3" />
        <input name="phoneNumber" type="tel" required pattern="[6-9][0-9]{9}" placeholder="Phone number" className="field mt-3" />
        <CategorySelect className="mt-3" />
        <input name="address" required placeholder="Business address" className="field mt-3" />
        <input name="city" required placeholder="City" className="field mt-3" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input name="state" required placeholder="State" className="field" />
          <input name="pincode" required pattern="[0-9]{6}" placeholder="Pincode" className="field" />
        </div>
        <input name="experience" required placeholder="Experience, e.g. 8 years" className="field mt-3" />
        <input name="gstNumber" placeholder="GST number (optional)" className="field mt-3" />
        <textarea name="description" rows={5} placeholder="Business description" className="field mt-3" />
        <div className="mt-4 rounded-xl border border-acid/30 bg-acid/10 p-4">
          <p className="text-sm font-semibold text-white">Registration total</p>
          <p className="mt-1 text-2xl font-bold text-acid">Free</p>
          <p className="mt-1 text-sm text-zinc-300">₹0 today and no hidden platform charges later.</p>
        </div>
        <FileField name="photo" label="Business photo" accept="image/png,image/jpeg,image/webp" required />
        <FileField name="certificate" label="Registration certificate or ownership proof" accept="image/png,image/jpeg,image/webp,application/pdf" required />
        {ENABLE_AADHAAR ? (
          <>
            <FileField name="aadharFront" label="Aadhaar front image for business verification" accept="image/png,image/jpeg,image/webp" required />
            <FileField name="aadharBack" label="Aadhaar back image (optional)" accept="image/png,image/jpeg,image/webp" />
          </>
        ) : null}
        <button disabled={loading} className="mt-5 rounded-xl bg-acid px-5 py-3 font-semibold text-ink disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400">
          {loading ? "Submitting registration..." : "Register Dojo / Gym"}
        </button>
        {loading && stage ? <p className="mt-3 text-sm text-acid">{stageLabels[stage]}{stage === "uploading_attachments" ? ` ${uploadProgress}%` : ""}</p> : null}
        {message ? <p className="mt-4 text-sm text-zinc-300">{message}</p> : null}
      </form>
    </main>
  );
}

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
function validateRequiredFile(value: FormDataEntryValue | null, label: string, allowPdf: boolean) {
  if (!(value instanceof File) || value.size === 0) return `Select a ${label}.`;
  if (!allowedTypes.has(value.type) || (!allowPdf && value.type === "application/pdf")) return `The ${label} must be a JPEG, PNG, WebP${allowPdf ? ", or PDF" : ""} file.`;
  if (value.size > 4 * 1024 * 1024) return `The ${label} must be 4 MB or smaller.`;
  return "";
}

function submitRegistration(body: FormData, onProgress: (progress: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${API_URL}/dojos`);
    request.withCredentials = true;
    request.upload.onprogress = event => { if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100)); };
    request.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    request.onload = () => {
      let payload: { error?: string } = {};
      try { payload = JSON.parse(request.responseText); } catch { /* handled by the fallback message */ }
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error(payload.error || "Could not submit the dojo or gym registration."));
    };
    request.send(body);
  });
}

function FileField({ name, label, accept, required = false }: { name: string; label: string; accept: string; required?: boolean }) {
  return (
    <label className="mt-3 block rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm text-zinc-300">
      <span className="block font-medium text-white">{label}{required ? " *" : ""}</span>
      <input name={name} type="file" accept={accept} required={required} className="mt-2 block w-full text-sm text-zinc-400 file:mr-4 file:rounded-full file:border-0 file:bg-acid file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink" />
    </label>
  );
}
