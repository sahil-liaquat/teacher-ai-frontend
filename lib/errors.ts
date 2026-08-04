const NETWORK_MESSAGE = "Can't reach the server. Check your internet connection and try again.";
const SERVER_MESSAGE = "Something went wrong on our side. Please try again.";

/** Friendlier page-agnostic wording for specific backend error codes. */
const CODE_OVERRIDES: Record<string, string> = {
  EMAIL_TAKEN: "An account with this email already exists. Try logging in instead."
};

/**
 * Codes whose `detail` is machine output rather than a sentence written for a
 * user. SCHEMA_VALIDATION carries pydantic's field-level wording — "level:
 * Input should be 'nursery'" — which is accurate, useless to a teacher, and
 * emitted whenever a client payload drifts from an `extra="forbid"` schema.
 * Hand-authored 4xx details keep code VALIDATION and are still trusted.
 */
const UNTRUSTED_CODES = new Set(["SCHEMA_VALIDATION"]);

/**
 * The only sanctioned path from a caught error to the UI.
 *
 * Trust rule: a `code` property proves the backend's error layer authored the
 * message, so `error.message` is safe to render (optionally overridden per
 * code) — except for the codes in UNTRUSTED_CODES, whose detail is machine
 * output. Without a code, a 5xx is untrusted infrastructure noise and collapses
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
    const authored = overrides?.[code] || CODE_OVERRIDES[code];
    if (authored) return authored;
    return UNTRUSTED_CODES.has(code) ? fallback : message || fallback;
  }
  if (typeof status === "number") {
    return status >= 500 ? SERVER_MESSAGE : message || fallback;
  }
  if (error instanceof TypeError && /fetch|network|load failed/i.test(message)) {
    return NETWORK_MESSAGE;
  }
  return fallback;
}

/** The backend error code, if the error came from our {detail, code} layer. */
export function getErrorCode(error: unknown): string | undefined {
  const code = (error as { code?: unknown })?.code;
  return typeof code === "string" ? code : undefined;
}
