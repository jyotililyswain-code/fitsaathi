import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured && typeof window !== "undefined"
  ? createBrowserClient(supabaseUrl, supabaseAnonKey, {
      cookies: { encode: "tokens-only" },
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true
      }
    })
  : null;

type SupabaseSsrCookieMethods = Parameters<typeof createServerClient>[2]["cookies"];

export function createSupabaseSsrServerClient(cookies: SupabaseSsrCookieMethods) {
  if (!isSupabaseConfigured) return null;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: { ...cookies, encode: "tokens-only" }
  });
}

export function createSupabaseServerClient() {
  if (!isSupabaseConfigured) return null;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    }
  });
}

export function requireSupabaseClient() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return supabase;
}
