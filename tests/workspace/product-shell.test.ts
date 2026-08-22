import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { SCHOOL_ADMIN_NAV } from "../../lib/school-admin-nav.ts";
import {
  ACADEMIC_MODULE,
  PRODUCT_MODULES,
  activeModule,
  isProductNavItemActive,
  productNavFor,
  type ProductModuleKey,
} from "../../lib/product-nav.ts";

/**
 * Phase 1 — School Admin becomes the Academic module of a larger product.
 *
 * The whole risk of this phase is that "adding a navigation layer" quietly
 * becomes "changing the navigation". These tests assert the opposite: that for
 * every `/school-admin/*` path the product layer is a pass-through.
 */

const ROOT = new URL("../../", import.meta.url);

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, ROOT), "utf8");
}

// ── Academic is a pass-through ──────────────────────────────────────────────

test("Academic's navigation is the School Admin list, not a copy of it", () => {
  // Identity, not deep equality: a duplicated array would pass a deepEqual and
  // then drift the first time someone added a School Admin page.
  assert.equal(
    ACADEMIC_MODULE.items,
    SCHOOL_ADMIN_NAV,
    "Academic must reference SCHOOL_ADMIN_NAV itself, never restate it",
  );
});

test("every School Admin path resolves to Academic and renders its own nav", () => {
  for (const path of [
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
    "/school-admin/setup",
  ]) {
    assert.equal(activeModule(path).key, "academic", `${path} must resolve to Academic`);
    assert.equal(productNavFor(path), SCHOOL_ADMIN_NAV, `${path} must render the School Admin nav`);
  }
});

test("`/school` is not treated as a prefix of `/school-admin`", () => {
  // The bug this exists to prevent: a naive startsWith("/school") makes every
  // Academic page resolve to Home and blanks the sidebar.
  assert.equal(activeModule("/school-admin").key, "academic");
  assert.equal(activeModule("/school").key, "home");
  assert.equal(activeModule("/school/insights").key, "insights");
});

test("Academic's active-item rule still delegates to School Admin's", () => {
  // `/school-admin/themes` is sub-navigation under Curriculum, so Curriculum
  // lights up — a prefix match would light nothing.
  assert.ok(
    isProductNavItemActive("/school-admin/curriculum/overview", "/school-admin/themes"),
    "Curriculum must stay lit on a relocated child route",
  );
  assert.ok(
    !isProductNavItemActive("/school-admin/people", "/school-admin/themes"),
    "an unrelated section must not light up",
  );
  // Overview is exact-match only.
  assert.ok(isProductNavItemActive("/school-admin", "/school-admin"));
  assert.ok(!isProductNavItemActive("/school-admin", "/school-admin/curriculum"));
});

// ── New modules ─────────────────────────────────────────────────────────────

test("new modules take a namespace that collides with nothing existing", () => {
  for (const module of PRODUCT_MODULES) {
    if (module.key === "academic") {
      assert.equal(module.href, "/school-admin", "Academic must not move");
      continue;
    }
    assert.ok(
      module.href === "/school" || module.href.startsWith("/school/"),
      `${module.key} must live under /school — got ${module.href}`,
    );
    // `/school-excellence` is the public marketing page. A module route must
    // never be confusable with it.
    assert.ok(
      !module.href.startsWith("/school-excellence"),
      `${module.key} collides with the marketing landing page`,
    );
  }
});

test("every module destination has a route file", () => {
  const routeFor = (href: string) =>
    href === "/school"
      ? "app/school/(shell)/page.tsx"
      : `app/school/(shell)/${href.replace("/school/", "")}/page.tsx`;

  for (const module of PRODUCT_MODULES) {
    if (module.key === "academic") continue;
    assert.ok(existsSync(new URL(routeFor(module.href), ROOT)), `${module.href} has no page`);
    for (const item of module.items) {
      assert.ok(existsSync(new URL(routeFor(item.href), ROOT)), `${item.href} has no page`);
    }
  }
});

test("a module's own items resolve by longest match", () => {
  const path = "/school/insights/teacher-preparation";
  assert.equal(activeModule(path).key, "insights");
  assert.ok(isProductNavItemActive("/school/insights/teacher-preparation", path));
  assert.ok(
    !isProductNavItemActive("/school/insights", path),
    "the module root must not stay lit on a child route",
  );
});

test("the modules are ordered by dependency, not alphabetically", () => {
  const order = PRODUCT_MODULES.map((m) => m.key);
  const rank = (key: ProductModuleKey) => order.indexOf(key);
  // Teach → measure → diagnose → fix → lead.
  assert.ok(rank("academic") < rank("insights"), "Insights depends on Academic");
  assert.ok(rank("insights") < rank("excellence"), "Excellence depends on Insights");
  assert.ok(rank("excellence") < rank("improvement"), "Improvement depends on Excellence");
  assert.ok(rank("improvement") < rank("leadership"), "Leadership consumes everything");
});

// ── One shell, one design system ────────────────────────────────────────────

test("the new modules render through the same shell as Academic", () => {
  const shell = source("components/school-admin/school-admin-shell.tsx");
  assert.ok(
    shell.includes("export const ProductShell = SchoolAdminShell"),
    "there must be exactly one shell implementation",
  );
  assert.ok(
    source("app/school/(shell)/layout.tsx").includes("ProductShell"),
    "the product routes must use it",
  );
  // Academic's own layout is untouched and still names SchoolAdminShell.
  assert.ok(source("app/school-admin/(shell)/layout.tsx").includes("SchoolAdminShell"));
});

test("product primitives re-export the Academic ones rather than reimplementing", () => {
  const primitives = source("components/product/primitives.tsx");
  assert.ok(
    primitives.includes('from "@/components/school-admin/shared/page-primitives"'),
    "the product design system must BE the Academic design system",
  );
  assert.ok(
    primitives.includes("SchoolAdminPage as ProductPage"),
    "the page shell must be the same component, not a lookalike",
  );
});

test("no new-module page ships a hardcoded prototype figure", () => {
  // The brief names these explicitly: 61/100, 76%, 82%, 5 days behind,
  // 7 teachers pending. A foundation screen states what it is instead.
  const banned = /\b(61\s*\/\s*100|76%|82%|84%|5 days behind|7 teachers)\b/;
  const pages = [
    "app/school/(shell)/page.tsx",
    "app/school/(shell)/excellence/page.tsx",
    "app/school/(shell)/excellence/findings/page.tsx",
    "app/school/(shell)/excellence/priorities/page.tsx",
    "app/school/(shell)/improvement/page.tsx",
    "app/school/(shell)/insights/page.tsx",
    "app/school/(shell)/leadership/page.tsx",
    "app/school/(shell)/reports/page.tsx",
  ];
  for (const page of pages) {
    assert.ok(!banned.test(source(page)), `${page} ships a prototype number`);
  }
});

test("the metric card renders unavailable rather than zero", () => {
  const primitives = source("components/product/primitives.tsx");
  assert.ok(primitives.includes("value: number | null"), "a metric must be allowed to have no value");
  assert.ok(
    primitives.includes('"Not enough data"'),
    "a null metric must say so, never render 0",
  );
});
