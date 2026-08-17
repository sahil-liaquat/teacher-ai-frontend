import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  RELOCATED_ROUTES,
  SCHOOL_ADMIN_NAV,
  SCHOOL_ADMIN_SUBNAV,
  activeTopLevel,
  isNavItemActive,
} from "../../lib/school-admin-nav.ts";

/**
 * Phase 3 — navigation names jobs, not tables.
 *
 * Nine top-level items, one per database concept, meant an administrator had to
 * know TeachPad's internal shape before they could find anything: building one
 * curriculum required navigating between Curriculum, Themes, Resources and
 * Calendar as four unrelated destinations.
 *
 * The constraint this phase worked under: **URLs could not move.** Six routes
 * are linked from thirty-odd places in the app and from bookmarks no test can
 * see. The information architecture changed; the addresses did not.
 */

const ROOT = new URL("../../", import.meta.url);

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, ROOT), "utf8");
}

// ── The shape ───────────────────────────────────────────────────────────────

test("the sidebar carries five jobs and nothing else", () => {
  assert.equal(SCHOOL_ADMIN_NAV.length, 5);
  assert.deepEqual(
    SCHOOL_ADMIN_NAV.map((item) => item.label),
    ["Overview", "Curriculum", "Teaching", "People", "Settings"],
  );
});

test("every relocated route is still reachable from some section", () => {
  // Removing a working surface to tidy a sidebar would be a regression wearing
  // a redesign's clothes. Each one must appear in its new parent's sub-nav.
  for (const [route, parent] of Object.entries(RELOCATED_ROUTES)) {
    const children = SCHOOL_ADMIN_SUBNAV[parent];
    assert.ok(children, `${parent} has no sub-navigation to hold ${route}`);
    assert.ok(
      children.some((child) => child.href === route),
      `${route} claims to live under ${parent} but is not in its sub-navigation`,
    );
    assert.equal(activeTopLevel(route), parent, `${route} must light up ${parent}`);
  }
});

test("every navigation target, top level and nested, has a page on disk", () => {
  // Array.from, not a for-of over the Set: tsconfig targets es5, where
  // iterating a Set needs downlevelIteration.
  const targets = Array.from(new Set<string>([
    ...SCHOOL_ADMIN_NAV.map((item) => item.href),
    ...Object.values(SCHOOL_ADMIN_SUBNAV).flatMap((children) => children.map((c) => c.href)),
  ]));
  for (const href of targets) {
    const relative = href.replace("/school-admin", "") || "/";
    const path = relative === "/"
      ? "app/school-admin/(shell)/page.tsx"
      : `app/school-admin/(shell)${relative}/page.tsx`;
    assert.ok(
      existsSync(new URL(path, ROOT)),
      `${href} is in the navigation but has no page at ${path}`,
    );
  }
});

// ── Prefix resolution, which is where this kind of nav breaks ───────────────

test("a section that is also its own first child resolves to itself", () => {
  for (const href of ["/school-admin/teaching", "/school-admin/people", "/school-admin/settings"]) {
    assert.equal(activeTopLevel(href), href);
    assert.equal(isNavItemActive(href, href), true);
  }
});

test("the longest matching child wins", () => {
  // `/curriculum/review` and `/curriculum` are both Curriculum children, and one
  // is a prefix of the other.
  for (const path of [
    "/school-admin/curriculum/review",
    "/school-admin/curriculum/overview",
    "/school-admin/curriculum",
  ]) {
    assert.equal(activeTopLevel(path), "/school-admin/curriculum/overview", `${path} must resolve to Curriculum`);
  }
});

test("Overview matches exactly and never swallows a child route", () => {
  assert.equal(isNavItemActive("/school-admin", "/school-admin"), true);
  for (const href of [
    "/school-admin/curriculum", "/school-admin/curriculum/overview", "/school-admin/teachers",
    "/school-admin/teaching", "/school-admin/people", "/school-admin/themes",
  ]) {
    assert.equal(isNavItemActive("/school-admin", href), false, `Overview must not claim ${href}`);
  }
});

test("an unknown route falls back to Overview rather than throwing", () => {
  assert.equal(activeTopLevel("/school-admin/nonsense"), "/school-admin");
});

test("a route that merely shares a prefix is not treated as a child", () => {
  // `/school-admin/people-directory` starts with `/school-admin/people` as a
  // string but is not underneath it. A bare `startsWith` would claim it.
  assert.equal(activeTopLevel("/school-admin/peoplex"), "/school-admin");
});

// ── One home per job ────────────────────────────────────────────────────────

test("class management has exactly one home", () => {
  // `ClassManager` rendered both at /school-admin/classes AND at the foot of the
  // Teachers workspace — two doors into the same CRUD, with the Classes page
  // telling the admin to go to Teachers in order to assign.
  const teachers = source("components/school-admin/teachers/teachers-workspace.tsx");
  assert.ok(
    !/<ClassManager/.test(teachers),
    "Teachers must not render a second class-management surface",
  );
  assert.ok(
    source("app/school-admin/(shell)/people/page.tsx").includes("<ClassManager"),
    "People → Classes & Sections is where classes live",
  );
});

test("the two moved URLs redirect rather than 404", () => {
  // /school-admin/classes and /school-admin/progress are the only addresses
  // this phase actually moved.
  const config = source("next.config.mjs");
  for (const [from, to] of [
    ["/school-admin/classes", "/school-admin/people"],
    ["/school-admin/progress", "/school-admin/teaching"],
  ]) {
    assert.ok(config.includes(`source: "${from}"`), `${from} must redirect`);
    assert.ok(config.includes(`destination: "${to}"`), `${from} must point at ${to}`);
  }
  // Non-permanent: a 308 would pin these in admins' browsers.
  assert.ok(
    !/source: "\/school-admin\/(classes|progress)"[\s\S]{0,120}permanent: true/.test(config),
    "these redirects must stay non-permanent",
  );
});

test("the removed routes no longer have pages, so the redirect owns the URL", () => {
  for (const route of ["classes", "progress"]) {
    assert.ok(
      !existsSync(new URL(`app/school-admin/(shell)/${route}/page.tsx`, ROOT)),
      `${route} still has a page, which would shadow its redirect`,
    );
  }
});

// ── Honesty about what is not built ─────────────────────────────────────────

test("Teaching reports delivery from recorded status, not from the calendar", () => {
  // ⚠ Rewritten: Teaching WAS foundation-only and asserted to render no
  // figures. It now has real data, sourced from the statuses teachers set on
  // their own planner activities. The invariant that survives — and matters far
  // more — is that a date passing is never treated as evidence of teaching.
  const teaching = SCHOOL_ADMIN_NAV.find((item) => item.href === "/school-admin/teaching");
  assert.equal(teaching?.status, undefined, "a 'Soon' badge on a working surface is a lie");

  const workspace = source("components/school-admin/teaching/execution-workspace.tsx");
  assert.ok(workspace.includes("by_status"), "figures must come from recorded statuses");
  assert.ok(
    workspace.includes("delivered_pct === null"),
    "no records must render as 'no data', never as 0% delivered",
  );
});
