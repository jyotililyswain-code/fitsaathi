import type { User as SupabaseUser } from "@supabase/supabase-js";
import { normalizeEmail } from "@/lib/auth/email";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/lib/roles";

export type GoogleProfileRecord = {
  id: string;
  authUserId: string | null;
  name: string;
  email: string;
  emailVerifiedAt: Date | null;
  avatarUrl: string | null;
  role: UserRole;
  accountStatus: string;
};

type GoogleProfileCreate = GoogleProfileRecord & {
  emailNormalized: string;
  registrationIntent: "customer";
  emailVerified: true;
};

type GoogleProfileUpdate = {
  authUserId: string;
  emailVerified: true;
  emailVerifiedAt: Date;
  accountStatus?: "active";
};

export type GoogleProfileStore = {
  findByAuthUserId: (authUserId: string) => Promise<GoogleProfileRecord | null>;
  findByEmail: (emailNormalized: string) => Promise<GoogleProfileRecord | null>;
  create: (data: GoogleProfileCreate) => Promise<GoogleProfileRecord>;
  update: (id: string, data: GoogleProfileUpdate) => Promise<GoogleProfileRecord>;
};

const unavailableStatuses = new Set(["banned", "suspended", "rejected", "deleted"]);

const prismaGoogleProfileStore: GoogleProfileStore = {
  findByAuthUserId: (authUserId) => prisma.user.findUnique({ where: { authUserId } }),
  findByEmail: (emailNormalized) => prisma.user.findUnique({ where: { emailNormalized } }),
  create: (data) => prisma.user.create({ data }),
  update: (id, data) => prisma.user.update({ where: { id }, data })
};

export class GoogleOAuthIdentityError extends Error {
  constructor() {
    super("The Google identity could not be linked safely.");
    this.name = "GoogleOAuthIdentityError";
  }
}

export async function provisionGoogleProfile(
  authUser: SupabaseUser,
  store: GoogleProfileStore = prismaGoogleProfileStore,
  retryOnConflict = true
) {
  const identity = readGoogleIdentity(authUser);
  const [byAuthId, byEmail] = await Promise.all([
    store.findByAuthUserId(identity.id),
    store.findByEmail(identity.email)
  ]);

  if (byAuthId && byEmail && byAuthId.id !== byEmail.id) throw new GoogleOAuthIdentityError();
  const existing = byAuthId || byEmail;

  if (existing) {
    if (existing.authUserId && existing.authUserId !== identity.id) throw new GoogleOAuthIdentityError();
    if (unavailableStatuses.has(existing.accountStatus)) return existing;

    return store.update(existing.id, {
      authUserId: identity.id,
      emailVerified: true,
      emailVerifiedAt: existing.emailVerifiedAt || identity.confirmedAt,
      ...(existing.accountStatus === "pending_email_verification" ? { accountStatus: "active" } : {})
    });
  }

  try {
    return await store.create({
      id: identity.id,
      authUserId: identity.id,
      name: identity.name,
      email: identity.email,
      emailNormalized: identity.email,
      avatarUrl: identity.avatarUrl,
      role: "customer",
      registrationIntent: "customer",
      accountStatus: "active",
      emailVerified: true,
      emailVerifiedAt: identity.confirmedAt
    });
  } catch (error) {
    if (retryOnConflict && isUniqueConflict(error)) return provisionGoogleProfile(authUser, store, false);
    throw error;
  }
}

function readGoogleIdentity(authUser: SupabaseUser) {
  const providers = Array.isArray(authUser.app_metadata?.providers) ? authUser.app_metadata.providers : [];
  const isGoogle = authUser.app_metadata?.provider === "google" || providers.includes("google") || authUser.identities?.some((identity) => identity.provider === "google");
  const email = normalizeEmail(authUser.email || "");
  const confirmedAt = parseConfirmedAt(authUser.email_confirmed_at || authUser.confirmed_at);

  if (!isGoogle || !email || !confirmedAt) throw new GoogleOAuthIdentityError();

  const metadataName = [authUser.user_metadata?.full_name, authUser.user_metadata?.name]
    .find((value) => typeof value === "string" && value.trim());
  const name = String(metadataName || email.split("@")[0]).replace(/\s+/g, " ").trim().slice(0, 80);

  return {
    id: authUser.id,
    email,
    name: name || "FitSaathi member",
    avatarUrl: safeAvatarUrl(authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture),
    confirmedAt
  };
}

function safeAvatarUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function parseConfirmedAt(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isUniqueConflict(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}
