"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { SOCIAL_INTERESTS, socialApi, type SocialProfile } from "@/lib/social";

const maxInterestLength = 50;

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [showOther, setShowOther] = useState(false);
  const [customInterest, setCustomInterest] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    socialApi<SocialProfile>("/me")
      .then((data) => {
        setProfile(data);
        setInterests(data.interests || []);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Could not load profile."));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const cleanInterests = uniqueInterests(interests.map(normalizeInterestValue).filter(Boolean));
    if (!cleanInterests.length) return setMessage("Choose at least one fitness interest.");
    if (cleanInterests.some((item) => item.length > maxInterestLength || !isInterestSafe(item))) return setMessage("Please remove invalid custom interests before saving.");
    setLoading(true);
    setMessage("");
    try {
      await socialApi("/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: form.get("name"),
          gender: form.get("gender"),
          birthDate: form.get("birthDate"),
          city: form.get("city"),
          state: form.get("state"),
          country: form.get("country"),
          heightCm: Number(form.get("heightCm")),
          weightKg: Number(form.get("weightKg")),
          fitnessGoal: form.get("fitnessGoal"),
          fitnessLevel: form.get("fitnessLevel"),
          profileBio: form.get("profileBio"),
          relationshipPreference: form.get("relationshipPreference") || null,
          preferredAgeMin: Number(form.get("preferredAgeMin")),
          preferredAgeMax: Number(form.get("preferredAgeMax")),
          interests: cleanInterests
        })
      });
      router.push("/profile");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update profile.");
    } finally {
      setLoading(false);
    }
  }

  function toggleInterest(interest: string) {
    setInterests((current) => current.includes(interest) ? current.filter((value) => value !== interest) : [...current, interest]);
  }

  function addCustomInterest() {
    const interest = normalizeInterestValue(customInterest);
    if (!interest) return setMessage("Write your fitness interest before adding it.");
    if (interest.length > maxInterestLength || !isInterestSafe(interest)) return setMessage("Custom interests must be 50 characters or fewer and use simple text.");
    if (interests.some((item) => item.toLowerCase() === interest.toLowerCase())) return setMessage(`${interest} is already selected.`);
    setInterests((current) => [...current, interest]);
    setCustomInterest("");
    setMessage("");
  }

  const birthDate = profile?.birthDate ? new Date(profile.birthDate).toISOString().slice(0, 10) : "";

  return (
    <AuthGuard>
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[.2em] text-acid">Profile details</p>
        <h1 className="mt-2 text-4xl font-black text-white">Edit social profile</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          These fields power Interest Match Search. Aadhaar/government ID and age-proof files stay private on the verification page.
        </p>

        {!profile ? (
          <div className="mt-8 h-80 animate-pulse rounded-3xl bg-white/[.04]" />
        ) : (
          <form onSubmit={submit} className="mt-8 rounded-3xl border border-white/10 bg-white/[.04] p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="name" defaultValue={profile.name} required placeholder="Name" className="field" />
              <select name="gender" defaultValue={profile.gender || ""} required className="field">
                <option value="" disabled>Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <input name="birthDate" type="date" defaultValue={birthDate} required className="field" />
              <input name="city" defaultValue={profile.city || ""} placeholder="City" required className="field" />
              <input name="state" defaultValue={profile.state || ""} placeholder="State" required className="field" />
              <input name="country" defaultValue={profile.country || "India"} placeholder="Country" required className="field" />
              <input name="heightCm" type="number" min="100" max="250" defaultValue={profile.heightCm || ""} placeholder="Height in cm" required className="field" />
              <input name="weightKg" type="number" min="25" max="350" step="0.1" defaultValue={profile.weightKg || ""} placeholder="Weight in kg" required className="field" />
              <input name="fitnessGoal" defaultValue={profile.fitnessGoal || ""} placeholder="Fitness goal" required className="field" />
              <select name="fitnessLevel" defaultValue={profile.fitnessLevel || "beginner"} required className="field">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="athlete">Athlete</option>
              </select>
              <input name="relationshipPreference" defaultValue={profile.relationshipPreference || ""} placeholder="Relationship preference (optional)" className="field sm:col-span-2" />
              <input name="preferredAgeMin" type="number" min="18" max="100" defaultValue={profile.preferredAgeMin || 18} className="field" />
              <input name="preferredAgeMax" type="number" min="18" max="100" defaultValue={profile.preferredAgeMax || 30} className="field" />
              <textarea name="profileBio" defaultValue={profile.profileBio || ""} minLength={20} rows={5} required placeholder="Short profile bio" className="field sm:col-span-2" />
            </div>

            <h2 className="mt-6 font-bold text-white">Interests</h2>
            <p className="mt-1 text-sm text-zinc-400">Choose at least one. Interest Match Search only compares users with the same interest.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SOCIAL_INTERESTS.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => toggleInterest(item)}
                  className={`rounded-full border px-3 py-2 text-sm ${interests.includes(item) ? "border-acid bg-acid text-ink" : "border-white/10 text-zinc-300"}`}
                >
                  {item}
                </button>
              ))}
              <button type="button" onClick={() => setShowOther((value) => !value)} className={`rounded-full border px-3 py-2 text-sm ${showOther ? "border-acid bg-acid text-ink" : "border-white/10 text-zinc-300"}`}>Other</button>
            </div>
            {showOther ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <input value={customInterest} onChange={(event) => setCustomInterest(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCustomInterest(); } }} maxLength={maxInterestLength} placeholder="Write your fitness interest" className="field" />
                <button type="button" onClick={addCustomInterest} className="rounded-xl border border-acid/40 px-5 py-3 text-sm font-bold text-acid">Add interest</button>
              </div>
            ) : null}
            {interests.some((item) => !(SOCIAL_INTERESTS as readonly string[]).includes(item)) ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {interests.filter((item) => !(SOCIAL_INTERESTS as readonly string[]).includes(item)).map((item) => <button key={item} type="button" onClick={() => toggleInterest(item)} className="rounded-full bg-acid px-3 py-1.5 text-xs font-semibold text-ink">{item} x</button>)}
              </div>
            ) : null}

            <button disabled={loading || interests.length === 0} className="mt-7 w-full rounded-xl bg-acid px-5 py-4 font-bold text-ink disabled:opacity-50">
              {loading ? "Saving..." : "Save profile"}
            </button>
            {message ? <p className="mt-4 text-red-300">{message}</p> : null}
          </form>
        )}
      </main>
    </AuthGuard>
  );
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
    return true;
  });
}

function isInterestSafe(value: string) {
  return /^[\p{L}\p{N}][\p{L}\p{N}\s&'./+-]{1,49}$/u.test(value);
}
