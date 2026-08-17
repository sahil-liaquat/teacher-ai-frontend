import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  CURRICULUM_SOURCES,
  SETUP_SCREENS,
} from "../../lib/school-admin-onboarding.ts";

import { SCHOOL_ADMIN_NAV } from "../../lib/school-admin-nav.ts";

function source(relativePath: string) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

const WIZARD = "components/school-admin/onboarding/setup-wizard.tsx";
const PROMPT = "components/school-admin/onboarding/setup-prompt.tsx";
const SETTINGS = "components/school-admin/settings/settings-workspace.tsx";
const API = "lib/api.ts";

test("guided setup exists as a route", () => {
  assert.equal(existsSync(new URL("../../app/school-admin/setup/page.tsx", import.meta.url)), true);
});

test("setup is NOT a permanent navigation item", () => {
  // A one-time path. A sidebar entry would invite a configured school to redo
  // setup, which is the opposite of what onboarding is for.
  const hrefs = SCHOOL_ADMIN_NAV.map((item) => item.href);
  assert.equal(hrefs.includes("/school-admin/setup"), false);
});

test("configuration concepts never surface as top-level navigation", () => {
  // Settings defines how the school works; the main nav is where it does work.
  const labels = SCHOOL_ADMIN_NAV.map((item) => item.label.toLowerCase());
  for (const internal of ["framework", "programme", "curriculum model", "learning structure", "terminology"]) {
    assert.equal(
      labels.some((label) => label.includes(internal)),
      false,
      `"${internal}" is a configuration concept and belongs in Settings`,
    );
  }
});

test("the wizard covers every tracked backend step, in order", () => {
  // ⚠ Rewritten, not weakened. The wizard's screens used to BE the backend's
  // five steps (`{ n: 1, title: "Framework" }`). It now shows eight screens —
  // a welcome, a working-days screen and a review the backend has no step for —
  // so the invariant moved: every tracked step is still claimed exactly once,
  // in order, and the extra screens claim none. The screen model is asserted in
  // full in school-admin-onboarding-flow.test.ts.
  const claimed = SETUP_SCREENS
    .map((screen) => screen.backendStep)
    .filter((step): step is 1 | 2 | 3 | 4 | 5 => step !== null);
  assert.deepEqual(claimed.slice().sort(), [1, 2, 3, 4, 5]);
  assert.deepEqual(
    SETUP_SCREENS.filter((screen) => screen.readinessKey).map((screen) => screen.readinessKey),
    ["framework", "programmes", "levels", "academic_year", "curriculum"],
  );
});

test("the wizard offers three curriculum starting points and never import", () => {
  // ⚠ This assertion is INVERTED from what it was, deliberately. It used to
  // require all four, `import` included — but there is no import pipeline
  // anywhere in the product: no upload endpoint, no parser, no review step.
  // Offering it set a school up to choose a path that does nothing. The enum
  // value stays supported on the wire for any school already carrying it; it is
  // simply not offered until the pipeline exists.
  assert.deepEqual(CURRICULUM_SOURCES.map((option) => option.value), ["teachpad", "customize", "empty"]);
  const wizard = source(WIZARD);
  assert.doesNotMatch(wizard, /Import School Curriculum|Upload Existing Curriculum/);
});

test("the wizard writes through existing services rather than its own storage", () => {
  const wizard = source(WIZARD);
  // Each step calls the endpoint that already owns that concept. A wizard with
  // its own persistence would drift from Settings the moment either changed.
  for (const helper of [
    "schoolAdminSetFramework",
    "schoolAdminEnableProgramme",
    "schoolAdminCreateLevel",
    "schoolAdminSetCurriculumStartingPoint",
    "schoolAdminCreateAcademicYear",
  ]) {
    assert.match(wizard, new RegExp(helper), `${helper} is not used by the wizard`);
  }
  assert.doesNotMatch(wizard, /localStorage/, "setup answers must not live in the browser");
});

test("the setup prompt hides itself for a completed school", () => {
  // Existing schools were backfilled to completed; nagging them would be a
  // regression dressed as onboarding.
  assert.match(source(PROMPT), /is_complete\) return null/);
});

test("the setup prompt names the outstanding steps from derived readiness", () => {
  const prompt = source(PROMPT);
  assert.match(prompt, /readiness/);
  assert.match(prompt, /resume_step/);
});

test("programme and level helpers live on the school-admin surface", () => {
  const api = source(API);
  for (const helper of [
    "schoolAdminEnabledProgrammes", "schoolAdminAvailableProgrammes",
    "schoolAdminEnableProgramme", "schoolAdminDisableProgramme",
    "schoolAdminLevels", "schoolAdminCreateLevel", "schoolAdminAdoptLevel",
    "schoolAdminUpdateLevel", "schoolAdminArchiveLevel",
    "schoolAdminOnboarding", "schoolAdminAdvanceOnboarding", "schoolAdminCompleteOnboarding",
    "schoolAdminProgrammeDefinition",
  ]) {
    assert.notEqual(api.indexOf(`  ${helper}:`), -1, `${helper} is missing`);
  }
  // Never the platform-admin surface — those guards 403 for an org admin.
  const academicCalls = Array.from(api.matchAll(/"(\/school-admin\/academic[^"`]*)"/g)).map((m) => m[1]);
  assert.ok(academicCalls.length > 0);
  for (const path of academicCalls) {
    assert.match(path, /^\/school-admin\//);
  }
});

test("disabling a programme is never a delete", () => {
  const api = source(API);
  // The disable helper is a PUT to /disable, not a DELETE on the programme.
  assert.match(api, /schoolAdminDisableProgramme[\s\S]{0,200}\/disable`, \{ method: "PUT" \}/);
  assert.doesNotMatch(api, /programmes\/\$\{programmeId\}`, \{ method: "DELETE" \}/);
});

test("archiving a level is a DELETE route that returns the row, not a removal", () => {
  const api = source(API);
  assert.match(api, /schoolAdminArchiveLevel: \(id: string\) =>\s*\n\s*apiFetch<SchoolLevel>/);
});

test("settings manages programmes and levels", () => {
  // Renamed from Cards to Stages when Settings became a disclosure flow: the
  // three academic stages unlock in the order the server accepts them.
  const settings = source(SETTINGS);
  assert.match(settings, /ProgrammesStage/);
  assert.match(settings, /LevelsStage/);
  // The disable warning must be shown, since the backend allows it while
  // levels still reference the programme.
  assert.match(settings, /Levels reference this/);
});

test("settings lists only school-owned levels as editable", () => {
  // ⚠ Loosened deliberately, and the distinction is the point. This used to
  // forbid ANY reference to the catalogue, because TeachPad's shared rows are
  // read-only to a school — the backend 403s on an edit.
  //
  // ADOPTING is not editing. `schoolAdminAdoptLevel` COPIES a platform level
  // into the school as a school-owned row, which is exactly what the setup
  // wizard does. Forbidding the catalogue outright also forbade the one safe
  // thing a school can do with it.
  //
  // The invariant that actually matters is unchanged: the EDITABLE list comes
  // from the school's own rows.
  const settings = source(SETTINGS);
  assert.match(settings, /schoolAdminLevels\(\)/, "the editable list is school-owned");
  assert.match(settings, /schoolAdminAdoptLevel/, "catalogue rows may only be adopted");
  // Archive — the only destructive level action — must act on a school row id,
  // never on a catalogue code.
  assert.match(settings, /archive\.mutate\(level\.id\)/);
});

test("the resolved-definition type keeps compiled and structure sources distinct", () => {
  const api = source(API);
  assert.match(api, /source: "compiled" \| "structure"/);
  // Placement stays separate from the content node list.
  assert.match(api, /placement: string\[\]/);
});
