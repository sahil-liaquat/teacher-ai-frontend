import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  SCHOOL_ADMIN_SUBNAV,
  activeTopLevel,
} from "../../lib/school-admin-nav.ts";

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

const WORKSPACE = "components/school-admin/calendar/calendar-workspace.tsx";

// Phase 2 answers one question — on which dates can this school teach? — and
// stops there. Scheduled teaching days, curriculum-to-date mapping and the
// teacher surface belong to Phase 3.

test("the calendar page exists and is reachable from Curriculum", () => {
  assert.equal(existsSync(`${root}/app/school-admin/(shell)/calendar/page.tsx`), true);
  // ⚠ Calendar is no longer top level. Deciding WHEN teaching happens is part
  // of building curriculum, not a separate job an admin arrives wanting to do,
  // so it became Curriculum sub-navigation. The URL is unchanged.
  const nav = read("lib/school-admin-nav.ts");
  assert.match(nav, /href: "\/school-admin\/calendar", label: "Calendar"/);
  assert.equal(
    SCHOOL_ADMIN_SUBNAV["/school-admin/curriculum/overview"].some(
      (item) => item.href === "/school-admin/calendar",
    ),
    true,
    "Calendar must be reachable from the Curriculum section",
  );
  assert.equal(activeTopLevel("/school-admin/calendar"), "/school-admin/curriculum/overview");
});

test("every calendar helper is on the school surface", () => {
  const api = read("lib/api.ts");
  for (const helper of [
    "schoolAdminTerms", "schoolAdminCreateTerm", "schoolAdminUpdateTerm", "schoolAdminDeleteTerm",
    "schoolAdminCalendar", "schoolAdminCalendarSummary", "schoolAdminInitializeCalendar",
    "schoolAdminSetCalendarDay", "schoolAdminSetCalendarRange",
  ]) {
    const start = api.indexOf(`  ${helper}:`);
    assert.notEqual(start, -1, `${helper} is missing`);
    // Slice to the next top-level helper so multi-line bodies are fully covered.
    const rest = api.slice(start + 2);
    const next = rest.search(/\n {2}[a-zA-Z][a-zA-Z0-9_]*:/);
    const block = next === -1 ? rest : rest.slice(0, next);
    assert.match(block, /["'`]\/school-admin\//, `${helper} is not on /school-admin`);
  }
  // The calendar is school-owned; a master mount would be the wrong ownership.
  assert.doesNotMatch(api, /\/admin\/master\/[a-z-]*calendar/);
  assert.doesNotMatch(api, /adminCalendar|adminCreateTerm/);
});

test("the calendar is scoped to an academic year, not chosen separately", () => {
  // A second year picker would let the calendar drift from the curriculum the
  // school is actually planning.
  const source = read(WORKSPACE);
  assert.match(source, /years\.data\?\.find\(\(item\) => item\.is_active\)/);
  assert.match(source, /schoolAdminCalendarSummary\(year!\.id\)/);
});

test("setup generates from a weekly pattern rather than manual entry", () => {
  const source = read(WORKSPACE);
  assert.match(source, /schoolAdminInitializeCalendar\(year\.id, \{ teaching_weekdays: teachingWeekdays \}\)/);
  // Monday-first, matching the API's 0 = Monday numbering.
  assert.match(source, /\{ value: 0, short: "Mon" \}/);
  assert.match(source, /\{ value: 6, short: "Sun" \}/);
});

test("a six-day school is reachable from the UI", () => {
  // Saturday must be selectable, not assumed to be a weekend.
  const source = read(WORKSPACE);
  assert.match(source, /\{ value: 5, short: "Sat" \}/);
  assert.match(source, /setTeachingWeekdays\(\(current\) =>/, "weekdays are not togglable");
});

test("holidays are the school's own, and the UI says so", () => {
  const source = read(WORKSPACE);
  assert.match(source, /TeachPad does not assume any/);
  // No hard-coded national or board holiday list anywhere.
  assert.doesNotMatch(source, /Independence Day.*Republic Day|HOLIDAY_LIST|NATIONAL_HOLIDAYS/);
});

test("re-running setup does not silently erase overrides", () => {
  const source = read(WORKSPACE);
  assert.match(source, /Dates you have already changed are kept/);
  assert.match(source, /of your existing changes kept/);
});

test("all three day types can be set on a date", () => {
  const source = read(WORKSPACE);
  assert.match(source, /\(\["teaching", "holiday", "weekend"\] as PrimaryCalendarDayType\[\]\)/);
  assert.match(source, /schoolAdminSetCalendarDay\(year\.id, day\.date/);
});

test("server errors are surfaced through the error gateway", () => {
  // Term-outside-year and inverted-range messages come from the service.
  const source = read(WORKSPACE);
  assert.match(source, /import \{ getErrorMessage \} from "@\/lib\/errors";/);
  assert.match(source, /Could not add the term[\s\S]{0,120}getErrorMessage\(error/);
});

test("the page states its own limits — terms group, they do not schedule", () => {
  const source = read(WORKSPACE);
  assert.match(source, /Teaching days and holidays are not affected/);
});

test("Phase 2 stops short of scheduling", () => {
  const source = read(WORKSPACE);
  for (const later of ["scheduled_lesson", "ScheduledDay", "prepare", "lesson_version"]) {
    assert.doesNotMatch(source, new RegExp(later, "i"), `calendar reached into ${later}`);
  }
});
