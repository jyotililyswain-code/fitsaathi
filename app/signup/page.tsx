"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { POLICY_VERSION } from "@/lib/policies";
import { localApi, notifyAuthChanged } from "@/lib/local-api";
import { supabase } from "@/lib/supabase";
import { normalizeEmail } from "@/lib/auth/email";
import { SOCIAL_INTERESTS } from "@/lib/social";
import { isValidIndianPhone, normalizePhone } from "@/lib/validation";
import { AuthModeTabs } from "@/components/AuthModeTabs";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { safeAuthRedirect } from "@/lib/auth-redirect";

const maxInterestLength = 50;

export default function SignupPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [showOther, setShowOther] = useState(false);
  const [customInterest, setCustomInterest] = useState("");
  const age = useMemo(() => calculateAge(birthDate), [birthDate]);

  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get("interests");
    if (!selected) return;
    const seeded = selected.split(",").map(normalizeInterestValue).filter(Boolean);
    setInterests(uniqueInterests(seeded));
  }, []);

  function toggleInterest(interest: string) {
    setInterests((current) => current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]);
  }

  function addCustomInterest() {
    const interest = normalizeInterestValue(customInterest);
    if (!interest) return setMessage("Write your fitness interest before adding it.");
    if (interest.length > maxInterestLength) return setMessage("Custom interests must be 50 characters or fewer.");
    if (!isInterestSafe(interest)) return setMessage("Use letters, numbers, spaces, and simple punctuation for interests.");
    if (interests.some((item) => item.toLowerCase() === interest.toLowerCase())) return setMessage(`${interest} is already selected.`);
    setInterests((current) => [...current, interest]);
    setCustomInterest("");
    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    const confirmation = String(form.get("passwordConfirmation"));
    const email = normalizeEmail(String(form.get("email")));
    const phone = normalizePhone(String(form.get("phone")));
    const cleanInterests = uniqueInterests(interests.map(normalizeInterestValue).filter(Boolean));

    if (!acceptedTerms || !acceptedPrivacy) return setMessage("Accept the Terms and Privacy Policy to continue.");
    if (!email) return setMessage("Enter a valid email address without spaces.");
    if (!isStrongPassword(password)) return setMessage("Use 8+ characters with uppercase, lowercase, number and symbol.");
    if (password !== confirmation) return setMessage("Passwords do not match.");
    if (!isValidIndianPhone(phone)) return setMessage("Enter a valid 10 digit Indian mobile number.");
    if (!cleanInterests.length) return setMessage("Choose at least one fitness interest.");
    if (cleanInterests.some((item) => item.length > maxInterestLength || !isInterestSafe(item))) return setMessage("Please remove invalid custom interests before continuing.");

    setLoading(true);
    setMessage("");
    try {
      const result = await localApi<{ redirectTo: string; supabaseSession: { access_token: string; refresh_token: string } }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: String(form.get("name")).trim(),
          email,
          password,
          accountType: form.get("accountType"),
          phone,
          gender: form.get("gender"),
          birthDate,
          city: form.get("city"),
          state: form.get("state"),
          country: form.get("country"),
          heightCm: Number(form.get("heightCm")),
          weightKg: Number(form.get("weightKg")),
          fitnessGoal: form.get("fitnessGoal"),
          relationshipPreference: form.get("relationshipPreference") || undefined,
          profileBio: form.get("profileBio"),
          fitnessLevel: form.get("fitnessLevel"),
          interests: cleanInterests,
          acceptedPolicies: true,
          acceptedPolicyVersion: POLICY_VERSION
        })
      });
      if (supabase) await supabase.auth.setSession(result.supabaseSession);
      notifyAuthChanged();
      const requestedPath = new URLSearchParams(window.location.search).get(
        "next",
      );
      router.replace(
        safeAuthRedirect(requestedPath, result.redirectTo || "/dashboard"),
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <AuthModeTabs current="signup" />
        <p className="mt-6 text-sm font-semibold uppercase tracking-[.22em] text-acid">Create your FitSaathi identity</p>
        <h1 className="mt-3 text-4xl font-black text-white sm:text-5xl">Tell us how you move.</h1>
        <p className="mt-3 text-zinc-400">Your public profile is separate from private verification documents. Registration and verification are free, with no charges or hidden fees.</p>
        <div className="mt-6 max-w-md">
          <GoogleOAuthButton />
          <div className="mt-4 flex items-center gap-3 text-xs uppercase text-zinc-500" aria-hidden="true">
            <span className="h-px flex-1 bg-white/10" />
            <span>or create with email</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>
        </div>
        <div className="mt-6 grid gap-2 sm:grid-cols-4">
          {["Account", "Interests", "Complete"].map((step, index) => (
            <div key={step} className={`rounded-2xl border px-4 py-3 text-sm ${index === 0 ? "border-acid bg-acid/10 text-acid" : "border-white/10 text-zinc-400"}`}>
              <span className="mr-2 font-black">{index + 1}</span>{step}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="rounded-[2rem] border border-white/10 bg-white/[.04] p-5 sm:p-8">
        <Section title="Account">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-zinc-400 sm:col-span-2">Account type<select name="accountType" required defaultValue="customer" className="field mt-1">
              <option value="customer">Customer</option>
              <option value="coach">Coach</option>
              <option value="dojo">Dojo owner</option>
              <option value="gym">Gym owner</option>
              <option value="seller">Seller</option>
            </select></label>
            <Field name="name" autoComplete="name" placeholder="Full name" />
            <Field name="email" type="email" autoComplete="email" inputMode="email" placeholder="Email address" />
            <Field name="phone" type="tel" autoComplete="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" placeholder="Phone number" />
            <label className="block text-sm text-zinc-400">Gender<select name="gender" required className="field mt-1">
              <option value="">Choose gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select></label>
            <label className="text-sm text-zinc-400">Birth date<input name="birthDate" type="date" required value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className="field mt-1" /></label>
            <label className="text-sm text-zinc-400">Age<input readOnly value={age ?? ""} placeholder="Calculated automatically" className="field mt-1 opacity-70" /></label>
            <div className="relative"><Field name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Password" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute bottom-0 right-1 min-h-12 px-3 text-xs font-bold text-acid">{showPassword ? "Hide" : "Show"}</button></div>
            <Field name="passwordConfirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Confirm password" />
          </div>
        </Section>

        <Section title="Location & body">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field name="city" autoComplete="address-level2" placeholder="City" />
            <Field name="state" autoComplete="address-level1" placeholder="State" />
            <Field name="country" autoComplete="country-name" defaultValue="India" placeholder="Country" />
            <Field name="heightCm" type="number" inputMode="decimal" min="100" max="250" placeholder="Height (cm)" />
            <Field name="weightKg" type="number" inputMode="decimal" min="25" max="350" step="0.1" placeholder="Weight (kg)" />
            <label className="block text-sm text-zinc-400">Fitness level<select name="fitnessLevel" required className="field mt-1">
              <option value="">Choose fitness level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="athlete">Athlete</option>
            </select></label>
          </div>
        </Section>

        <Section title="Goals & preferences">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field name="fitnessGoal" placeholder="Fitness goal" />
            <Field name="relationshipPreference" required={false} placeholder="Relationship preference (optional)" />
            <label className="block text-sm text-zinc-400 sm:col-span-2">Profile bio<textarea name="profileBio" required minLength={20} maxLength={1200} rows={4} placeholder="Your training style, experience and what you are looking for" className="field mt-1" /></label>
          </div>
        </Section>

        <Section title="Fitness interests">
          <div className="flex flex-wrap gap-2">
            {SOCIAL_INTERESTS.map((interest) => <InterestChip key={interest} selected={interests.includes(interest)} onClick={() => toggleInterest(interest)}>{interest}</InterestChip>)}
            <InterestChip selected={showOther} onClick={() => setShowOther((value) => !value)}>Other</InterestChip>
          </div>
          {showOther ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input value={customInterest} onChange={(event) => setCustomInterest(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCustomInterest(); } }} maxLength={maxInterestLength} placeholder="Write your fitness interest" className="field" />
              <button type="button" onClick={addCustomInterest} className="rounded-xl border border-acid/40 px-5 py-3 text-sm font-bold text-acid">Add interest</button>
            </div>
          ) : null}
          {interests.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {interests.map((interest) => <button type="button" key={interest} onClick={() => toggleInterest(interest)} className="rounded-full bg-acid px-3 py-1.5 text-xs font-semibold text-ink">{interest} x</button>)}
            </div>
          ) : null}
        </Section>

        <div className="mt-7 grid gap-3 text-sm text-zinc-300">
          <Agreement checked={acceptedTerms} setChecked={setAcceptedTerms}>I accept the <Link className="text-acid" href="/terms">Terms & Conditions</Link>.</Agreement>
          <Agreement checked={acceptedPrivacy} setChecked={setAcceptedPrivacy}>I accept the <Link className="text-acid" href="/privacy">Privacy Policy</Link> and private verification processing.</Agreement>
        </div>
        <button disabled={loading} className="mt-7 w-full rounded-xl bg-acid px-5 py-4 font-bold text-ink disabled:opacity-50">{loading ? "Creating secure profile..." : "Continue to verification"}</button>
        {message ? <p role="alert" className="mt-4 text-sm text-red-300">{message}</p> : null}
      </form>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="border-b border-white/10 py-6 first:pt-0 last:border-0"><h2 className="mb-4 text-lg font-bold text-white">{title}</h2>{children}</section>;
}

function Field({ required = true, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { required?: boolean }) {
  const label = typeof props["aria-label"] === "string"
    ? props["aria-label"]
    : typeof props.placeholder === "string"
      ? props.placeholder
      : props.name;
  return <label className="block text-sm text-zinc-400">{label}<input required={required} className="field mt-1" {...props} /></label>;
}

function InterestChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`rounded-full border px-3 py-2 text-sm ${selected ? "border-acid bg-acid text-ink" : "border-white/10 text-zinc-300"}`}>{children}</button>;
}

function Agreement({ checked, setChecked, children }: { checked: boolean; setChecked: (value: boolean) => void; children: React.ReactNode }) {
  return <label className="flex gap-3 rounded-xl border border-white/10 p-4"><input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="h-5 w-5 accent-acid" /><span>{children}</span></label>;
}

function normalizeInterestValue(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function uniqueInterests(values: string[]) {
  const seen = new Set<string>();
  return values.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return item.length <= maxInterestLength && isInterestSafe(item);
  });
}

function isInterestSafe(value: string) {
  return /^[\p{L}\p{N}][\p{L}\p{N}\s&'./+-]{1,49}$/u.test(value);
}

function calculateAge(value: string) {
  if (!value) return null;
  const birth = new Date(value);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
}

function isStrongPassword(password: string) {
  return password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}
