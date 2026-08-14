import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

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

test("the wizard walks all five steps in order", () => {
  const wizard = source(WIZARD);
  for (const title of ["Framework", "Programmes", "Levels", "Curriculum", "Academic year"]) {
    assert.match(wizard, new RegExp(`title: "${title}"`));
  }
  const order = Array.from(wizard.matchAll(/\{ n: (\d), title: "([^"]+)"/g)).map((m) => Number(m[1]));
  assert.deepEqual(order, [1, 2, 3, 4, 5]);
});

test("the wizard offers all four curriculum starting points", () => {
  const wizard = source(WIZARD);
  for (const value of ["teachpad", "customize", "import", "empty"]) {
    assert.match(wizard, new RegExp(`value: "${value}"`));
  }
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
  const settings = source(SETTINGS);
  assert.match(settings, /ProgrammesCard/);
  assert.match(settings, /LevelsCard/);
  // The disable warning must be shown, since the backend allows it while
  // levels still reference the programme.
  assert.match(settings, /Levels reference this/);
});

test("settings shows only school-owned levels", () => {
  // TeachPad's shared catalogue rows are read-only to a school — the backend
  // 403s on an edit, so listing them as editable would be a lie.
  assert.match(source(SETTINGS), /schoolAdminLevels\(\)/);
  assert.doesNotMatch(source(SETTINGS), /schoolAdminLevelCatalogue/);
});

test("the resolved-definition type keeps compiled and structure sources distinct", () => {
  const api = source(API);
  assert.match(api, /source: "compiled" \| "structure"/);
  // Placement stays separate from the content node list.
  assert.match(api, /placement: string\[\]/);
});
