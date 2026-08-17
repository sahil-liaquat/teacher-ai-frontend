import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  SCHOOL_ADMIN_NAV,
  SCHOOL_ADMIN_SUBNAV,
  activeTopLevel,
  isNavItemActive,
} from "../../lib/school-admin-nav.ts";

/**
 * The navigation IS the product argument, so it is asserted rather than left to
 * drift. The rule under test throughout: things a school WORKS WITH are top
 * level; things it CONFIGURES ONCE are not.
 */

// ⚠ FIVE, not nine. The sidebar used to carry one item per database concept,
// so building a single curriculum meant navigating between four unrelated
// top-level destinations. Navigation now names jobs.
function source(relativePath: string) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

const EXPECTED_ORDER = [
  "/school-admin",
  "/school-admin/curriculum/overview",
  "/school-admin/teaching",
  "/school-admin/people",
  "/school-admin/settings",
];

test("school admin navigation names five jobs, in the order they are done", () => {
  assert.deepEqual(SCHOOL_ADMIN_NAV.map((item) => item.href), EXPECTED_ORDER);
});

test("no database concept occupies a top-level slot", () => {
  const top = SCHOOL_ADMIN_NAV.map((item) => item.href);
  for (const relocated of [
    "/school-admin/themes",
    "/school-admin/resources",
    "/school-admin/calendar",
    "/school-admin/academic-years",
    "/school-admin/assessments",
    "/school-admin/teachers",
  ]) {
    assert.equal(top.includes(relocated), false, `${relocated} must not be top level`);
  }
});

test("configuration-heavy surfaces are not top-level navigation", () => {
  const top = SCHOOL_ADMIN_NAV.map((item) => item.href);
  // A theme is part of authoring curriculum; an academic year is part of
  // running a calendar. Neither is a destination a school admin visits daily.
  assert.equal(top.includes("/school-admin/themes"), false);
  assert.equal(top.includes("/school-admin/academic-years"), false);
  assert.equal(top.includes("/school-admin/calendar"), false);
});

test("Review & Publish is a real surface, not a modal over the grid", () => {
  // It used to be a dialog inside CurriculumWorkspace, which meant it could not
  // be linked to, could not survive a refresh, and had no equivalent on the
  // master side at all.
  assert.equal(
    existsSync(new URL("../../app/school-admin/(shell)/curriculum/review/page.tsx", import.meta.url)),
    true,
  );
  assert.equal(
    existsSync(new URL("../../app/admin/organizations/master-curriculum/review/page.tsx", import.meta.url)),
    true,
  );
});

test("a nested curriculum stage keeps the parent section lit without stealing it", () => {
  // `/curriculum/review` and `/curriculum/overview` both start with
  // `/curriculum`, so a prefix match alone would light several rows at once.
  for (const path of [
    "/school-admin/curriculum/review",
    "/school-admin/curriculum/overview",
    "/school-admin/curriculum",
    "/school-admin/themes",
  ]) {
    assert.equal(activeTopLevel(path), "/school-admin/curriculum/overview", `${path} must resolve to Curriculum`);
  }
});

test("the moved routes still exist and are reachable as sub-navigation", () => {
  // Removing a working authoring surface to tidy a sidebar would be a
  // regression wearing a redesign's clothes.
  for (const route of ["themes", "academic-years"]) {
    assert.equal(
      existsSync(new URL(`../../app/school-admin/(shell)/${route}/page.tsx`, import.meta.url)),
      true,
      `${route} page was deleted rather than relocated`,
    );
  }
  // Curriculum now carries the whole authoring journey, in the order it is
  // worked: build the blocks, plan the days, attach material, place it in time,
  // ship it. Resources and Calendar moved in here from top level, because
  // neither is a job you arrive wanting to do — they are things you touch while
  // building curriculum.
  assert.deepEqual(
    SCHOOL_ADMIN_SUBNAV["/school-admin/curriculum/overview"].map((i) => i.href),
    [
      "/school-admin/curriculum/overview",
      "/school-admin/themes",
      "/school-admin/curriculum",
      "/school-admin/resources",
      "/school-admin/calendar",
      "/school-admin/curriculum/review",
      "/school-admin/planning",
    ],
  );
  assert.deepEqual(
    SCHOOL_ADMIN_SUBNAV["/school-admin/settings"].map((i) => i.href),
    ["/school-admin/settings", "/school-admin/academic-years"],
  );
});

test("the operational surfaces exist under their new sections", () => {
  for (const route of ["assessments", "teaching", "people"]) {
    assert.equal(
      existsSync(new URL(`../../app/school-admin/(shell)/${route}/page.tsx`, import.meta.url)),
      true,
      `${route} page is missing`,
    );
  }
});

test("foundation-only surfaces are labelled as such", () => {
  // An intentionally empty screen must not read as a broken one.
  // ⚠ No top-level section is foundation-only any more. Teaching carried the
  // badge until its execution data was wired in; Assessments is still a
  // foundation SURFACE, but it sits inside Teaching rather than occupying a
  // sidebar slot, and says so on the page itself.
  const foundation = SCHOOL_ADMIN_NAV.filter((item) => item.status === "foundation");
  assert.deepEqual(foundation.map((item) => item.href), []);
  const assessments = source("app/school-admin/(shell)/assessments/page.tsx");
  assert.ok(assessments.includes("Foundation only"), "an empty surface must still admit it");
});

test("a moved child lights up its new parent, not its old top-level entry", () => {
  assert.equal(activeTopLevel("/school-admin/themes"), "/school-admin/curriculum/overview");
  assert.equal(activeTopLevel("/school-admin/resources"), "/school-admin/curriculum/overview");
  assert.equal(activeTopLevel("/school-admin/calendar"), "/school-admin/curriculum/overview");
  assert.equal(activeTopLevel("/school-admin/academic-years"), "/school-admin/settings");
  assert.equal(activeTopLevel("/school-admin/assessments"), "/school-admin/teaching");
  assert.equal(activeTopLevel("/school-admin/teachers"), "/school-admin/people");
  assert.equal(isNavItemActive("/school-admin/curriculum/overview", "/school-admin/themes"), true);
  assert.equal(isNavItemActive("/school-admin/people", "/school-admin/teachers"), true);
});

test("overview only matches exactly, so it does not swallow every route", () => {
  assert.equal(isNavItemActive("/school-admin", "/school-admin"), true);
  assert.equal(isNavItemActive("/school-admin", "/school-admin/teachers"), false);
  assert.equal(activeTopLevel("/school-admin"), "/school-admin");
});

test("a section that is also its own first child resolves to itself", () => {
  // ⚠ Replaces "calendar and curriculum do not claim each other's routes",
  // which asserted the two were independent top-level items. Calendar is now a
  // Curriculum child, so that claim is inverted by design — but the hazard it
  // guarded moved rather than disappeared.
  //
  // Teaching, People and Settings are each both a parent AND their own first
  // sub-navigation entry, so a first-match scan over an unordered map would
  // resolve them to whichever key happened to be declared first.
  assert.equal(activeTopLevel("/school-admin/teaching"), "/school-admin/teaching");
  assert.equal(activeTopLevel("/school-admin/people"), "/school-admin/people");
  assert.equal(activeTopLevel("/school-admin/settings"), "/school-admin/settings");
});

test("the longest matching child wins, so nested stages resolve correctly", () => {
  // `/curriculum/review` is a child of Curriculum and a prefix of nothing else;
  // `/curriculum` is a child of itself. Both must land on Curriculum without
  // one shadowing the other.
  assert.equal(activeTopLevel("/school-admin/curriculum/review"), "/school-admin/curriculum/overview");
  assert.equal(isNavItemActive("/school-admin/curriculum/overview", "/school-admin/curriculum/review"), true);
  assert.equal(isNavItemActive("/school-admin/teaching", "/school-admin/curriculum/review"), false);
  assert.equal(isNavItemActive("/school-admin/people", "/school-admin/curriculum"), false);
});

test("every navigation target has a page on disk", () => {
  for (const item of SCHOOL_ADMIN_NAV) {
    const relative = item.href.replace("/school-admin", "") || "/";
    const path = relative === "/" ? "app/school-admin/(shell)/page.tsx" : `app/school-admin/(shell)${relative}/page.tsx`;
    assert.equal(
      existsSync(new URL(`../../${path}`, import.meta.url)),
      true,
      `${item.href} is in the sidebar but has no page`,
    );
  }
});
