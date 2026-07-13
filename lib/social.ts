import { API_URL, localApi } from "@/lib/local-api";

export const SOCIAL_INTERESTS = [
  "Karate", "Gym", "Powerlifting", "Yoga", "MMA", "Running", "Cycling", "Swimming", "Football", "Cricket",
  "Calisthenics", "Dance", "Zumba", "Boxing", "Taekwondo", "Kickboxing", "Bodybuilding", "CrossFit", "Pilates", "Meditation",
  "Badminton", "Basketball", "Hiking", "Functional Training", "Martial Arts", "Strength Training", "Weight Loss", "Mobility"
] as const;

export type SocialProfile = {
  id: string; name: string; age: number | null; gender?: string; city?: string; state?: string; country?: string;
  email?: string; phone?: string; birthDate?: string | null; heightCm?: number | null; weightKg?: number | null;
  profileBio?: string; fitnessGoal?: string; fitnessLevel?: string; relationshipPreference?: string;
  preferredAgeMin?: number | null; preferredAgeMax?: number | null;
  photos: string[]; interests: string[]; verified: boolean; verificationStatus?: string; online: boolean;
  compatibility?: number; distanceKm?: number | null; achievements?: Array<{ id: string; title: string; details?: string }>;
  socialLinks?: Array<{ id: string; platform: string; url: string }>; reviews?: Array<any>; profileCompletion?: Record<string, unknown> & { percent: number };
};

export const socialApi = <T>(path: string, init: RequestInit = {}) => localApi<T>(`/social${path}`, init);

export function socialAsset(path?: string | null) {
  if (!path) return "";
  const origin = API_URL.startsWith("http") ? API_URL.replace(/\/api$/, "") : "";
  return path.startsWith("http") ? path : `${origin}${path}`;
}
