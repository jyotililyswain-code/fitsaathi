"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { CategorySelect } from "@/components/CategorySelect";
import { useSessionUser } from "@/lib/auth-client";
import { localApi, notifyAuthChanged } from "@/lib/local-api";
import { cleanupProviderUploads, getProviderUploadConfiguration, prepareProviderFile, selectedFile, uploadProviderFile } from "@/lib/provider-registration-upload";
import type { ProviderFileKind } from "@/lib/provider-upload-rules";
import { isValidIndianPhone, normalizePhone } from "@/lib/validation";

type CoachFile = { field: string; kind: ProviderFileKind; label: string; required?: boolean };
const coachFiles: CoachFile[] = [
  { field: "photo", kind: "profile", label: "profile photo" },
  { field: "certificate", kind: "certificate", label: "certificate" },
  { field: "aadharFront", kind: "aadhaar-front", label: "Aadhaar front", required: true },
  { field: "aadharBack", kind: "aadhaar-back", label: "Aadhaar back" },
];

export default function BecomeCoachPage() {
  const router = useRouter();
  const { user } = useSessionUser();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    if (!user) {
      setMessage("Please sign in before registering as a coach. Returning you to this form after login...");
      router.push("/login?next=%2Fbecome-a-coach");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const phoneNumber = normalizePhone(String(formData.get("phoneNumber")));
    if (!isValidIndianPhone(phoneNumber)) return setMessage("Enter a valid 10 digit Indian mobile number.");
    if (String(formData.get("category")) === "Other" && !String(formData.get("customCategory") || "").trim()) return setMessage("Enter your coaching category when selecting Other.");

    const missingFile = coachFiles.find(definition => definition.required && !selectedFile(formData, definition.field));
    if (missingFile) return setMessage(`Please upload the required ${missingFile.label} image.`);
    const selections = coachFiles.flatMap(definition => {
      const file = selectedFile(formData, definition.field);
      return file ? [{ ...definition, file }] : [];
    });

    setLoading(true);
    setMessage("");
    setUploadProgress(0);
    const uploadedPaths: string[] = [];
    let saved = false;
    try {
      setStatus("Checking your session and registration...");
      const configuration = (await getProviderUploadConfiguration("coach")).data;

      const prepared: Array<CoachFile & { file: File }> = [];
      for (const selection of selections) {
        setStatus(`Compressing ${selection.label}...`);
        prepared.push({ ...selection, file: await prepareProviderFile(selection.file, "coach", selection.kind) });
      }

      const paths: Partial<Record<ProviderFileKind, string>> = {};
      for (let index = 0; index < prepared.length; index += 1) {
        const item = prepared[index];
        setStatus(`Uploading ${item.label}...`);
        const path = await uploadProviderFile({
          configuration,
          registrationType: "coach",
          kind: item.kind,
          file: item.file,
          onProgress: percentage => setUploadProgress(Math.round(((index + percentage / 100) / prepared.length) * 100)),
        });
        paths[item.kind] = path;
        uploadedPaths.push(path);
      }

      setStatus("Saving coach profile...");
      await localApi("/coaches", {
        method: "POST",
        body: JSON.stringify({
          name: String(formData.get("name") || "").trim(),
          phoneNumber,
          category: String(formData.get("category") || "").trim(),
          customCategory: String(formData.get("customCategory") || "").trim() || undefined,
          city: String(formData.get("city") || "").trim(),
          availableDays: formData.getAll("availableDays").map(String),
          availableTimings: String(formData.get("availableTimings") || "").split(",").map(value => value.trim()).filter(Boolean),
          bio: String(formData.get("bio") || "").trim() || undefined,
          profilePhotoPath: paths.profile,
          certificatePath: paths.certificate,
          aadhaarFrontPath: paths["aadhaar-front"],
          aadhaarBackPath: paths["aadhaar-back"],
          acceptedTerms: formData.get("acceptedTerms") === "on",
        }),
      });
      saved = true;
      form.reset();
      notifyAuthChanged();
      setStatus("Registration completed successfully.");
      setMessage("Coach profile submitted for verification.");
      router.push("/coach-dashboard");
      router.refresh();
    } catch (error) {
      if (!saved) await cleanupProviderUploads(uploadedPaths);
      setMessage(error instanceof Error ? error.message : "Could not submit coach profile right now.");
    } finally {
      setLoading(false);
      if (!saved) setStatus("");
    }
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <section>
        <p className="text-sm text-acid">Become a coach</p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Register with real profile details</h1>
        <p className="mt-4 leading-7 text-zinc-400">Coach registration and customer bookings are completely free. FitSaathi adds no registration fee, booking fee, platform charge, or hidden charge.</p>
      </section>
      <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 sm:p-6">
        <label className="block text-sm text-zinc-400">Coach name<input name="name" required autoComplete="name" placeholder="Your public coach name" className="field mt-1" /></label>
        <label className="mt-3 block text-sm text-zinc-400">Phone number<input name="phoneNumber" type="tel" required autoComplete="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" placeholder="10 digit mobile number" className="field mt-1" /></label>
        <CategorySelect className="mt-3" />
        <label className="mt-3 block text-sm text-zinc-400">City<input name="city" required autoComplete="address-level2" placeholder="Your city" className="field mt-1" /></label>
        <div className="mt-3 rounded-xl border border-acid/30 bg-acid/10 p-4 text-sm leading-6 text-zinc-200">
          <strong className="text-acid">Free registration.</strong> Your profile and bookings have a ₹0 FitSaathi charge with no hidden fees.
        </div>
        <fieldset className="mt-3 rounded-xl border border-white/10 bg-ink p-4">
          <legend className="px-1 text-sm font-medium text-white">Available teaching days</legend>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-zinc-300 sm:grid-cols-4">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
              <label key={day} className="flex items-center gap-2"><input name="availableDays" type="checkbox" value={day} className="accent-acid" />{day}</label>
            ))}
          </div>
        </fieldset>
        <label className="mt-3 block text-sm text-zinc-400">Available timings<input name="availableTimings" required placeholder="For example: 6:00 AM, 7:00 PM" className="field mt-1" /></label>
        <label className="mt-3 block text-sm text-zinc-400">Coach bio (optional)<textarea name="bio" rows={5} placeholder="Describe your experience and training style" className="field mt-1" /></label>
        <FileField name="photo" label="Profile photo for bio" accept="image/png,image/jpeg,image/webp" />
        <FileField name="certificate" label="Certificate or achievement proof" accept="image/png,image/jpeg,image/webp,application/pdf" />
        <FileField name="aadharFront" label="Aadhaar front image for coach verification" accept="image/png,image/jpeg,image/webp" required />
        <FileField name="aadharBack" label="Aadhaar back image (optional)" accept="image/png,image/jpeg,image/webp" />
        <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-zinc-300">
          <input name="acceptedTerms" type="checkbox" required className="mt-1 accent-acid" />
          <span>
            I confirm these details are accurate and accept the{" "}
            <Link href="/terms" className="text-acid underline">Terms and Conditions</Link>{" "}
            and <Link href="/privacy" className="text-acid underline">Privacy Policy</Link>.
          </span>
        </label>
        <button disabled={loading} className="mt-5 min-h-12 rounded-xl bg-acid px-5 py-3 font-semibold text-ink disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400">
          {loading ? "Submitting profile..." : "Submit profile"}
        </button>
        {status ? <p className="mt-3 text-sm text-acid">{status}{loading && uploadProgress ? ` ${uploadProgress}%` : ""}</p> : null}
        {message ? <p className="mt-4 text-sm text-zinc-300">{message}</p> : null}
      </form>
    </main>
  );
}

function FileField({ name, label, accept, required = false }: { name: string; label: string; accept: string; required?: boolean }) {
  return (
    <label className="mt-3 block rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm text-zinc-300">
      <span className="block font-medium text-white">{label}{required ? " *" : ""}</span>
      <input name={name} type="file" accept={accept} required={required} className="mt-2 block max-w-full text-sm text-zinc-400 file:mr-3 file:min-h-11 file:rounded-full file:border-0 file:bg-acid file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink" />
    </label>
  );
}
