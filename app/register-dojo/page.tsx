"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CategorySelect } from "@/components/CategorySelect";
import { useSessionUser } from "@/lib/auth-client";
import { localApi, notifyAuthChanged } from "@/lib/local-api";
import { cleanupProviderUploads, getProviderUploadConfiguration, prepareProviderFile, selectedFile, uploadProviderFile } from "@/lib/provider-registration-upload";
import type { ProviderFileKind } from "@/lib/provider-upload-rules";
import { isValidIndianPhone, normalizePhone } from "@/lib/validation";

const ENABLE_AADHAAR = process.env.NEXT_PUBLIC_ENABLE_AADHAAR_VERIFICATION === "true";
const establishmentTypeOptions = [
  ["DOJO", "Dojo"],
  ["GYM", "Gym"],
  ["FITNESS_STUDIO", "Fitness Studio"],
  ["YOGA_STUDIO", "Yoga Studio"],
  ["MARTIAL_ARTS_ACADEMY", "Martial Arts Academy"],
  ["OTHER", "Other"],
];

type DojoFile = { field: string; kind: ProviderFileKind; label: string; required?: boolean };

export default function RegisterDojoPage() {
  const router = useRouter();
  const { user } = useSessionUser();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [establishmentType, setEstablishmentType] = useState("DOJO");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    if (!user) return setMessage("Please sign in before registering a dojo or gym.");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const phoneNumber = normalizePhone(String(formData.get("phoneNumber")));
    if (!isValidIndianPhone(phoneNumber)) return setMessage("Enter a valid 10 digit Indian mobile number.");
    if (String(formData.get("establishmentType")) === "OTHER" && !String(formData.get("customEstablishmentType") || "").trim()) return setMessage("Enter the establishment type when selecting Other.");
    if (String(formData.get("category")) === "Other" && !String(formData.get("customCategory") || "").trim()) return setMessage("Enter the training category when selecting Other.");

    const definitions: DojoFile[] = [
      { field: "photo", kind: "logo", label: "business photo", required: true },
      { field: "certificate", kind: "certificate", label: "registration certificate or ownership proof", required: true },
      ...(ENABLE_AADHAAR ? [
        { field: "aadharFront", kind: "aadhaar-front" as const, label: "Aadhaar front", required: true },
        { field: "aadharBack", kind: "aadhaar-back" as const, label: "Aadhaar back" },
      ] : []),
    ];
    const missingFile = definitions.find(definition => definition.required && !selectedFile(formData, definition.field));
    if (missingFile) return setMessage(`Please upload the required ${missingFile.label}.`);
    const selections = definitions.flatMap(definition => {
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
      const configuration = (await getProviderUploadConfiguration("dojo")).data;

      const prepared: Array<DojoFile & { file: File }> = [];
      for (const selection of selections) {
        setStatus(`Compressing ${selection.label}...`);
        prepared.push({ ...selection, file: await prepareProviderFile(selection.file, "dojo", selection.kind) });
      }

      const paths: Partial<Record<ProviderFileKind, string>> = {};
      for (let index = 0; index < prepared.length; index += 1) {
        const item = prepared[index];
        setStatus(`Uploading ${item.label}...`);
        const path = await uploadProviderFile({
          configuration,
          registrationType: "dojo",
          kind: item.kind,
          file: item.file,
          onProgress: percentage => setUploadProgress(Math.round(((index + percentage / 100) / prepared.length) * 100)),
        });
        paths[item.kind] = path;
        uploadedPaths.push(path);
      }

      setStatus("Saving dojo or gym profile...");
      await localApi("/dojos", {
        method: "POST",
        body: JSON.stringify({
          establishmentType: String(formData.get("establishmentType") || ""),
          customEstablishmentType: String(formData.get("customEstablishmentType") || "").trim() || undefined,
          name: String(formData.get("name") || "").trim(),
          ownerName: String(formData.get("ownerName") || "").trim(),
          email: String(formData.get("email") || "").trim(),
          phoneNumber,
          category: String(formData.get("category") || "").trim(),
          customCategory: String(formData.get("customCategory") || "").trim() || undefined,
          address: String(formData.get("address") || "").trim(),
          city: String(formData.get("city") || "").trim(),
          state: String(formData.get("state") || "").trim(),
          pincode: String(formData.get("pincode") || "").trim(),
          experience: String(formData.get("experience") || "").trim(),
          gstNumber: String(formData.get("gstNumber") || "").trim() || undefined,
          description: String(formData.get("description") || "").trim() || undefined,
          businessPhotoPath: paths.logo,
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
      setMessage("Your dojo or gym is active and now appears in public search. Document verification remains under review.");
      router.push("/dojo-dashboard");
      router.refresh();
    } catch (error) {
      if (!saved) await cleanupProviderUploads(uploadedPaths);
      setMessage(error instanceof Error ? error.message : "Could not submit dojo or gym registration right now.");
    } finally {
      setLoading(false);
      if (!saved) setStatus("");
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
          <select name="establishmentType" required value={establishmentType} onChange={event => setEstablishmentType(event.target.value)} className="field mt-2">
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
        {ENABLE_AADHAAR ? <>
          <FileField name="aadharFront" label="Aadhaar front image for business verification" accept="image/png,image/jpeg,image/webp" required />
          <FileField name="aadharBack" label="Aadhaar back image (optional)" accept="image/png,image/jpeg,image/webp" />
        </> : null}
        <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-zinc-300">
          <input name="acceptedTerms" type="checkbox" required className="mt-1 accent-acid" />
          <span>I confirm these business details are accurate and accept the terms and privacy policy.</span>
        </label>
        <button disabled={loading} className="mt-5 rounded-xl bg-acid px-5 py-3 font-semibold text-ink disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400">
          {loading ? "Submitting registration..." : "Register Dojo / Gym"}
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
      <input name={name} type="file" accept={accept} required={required} className="mt-2 block w-full text-sm text-zinc-400 file:mr-4 file:rounded-full file:border-0 file:bg-acid file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink" />
    </label>
  );
}
