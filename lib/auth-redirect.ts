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

export type AppRole = "admin" | "teacher" | "influencer" | "org_admin";

export function dashboardForRole(role: AppRole): string {
  if (role === "admin") return "/admin";
  if (role === "org_admin") return "/school-admin";
  return "/dashboard";
}

function isRoute(path: string, route: string): boolean {
  return path === route || path.startsWith(`${route}/`);
}

/**
 * Resolve a post-login destination without crossing workspace boundaries.
 *
 * `next` is normally added when an unauthenticated visitor opens a protected
 * page. It is safe from open redirects after `getSafeNextPath`, but it can
 * still point at a workspace for a different role (for example an admin who
 * arrived at `/login?next=/dashboard`). In that case the account's role must
 * win and the user should land on their own home page.
 */
export function getPostLoginPath(
  role: AppRole,
  nextValue: string | null | undefined
): string {
  const fallback = dashboardForRole(role);
  const next = getSafeNextPath(nextValue);
  if (!next) return fallback;

  const isAdminPath = isRoute(next, "/admin");
  const isSchoolAdminPath = isRoute(next, "/school-admin");
  const isInfluencerPath = isRoute(next, "/influencer");
  const isTeacherPath = isRoute(next, "/dashboard") || isRoute(next, "/primary");

  if (isAdminPath) return role === "admin" ? next : fallback;
  if (isSchoolAdminPath) return role === "org_admin" ? next : fallback;
  if (isInfluencerPath) return role === "influencer" ? next : fallback;
  if (isTeacherPath) {
    return role === "teacher" || role === "influencer" ? next : fallback;
  }

  // Role-neutral authenticated flows, such as accepting an invitation, still
  // retain their safe same-origin destination.
  return next;
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
