import assert from "node:assert/strict";
import test from "node:test";

import {
  COVERAGE_DAY_STATES,
  DAY_STATE_LABELS,
  PRIMARY_LEVEL_KEYS,
  THEME_COVERAGE_STATES,
  THEME_STATE_LABELS,
  WEEKDAY_HEADINGS,
  addDays,
  dayStateTone,
  eachDate,
  endOfMonth,
  formatDayLabel,
  formatMinutes,
  formatRangeLabel,
  formatShortDate,
  isSameMonth,
  levelFromDisplay,
  levelLabel,
  monthGridDates,
  parseLocalISODate,
  rangeFor,
  shiftMonths,
  shiftWeeks,
  startOfMonth,
  startOfWeek,
  themeStateTone,
  toLocalISODate,
} from "../../lib/primary-coverage.ts";

// 3 Aug 2026 is a Monday; 1 Aug 2026 is a Saturday. Every date fixture below
// depends on that, so it is asserted rather than assumed.
test("the fixture week really does start on a Monday", () => {
  assert.equal(new Date(2026, 7, 3).getDay(), 1);
  assert.equal(new Date(2026, 7, 1).getDay(), 6);
});

test("state unions match their labels and tones exactly", () => {
  assert.equal(COVERAGE_DAY_STATES.length, 6);
  assert.equal(THEME_COVERAGE_STATES.length, 4);
  assert.equal(PRIMARY_LEVEL_KEYS.length, 8);
  for (const state of COVERAGE_DAY_STATES) {
    assert.ok(DAY_STATE_LABELS[state], `missing label for ${state}`);
    assert.ok(dayStateTone(state).chip, `missing tone for ${state}`);
  }
  for (const state of THEME_COVERAGE_STATES) {
    assert.ok(THEME_STATE_LABELS[state], `missing label for ${state}`);
    assert.ok(themeStateTone(state).chip, `missing tone for ${state}`);
  }
});

test("an unauthored theme is never labelled as the teacher's gap", () => {
  assert.equal(THEME_STATE_LABELS.not_authored, "No lesson authored yet");
  assert.notEqual(THEME_STATE_LABELS.not_authored, THEME_STATE_LABELS.not_started);
});

test("no_plan and not_started read as different facts", () => {
  assert.notEqual(DAY_STATE_LABELS.no_plan, DAY_STATE_LABELS.not_started);
});

test("toLocalISODate and parseLocalISODate round-trip without timezone drift", () => {
  assert.equal(toLocalISODate(new Date(2026, 7, 3)), "2026-08-03");
  assert.equal(toLocalISODate(new Date(2026, 0, 1)), "2026-01-01");
  assert.equal(toLocalISODate(parseLocalISODate("2026-12-31")), "2026-12-31");
});

test("startOfWeek is Monday for every weekday, including Sunday", () => {
  // Sunday is the classic off-by-one: getDay() is 0, so a naive shift lands a
  // week early.
  assert.equal(toLocalISODate(startOfWeek(new Date(2026, 7, 3))), "2026-08-03"); // Mon
  assert.equal(toLocalISODate(startOfWeek(new Date(2026, 7, 5))), "2026-08-03"); // Wed
  assert.equal(toLocalISODate(startOfWeek(new Date(2026, 7, 9))), "2026-08-03"); // Sun
  assert.equal(toLocalISODate(startOfWeek(new Date(2026, 7, 10))), "2026-08-10"); // Mon
});

test("startOfWeek crosses a month boundary correctly", () => {
  // Sat 1 Aug 2026 belongs to the week starting Mon 27 Jul 2026.
  assert.equal(toLocalISODate(startOfWeek(new Date(2026, 7, 1))), "2026-07-27");
});

test("startOfMonth and endOfMonth cover the whole month", () => {
  assert.equal(toLocalISODate(startOfMonth(new Date(2026, 7, 17))), "2026-08-01");
  assert.equal(toLocalISODate(endOfMonth(new Date(2026, 7, 17))), "2026-08-31");
  assert.equal(toLocalISODate(endOfMonth(new Date(2026, 1, 10))), "2026-02-28");
  assert.equal(toLocalISODate(endOfMonth(new Date(2024, 1, 10))), "2024-02-29");
});

test("shiftMonths does not overflow a short month", () => {
  // Jan 31 + 1 month must be February, not March.
  assert.equal(toLocalISODate(startOfMonth(shiftMonths(new Date(2026, 0, 31), 1))), "2026-02-01");
  assert.equal(toLocalISODate(startOfMonth(shiftMonths(new Date(2026, 0, 31), -1))), "2025-12-01");
});

test("shiftWeeks moves exactly seven days", () => {
  assert.equal(toLocalISODate(shiftWeeks(new Date(2026, 7, 5), 1)), "2026-08-12");
  assert.equal(toLocalISODate(shiftWeeks(new Date(2026, 7, 5), -2)), "2026-07-22");
});

test("addDays crosses a year boundary", () => {
  assert.equal(toLocalISODate(addDays(new Date(2026, 11, 30), 3)), "2027-01-02");
});

test("rangeFor produces exactly seven days for a week and a full month", () => {
  const week = rangeFor("week", new Date(2026, 7, 5));
  assert.deepEqual(week, { start: "2026-08-03", end: "2026-08-09" });
  assert.equal(eachDate(week.start, week.end).length, 7);

  const month = rangeFor("month", new Date(2026, 7, 17));
  assert.deepEqual(month, { start: "2026-08-01", end: "2026-08-31" });
  assert.equal(eachDate(month.start, month.end).length, 31);
});

test("eachDate is inclusive of both ends and handles a single day", () => {
  assert.deepEqual(eachDate("2026-08-03", "2026-08-05"), [
    "2026-08-03", "2026-08-04", "2026-08-05",
  ]);
  assert.deepEqual(eachDate("2026-08-03", "2026-08-03"), ["2026-08-03"]);
  assert.deepEqual(eachDate("2026-08-05", "2026-08-03"), []);
});

test("monthGridDates is 42 cells starting on a Monday", () => {
  const grid = monthGridDates(new Date(2026, 7, 17));
  assert.equal(grid.length, 42);
  assert.equal(grid[0], "2026-07-27");
  assert.equal(parseLocalISODate(grid[0]).getDay(), 1);
  assert.ok(grid.indexOf("2026-08-01") >= 0);
  assert.ok(grid.indexOf("2026-08-31") >= 0);
  assert.equal(WEEKDAY_HEADINGS.length, 7);
  assert.equal(WEEKDAY_HEADINGS[0], "Mon");
});

test("isSameMonth distinguishes the padding cells from the real month", () => {
  const anchor = new Date(2026, 7, 17);
  assert.equal(isSameMonth("2026-08-01", anchor), true);
  assert.equal(isSameMonth("2026-07-27", anchor), false);
  assert.equal(isSameMonth("2026-09-01", anchor), false);
});

test("range labels are deterministic and pure ASCII", () => {
  // No toLocaleDateString: its output varies with the runtime's ICU build, and
  // these strings go straight into an ASCII-only PDF writer.
  const week = formatRangeLabel("week", "2026-08-03", "2026-08-09");
  const crossMonth = formatRangeLabel("week", "2026-07-27", "2026-08-02");
  const crossYear = formatRangeLabel("week", "2026-12-28", "2027-01-03");
  const month = formatRangeLabel("month", "2026-08-01", "2026-08-31");

  assert.equal(week, "3 - 9 Aug 2026");
  assert.equal(crossMonth, "27 Jul - 2 Aug 2026");
  assert.equal(crossYear, "28 Dec 2026 - 3 Jan 2027");
  assert.equal(month, "August 2026");

  for (const label of [week, crossMonth, crossYear, month]) {
    assert.ok(!/[^\x20-\x7E]/.test(label), `non-ASCII in "${label}"`);
  }
});

test("day and short date labels are deterministic", () => {
  assert.equal(formatDayLabel("2026-08-03"), "Mon 3 Aug");
  assert.equal(formatDayLabel("2026-08-09"), "Sun 9 Aug");
  assert.equal(formatShortDate("2026-08-03"), "3 Aug 2026");
});

test("formatMinutes reads as a teacher would say it", () => {
  assert.equal(formatMinutes(0), "0 min");
  assert.equal(formatMinutes(53), "53 min");
  assert.equal(formatMinutes(60), "1 h");
  assert.equal(formatMinutes(65), "1 h 5 min");
  assert.equal(formatMinutes(125), "2 h 5 min");
});

test("levelLabel and levelFromDisplay round-trip every level", () => {
  for (const key of PRIMARY_LEVEL_KEYS) {
    assert.equal(levelFromDisplay(levelLabel(key)), key);
  }
  assert.equal(levelLabel("class_1"), "Class 1");
  assert.equal(levelLabel("lkg"), "LKG");
  assert.equal(levelLabel("nursery"), "Nursery");
});

test("levelFromDisplay tolerates the teaching context's spellings and rejects the rest", () => {
  assert.equal(levelFromDisplay("Class 1"), "class_1");
  assert.equal(levelFromDisplay("class-1"), "class_1");
  assert.equal(levelFromDisplay("  UKG "), "ukg");
  assert.equal(levelFromDisplay("L.K.G"), "lkg");
  assert.equal(levelFromDisplay("Class 6"), null);
  assert.equal(levelFromDisplay(""), null);
  assert.equal(levelFromDisplay(null), null);
  assert.equal(levelFromDisplay(undefined), null);
});
