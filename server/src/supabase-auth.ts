import { createSupabaseServerClient, isSupabaseConfigured } from "../../lib/supabase";

type AuthUserInput = {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  role?: string;
};

function siteRedirect(path: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_ORIGIN || "";
  return siteUrl ? new URL(path, siteUrl).toString() : undefined;
}

export async function createSupabaseAuthUser(input: AuthUserInput) {
  if (!isSupabaseConfigured) return;
  const client = createSupabaseServerClient();
  if (!client) return;

  const { data, error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        name: input.name,
        phone: input.phone,
        role: input.role || "customer"
      },
      emailRedirectTo: siteRedirect("/login")
    }
  });

  if (error) {
    throw new Error(`Supabase Auth signup failed: ${error.message}`);
  }

  return data.user?.id;
}

export async function rememberSupabaseAuthLogin(email: string, password: string) {
  if (!isSupabaseConfigured) return;
  const client = createSupabaseServerClient();
  if (!client) return;

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    console.warn("supabase_auth_login_skipped", error.message);
  }
}

export async function sendSupabasePasswordReset(email: string) {
  if (!isSupabaseConfigured) return false;
  const client = createSupabaseServerClient();
  if (!client) return false;

  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: siteRedirect("/login")
  });

  if (error) {
    throw new Error(`Supabase password reset failed: ${error.message}`);
  }

  return true;
}
