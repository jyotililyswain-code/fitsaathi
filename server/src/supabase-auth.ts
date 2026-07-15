import type { Session, User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../../lib/supabase";
import { createSupabaseAdminClient } from "../../lib/supabase-admin";
import { prisma } from "./db";

type AuthUserInput = {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  registrationIntent?: string;
};

export class SupabaseAuthOperationError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "SupabaseAuthOperationError";
  }
}

function siteRedirect(path: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_ORIGIN || "https://thefitsaathi.com";
  return siteUrl ? new URL(path, siteUrl).toString() : undefined;
}

function requiredClient() {
  const client = createSupabaseServerClient();
  if (!client) {
    throw new SupabaseAuthOperationError(
      "AUTH_PROVIDER_NOT_CONFIGURED",
      503,
      "Email verification is temporarily unavailable.",
    );
  }
  return client;
}

function mapAuthError(error: { code?: string; status?: number; message?: string }) {
  const code = String(error.code || "AUTH_PROVIDER_ERROR");
  if (code === "email_not_confirmed") {
    return new SupabaseAuthOperationError(
      "ACCOUNT_ACTIVATION_FAILED",
      503,
      "The account could not be activated automatically.",
    );
  }
  if (code.includes("rate_limit") || error.status === 429) {
    return new SupabaseAuthOperationError(
      "AUTH_RATE_LIMITED",
      429,
      "Too many verification attempts. Please wait before trying again.",
    );
  }
  if (code.includes("expired")) {
    return new SupabaseAuthOperationError(
      "OTP_EXPIRED",
      400,
      "This verification code has expired. Request a new code.",
    );
  }
  if (code.includes("invalid") || code.includes("otp")) {
    return new SupabaseAuthOperationError(
      "OTP_INVALID",
      400,
      "The verification code is incorrect. Please check the code and try again.",
    );
  }
  return new SupabaseAuthOperationError(
    "INVALID_CREDENTIALS",
    401,
    "Invalid email or password.",
  );
}

export async function createSupabaseAuthUser(input: AuthUserInput) {
  const client = requiredClient();
  const { data, error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        name: input.name,
        phone: input.phone,
        registration_intent: input.registrationIntent || "customer",
      },
    },
  });
  if (error) throw mapAuthError(error);
  if (!data.user) {
    throw new SupabaseAuthOperationError(
      "SIGNUP_UNAVAILABLE",
      503,
      "We could not create this account. Please try again shortly.",
    );
  }
  if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new SupabaseAuthOperationError(
      "ACCOUNT_UNAVAILABLE",
      409,
      "We could not create this account. Try signing in or request a new verification code.",
    );
  }
  let session = data.session;
  if (!data.user.email_confirmed_at) await automaticallyConfirmSupabaseUser(data.user.id);
  if (!session) {
    const signedIn = await client.auth.signInWithPassword({ email: input.email, password: input.password });
    if (signedIn.error || !signedIn.data.session) throw mapAuthError(signedIn.error || { code: "invalid_credentials" });
    session = signedIn.data.session;
  }
  return { user: session.user, session: safeSession(session) };
}

export async function signInSupabaseUser(email: string, password: string) {
  const client = requiredClient();
  let { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error?.code === "email_not_confirmed") {
    const record = await prisma.user.findFirst({ where: { OR: [{ emailNormalized: email }, { email: { equals: email, mode: "insensitive" } }] }, select: { authUserId: true } });
    if (record?.authUserId) {
      await automaticallyConfirmSupabaseUser(record.authUserId);
      ({ data, error } = await client.auth.signInWithPassword({ email, password }));
    }
  }
  if (error) throw mapAuthError(error);
  if (!data.session) throw new SupabaseAuthOperationError("INVALID_CREDENTIALS", 401, "Invalid email or password.");
  return { user: data.user, session: safeSession(data.session) };
}

async function automaticallyConfirmSupabaseUser(userId: string) {
  const admin = createSupabaseAdminClient();
  if (admin) {
    const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
    if (!error) return;
  }
  const updated = await prisma.$executeRaw`
    UPDATE auth.users
    SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()), updated_at = NOW()
    WHERE id = CAST(${userId} AS uuid)
  `;
  if (!updated) throw new SupabaseAuthOperationError("ACCOUNT_ACTIVATION_FAILED", 503, "The account could not be activated.");
}

export async function updateSupabasePassword(email: string, currentPassword: string, newPassword: string) {
  const client = requiredClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password: currentPassword });
  if (error || !data.session) throw mapAuthError(error || { code: "invalid_credentials" });
  const { error: updateError } = await client.auth.updateUser({ password: newPassword });
  if (updateError) throw mapAuthError(updateError);
}

export async function deleteSupabaseAuthUser(userId: string) {
  const admin = createSupabaseAdminClient();
  if (!admin) return false;
  const { error } = await admin.auth.admin.deleteUser(userId);
  return !error;
}

export async function sendSupabasePasswordReset(email: string) {
  const client = requiredClient();
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: siteRedirect("/login"),
  });
  if (error && error.status === 429) throw mapAuthError(error);
  return true;
}

function safeSession(session: Session) {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type,
    user: safeAuthUser(session.user),
  };
}

function safeAuthUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    email_confirmed_at: user.email_confirmed_at,
  };
}
