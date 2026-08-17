import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * Platform Admin and School Admin are one product.
 *
 * They had drifted into two design languages: School Admin used flat white
 * surfaces on a #f7f8fa canvas with slate ink, while Admin used 32px radii,
 * layered gradients, glassy `bg-white/86` panels and a `#071b49` navy. Admin
 * was also the only authenticated surface still on the system font stack, so a
 * platform admin moving between /admin and /school-admin watched the product
 * change typeface mid-session.
 *
 * These tests pin the shared vocabulary. They check the SHELL and the design
 * system — not individual pages, which compose those primitives and inherit the
 * look for free.
 */

function source(relativePath: string) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

/**
 * Source with comments stripped.
 *
 * The "these tokens are gone" assertions below scan for strings like
 * `#071b49`. The files legitimately NAME those tokens in prose, explaining what
 * they replaced — so scanning raw source makes the documentation fail the test
 * that the documentation exists to explain.
 */
function code(relativePath: string) {
  return source(relativePath)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

const adminLayout = source("app/admin/layout.tsx");
// The typography wrapper stayed on the ROOT school-admin layout when the shell
// moved into the `(shell)` group, so it now covers guided setup too.
const schoolLayout = source("app/school-admin/layout.tsx");
const adminShell = source("components/admin/admin-shell.tsx");
const schoolShell = source("components/school-admin/school-admin-shell.tsx");
const adminUi = source("components/admin/admin-ui.tsx");
const adminUiCode = code("components/admin/admin-ui.tsx");
const adminShellCode = code("components/admin/admin-shell.tsx");

// ── Fonts ───────────────────────────────────────────────────────────────────

test("both admin surfaces use the same typography wrapper", () => {
  // `primary-route-typography` (components/primary/primary.css) is Baloo 2 for
  // headings and Nunito Sans for body. It is imported globally, so applying the
  // class is the whole integration.
  for (const [name, layout] of [["admin", adminLayout], ["school-admin", schoolLayout]] as const) {
    assert.match(layout, /primary-route-typography/, `${name} is not on the shared typeface`);
  }
});

// ── Shell chrome ────────────────────────────────────────────────────────────

test("both shells sit on the same canvas", () => {
  for (const [name, shell] of [["admin", adminShell], ["school-admin", schoolShell]] as const) {
    assert.match(shell, /bg-\[#f7f8fa\]/, `${name} uses a different page background`);
  }
});

test("both sidebars use the same width, border and surface", () => {
  for (const [name, shell] of [["admin", adminShell], ["school-admin", schoolShell]] as const) {
    assert.match(shell, /w-64 flex-col border-r border-slate-200 bg-white/, `${name} sidebar differs`);
  }
});

test("both shells mark the active nav item the same way", () => {
  // A tinted pill plus a left rail marker.
  for (const [name, shell] of [["admin", adminShell], ["school-admin", schoolShell]] as const) {
    assert.match(shell, /bg-blue-50 text-blue-700/, `${name} active tint differs`);
    assert.match(shell, /before:w-1 before:rounded-full before:bg-blue-600/, `${name} lacks the rail marker`);
  }
});

test("both shells use the same sign-out affordance", () => {
  for (const [name, shell] of [["admin", adminShell], ["school-admin", schoolShell]] as const) {
    assert.match(shell, /hover:bg-rose-50 hover:text-rose-600/, `${name} sign-out differs`);
  }
});

test("both shells frame content identically", () => {
  for (const [name, shell] of [["admin", adminShell], ["school-admin", schoolShell]] as const) {
    assert.match(shell, /max-w-\[1480px\]/, `${name} content width differs`);
  }
});

test("the admin shell no longer uses the bespoke teachpad-* chrome tokens", () => {
  // Those tokens still exist and are still correct for the marketing and
  // teacher surfaces — they were simply never School Admin's vocabulary, and
  // having both inside one admin experience is what looked broken.
  assert.ok(
    !/teachpad-(ink|muted|cardBorder|panel|tag|blue)/.test(adminShellCode),
    "admin shell still mixes the legacy chrome palette",
  );
});

// ── The shared design system ────────────────────────────────────────────────

test("admin primitives use flat slate surfaces, not gradients and glass", () => {
  for (const gone of ["rounded-[32px]", "bg-white/86", "#071b49", "font-black", "backdrop-blur-sm"]) {
    assert.ok(
      !adminUiCode.includes(gone),
      `admin-ui still uses ${gone}, which School Admin never had`,
    );
  }
});

test("admin headings match School Admin's heading treatment", () => {
  const pagePrimitives = source("components/school-admin/shared/page-primitives.tsx");
  // Same size, weight and optical tracking on the page title.
  const heading = /text-2xl font-semibold tracking-\[-0\.025em\] text-slate-950 sm:text-3xl/;
  assert.match(adminUi, heading, "admin page header differs");
  assert.match(pagePrimitives, heading, "school-admin page header moved — update both");
});

test("admin panels and cards use the shared radius and border", () => {
  assert.match(adminUi, /rounded-2xl border border-slate-200 bg-white/);
});

// ── Behaviour must be untouched ─────────────────────────────────────────────

test("restyling did not weaken the platform-admin role gate", () => {
  assert.match(adminShell, /currentUser\.role !== "admin"/);
});

test("the admin surface still renders one h1 per page", () => {
  // The sticky header shows the active nav label. It must not be an <h1>:
  // every page renders its own through AdminPageHeader, and two h1s on one
  // page is an accessibility defect rather than a styling preference.
  const header = adminShellCode.slice(
    adminShellCode.indexOf("sticky top-0"),
    adminShellCode.indexOf("</header>"),
  );
  assert.ok(!header.includes("<h1"), "the shell header competes with the page title");
  assert.match(adminUi, /<h1 /, "AdminPageHeader should own the page title");
});
