import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { SCHOOL_ADMIN_NAV } from "../../lib/school-admin-nav.ts";

/**
 * Phase 8 — Teaching shows what was actually delivered.
 *
 * ⚠ The distinction this whole layer exists to protect: a date passing is not
 * evidence a lesson was taught. Every figure here comes from a status a teacher
 * set — completed, partially completed, skipped, rescheduled — and the surface
 * must never derive delivery from the calendar.
 */

const ROOT = new URL("../../", import.meta.url);

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, ROOT), "utf8");
}

const WORKSPACE = "components/school-admin/teaching/execution-workspace.tsx";
const PLANNING = "components/school-admin/planning/planning-workspace.tsx";

// ── Planned is not taught ───────────────────────────────────────────────────

test("execution and coverage are separate endpoints, never merged", () => {
  const api = source("lib/api.ts");
  assert.ok(api.includes("/school-admin/planning/execution"), "execution must have its own client");
  assert.ok(api.includes("/school-admin/planning/coverage"), "coverage must remain distinct");
  // Serving both from one response would invite treating a scheduled day as a
  // taught one.
  assert.ok(
    api.includes("schoolAdminExecution") && api.includes("schoolAdminCoverage"),
    "the two must be separate calls",
  );
});

test("the execution surface never derives delivery from a date", () => {
  const workspace = source(WORKSPACE);
  const code = workspace.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  // No comparison of a plan date against today anywhere in the render path.
  assert.ok(
    !/date\s*<\s*(today|now|new Date)/i.test(code),
    "delivery must come from teacher-set status, never from the calendar",
  );
  assert.ok(code.includes("by_status"), "figures must come from recorded statuses");
});

test("all five execution statuses are surfaced, including the unflattering ones", () => {
  const workspace = source(WORKSPACE);
  // Object keys, so the single-word ones are unquoted and the multi-word one
  // is not. Match the label map rather than a quoting style.
  for (const status of ["completed:", '"partially completed":', "planned:", "skipped:", "rescheduled:"]) {
    assert.ok(workspace.includes(status), `${status} must be reported`);
  }
});

// ── No data is not zero ─────────────────────────────────────────────────────

test("an empty period renders as 'no records', not as 0%", () => {
  // A school whose teachers have not opened their planners has not failed to
  // teach — it has failed to record. Rendering 0% asserts the first.
  const workspace = source(WORKSPACE);
  assert.ok(
    workspace.includes("delivered_pct === null"),
    "the null case must be handled explicitly",
  );
  assert.ok(workspace.includes("No records yet"), "it must say so in words");
});

test("assigned and reporting teacher counts are both shown", () => {
  // Zero completions across ten teachers who never opened their planner means
  // something entirely different from zero across ten who did.
  const workspace = source(WORKSPACE);
  assert.ok(workspace.includes("assigned_teachers"));
  assert.ok(workspace.includes("reporting_teachers"));
});

// ── Privacy ─────────────────────────────────────────────────────────────────

test("the execution surface never renders a teacher's words", () => {
  const workspace = source(WORKSPACE);
  // ⚠ Assert on property ACCESS, not on the words appearing anywhere. The page
  // carries a visible sentence promising notes are private, and a substring
  // check flags that sentence — which the assertion below requires. Checking
  // for `.notes` in prose made this test contradict itself.
  for (const access of [
    /\.\s*teacher_notes/,
    /\.\s*observation\b/,
    /summary\??\.\s*notes/,
    /\bnotes\s*:/,
  ]) {
    assert.ok(!access.test(workspace), `${access} would read a teacher's private record`);
  }
  assert.ok(
    workspace.includes("private to the teacher"),
    "the promise must be stated on the page, not just kept",
  );
});

test("the wire type carries no free text", () => {
  const api = source("lib/api.ts");
  const block = api.slice(
    api.indexOf("export type ExecutionSummary"),
    api.indexOf("export type ExecutionSummary") + 700,
  );
  for (const field of ["observation", "teacher_notes"]) {
    assert.ok(!block.includes(field), `ExecutionSummary must not carry ${field}`);
  }
});

// ── Teaching is no longer a foundation page ─────────────────────────────────

test("Teaching has dropped its foundation badge, because it now has data", () => {
  const teaching = SCHOOL_ADMIN_NAV.find((item) => item.href === "/school-admin/teaching");
  assert.ok(teaching, "Teaching must still be top level");
  assert.equal(teaching?.status, undefined, "a 'Soon' badge on a working surface is a lie");
});

test("the teaching page renders the execution workspace", () => {
  const page = source("app/school-admin/(shell)/teaching/page.tsx");
  assert.ok(page.includes("ExecutionWorkspace"));
  assert.ok(!page.includes("Not connected yet"), "the foundation copy must be gone");
});

// ── Rescheduling ────────────────────────────────────────────────────────────

test("rescheduling moves the plan rather than recreating it", () => {
  // Recreating would lose that a day was MOVED rather than newly planned —
  // exactly the distinction execution reporting depends on.
  const planning = source(PLANNING);
  assert.ok(planning.includes("schoolAdminReschedulePlan"), "it must use the reschedule endpoint");
  assert.ok(
    !/schoolAdminCancelPlan[\s\S]{0,200}schoolAdminCreatePlan/.test(planning),
    "a move must not be implemented as cancel-then-create",
  );
});

test("an invalid reschedule surfaces the server's own reason", () => {
  const planning = source(PLANNING);
  // The service names the date and why — a holiday, outside every term, or
  // already taken. Anything generic here would be worse.
  assert.ok(
    /Could not move that day[\s\S]{0,300}getErrorMessage\(error/.test(planning),
    "the refusal must route through the error gateway",
  );
});

test("the reschedule date is bounded by the academic year", () => {
  const planning = source(PLANNING);
  assert.ok(planning.includes("min={year?.starts_on}"), "a date outside the year is never valid");
  assert.ok(planning.includes("max={year?.ends_on}"));
});
