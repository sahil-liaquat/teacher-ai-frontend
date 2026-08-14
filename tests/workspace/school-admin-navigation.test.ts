import assert from "node:assert/strict";
import { existsSync } from "node:fs";
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

const EXPECTED_ORDER = [
  "/school-admin",
  "/school-admin/curriculum",
  "/school-admin/calendar",
  "/school-admin/classes",
  "/school-admin/teachers",
  "/school-admin/resources",
  "/school-admin/assessments",
  "/school-admin/progress",
  "/school-admin/settings",
];

test("school admin navigation follows the academic operating loop, in order", () => {
  assert.deepEqual(SCHOOL_ADMIN_NAV.map((item) => item.href), EXPECTED_ORDER);
});

test("configuration-heavy surfaces are not top-level navigation", () => {
  const top = SCHOOL_ADMIN_NAV.map((item) => item.href);
  // A theme is part of authoring curriculum; an academic year is part of
  // running a calendar. Neither is a destination a school admin visits daily.
  assert.equal(top.includes("/school-admin/themes"), false);
  assert.equal(top.includes("/school-admin/academic-years"), false);
});

test("the moved routes still exist and are reachable as sub-navigation", () => {
  // Removing a working authoring surface to tidy a sidebar would be a
  // regression wearing a redesign's clothes.
  for (const route of ["themes", "academic-years"]) {
    assert.equal(
      existsSync(new URL(`../../app/school-admin/${route}/page.tsx`, import.meta.url)),
      true,
      `${route} page was deleted rather than relocated`,
    );
  }
  assert.deepEqual(
    SCHOOL_ADMIN_SUBNAV["/school-admin/curriculum"].map((i) => i.href),
    ["/school-admin/curriculum", "/school-admin/themes"],
  );
  assert.deepEqual(
    SCHOOL_ADMIN_SUBNAV["/school-admin/calendar"].map((i) => i.href),
    ["/school-admin/calendar", "/school-admin/academic-years"],
  );
});

test("the two new operational surfaces exist", () => {
  for (const route of ["assessments", "progress"]) {
    assert.equal(
      existsSync(new URL(`../../app/school-admin/${route}/page.tsx`, import.meta.url)),
      true,
    );
  }
});

test("foundation-only surfaces are labelled as such", () => {
  // An intentionally empty screen must not read as a broken one.
  const foundation = SCHOOL_ADMIN_NAV.filter((item) => item.status === "foundation");
  assert.deepEqual(
    foundation.map((item) => item.href),
    ["/school-admin/assessments", "/school-admin/progress"],
  );
});

test("a moved child lights up its new parent, not its old top-level entry", () => {
  assert.equal(activeTopLevel("/school-admin/themes"), "/school-admin/curriculum");
  assert.equal(activeTopLevel("/school-admin/academic-years"), "/school-admin/calendar");
  assert.equal(isNavItemActive("/school-admin/curriculum", "/school-admin/themes"), true);
  assert.equal(isNavItemActive("/school-admin/calendar", "/school-admin/academic-years"), true);
});

test("overview only matches exactly, so it does not swallow every route", () => {
  assert.equal(isNavItemActive("/school-admin", "/school-admin"), true);
  assert.equal(isNavItemActive("/school-admin", "/school-admin/teachers"), false);
  assert.equal(activeTopLevel("/school-admin"), "/school-admin");
});

test("calendar and curriculum do not claim each other's routes", () => {
  assert.equal(isNavItemActive("/school-admin/calendar", "/school-admin/curriculum"), false);
  assert.equal(isNavItemActive("/school-admin/curriculum", "/school-admin/calendar"), false);
});

test("every navigation target has a page on disk", () => {
  for (const item of SCHOOL_ADMIN_NAV) {
    const relative = item.href.replace("/school-admin", "") || "/";
    const path = relative === "/" ? "app/school-admin/page.tsx" : `app/school-admin${relative}/page.tsx`;
    assert.equal(
      existsSync(new URL(`../../${path}`, import.meta.url)),
      true,
      `${item.href} is in the sidebar but has no page`,
    );
  }
});
