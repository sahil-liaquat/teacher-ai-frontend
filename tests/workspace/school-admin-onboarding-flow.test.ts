import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  CURRICULUM_SOURCES,
  SETUP_SCREENS,
  gatingScreens,
  resumeScreenKey,
  screenAt,
  screenIndex,
  shouldRedirectToSetup,
} from "../../lib/school-admin-onboarding.ts";

/**
 * Phase 2 — guided setup outside the School Admin shell.
 *
 * The wizard used to render inside `SchoolAdminShell`, so a school on step 1 —
 * no framework, no levels, no academic year — was shown nine navigation items
 * of which every one led to an empty state. These tests pin the two halves of
 * the fix: the route structure that keeps setup out of the shell, and the
 * screen model that maps more screens than the backend tracks onto the five
 * steps it does.
 */

const ROOT = new URL("../../", import.meta.url);

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, ROOT), "utf8");
}

function exists(relativePath: string) {
  return existsSync(new URL(relativePath, ROOT));
}

// ── Route structure ─────────────────────────────────────────────────────────

test("setup renders outside the shell route group", () => {
  assert.ok(exists("app/school-admin/(shell)/layout.tsx"), "the shell layout must live in the group");
  assert.ok(exists("app/school-admin/setup/layout.tsx"), "setup must have its own layout");
  assert.ok(!exists("app/school-admin/(shell)/setup"), "setup must not be inside the shell group");

  const root = source("app/school-admin/layout.tsx");
  assert.ok(
    !root.includes("SchoolAdminShell"),
    "the root layout must not wrap every child in the ERP shell",
  );
  assert.ok(source("app/school-admin/(shell)/layout.tsx").includes("SchoolAdminShell"));
  assert.ok(source("app/school-admin/setup/layout.tsx").includes("SetupShell"));
});

test("every previously-shelled route stayed inside the group, so URLs are unchanged", () => {
  // A route group carries no URL segment, so this move is invisible to links,
  // bookmarks and the smoke-route check.
  // `classes` and `progress` are absent on purpose: they became
  // People → Classes & Sections and Teaching → Coverage, with redirects from
  // the old URLs. Everything else kept both its URL and its file.
  for (const route of [
    "page.tsx", "curriculum", "themes", "resources", "calendar",
    "academic-years", "teachers", "settings", "assessments",
  ]) {
    assert.ok(
      exists(`app/school-admin/(shell)/${route}`),
      `/school-admin/${route} must still resolve through the shell group`,
    );
  }
});

test("the setup shell offers no navigation into the unconfigured product", () => {
  const shell = source("components/school-admin/onboarding/setup-shell.tsx");
  assert.ok(!shell.includes("SCHOOL_ADMIN_NAV"), "setup must not render the ERP navigation");
  assert.ok(shell.includes("deferSetup"), "there must be an explicit way out");
});

// ── The redirect, and the trap it must not become ───────────────────────────

test("an unconfigured school is sent to setup", () => {
  assert.equal(
    shouldRedirectToSetup({ isComplete: false, deferred: false, pathname: "/school-admin" }),
    true,
  );
});

test("a configured school is never sent to setup", () => {
  assert.equal(
    shouldRedirectToSetup({ isComplete: true, deferred: false, pathname: "/school-admin" }),
    false,
  );
});

test("an unknown readiness state holds rather than guessing", () => {
  // Redirecting before the query answers would bounce a fully configured school
  // through the wizard on every cold load.
  assert.equal(
    shouldRedirectToSetup({ isComplete: undefined, deferred: false, pathname: "/school-admin" }),
    false,
  );
});

test("deferring releases the redirect, so setup cannot become a lockout", () => {
  // `complete()` refuses while any readiness key is unmet. Without an explicit
  // escape, a school that cannot satisfy one would be redirected into a wizard
  // it cannot finish and back out of every exit.
  assert.equal(
    shouldRedirectToSetup({ isComplete: false, deferred: true, pathname: "/school-admin" }),
    false,
  );
});

test("setup does not redirect to itself", () => {
  assert.equal(
    shouldRedirectToSetup({ isComplete: false, deferred: false, pathname: "/school-admin/setup" }),
    false,
  );
});

// ── Screens vs backend steps ────────────────────────────────────────────────

test("no screen claims a backend step outside the five the server tracks", () => {
  // `SchoolOnboardingService.advance()` rejects anything outside 1–5 with a 400.
  for (const screen of SETUP_SCREENS) {
    if (screen.backendStep === null) continue;
    assert.ok(
      screen.backendStep >= 1 && screen.backendStep <= 5,
      `${screen.key} claims step ${screen.backendStep}, which the backend would reject`,
    );
  }
});

test("each tracked backend step is claimed exactly once", () => {
  const claimed = SETUP_SCREENS.map((screen) => screen.backendStep).filter((step) => step !== null);
  assert.deepEqual(claimed.slice().sort(), [1, 2, 3, 4, 5]);
});

test("presentation-only screens declare no step and no readiness key", () => {
  // Welcome, working days and review have no backend step. Inventing one would
  // have meant a 400 on advance(6) or a second progress model in the browser.
  for (const key of ["welcome", "calendar", "review"]) {
    const screen = SETUP_SCREENS.find((item) => item.key === key)!;
    assert.equal(screen.backendStep, null, `${key} must not claim a tracked step`);
    assert.equal(screen.readinessKey, null, `${key} must not claim to gate readiness`);
  }
});

test("the working-days screen does not gate activation", () => {
  // The backend's readiness has five keys and a calendar is not one of them.
  const gating = gatingScreens().map((screen) => screen.key);
  assert.ok(!gating.includes("calendar"), "a calendar must not appear to gate activation");
  assert.deepEqual(gating, ["framework", "programmes", "levels", "year", "curriculum"]);
});

// ── Resume, which is derived and not stored ─────────────────────────────────

test("resume lands on the first unsatisfied step, not on step one", () => {
  // A school that set its framework from Settings and never opened the wizard.
  assert.equal(
    resumeScreenKey({
      framework: true, programmes: false, levels: false, curriculum: true, academic_year: false,
    }),
    "programmes",
  );
});

test("a fully ready school resumes on review", () => {
  assert.equal(
    resumeScreenKey({
      framework: true, programmes: true, levels: true, curriculum: true, academic_year: true,
    }),
    "review",
  );
});

test("resume with no readiness yet starts at the welcome", () => {
  assert.equal(resumeScreenKey(undefined), "welcome");
});

test("readiness gaps later in the flow do not pull resume backwards", () => {
  // `curriculum` is always true server-side; the year is the real gap here.
  assert.equal(
    resumeScreenKey({
      framework: true, programmes: true, levels: true, curriculum: true, academic_year: false,
    }),
    "year",
  );
});

// ── Navigating back must not destroy progress ───────────────────────────────

test("screen indexing is stable and clamped at both ends", () => {
  assert.equal(screenIndex("welcome"), 0);
  assert.equal(screenIndex("review"), SETUP_SCREENS.length - 1);
  // An unknown key must not produce -1 and index off the end of the array.
  assert.equal(screenIndex("nonsense"), 0);
  assert.equal(screenAt(-5).key, "welcome");
  assert.equal(screenAt(999).key, "review");
});

test("the wizard advances the backend marker only forwards, and only for tracked screens", () => {
  const wizard = source("components/school-admin/onboarding/setup-wizard.tsx");
  assert.ok(
    wizard.includes("target.backendStep && target.backendStep > (onboarding.data?.step ?? 0)"),
    "going back must not rewind the server's progress marker",
  );
});

test("numeric deep links from Overview and Settings still resolve", () => {
  // The Overview prompt links `?step=<resume_step>` and Settings links
  // `?step=3`. Both predate this rewrite. A numeric value must resolve through
  // the screen that satisfies that TRACKED step, not as an index into the new
  // screen list — `?step=3` is Levels, which is screen index 3 only by luck.
  const levels = SETUP_SCREENS.find((screen) => screen.backendStep === 3)!;
  assert.equal(levels.key, "levels");
  const wizard = source("components/school-admin/onboarding/setup-wizard.tsx");
  assert.ok(
    wizard.includes("SETUP_SCREENS.find((screen) => screen.backendStep === numeric)"),
    "a numeric step must resolve by tracked step, not by array position",
  );
});

// ── Curriculum source ───────────────────────────────────────────────────────

test("curriculum source offers three real options and never import", () => {
  // There is no import pipeline anywhere in the product — no upload endpoint,
  // no parser, no review step. Offering it set a school up to choose a path
  // that does nothing.
  assert.equal(CURRICULUM_SOURCES.length, 3);
  const values = CURRICULUM_SOURCES.map((option) => option.value);
  assert.deepEqual(values, ["teachpad", "customize", "empty"]);
  assert.ok(!values.includes("import" as never), "import must not be offered");
});

test("the wizard renders only the offered sources", () => {
  const wizard = source("components/school-admin/onboarding/setup-wizard.tsx");
  assert.ok(wizard.includes("CURRICULUM_SOURCES"), "sources must come from the shared list");
  assert.ok(
    !/Import School Curriculum|Upload Existing Curriculum/.test(wizard),
    "the removed import option must not reappear",
  );
});

// ── Activation is the server's call ─────────────────────────────────────────

test("activation goes through the server and readiness is never recomputed locally", () => {
  const wizard = source("components/school-admin/onboarding/setup-wizard.tsx");
  assert.ok(
    wizard.includes("schoolAdminCompleteOnboarding"),
    "activation must be POST /onboarding/complete",
  );
  assert.ok(
    wizard.includes("readiness?.[screen.readinessKey"),
    "review ticks must read the server's readiness",
  );
  assert.ok(
    !/const\s+isReady\s*=\s*.*&&.*&&/.test(wizard),
    "the wizard must not assemble its own readiness verdict",
  );
});

test("completing setup clears a stale deferral", () => {
  const wizard = source("components/school-admin/onboarding/setup-wizard.tsx");
  assert.ok(
    wizard.includes("clearDeferredSetup()"),
    "an 'I'll do it later' must not outlive the setup it deferred",
  );
});
