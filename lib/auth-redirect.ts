/**
 * Returns `value` if it's a safe same-origin relative path to redirect to
 * after login, otherwise `null`. Rejects anything that isn't a plain
 * relative path — in particular protocol-relative URLs (`//evil.com`) and
 * backslash-prefixed paths (`/\evil.com`, which some browsers normalize to
 * `//evil.com`) — since those would send the browser off-origin.
 */
export function getSafeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  try {
    const url = new URL(value, "https://invalid.example");
    if (url.origin !== "https://invalid.example") return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

/**
 * Builds the absolute `/auth/callback` URL used as the Supabase OAuth
 * `redirectTo`, forwarding the post-login destination (`next`) and referral
 * code (`ref`) as query params so `/auth/callback` can read them back.
 */
export function buildGoogleCallbackUrl(
  origin: string,
  opts: { next?: string | null; ref?: string | null }
): string {
  const url = new URL("/auth/callback", origin);
  const safeNext = getSafeNextPath(opts.next);
  if (safeNext) url.searchParams.set("next", safeNext);
  if (opts.ref) url.searchParams.set("ref", opts.ref);
  return url.toString();
}
