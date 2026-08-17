import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

import { SCHOOL_ADMIN_SUBNAV } from "../../lib/school-admin-nav.ts";

/**
 * Phase 0 invariants.
 *
 * The existing School Admin suites test `lib/` modules, which is why none of
 * them caught the component-level defects the audit found. These are the
 * cheapest guards that would have: each one is a property of the source that
 * can be asserted without a DOM runner, and each corresponds to a defect that
 * actually shipped.
 */

const ROOT = new URL("../../", import.meta.url);

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, ROOT), "utf8");
}

function schoolAdminComponents(): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(new URL(dir, ROOT), { withFileTypes: true })) {
      if (entry.isDirectory()) walk(`${dir}${entry.name}/`);
      else if (entry.name.endsWith(".tsx")) files.push(`${dir}${entry.name}`);
    }
  };
  walk("components/school-admin/");
  return files;
}

// ── Accessible primitives, not hand-rolled overlays ─────────────────────────

test("no School Admin component hand-rolls a modal", () => {
  // Six of these shipped: create-day, curriculum preview, bulk-publish confirm,
  // resource picker, day preview and publish review. All were
  // `<div role="dialog" aria-modal="true">` with no focus trap, no Escape, no
  // focus restore and no scroll lock, while the Radix-backed ActionDialog sat
  // in the same folder.
  const offenders = schoolAdminComponents().filter((file) => {
    const text = source(file);
    return text.includes('role="dialog"') && !text.includes("Dialog.Content");
  });
  assert.deepEqual(offenders, [], `hand-rolled dialogs must use ActionDialog: ${offenders.join(", ")}`);
});

test("no School Admin component uses <details> as an action menu", () => {
  // `<details>/<summary>` carries no menu semantics, does not close on Escape
  // or outside click, and several could sit open at once.
  const offenders = schoolAdminComponents().filter((file) => source(file).includes("<details"));
  assert.deepEqual(offenders, [], `use ActionMenu instead of <details>: ${offenders.join(", ")}`);
});

test("the shared action menu portals, so no ancestor overflow can clip it", () => {
  const menu = source("components/ui/action-menu.tsx");
  // The roster's menu lived inside `overflow-hidden > overflow-x-auto`. Because
  // `overflow-x: auto` makes `overflow-y: visible` compute to `auto`, the panel
  // was clipped rather than overlaying. A portal is the fix that cannot regress
  // when a card's styling changes.
  assert.ok(menu.includes("Menu.Portal"), "ActionMenu must render its content in a portal");
  assert.ok(menu.includes("@radix-ui/react-dropdown-menu"), "ActionMenu must use the Radix primitive");
});

// ── Curriculum context survives every child route ───────────────────────────

test("every Curriculum sub-navigation destination renders the sub-navigation", () => {
  // Review & Publish is declared in the Curriculum group but never mounted
  // SectionSubnav, so arriving there removed the nav that got you there.
  const componentFor: Record<string, string> = {
    "/school-admin/curriculum/overview": "components/school-admin/curriculum/curriculum-overview.tsx",
    "/school-admin/themes": "components/school-admin/themes/themes-workspace.tsx",
    "/school-admin/curriculum": "components/school-admin/curriculum/curriculum-workspace.tsx",
    "/school-admin/curriculum/review":
      "components/school-admin/curriculum/review-publish-workspace.tsx",
    "/school-admin/calendar": "components/school-admin/calendar/calendar-workspace.tsx",
    "/school-admin/resources": "components/school-admin/resources/resources-workspace.tsx",
    "/school-admin/academic-years":
      "components/school-admin/academic-years/academic-years-workspace.tsx",
    "/school-admin/settings": "components/school-admin/settings/settings-workspace.tsx",
    "/school-admin/teachers": "components/school-admin/teachers/teachers-workspace.tsx",
    "/school-admin/people": "app/school-admin/(shell)/people/page.tsx",
    "/school-admin/planning": "components/school-admin/planning/planning-workspace.tsx",
    "/school-admin/teaching": "components/school-admin/teaching/execution-workspace.tsx",
    "/school-admin/assessments": "app/school-admin/(shell)/assessments/page.tsx",
  };

  for (const children of Object.values(SCHOOL_ADMIN_SUBNAV)) {
    for (const child of children) {
      const file = componentFor[child.href];
      assert.ok(file, `no component mapped for sub-nav entry ${child.href}`);
      assert.ok(
        source(file).includes("<SectionSubnav />"),
        `${child.href} is in a sub-nav group but does not render SectionSubnav`,
      );
    }
  }
});

// ── One rule per question ───────────────────────────────────────────────────

test("Overview and the curriculum grid read the same resource-issue rule", () => {
  // The Overview card counted `advisoryNotes`, the grid highlighted
  // `blockingIssues` — disjoint sets, so "N days need resources" linked to a
  // grid that highlighted nothing.
  const overview = source("components/school-admin/overview/school-admin-overview.tsx");
  const grid = source("components/school-admin/curriculum/curriculum-workspace.tsx");
  const readiness = source("lib/curriculum-readiness.ts");

  assert.ok(readiness.includes("export function resourceIssues"), "the shared rule must exist");
  assert.ok(overview.includes("resourceIssues("), "Overview must read the shared rule");
  assert.ok(grid.includes("resourceIssues("), "the grid must read the shared rule");
  assert.ok(
    !/startsWith\("step_resource"\)/.test(overview + grid),
    "neither surface may re-derive the resource rule inline",
  );
});

test("readiness is still the server's verdict and is never recomputed client-side", () => {
  // The strongest existing decision in the surface. Phase 0 must not weaken it.
  const readiness = source("lib/curriculum-readiness.ts");
  assert.ok(
    readiness.includes("lesson?.readiness?.checks"),
    "readiness must be read from the server payload",
  );
  assert.ok(
    !readiness.includes("function evaluate"),
    "curriculum-readiness must not evaluate lessons itself",
  );
});

// ── Error gateway ───────────────────────────────────────────────────────────

test("no School Admin component renders a raw error message", () => {
  // `CLAUDE.md`: never render `error.message` directly. Without a `code` the
  // gateway is what collapses a 5xx to a generic message and a fetch TypeError
  // to a network message.
  const offenders = schoolAdminComponents().filter((file) => {
    const text = source(file);
    return /description:\s*(error|cause)\??\.message/.test(text);
  });
  assert.deepEqual(offenders, [], `route errors through getErrorMessage: ${offenders.join(", ")}`);
});
