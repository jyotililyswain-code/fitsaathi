"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ImagePlus, Save, Trash2, Upload } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { DojoProfileImage } from "@/components/DojoProfileImage";
import {
  DOJO_FALLBACK_IMAGE,
  resolveDojoImageUrl,
  type DojoImageFit,
  type DojoImagePosition,
} from "@/lib/dojo-image";
import { API_URL, localApi } from "@/lib/local-api";
import {
  cleanupProviderUploads,
  getProviderUploadConfiguration,
  prepareProviderFile,
  uploadProviderFile,
} from "@/lib/provider-registration-upload";
import { validateProviderFileSelection } from "@/lib/provider-upload-rules";
import { isValidIndianPhone, normalizePhone } from "@/lib/validation";

type EditableDojo = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  city: string | null;
  address: string | null;
  phoneNumber: string | null;
  imageFit: DojoImageFit;
  imagePosition: DojoImagePosition;
  imageUrl: string;
  hasImage: boolean;
};

type FormState = {
  name: string;
  description: string;
  category: string;
  city: string;
  address: string;
  phoneNumber: string;
  imageFit: DojoImageFit;
  imagePosition: DojoImagePosition;
};

const apiOrigin = API_URL.startsWith("http") ? API_URL.replace(/\/api$/, "") : "";

export default function EditDojoProfilePage() {
  const params = useParams<{ dojoId?: string }>();
  const dojoId = params?.dojoId || "";
  return (
    <AuthGuard>
      <DojoProfileEditor dojoId={dojoId} />
    </AuthGuard>
  );
}

function DojoProfileEditor({ dojoId }: { dojoId: string }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [dojo, setDojo] = useState<EditableDojo | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [removePhoto, setRemovePhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const loadDojo = useCallback(async () => {
    if (!dojoId) return;
    setLoading(true);
    setError("");
    try {
      const record = await localApi<EditableDojo>(`/dojos/${dojoId}/edit`);
      const resolved = {
        ...record,
        imageUrl: resolveDojoImageUrl(record.hasImage ? record.imageUrl : null, record.id, apiOrigin),
      };
      setDojo(resolved);
      setForm({
        name: record.name || "",
        description: record.description || "",
        category: record.category || "",
        city: record.city || "",
        address: record.address || "",
        phoneNumber: record.phoneNumber || "",
        imageFit: record.imageFit === "cover" ? "cover" : "contain",
        imagePosition: ["top", "center", "bottom"].includes(record.imagePosition) ? record.imagePosition : "center",
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The dojo profile could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [dojoId]);

  useEffect(() => {
    void loadDojo();
  }, [loadDojo]);

  useEffect(() => {
    if (!selectedPhoto) {
      setPreviewUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(selectedPhoto);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedPhoto]);

  function choosePhoto(file: File | null) {
    setSuccess("");
    setError("");
    if (!file) return setError("No image was selected.");
    const validationError = validateProviderFileSelection(file, "dojo", "logo");
    if (validationError) return setError(validationError);
    setSelectedPhoto(file);
    setRemovePhoto(false);
    setStatus(`${file.name} is ready to upload when you save.`);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    choosePhoto(event.target.files?.[0] || null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    choosePhoto(event.dataTransfer.files?.[0] || null);
  }

  function markPhotoForRemoval() {
    setSelectedPhoto(null);
    if (fileInput.current) fileInput.current.value = "";
    setRemovePhoto(true);
    setSuccess("");
    setError("");
    setStatus("The current photo will be removed when you save the profile.");
  }

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(current => current ? { ...current, [field]: value } : current);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || !dojo || saving) return;
    const phoneNumber = normalizePhone(form.phoneNumber);
    if (!isValidIndianPhone(phoneNumber)) {
      setError("Enter a valid 10 digit Indian mobile number.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    setUploadProgress(0);
    let uploadedPath = "";
    try {
      if (selectedPhoto) {
        setStatus("Validating and preparing the new dojo photo...");
        const preparedPhoto = await prepareProviderFile(selectedPhoto, "dojo", "logo");
        const configuration = (await getProviderUploadConfiguration("dojo", dojoId)).data;
        setStatus("Uploading the new dojo photo...");
        uploadedPath = await uploadProviderFile({
          configuration,
          registrationType: "dojo",
          kind: "logo",
          profileId: dojoId,
          file: preparedPhoto,
          onProgress: percentage => setUploadProgress(Math.round(percentage)),
        });
      }

      setStatus("Saving dojo profile...");
      const payload: FormState & { imagePath?: string | null } = {
        ...form,
        phoneNumber,
        ...(uploadedPath ? { imagePath: uploadedPath } : removePhoto ? { imagePath: null } : {}),
      };
      const updated = await localApi<EditableDojo>(`/dojos/${dojoId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const resolved = {
        ...updated,
        imageUrl: resolveDojoImageUrl(updated.hasImage ? updated.imageUrl : null, updated.id, apiOrigin),
      };
      setDojo(resolved);
      setForm({
        name: updated.name || "",
        description: updated.description || "",
        category: updated.category || "",
        city: updated.city || "",
        address: updated.address || "",
        phoneNumber: updated.phoneNumber || "",
        imageFit: updated.imageFit,
        imagePosition: updated.imagePosition,
      });
      setSelectedPhoto(null);
      setRemovePhoto(false);
      if (fileInput.current) fileInput.current.value = "";
      setStatus("");
      setSuccess("Dojo profile saved. The latest photo and display settings are now live.");
      router.refresh();
    } catch (saveError) {
      if (uploadedPath) await cleanupProviderUploads([uploadedPath]);
      setStatus("");
      setError(saveError instanceof Error ? saveError.message : "The dojo profile could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-5xl px-4 py-12 text-zinc-300">Loading dojo profile...</main>;
  }
  if (!dojo || !form) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-12">
        <section className="w-full rounded-2xl border border-red-400/25 bg-red-400/10 p-6">
          <h1 className="text-2xl font-bold text-white">Profile access unavailable</h1>
          <p className="mt-3 text-red-100" role="alert">{error || "The dojo profile could not be loaded."}</p>
          <Link href="/dojo-dashboard" className="focus-ring mt-6 inline-flex rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold text-white">Back to dashboard</Link>
        </section>
      </main>
    );
  }

  const displayedImage = removePhoto ? DOJO_FALLBACK_IMAGE : previewUrl || dojo.imageUrl;
  const hasPhoto = Boolean(selectedPhoto || (dojo.hasImage && !removePhoto));

  return (
    <main className="mx-auto w-full max-w-5xl overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-acid">Owner profile settings</p>
          <h1 className="mt-2 break-words text-3xl font-bold text-white sm:text-4xl">Edit {dojo.name}</h1>
          <p className="mt-3 text-zinc-400">Update the public details and control how the dojo photo is displayed.</p>
        </div>
        <Link href={`/dojos/${dojoId}`} className="focus-ring inline-flex w-full shrink-0 justify-center rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-acid/50 hover:text-acid sm:w-auto">View public profile</Link>
      </div>

      <form onSubmit={saveProfile} className="mt-8 space-y-6">
        <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <ImagePlus className="mt-0.5 h-5 w-5 shrink-0 text-acid" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-semibold text-white">Dojo profile photo</h2>
              <p id="photo-help" className="mt-1 text-sm leading-6 text-zinc-400">JPG, PNG, or WebP only. Maximum file size 5 MB.</p>
            </div>
          </div>

          <div className="mt-5">
            <DojoProfileImage
              dojoName={form.name || dojo.name}
              imageUrl={displayedImage}
              imageFit={form.imageFit}
              imagePosition={form.imagePosition}
            />
          </div>

          <div
            className="mt-4 rounded-2xl border border-dashed border-white/20 bg-ink/50 p-4 text-center transition hover:border-acid/50 sm:p-6"
            onDragOver={event => event.preventDefault()}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-6 w-6 text-acid" aria-hidden="true" />
            <p className="mt-2 text-sm text-zinc-300">Drag and drop a photo here, or choose one from your device.</p>
            <input
              ref={fileInput}
              id="dojo-profile-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              aria-describedby="photo-help"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="focus-ring mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-acid px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white sm:w-auto"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {hasPhoto ? "Replace photo" : "Upload new photo"}
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 break-words text-sm text-zinc-400">{selectedPhoto ? `Selected: ${selectedPhoto.name}` : hasPhoto ? "Current profile photo" : "Using the fallback dojo image"}</p>
            <button
              type="button"
              disabled={!hasPhoto || saving}
              onClick={markPhotoForRemoval}
              className="focus-ring inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full border border-red-400/30 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove photo
            </button>
          </div>

          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-white">Image fitting preference</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ImageFitOption
                checked={form.imageFit === "contain"}
                title="Show complete image"
                description="Keeps the full photo visible without cropping. Recommended."
                onChange={() => updateField("imageFit", "contain")}
              />
              <ImageFitOption
                checked={form.imageFit === "cover"}
                title="Fill image area"
                description="Fills the frame and may crop the photo edges."
                onChange={() => updateField("imageFit", "cover")}
              />
            </div>
          </fieldset>

          <label className="mt-5 block text-sm font-medium text-zinc-300">
            Vertical position
            <select
              value={form.imagePosition}
              disabled={form.imageFit !== "cover"}
              onChange={event => updateField("imagePosition", event.target.value as DojoImagePosition)}
              className="field mt-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="top">Top</option>
              <option value="center">Centre</option>
              <option value="bottom">Bottom</option>
            </select>
            <span className="mt-2 block text-xs text-zinc-500">Available when “Fill image area” is selected.</span>
          </label>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-white">Public dojo details</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Dojo name" value={form.name} onChange={value => updateField("name", value)} minLength={2} maxLength={120} />
            <Field label="Martial art or category" value={form.category} onChange={value => updateField("category", value)} minLength={2} maxLength={80} />
            <Field label="City" value={form.city} onChange={value => updateField("city", value)} minLength={2} maxLength={80} />
            <Field label="Contact number" value={form.phoneNumber} onChange={value => updateField("phoneNumber", value)} type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} />
          </div>
          <Field label="Address" value={form.address} onChange={value => updateField("address", value)} minLength={5} maxLength={500} className="mt-4" />
          <label className="mt-4 block text-sm font-medium text-zinc-300">
            Description
            <textarea
              rows={6}
              maxLength={2000}
              value={form.description}
              onChange={event => updateField("description", event.target.value)}
              className="field mt-2 resize-y"
            />
          </label>
        </section>

        {uploadProgress > 0 && saving ? (
          <div className="rounded-2xl border border-acid/25 bg-acid/10 p-4" role="status" aria-live="polite">
            <div className="flex items-center justify-between gap-4 text-sm text-zinc-200">
              <span>Photo upload progress</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress}>
              <div className="h-full rounded-full bg-acid transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : null}

        <div aria-live="polite" className="space-y-3">
          {status ? <p className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-zinc-300">{status}</p> : null}
          {success ? <p className="rounded-xl border border-acid/30 bg-acid/10 p-3 text-sm text-emerald-100" role="status">{success}</p> : null}
          {error ? <p className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100" role="alert">{error}</p> : null}
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href={`/dojos/${dojoId}`} className="focus-ring inline-flex w-full items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white sm:w-auto">Cancel</Link>
          <button
            type="submit"
            disabled={saving}
            className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 sm:w-auto"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? "Saving profile..." : "Save profile"}
          </button>
        </div>
      </form>
    </main>
  );
}

function ImageFitOption({ checked, title, description, onChange }: { checked: boolean; title: string; description: string; onChange: () => void }) {
  return (
    <label className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${checked ? "border-acid/60 bg-acid/10" : "border-white/10 bg-ink/40 hover:border-white/25"}`}>
      <input type="radio" name="imageFit" checked={checked} onChange={onChange} className="mt-1 h-4 w-4 accent-acid" />
      <span>
        <span className="block font-semibold text-white">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-zinc-400">{description}</span>
      </span>
    </label>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  type?: string;
  inputMode?: "numeric";
  pattern?: string;
  minLength?: number;
  maxLength?: number;
};

function Field({ label, value, onChange, className = "", type = "text", ...inputProps }: FieldProps) {
  return (
    <label className={`block text-sm font-medium text-zinc-300 ${className}`}>
      {label}
      <input required type={type} value={value} onChange={event => onChange(event.target.value)} className="field mt-2" {...inputProps} />
    </label>
  );
}
