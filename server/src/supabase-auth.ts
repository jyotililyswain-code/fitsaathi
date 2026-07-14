import type { Session, User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../../lib/supabase";
import { createSupabaseAdminClient } from "../../lib/supabase-admin";

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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_ORIGIN || "https://fitsaathi.com";
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
      "EMAIL_VERIFICATION_REQUIRED",
      403,
      "Verify your email before signing in.",
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
      emailRedirectTo: siteRedirect("/auth/verify-email"),
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
  if (data.session || data.user.email_confirmed_at) {
    await deleteSupabaseAuthUser(data.user.id);
    throw new SupabaseAuthOperationError(
      "EMAIL_CONFIRMATION_DISABLED",
      503,
      "Email verification is not configured correctly. Please contact FitSaathi support.",
    );
  }
  return data.user;
}

export async function signInSupabaseUser(email: string, password: string) {
  const client = requiredClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw mapAuthError(error);
  if (!data.user.email_confirmed_at || !data.session) {
    throw new SupabaseAuthOperationError(
      "EMAIL_VERIFICATION_REQUIRED",
      403,
      "Verify your email before signing in.",
    );
  }
  return { user: data.user, session: safeSession(data.session) };
}

export async function verifySupabaseEmailOtp(email: string, token: string) {
  const client = requiredClient();
  const { data, error } = await client.auth.verifyOtp({ email, token, type: "email" });
  if (error) throw mapAuthError(error);
  if (!data.user?.email_confirmed_at || !data.session) {
    throw new SupabaseAuthOperationError(
      "EMAIL_VERIFICATION_REQUIRED",
      403,
      "Your email could not be verified. Request a new code and try again.",
    );
  }
  return { user: data.user, session: safeSession(data.session) };
}

export async function resendSupabaseSignupOtp(email: string) {
  const client = requiredClient();
  const { error } = await client.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: siteRedirect("/auth/verify-email") },
  });
  if (error) throw mapAuthError(error);
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
