import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Browser Supabase client used ONLY for the Google OAuth (PKCE) dance.
 *
 * `persistSession: true` is required so the PKCE code-verifier survives the
 * full-page redirect to Google and back; we namespace it under `storageKey` and
 * clear it right after `exchangeCodeForSession`. `autoRefreshToken: false` and
 * `detectSessionInUrl: false` keep this client from competing with the app's own
 * localStorage token system (lib/api.ts) — after the callback we hand the tokens
 * to `completeTokenLogin()` and the existing Bearer/`/auth/refresh` plumbing owns
 * the session from there.
 *
 * Returns null when the public env vars are not configured, so callers can hide
 * the Google button gracefully instead of throwing.
 */
export function getSupabaseClient(): SupabaseClient | null {
  // Browser-only: the PKCE verifier must live in localStorage to survive the
  // OAuth redirect, so never hand back an instance during SSR.
  if (typeof window === "undefined") return null;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        flowType: "pkce",
        storageKey: "teachpad-supabase-oauth",
      },
    });
  }
  return client;
}
