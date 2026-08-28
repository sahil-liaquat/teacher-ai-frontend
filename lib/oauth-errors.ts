const GENERIC = "We couldn't complete that sign-in. Please try again.";

/**
 * Map an OAuth/confirmation error_code onto our own copy.
 *
 * Matches on error_code ONLY. `error_description` is attacker-controllable via
 * the query string or the URL fragment and must never reach the page.
 */
const MESSAGES: Record<string, string> = {
  otp_expired: "That link has expired. Request a new one and open it within the hour.",
  access_denied: "The sign-in was cancelled. You can try again whenever you're ready.",
  server_error: "Google couldn't complete the sign-in just now. Please try again.",
  temporarily_unavailable: "Google is temporarily unavailable. Please try again in a moment.",
  invalid_request: GENERIC,
  bad_oauth_state: "That sign-in link is no longer valid. Please start again from the login page."
};

export function translateOAuthError(errorCode: string | null | undefined): string {
  if (!errorCode) return GENERIC;
  const key = errorCode.toLowerCase();
  // Own-property check: a plain object also resolves Object.prototype keys, and
  // "constructor"/"__proto__" survive toLowerCase(). Both yield a non-string that
  // `?? GENERIC` would not catch, crashing the render on a crafted link.
  return Object.prototype.hasOwnProperty.call(MESSAGES, key) ? MESSAGES[key] : GENERIC;
}
