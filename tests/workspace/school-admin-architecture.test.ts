import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

function source(relativePath: string) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

test("school administration uses URL-driven workspace routes", () => {
  for (const route of ["curriculum", "themes", "resources", "academic-years", "settings"]) {
    assert.equal(existsSync(new URL(`../../app/school-admin/${route}/page.tsx`, import.meta.url)), true);
  }
  const overview = source("app/school-admin/page.tsx");
  assert.doesNotMatch(overview, /useState<Tab>/);
  assert.doesNotMatch(overview, /ResourceMappingPanel/);
});

test("school administration has a dedicated product shell", () => {
  const layout = source("app/school-admin/layout.tsx");
  const shell = source("components/school-admin/school-admin-shell.tsx");
  assert.match(layout, /SchoolAdminShell/);
  assert.doesNotMatch(layout, /AppShell|DashboardBillingShell/);
  assert.match(shell, /SCHOOL_ADMIN_NAV/);
  assert.match(shell, /user\.role !== "org_admin"/);
  assert.doesNotMatch(shell, /teacherNav|MobileBottomNav|PlanBanner|OnboardingWizard/);
});

test("resource mapping is nested under curriculum rather than a workspace route", () => {
  const shell = source("components/school-admin/school-admin-shell.tsx");
  const curriculum = source("components/school-admin/day-editor/school-day-editor.tsx");
  const resourcePicker = source("components/school-admin/day-editor/resource-picker.tsx");
  assert.doesNotMatch(shell, /\/school-admin\/mapping/);
  assert.match(curriculum, /Add resource/);
  assert.match(resourcePicker, /School Library/);
  assert.match(resourcePicker, /TeachPad Library/);
  assert.doesNotMatch(resourcePicker, /Resource Mapping/);
});

test("school curriculum exposes explicit master customization requests", () => {
  const api = source("lib/api.ts");
  const curriculum = source("components/school-admin/day-editor/school-day-editor.tsx");
  assert.match(api, /adminCustomizePrimaryLesson/);
  assert.match(api, /adminCustomizePrimaryTheme/);
  assert.match(curriculum, /lesson\?\.scope === "platform"/);
  assert.match(curriculum, /Customize for your school/);
});
