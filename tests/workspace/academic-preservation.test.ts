import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

import { SCHOOL_ADMIN_NAV, SCHOOL_ADMIN_SUBNAV, RELOCATED_ROUTES } from "../../lib/school-admin-nav.ts";

/**
 * Academic preservation lock — Phase 0 of the School Excellence OS work.
 *
 * ⚠ THIS FILE EXISTS TO MAKE ONE KIND OF MISTAKE LOUD. The School Excellence,
 * Improvement, Insights, Leadership and Reports modules are being built
 * *around* the current School Admin, which becomes the Academic module
 * unchanged. The failure mode that would quietly break a working product is a
 * new module reaching into a shared Academic component — a "small tidy-up" to
 * `page-primitives.tsx`, an extra nav item in `school-admin-nav.ts`, a tweak to
 * the readiness helper — and silently changing `/school-admin/curriculum/overview`
 * for every existing school.
 *
 * The existing suites assert *properties* of these files (see
 * `school-admin-curriculum-overview.test.ts` and
 * `school-admin-phase0-invariants.test.ts`). Those remain the tests that say
 * what the page must DO. This one says something narrower and blunter: these
 * exact bytes are the shipped Academic surface, and nothing in the new-module
 * work may change them by accident.
 *
 * ⚠ HOW TO CHANGE A PROTECTED FILE. Deliberately, and never to satisfy this
 * test. If an Academic file genuinely must change to support a new module:
 *
 *   1. Make the change and confirm the behavioural suites still pass.
 *   2. Re-read `/school-admin/curriculum/overview` and confirm the visual and
 *      workflow contract in `ACADEMIC_CONTRACT` below still holds.
 *   3. Update the digest here in the same commit, with the reason in the
 *      commit message.
 *
 * A digest updated in its own commit, or updated without the suites passing, is
 * the thing this file is trying to prevent.
 */

const ROOT = new URL("../../", import.meta.url);

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, ROOT), "utf8");
}

function digest(relativePath: string): string {
  return createHash("sha256").update(readFileSync(new URL(relativePath, ROOT))).digest("hex");
}

/**
 * The Academic surface, pinned.
 *
 * ⚠ Scoped deliberately. This is not "every School Admin file" — locking all 31
 * components would make ordinary Academic maintenance fail this test and the
 * digests would be rubber-stamped within a week. These eleven are the ones a
 * *new module* would plausibly touch: the canonical page, the two layouts that
 * wrap it, the shell, the four shared primitives every screen composes, and the
 * three `lib/` modules that decide navigation, readiness and curriculum URLs.
 */
const PROTECTED: Readonly<Record<string, string>> = {
  // The canonical page and its route.
  "app/school-admin/(shell)/curriculum/overview/page.tsx":
    "b3864218e8af91e60ff8bbbb624539ab380ea4f590a1d5ec052b3681341f20a7",
  "components/school-admin/curriculum/curriculum-overview.tsx":
    "4eb5c7a7e2f8aa251d746e3a79fde2592bd9728ac0af4b8aa2acaf057b4f441b",

  // The layouts that wrap it. The route group carries no URL segment, so a
  // change here silently moves every School Admin page.
  "app/school-admin/layout.tsx":
    "6b981a1d38e60ecefa08bea7be8742959974cdbe9c1884dfe6d9af447306bcc7",
  "app/school-admin/(shell)/layout.tsx":
    "20f1abffc16dd51790a14cee037dd38631b29b6971c035b7d50643c1e92b0f88",
  // ⚠ DIGEST UPDATED ONCE, in the product-shell change. The shell now resolves
  // its sidebar items from the pathname (`productNavFor`) instead of importing
  // `SCHOOL_ADMIN_NAV` directly, and renders one collapsed module switcher above
  // them. For every `/school-admin/*` route `productNavFor` returns
  // `SCHOOL_ADMIN_NAV` unchanged, so Academic's items, order, active state and
  // styling are identical to what shipped. Nothing else in the file moved: the
  // session check, onboarding gate, role redirect, mobile drawer, sign-out and
  // layout classes are byte-identical. The full suite passed at the time of the
  // update with this as the only failure.
  "components/school-admin/school-admin-shell.tsx":
    "08833548a3c52ef4ccc6e5a2f0d9e5127439fb5cb12f7467b33b3553d3961078",

  // The shared visual language. New modules must ADAPT to these, never edit
  // them — that is the whole "one product, not two projects" requirement.
  "components/school-admin/shared/page-primitives.tsx":
    "cb6fa92da8fd1419a818faf904627aff4b1a29272707cc84a322b620065f6a6d",
  "components/school-admin/shared/section-subnav.tsx":
    "5be3d49b39d7ec4ed67b4d58abb2b63fc92cb271617aed57be0b3d154086aa76",
  "components/school-admin/shared/status-badge.tsx":
    "ac961fd2a1aa03e981f148c31c3d9fb7eb8735f947514925112033140f3833dd",

  // Navigation, readiness and curriculum URLs.
  "lib/school-admin-nav.ts":
    "a15e6265d62de0a4e6866b235cd0324cc4436defc80b9d79d674f98cd3ebc0e7",
  "lib/curriculum-readiness.ts":
    "011e3e65ba16e1ff59db845cd1218dff36bb6be9a36b9d1e7f4d512ea871d8fe",
  "lib/school-admin-curriculum.ts":
    "a7db99621465200258ac5e87e0cebf4ca55b6126d8a2ac18a6602067dc9ccd11",
};

test("the protected Academic surface is byte-for-byte unchanged", () => {
  const changed: string[] = [];
  for (const [file, expected] of Object.entries(PROTECTED)) {
    const actual = digest(file);
    if (actual !== expected) changed.push(`${file}\n    expected ${expected}\n    actual   ${actual}`);
  }
  assert.deepEqual(
    changed,
    [],
    "Academic-preserved files changed. If the change is required to support a new " +
      "module, confirm the behavioural suites still pass and update the digest in " +
      `this file in the SAME commit. Changed:\n  ${changed.join("\n  ")}`,
  );
});

/**
 * The workflow and visual contract of `/school-admin/curriculum/overview`.
 *
 * ⚠ Deliberately separate from the digest. A digest says "these bytes"; this
 * says "and here is what a reader would lose if they changed". If a future
 * commit legitimately updates the digest, these assertions are what still
 * catches a regression in the thing the page is FOR.
 */
const ACADEMIC_CONTRACT = "components/school-admin/curriculum/curriculum-overview.tsx";

test("the overview keeps its page shell, heading and content width", () => {
  const page = source(ACADEMIC_CONTRACT);
  assert.ok(page.includes("<SchoolAdminPage>"), "the page must use the shared Academic shell");
  assert.ok(page.includes("<SectionSubnav />"), "the curriculum sub-navigation must render");
  assert.ok(page.includes("<PageHeading"), "the page must use the shared heading");
  assert.ok(
    source("components/school-admin/shared/page-primitives.tsx").includes("max-w-[1320px]"),
    "the Academic content width is 1320px — new modules match it rather than changing it",
  );
});

test("the overview keeps its three-band structure", () => {
  const page = source(ACADEMIC_CONTRACT);
  // Band 1: the dark readiness banner carrying the single next action.
  assert.ok(page.includes("rounded-3xl bg-slate-950"), "the readiness banner must stay");
  assert.ok(page.includes("readiness"), "the banner states month readiness");
  // Band 2: four stage cards, one per authoring stage.
  assert.ok(page.includes("function StageCard"), "the four stage cards must stay");
  assert.ok(page.includes("xl:grid-cols-4"), "the stage row is four across on wide screens");
  // Band 3: needs-attention, deep-linked per day.
  assert.ok(page.includes("Needs attention"), "the issues section must stay");
});

test("the overview keeps its loading, empty and error behaviour", () => {
  const page = source(ACADEMIC_CONTRACT);
  assert.ok(page.includes("<Skeleton"), "loading is a skeleton, not a spinner or a blank page");
  assert.ok(page.includes("No teaching days planned for"), "the empty state names the month");
  assert.ok(page.includes("Nothing is blocking"), "the resolved state says so specifically");
  assert.ok(
    source("app/school-admin/(shell)/curriculum/overview/page.tsx").includes("Suspense"),
    "the route boundary must keep its Suspense fallback",
  );
});

test("the overview still derives readiness from the server", () => {
  const page = source(ACADEMIC_CONTRACT);
  assert.ok(page.includes("monthMetrics("), "readiness comes from the shared slot metrics");
  assert.ok(page.includes("blockingIssues("), "issues come from the server verdict");
  assert.ok(
    !/lesson\.(steps|objectives)\??\.length\s*(===|<|>)/.test(page),
    "the overview must never judge readiness from a lesson's own fields",
  );
});

/**
 * URL stability.
 *
 * ⚠ The brief is explicit that new modules arrive as a navigation layer, not as
 * route churn. Every existing School Admin address must still be produced by
 * the nav module, because bookmarks and cross-surface deep links point at them.
 */
test("every existing School Admin URL is still reachable", () => {
  const hrefs = new Set<string>([
    ...SCHOOL_ADMIN_NAV.map((item) => item.href),
    ...Object.values(SCHOOL_ADMIN_SUBNAV).flatMap((items) => items.map((item) => item.href)),
  ]);
  for (const url of [
    "/school-admin",
    "/school-admin/curriculum",
    "/school-admin/curriculum/overview",
    "/school-admin/curriculum/review",
    "/school-admin/themes",
    "/school-admin/resources",
    "/school-admin/calendar",
    "/school-admin/planning",
    "/school-admin/teaching",
    "/school-admin/assessments",
    "/school-admin/people",
    "/school-admin/teachers",
    "/school-admin/settings",
    "/school-admin/academic-years",
  ]) {
    assert.ok(hrefs.has(url), `${url} disappeared from School Admin navigation`);
  }
});

test("relocated routes keep pointing at a section that still exists", () => {
  for (const [route, parent] of Object.entries(RELOCATED_ROUTES)) {
    assert.ok(
      SCHOOL_ADMIN_SUBNAV[parent],
      `${route} claims to live under ${parent}, which has no sub-navigation`,
    );
  }
});

/**
 * The module boundary, enforced from the Academic side.
 *
 * ⚠ This is the rule that keeps the product one application instead of two.
 * New-module components live in `components/<module>/` and may compose the
 * Academic primitives; Academic components must never depend on a new module,
 * because that is the direction that turns a preserved system into a coupled
 * one.
 */
const NEW_MODULES = ["excellence", "improvement", "insights", "leadership", "reports"] as const;

function componentFiles(dir: string): string[] {
  const files: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(new URL(current, ROOT), { withFileTypes: true })) {
      if (entry.isDirectory()) walk(`${current}${entry.name}/`);
      else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) files.push(`${current}${entry.name}`);
    }
  };
  walk(dir);
  return files;
}

test("no Academic component imports from a new module", () => {
  const offenders: string[] = [];
  for (const file of componentFiles("components/school-admin/")) {
    const text = source(file);
    for (const module of NEW_MODULES) {
      if (new RegExp(`from ["']@/components/${module}/`).test(text)) {
        offenders.push(`${file} → ${module}`);
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    "Academic must not depend on a module built on top of it. Dependency runs " +
      `Academic → Insights → Excellence → Improvement → Leadership, never back.\n  ${offenders.join("\n  ")}`,
  );
});
