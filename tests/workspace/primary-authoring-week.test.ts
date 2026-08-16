import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import {
  DEFAULT_TEACHING_WEEKDAYS,
  WEEK_ROWS,
  authoringDays,
  authoringWeeks,
  calendarYearOf,
  weekRows,
  weekdayAbbr,
  weekdayName,
} from "../../lib/primary-teaching-week.ts";
import { monthMetrics } from "../../lib/curriculum-readiness.ts";
import type { PrimaryAcademicYear, PrimaryCurriculumLesson } from "../../lib/api.ts";

// The curriculum authoring grid was five columns wide for every school —
// `const DAYS = [1, 2, 3, 4, 5]`, in three components. A school that had
// declared Monday–Saturday in its calendar got an open Saturday in the teacher
// planner and no column to author it in. The columns now come from the academic
// year's own `teaching_weekdays`.

const year = (
  teachingWeekdays: number[] | undefined,
  overrides: Partial<PrimaryAcademicYear> = {},
): PrimaryAcademicYear => ({
  id: "year-1",
  scope: "school",
  name: "2026–27",
  starts_on: "2026-06-01",
  ends_on: "2027-03-31",
  is_active: true,
  teaching_weekdays: teachingWeekdays,
  ...overrides,
});

const MON_TO_FRI = [0, 1, 2, 3, 4];
const MON_TO_SAT = [0, 1, 2, 3, 4, 5];

// ── Columns ────────────────────────────────────────────────────────────────

test("a five-day school renders five columns", () => {
  assert.deepEqual(authoringDays(year(MON_TO_FRI)), [1, 2, 3, 4, 5]);
});

test("a six-day school renders six columns", () => {
  assert.deepEqual(authoringDays(year(MON_TO_SAT)), [1, 2, 3, 4, 5, 6]);
});

test("Saturday is absent for a five-day school", () => {
  assert.equal(authoringDays(year(MON_TO_FRI)).includes(6), false);
});

test("Saturday is selectable for a six-day school", () => {
  assert.equal(authoringDays(year(MON_TO_SAT)).includes(6), true);
  assert.equal(weekdayName(6), "Saturday");
  assert.equal(weekdayAbbr(6), "SAT");
});

test("a year that declares nothing falls back to Monday–Friday", () => {
  // Every year created before the column existed, and the platform master
  // curriculum. The grid these schools see must not change at all.
  assert.deepEqual(authoringDays(year(undefined)), [1, 2, 3, 4, 5]);
  assert.deepEqual(authoringDays(null), [1, 2, 3, 4, 5]);
  assert.deepEqual(authoringDays(year([])), [1, 2, 3, 4, 5]);
  assert.deepEqual(DEFAULT_TEACHING_WEEKDAYS, [0, 1, 2, 3, 4]);
});

test("junk weekdays cannot empty the grid", () => {
  assert.deepEqual(authoringDays(year([9, -3])), [1, 2, 3, 4, 5]);
  assert.deepEqual(authoringDays(year([0, 5, 42])), [1, 6]);
});

test("columns are ISO-aligned, so adding Saturday moves nothing", () => {
  // ⚠ THE COMPATIBILITY GUARANTEE. Monday is column 1 in both schools; Saturday
  // is an additional column 6. A dense index over the configured weekdays would
  // renumber every published lesson the moment a school changed its week.
  const five = authoringDays(year(MON_TO_FRI));
  const six = authoringDays(year(MON_TO_SAT));
  assert.deepEqual(six.slice(0, 5), five);
  assert.equal(weekdayName(1), "Monday");
  assert.equal(weekdayName(5), "Friday");
});

// ── Week rows ──────────────────────────────────────────────────────────────

test("a five-day school always draws exactly five week rows", () => {
  for (let month = 1; month <= 12; month += 1) {
    assert.equal(authoringWeeks(year(MON_TO_FRI), month), WEEK_ROWS, `month ${month}`);
  }
});

test("a six-day month that spans six weeks draws six rows", () => {
  // March 2025 opens on a Saturday and closes on a Monday five Mondays later,
  // so a Monday–Saturday school genuinely teaches across six Monday-anchored
  // weeks. Drawing five would leave the 31st unauthorable.
  const sixDay = year(MON_TO_SAT, { starts_on: "2024-06-01", ends_on: "2025-03-31" });
  assert.equal(authoringWeeks(sixDay, 3), 6);
  assert.deepEqual(weekRows(sixDay, 3), [1, 2, 3, 4, 5, 6]);
});

test("a six-day school still draws five rows in an ordinary month", () => {
  assert.equal(authoringWeeks(year(MON_TO_SAT), 9), WEEK_ROWS);
});

test("a month number resolves to the right calendar year", () => {
  // An academic year spans two: June 2026 → March 2027.
  const academic = year(MON_TO_FRI);
  assert.equal(calendarYearOf(academic, 9), 2026);
  assert.equal(calendarYearOf(academic, 3), 2027);
  assert.equal(calendarYearOf(academic, 6), 2026);
});

// ── Metrics follow the same shape ──────────────────────────────────────────

const lesson = (week: number, day: number): PrimaryCurriculumLesson =>
  ({
    id: `l-${week}-${day}`, week, day, month: 9, status: "published", version: 1,
    scope: "school", level: "nursery", theme_id: "t", steps: [],
  }) as unknown as PrimaryCurriculumLesson;

test("a five-day month is still 25 slots", () => {
  assert.equal(monthMetrics([]).slots, 25);
  assert.equal(monthMetrics([], { weeks: 5, days: 5 }).slots, 25);
});

test("a six-day month is 30 slots", () => {
  assert.equal(monthMetrics([], { weeks: 5, days: 6 }).slots, 30);
});

test("completion is measured against the school's own slot count", () => {
  // 5 published days is 20% of a Monday–Friday month and 17% of a
  // Monday–Saturday one. Reporting 20% to a six-day school would overstate how
  // much of its year is live for teachers.
  const published = [1, 2, 3, 4, 5].map((day) => lesson(1, day));
  assert.equal(monthMetrics(published, { weeks: 5, days: 5 }).completionPct, 20);
  assert.equal(monthMetrics(published, { weeks: 5, days: 6 }).completionPct, 17);
});

test("a Saturday lesson counts as created and published", () => {
  const metrics = monthMetrics([lesson(1, 6)], { weeks: 5, days: 6 });
  assert.equal(metrics.created, 1);
  assert.equal(metrics.published, 1);
  assert.equal(metrics.empty, 29);
});

// ── The components ─────────────────────────────────────────────────────────

const read = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const workspace = read("components/school-admin/curriculum/curriculum-workspace.tsx");

test("the authoring grid has no hard-coded five-day array left", () => {
  assert.doesNotMatch(workspace, /const DAYS = \[1, 2, 3, 4, 5\]/);
  assert.doesNotMatch(workspace, /const WEEKS = \[1, 2, 3, 4, 5\]/);
  assert.match(workspace, /authoringDays\(activeYear\)/);
  assert.match(workspace, /weekRows\(activeYear, month\)/);
});

test("the grid's column count comes from the academic year", () => {
  // Tailwind cannot see a computed class name, so the track count has to be an
  // inline style — which is also what keeps six columns on one row instead of
  // scrolling sideways.
  assert.match(workspace, /gridTemplateColumns: `repeat\(\$\{DAYS\.length\}/);
  assert.doesNotMatch(workspace, /hidden grid-cols-5 gap-3 xl:grid/);
});

test("the week header counts against the school's own day count", () => {
  assert.doesNotMatch(workspace, /of 5 days planned/);
  assert.match(workspace, /of \{DAYS\.length\} days planned/);
});

test("the preview dialog is handed the same shape as the grid", () => {
  // Two different day lists would let an admin preview a month that does not
  // match the one they are authoring.
  assert.match(workspace, /weeks=\{WEEKS\}/);
  assert.match(workspace, /days=\{DAYS\}/);
});

test("no curriculum surface still carries a five-name weekday array", () => {
  for (const path of [
    "components/school-admin/curriculum/curriculum-workspace.tsx",
    "components/school-admin/curriculum/curriculum-day-card.tsx",
    "components/school-admin/curriculum/create-day-dialog.tsx",
    "components/school-admin/curriculum/review-publish-workspace.tsx",
    "components/school-admin/day-editor/school-day-editor.tsx",
    "components/admin/master-curriculum/resource-mapping-panel.tsx",
  ]) {
    const source = read(path);
    assert.doesNotMatch(
      source,
      /\["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"\]/,
      `${path} still hard-codes a five-day week`,
    );
    assert.doesNotMatch(source, /\["Mon", "Tue", "Wed", "Thu", "Fri"\]/, path);
  }
});

test("no grid renders a fixed five-column track any more", () => {
  for (const path of [
    "components/school-admin/curriculum/curriculum-workspace.tsx",
    "components/admin/master-curriculum/resource-mapping-panel.tsx",
  ]) {
    assert.doesNotMatch(read(path), /\[1, 2, 3, 4, 5\]\.map/, path);
  }
});
