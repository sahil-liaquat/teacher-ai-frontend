/**
 * Whether a school admin should be held in guided setup.
 *
 * ⚠ THE TRAP THIS AVOIDS. "Send an unconfigured school to the wizard" is the
 * right default and a dangerous absolute. `complete()` refuses while any of the
 * five backend readiness keys is unmet, so a school that cannot satisfy one —
 * a framework with no programmes, say — would be redirected into a wizard it
 * cannot finish and redirected back out of every escape route. That is a
 * lockout, not an onboarding flow.
 *
 * The deferral flag is the release valve: an explicit, admin-initiated "I'll
 * finish this later" that lasts for the session and is never set automatically.
 * The Overview prompt keeps nagging, so deferring costs discovery, not
 * correctness.
 *
 * ⚠ Readiness itself is NEVER computed here. `is_complete` is the server's,
 * derived from real rows on every read. This module only decides where to send
 * someone given that verdict.
 */
import { readStoredItem, removeStoredItem, writeStoredItem } from "./safe-storage.ts";

const DEFERRED_KEY = "school-admin-setup-deferred";

/** The admin chose to leave setup unfinished. Cleared once setup completes. */
export function hasDeferredSetup(): boolean {
  return readStoredItem(DEFERRED_KEY) === "1";
}

export function deferSetup(): void {
  writeStoredItem(DEFERRED_KEY, "1");
}

export function clearDeferredSetup(): void {
  removeStoredItem(DEFERRED_KEY);
}

/**
 * Should the shell hand this admin to the wizard?
 *
 * `undefined` state means the query has not answered yet — hold, rather than
 * guess. Redirecting on an unknown state would bounce a fully configured school
 * through the wizard on every cold load.
 */
export function shouldRedirectToSetup(input: {
  isComplete: boolean | undefined;
  deferred: boolean;
  pathname: string;
}): boolean {
  if (input.isComplete === undefined) return false;
  if (input.isComplete) return false;
  if (input.deferred) return false;
  // Already there. Without this the wizard redirects to itself.
  if (input.pathname.startsWith("/school-admin/setup")) return false;
  return true;
}

// ── The wizard's own shape ──────────────────────────────────────────────────

/**
 * The screens the wizard shows, and which backend step each records.
 *
 * ⚠ SCREENS ARE NOT BACKEND STEPS. `SchoolOnboardingService` tracks exactly
 * five (`TOTAL_STEPS = 5`) and `advance()` rejects anything outside 1–5 with a
 * 400. The wizard shows more screens than that — a welcome, a working-days
 * screen and a review — so each screen declares which tracked step it belongs
 * to, and presentation-only screens declare none.
 *
 * Inventing a sixth tracked step to make the UI tidy would have meant either a
 * 400 on `advance(6)` or a second progress model in the browser.
 */
export type SetupScreen = {
  key: string;
  title: string;
  blurb: string;
  /** The backend onboarding step this screen satisfies, if any. */
  backendStep: 1 | 2 | 3 | 4 | 5 | null;
  /** The readiness key that proves it, if any. */
  readinessKey: "framework" | "programmes" | "levels" | "curriculum" | "academic_year" | null;
};

export const SETUP_SCREENS: readonly SetupScreen[] = [
  {
    key: "welcome",
    title: "Welcome to TeachPad",
    blurb: "A few decisions and your school is ready to plan curriculum.",
    backendStep: null,
    readinessKey: null,
  },
  {
    key: "framework",
    title: "Board or framework",
    blurb: "Which curriculum authority does your school follow?",
    backendStep: 1,
    readinessKey: "framework",
  },
  {
    key: "programmes",
    title: "Programmes",
    blurb: "Which stages does your school offer?",
    backendStep: 2,
    readinessKey: "programmes",
  },
  {
    key: "levels",
    title: "Levels",
    blurb: "Which grades or levels do you operate?",
    backendStep: 3,
    readinessKey: "levels",
  },
  {
    key: "year",
    title: "Academic year",
    blurb: "When does your school year run?",
    backendStep: 5,
    readinessKey: "academic_year",
  },
  {
    key: "calendar",
    title: "Working days",
    blurb: "Which days does your school normally teach on?",
    // ⚠ No backend step and no readiness key, because the backend has neither.
    // The calendar is real and writes through the existing initialize
    // endpoint — it simply does not gate activation, and this screen must not
    // imply that it does.
    backendStep: null,
    readinessKey: null,
  },
  {
    key: "curriculum",
    title: "Curriculum source",
    blurb: "Where should your curriculum start from?",
    backendStep: 4,
    readinessKey: "curriculum",
  },
  {
    key: "review",
    title: "Review and activate",
    blurb: "Check what you have configured, then open your school.",
    backendStep: null,
    readinessKey: null,
  },
] as const;

export function screenIndex(key: string): number {
  const index = SETUP_SCREENS.findIndex((screen) => screen.key === key);
  return index === -1 ? 0 : index;
}

export function screenAt(index: number): SetupScreen {
  return SETUP_SCREENS[Math.min(Math.max(index, 0), SETUP_SCREENS.length - 1)];
}

/**
 * Which screen to resume on, from the server's readiness.
 *
 * Derived, never stored — the same rule the backend applies. A school that set
 * its framework from Settings and never opened the wizard resumes at Programmes
 * rather than at step 1.
 */
export function resumeScreenKey(readiness: Record<string, boolean> | undefined): string {
  if (!readiness) return "welcome";
  const unmet = SETUP_SCREENS.find(
    (screen) => screen.readinessKey && !readiness[screen.readinessKey],
  );
  return unmet ? unmet.key : "review";
}

/** Screens whose readiness the Review screen reports on, in order. */
export function gatingScreens(): SetupScreen[] {
  return SETUP_SCREENS.filter((screen) => screen.readinessKey !== null);
}

// ── Curriculum source ───────────────────────────────────────────────────────

/**
 * The starting points offered during setup.
 *
 * ⚠ THREE, NOT FOUR. `curriculum_starting_point` also accepts `import`, and the
 * old wizard offered it as "Import School Curriculum". There is no import
 * pipeline anywhere in the product — no upload endpoint, no parser, no review
 * step — so the option set a school up to choose a path that does nothing. The
 * enum value stays supported on the wire for any school already carrying it;
 * it is simply not offered until the pipeline exists.
 */
export const CURRICULUM_SOURCES = [
  {
    value: "teachpad" as const,
    title: "Use TeachPad curriculum",
    description: "Teach TeachPad's published curriculum as it is. You can customise any day later.",
  },
  {
    value: "customize" as const,
    title: "Start from TeachPad and adapt it",
    description: "Adopt it as your starting point, then edit. Your edits never change TeachPad's copy.",
  },
  {
    value: "empty" as const,
    title: "Build your own",
    description: "Start with nothing and author every teaching day yourself.",
  },
];
