import { getErrorCode, getErrorMessage } from "./errors.ts";

export type AuthStateKind =
  | "idle"
  | "unconfirmed"
  | "wrong_provider"
  | "bad_credentials"
  | "taken"
  | "taken_google"
  | "rate_limited"
  | "link_expired"
  | "generic";

export type AuthState = {
  kind: AuthStateKind;
  /** Rendered in the inline panel. Always safe to show — never a raw upstream string. */
  message: string;
  /** The address the failed attempt used, so actions can be prefilled. */
  email: string;
  canResend: boolean;
  showGoogle: boolean;
  showOpenGmail: boolean;
  showSetPassword: boolean;
};

const IDLE: AuthState = {
  kind: "idle",
  message: "",
  email: "",
  canResend: false,
  showGoogle: false,
  showOpenGmail: false,
  showSetPassword: false
};

export function isGmail(email: string): boolean {
  return /@gmail\.com$/i.test(email.trim());
}

/** The provider hint the backend attaches to credential failures, if any. */
function providerHint(error: unknown): string | undefined {
  const hint = (error as { provider_hint?: unknown })?.provider_hint;
  return typeof hint === "string" ? hint : undefined;
}

const COPY: Record<Exclude<AuthStateKind, "idle" | "generic">, string> = {
  unconfirmed: "Your email isn't confirmed yet. We sent a link to {email}.",
  wrong_provider: "This email signs in with Google. It's the same account, with all your work still in it.",
  bad_credentials: "Email or password is incorrect.",
  taken: "An account with this email already exists. Try logging in instead.",
  taken_google: "You already have an account — it signs in with Google.",
  rate_limited: "We can only send one email a minute. Please try again shortly.",
  link_expired: "That link has expired. Request a new one and open it within the hour."
};

/**
 * Map a caught auth error onto exactly one UI state.
 *
 * Forward-compatible by design: an unrecognised code degrades to `generic`
 * carrying today's message, so a backend that starts emitting a new code never
 * produces a blank panel.
 */
export function deriveAuthState(error: unknown, email: string): AuthState {
  if (!error) return IDLE;

  const trimmed = email.trim();
  const base = { ...IDLE, email: trimmed };
  const code = getErrorCode(error);
  const hint = providerHint(error);

  const withCopy = (kind: Exclude<AuthStateKind, "idle" | "generic">, over: Partial<AuthState> = {}): AuthState => ({
    ...base,
    kind,
    message: COPY[kind].replace("{email}", trimmed),
    ...over
  });

  switch (code) {
    case "EMAIL_NOT_CONFIRMED":
      return withCopy("unconfirmed", { canResend: true, showOpenGmail: isGmail(trimmed) });
    case "INVALID_CREDENTIALS":
      return hint === "google"
        ? withCopy("wrong_provider", { showGoogle: true, showSetPassword: true })
        : withCopy("bad_credentials");
    case "EMAIL_TAKEN":
      return hint === "google" ? withCopy("taken_google", { showGoogle: true }) : withCopy("taken");
    case "RATE_LIMITED":
      return withCopy("rate_limited");
    case "SESSION_EXPIRED":
      return withCopy("link_expired");
    default:
      return { ...base, kind: "generic", message: getErrorMessage(error, "Something went wrong. Please try again.") };
  }
}
