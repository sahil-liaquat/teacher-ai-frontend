const NETWORK_MESSAGE = "Can't reach the server. Check your internet connection and try again.";
const SERVER_MESSAGE = "Something went wrong on our side. Please try again.";

/** Friendlier page-agnostic wording for specific backend error codes. */
const CODE_OVERRIDES: Record<string, string> = {
  EMAIL_TAKEN: "An account with this email already exists. Try logging in instead."
};

/**
 * The only sanctioned path from a caught error to the UI.
 *
 * Trust rule: a `code` property proves the backend's error layer authored the
 * message, so `error.message` is safe to render (optionally overridden per
 * code). Without a code, a 5xx is untrusted infrastructure noise and collapses
 * to a generic message; a fetch-level TypeError becomes a network message;
 * anything else gets the caller's fallback.
 */
export function getErrorMessage(
  error: unknown,
  fallback: string,
  overrides?: Record<string, string>
): string {
  if (!error) return fallback;
  const status = (error as { status?: unknown }).status;
  const code = (error as { code?: unknown }).code;
  const message = error instanceof Error && error.message ? error.message : "";

  if (typeof code === "string" && code) {
    return overrides?.[code] || CODE_OVERRIDES[code] || message || fallback;
  }
  if (typeof status === "number") {
    return status >= 500 ? SERVER_MESSAGE : message || fallback;
  }
  if (error instanceof TypeError && /fetch|network|load failed/i.test(message)) {
    return NETWORK_MESSAGE;
  }
  return fallback;
}
