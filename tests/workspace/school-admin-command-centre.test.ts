import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * Phase 9 — the Overview as a command centre.
 *
 * ⚠ Built last on purpose. Every figure is integrated from a workflow that
 * works: curriculum readiness from the server's verdict, scheduling from the
 * planning layer, delivery from statuses teachers set. Assembled before those
 * existed it would have been decoration.
 *
 * These tests also close three findings from the original audit that survived
 * every phase until the page was rebuilt.
 */

const ROOT = new URL("../../", import.meta.url);

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, ROOT), "utf8");
}

const OVERVIEW = "components/school-admin/overview/school-admin-overview.tsx";

// ── The three original audit findings ───────────────────────────────────────

test("the page is titled Overview, matching the sidebar item that reaches it", () => {
  // Original finding A5: the sidebar said "Overview" and the page said
  // "Primary Curriculum".
  const overview = source(OVERVIEW);
  assert.ok(overview.includes('title="Overview"'));
  assert.ok(
    !overview.includes('title="Primary Curriculum"'),
    "the title mismatch must not return",
  );
});

test("nothing claims to be recent without an ordering", () => {
  // Original finding B1: `lessonsForMonth(...).slice(0, 4)` — no ordering at
  // all — was labelled "recently published days". `lessonsForMonth` still
  // applies no sort, so the honest fix was to stop making the claim.
  // ⚠ Comments stripped. An assertion that a word is ABSENT will always trip
  // over the comment explaining why it was removed — this is the third such
  // false positive in this suite, so the rule is: absence checks read code.
  const overview = source(OVERVIEW).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.ok(!/recent/i.test(overview), "the page must not claim recency it cannot establish");
  assert.ok(
    !/\.slice\(0,\s*4\)/.test(overview),
    "an arbitrary slice presented as a selection is the defect itself",
  );
});

test("no computed value is left unread", () => {
  // Original finding B7: a `published` slot count was computed and never used.
  const overview = source(OVERVIEW);
  const declared = Array.from(overview.matchAll(/^\s*const (\w+) = /gm)).map((match) => match[1]);
  for (const name of declared) {
    // Each declaration must appear again somewhere else in the file.
    const uses = overview.split(new RegExp(`\\b${name}\\b`)).length - 1;
    assert.ok(uses > 1, `${name} is computed but never read`);
  }
});

// ── Every figure is real and actionable ─────────────────────────────────────

test("each status card links to where its number is acted on", () => {
  const overview = source(OVERVIEW);
  assert.ok(overview.includes("function LoopCard"), "cards must share one component");
  assert.ok(/href: string;/.test(overview), "a card must require a destination");
  for (const destination of [
    "/school-admin/curriculum/overview",
    "/school-admin/planning",
    "/school-admin/teaching",
    "/school-admin/teachers",
  ]) {
    assert.ok(overview.includes(destination), `the loop must reach ${destination}`);
  }
});

test("attention items are assembled only from non-zero, actionable state", () => {
  const overview = source(OVERVIEW);
  // A count of zero must contribute nothing rather than a reassuring green row:
  // nine satisfied checks bury the one that is not.
  assert.ok(
    overview.includes(".filter(Boolean)"),
    "falsy entries must be dropped from the attention list",
  );
  assert.ok(
    /blocked\.length &&/.test(overview),
    "an item must be conditional on having something to report",
  );
});

test("every attention item carries a destination", () => {
  const overview = source(OVERVIEW);
  const items = overview.slice(overview.indexOf("const attention = ["), overview.indexOf(".filter(Boolean)"));
  const keys = (items.match(/key: "/g) ?? []).length;
  const hrefs = (items.match(/href: /g) ?? []).length;
  assert.ok(keys > 0, "there must be attention items to check");
  assert.equal(hrefs, keys, "every item needs somewhere to go");
});

// ── Integrated from real workflows, not invented ────────────────────────────

test("readiness comes from the server verdict, never recomputed", () => {
  const overview = source(OVERVIEW);
  assert.ok(overview.includes("monthMetrics("), "curriculum readiness must use the shared metrics");
  assert.ok(overview.includes("blockingIssues("), "issues must come from the server");
  assert.ok(overview.includes("resourceIssues("), "resource gaps must use the one shared rule");
  assert.ok(
    !/lesson\.(steps|objectives)\??\.length\s*(===|<|>)/.test(overview),
    "the overview must not judge readiness from lesson fields",
  );
});

test("scheduled and delivered come from their own layers and stay distinct", () => {
  const overview = source(OVERVIEW);
  assert.ok(overview.includes("schoolAdminCoverage"), "scheduling must come from the planning layer");
  assert.ok(overview.includes("schoolAdminExecution"), "delivery must come from the execution layer");
  assert.ok(
    overview.includes("days_with_plans") && overview.includes("delivered_pct"),
    "the two must be reported separately",
  );
});

test("the page states that a date passing is not a lesson taught", () => {
  // The distinction the whole planning/execution split exists to protect, on
  // the one screen most likely to blur it.
  const overview = source(OVERVIEW);
  assert.ok(
    /date passing is never treated as a/.test(overview),
    "the distinction must be stated where both figures appear together",
  );
});

test("no records renders as 'No data', never as zero per cent", () => {
  const overview = source(OVERVIEW);
  assert.ok(
    overview.includes('delivered_pct === null ? "No data"'),
    "an empty denominator must not become a percentage",
  );
});

// ── Presentation ────────────────────────────────────────────────────────────

test("card status is not carried by colour alone", () => {
  const overview = source(OVERVIEW);
  assert.ok(
    overview.includes("ok ? <CheckCircle2"),
    "a satisfied card must carry an icon, not just a green tint",
  );
});

test("each panel loads independently rather than blocking the page", () => {
  const overview = source(OVERVIEW);
  // Four independent queries; a slow roster must not hide curriculum readiness.
  assert.ok(overview.includes("loading={lessons.isLoading}"));
  assert.ok(overview.includes("loading={coverage.isLoading}"));
  assert.ok(overview.includes("loading={execution.isLoading}"));
  assert.ok(overview.includes("loading={roster.isLoading}"));
});

test("setup guidance still appears for an unconfigured school", () => {
  const overview = source(OVERVIEW);
  assert.ok(overview.includes("<SetupPrompt />"), "an unfinished school must still be prompted");
});
