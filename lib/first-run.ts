/**
 * When the first-run v2 surfaces apply to a user. Kept out of the components
 * so the rules are testable — the repo's test runner cannot render React.
 *
 * Both predicates keep the admin exclusion the two retired blocking modals
 * carried: `role !== "admin"` is the only thing holding the founder's own
 * accounts out of the teacher flow.
 */
type FirstRunUser = {
  role?: string;
  first_run_v2?: boolean;
  needs_onboarding?: boolean;
  phone_prompt_state?: "required" | "hidden";
};

function eligible(user: FirstRunUser | null | undefined): boolean {
  return user?.first_run_v2 === true && user.role !== "admin";
}

/** A teacher who has never finished onboarding belongs in the /start corridor. */
export function shouldRedirectToStart(user: FirstRunUser | null | undefined): boolean {
  return eligible(user) && user?.needs_onboarding === true;
}

/**
 * Whether to ask for a phone number after an artifact. `phone_prompt_state` is
 * computed server-side, so this stays false once the teacher saves a number or
 * taps "Not now" (which marks them exempt).
 */
export function shouldAskForPhone(user: FirstRunUser | null | undefined): boolean {
  return eligible(user) && user?.phone_prompt_state === "required";
}
