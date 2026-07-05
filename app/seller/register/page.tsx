"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useSessionUser } from "@/lib/auth-client";
import { localApi, notifyAuthChanged } from "@/lib/local-api";
import { isValidIndianPhone, normalizePhone } from "@/lib/validation";

export default function SellerRegistrationPage() {
  const router = useRouter();
  const { user } = useSessionUser();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return setMessage("Please sign in before registering as a seller.");
    const source = new FormData(event.currentTarget);
    const phone = normalizePhone(String(source.get("phoneNumber")));
    const aadhaar = String(source.get("aadhaarNumber")).replace(/\D/g, "");
    if (!isValidIndianPhone(phone)) return setMessage("Enter a valid Indian mobile number.");
    if (!/^\d{12}$/.test(aadhaar)) return setMessage("Enter a valid 12 digit Aadhaar number.");

    const form = new FormData();
    for (const name of ["storeName", "address", "gstNumber", "website", "socialLinks"]) form.set(name, String(source.get(name) || ""));
    form.set("phone", phone);
    const proof = source.get("aadhaarImage");
    const profile = source.get("profileImage");
    if (proof instanceof File) form.set("aadhaar", proof);
    if (profile instanceof File) form.set("profile", profile);

    setLoading(true);
    setMessage("");
    try {
      await localApi("/sellers", { method: "POST", body: form });
      notifyAuthChanged();
      router.push("/seller-dashboard");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Seller registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
      <section>
        <p className="text-sm text-acid">FitSaathi sellers</p>
        <h1 className="mt-2 text-4xl font-bold text-white">Open your fitness store</h1>
        <p className="mt-4 leading-7 text-zinc-400">Submit your store and identity details. Verification files remain in local private storage.</p>
      </section>
      <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/[.05] p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="fullName" required defaultValue={user?.name || ""} placeholder="Full name" className="field" />
          <input name="storeName" required placeholder="Store name" className="field" />
          <input name="phoneNumber" required placeholder="Phone number" className="field" />
          <input name="email" type="email" readOnly value={user?.email || ""} placeholder="Email" className="field" />
          <input name="aadhaarNumber" required inputMode="numeric" pattern="[0-9]{12}" placeholder="12 digit Aadhaar number" className="field sm:col-span-2" />
          <textarea name="address" required rows={3} placeholder="Store location and full address" className="field sm:col-span-2" />
          <input name="gstNumber" placeholder="GST number (optional)" className="field" />
          <input name="website" type="url" placeholder="Website (optional)" className="field" />
          <input name="socialLinks" placeholder="Social links (optional)" className="field sm:col-span-2" />
        </div>
        <File name="aadhaarImage" label="Aadhaar proof image" />
        <File name="profileImage" label="Store profile image" />
        <button disabled={loading} className="mt-5 w-full rounded-xl bg-acid px-5 py-3 font-semibold text-ink disabled:bg-zinc-700">{loading ? "Submitting securely…" : "Submit seller application"}</button>
        {message ? <p className="mt-4 text-sm text-zinc-300">{message}</p> : null}
      </form>
    </main>
  );
}

function File({ name, label }: { name: string; label: string }) {
  return <label className="mt-3 block rounded-xl border border-white/10 bg-ink p-4 text-sm text-zinc-300"><span className="font-medium text-white">{label} *</span><input name={name} type="file" accept="image/jpeg,image/png,image/webp" required className="mt-2 block w-full file:mr-3 file:rounded-full file:border-0 file:bg-acid file:px-4 file:py-2 file:font-semibold file:text-ink" /></label>;
}
