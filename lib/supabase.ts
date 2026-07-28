import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_OAUTH_STORAGE_KEY = "teachpad-supabase-oauth";

let client: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Browser Supabase client used ONLY for the Google OAuth (PKCE) dance.
 *
 * `persistSession: true` is required so the PKCE code-verifier survives the
 * full-page redirect to Google and back; we namespace it under `storageKey` and
 * clear it after handing the tokens to the app. `autoRefreshToken: false` and
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
        storageKey: SUPABASE_OAUTH_STORAGE_KEY,
      },
    });
  }
  return client;
}

/**
 * Remove the Supabase client's temporary OAuth state without calling
 * `auth.signOut()`. Signing out would revoke the same refresh token that has
 * just been handed to lib/api.ts, causing the app session to expire when the
 * short-lived access token needs refreshing.
 */
export function clearSupabaseOAuthStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SUPABASE_OAUTH_STORAGE_KEY);
  window.localStorage.removeItem(`${SUPABASE_OAUTH_STORAGE_KEY}-code-verifier`);
}
