import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import {
  isNonTeachingDay,
  teachingDayNotice,
} from "../../lib/primary-teaching-day.ts";
import type { PrimaryTeachingDayStatus } from "../../lib/api.ts";

// A teacher opening TeachPad Primary on a Sunday used to be shown
// "Sunday isn't a teaching day. Pick a weekday to plan." in a red error panel,
// because the backend answered an ordinary weekend with a 400. The calendar
// state now arrives as data on a successful response; these tests are about
// what the workspace does with it.

const SUNDAY: PrimaryTeachingDayStatus = {
  date: "2026-08-16",
  status: "non_teaching_day",
  is_teaching_day: false,
  blocks_generation: true,
  source: "default_pattern",
  headline: "No teaching scheduled today.",
  detail: "Sunday isn't a teaching day at your school.",
  next_teaching_day: "2026-08-17",
};

test("a Sunday is a non-teaching day", () => {
  assert.equal(isNonTeachingDay(SUNDAY), true);
});

test("a missing calendar state is treated as a teaching day", () => {
  // An older backend, or a caller with no school to resolve. Declaring every
  // day closed because a field is absent would break the entire workspace.
  assert.equal(isNonTeachingDay(undefined), false);
  assert.equal(isNonTeachingDay(null), false);
});

test("a no-curriculum day is NOT a closure", () => {
  // The school is open and the curriculum has a gap. Different problem,
  // different owner (the school admin), different message.
  assert.equal(
    isNonTeachingDay({ ...SUNDAY, status: "no_curriculum", is_teaching_day: true }),
    false,
  );
});

test("the notice names the date, the next teaching day and where the button goes", () => {
  const notice = teachingDayNotice(SUNDAY, "2026-08-16");

  assert.equal(notice?.headline, "No teaching scheduled today.");
  assert.equal(notice?.dateLabel, "Sunday, August 16");
  assert.equal(notice?.nextDateLabel, "Monday, August 17");
  assert.equal(notice?.nextActionLabel, "View Monday's Plan");
  assert.equal(notice?.tone, "closed");
});

test("a date the teacher navigated to is not called 'today'", () => {
  const notice = teachingDayNotice(SUNDAY, "2026-08-14");

  assert.equal(notice?.headline, "No teaching scheduled");
  assert.equal(notice?.dateLabel, "Sunday, August 16");
});

test("a holiday keeps the school's own name for it", () => {
  const notice = teachingDayNotice({
    ...SUNDAY,
    date: "2026-08-15",
    status: "school_holiday",
    headline: "School Holiday",
    detail: "Independence Day",
    label: "Independence Day",
    source: "school_calendar",
  }, "2026-08-15");

  assert.equal(notice?.headline, "School Holiday");
  assert.equal(notice?.detail, "Independence Day");
});

test("an academic break says so", () => {
  const notice = teachingDayNotice({
    ...SUNDAY,
    status: "academic_break",
    headline: "Academic Break",
    detail: "This date falls outside your school's teaching terms.",
    source: "school_calendar",
  }, "2026-08-16");

  assert.equal(notice?.headline, "Academic Break");
  assert.equal(notice?.tone, "closed");
});

test("a teaching day with no curriculum reads as a gap, not a closure", () => {
  const notice = teachingDayNotice({
    ...SUNDAY,
    date: "2026-08-17",
    status: "no_curriculum",
    is_teaching_day: true,
    blocks_generation: false,
    headline: "No curriculum planned for this day.",
    detail: null,
    next_teaching_day: null,
  }, "2026-08-17");

  assert.equal(notice?.headline, "No curriculum planned for this day.");
  assert.equal(notice?.tone, "gap");
  assert.equal(notice?.nextActionLabel, null);
});

test("a date is parsed local, so the day it names is the teacher's day", () => {
  // `new Date("2026-08-16")` is UTC midnight — the 15th for anyone west of
  // Greenwich. A feature whose whole job is naming the right day cannot get
  // this wrong.
  assert.equal(teachingDayNotice(SUNDAY)?.dateLabel, "Sunday, August 16");
});

test("no calendar state produces no notice", () => {
  assert.equal(teachingDayNotice(null), null);
  assert.equal(teachingDayNotice(undefined), null);
});

// ── The page contract ───────────────────────────────────────────────────────

const page = readFileSync(
  new URL("../../components/primary/pages/primary-today-page.tsx", import.meta.url),
  "utf8",
);

test("the Today page renders the calendar state instead of an error", () => {
  assert.match(page, /viewState === "no-teaching"/);
  assert.match(page, /teachingDayNotice/);
});

test("the non-teaching state is not styled as an error", () => {
  // The rule this whole change exists for: rose/red is the error palette in
  // this workspace, and a Sunday is not an error.
  const block = page.slice(
    page.indexOf('viewState === "no-teaching"'),
    page.indexOf('viewState === "empty"'),
  );
  assert.ok(block.length > 0, "the no-teaching branch must render something");
  assert.doesNotMatch(block, /rose-|red-/);
});

test("a non-teaching day offers no Generate button", () => {
  // The protection, restated on the client: opening a closed day must not put a
  // metered action under the teacher's cursor.
  const block = page.slice(
    page.indexOf('viewState === "no-teaching"'),
    page.indexOf('viewState === "empty"'),
  );
  assert.doesNotMatch(block, /Generate plan/);
});

test("generation is refused client-side on a non-teaching day", () => {
  assert.match(page, /blocks_generation/);
});

test("a non-generated response is not treated as a failure", () => {
  // The server answers 200 with generated:false. Rendering that as an error
  // would put the red panel back by another route.
  assert.match(page, /result\.generated === false|!result\.generated/);
});

test("the workspace stays usable on a non-teaching day", () => {
  // Date navigation, the class picker and the resource surfaces sit OUTSIDE the
  // viewState switch, so a closed day disables none of them.
  const beforeSwitch = page.slice(0, page.indexOf('viewState === "loading"'));
  assert.match(beforeSwitch, /handlePrevDay|handleNextDay/);
});

const home = readFileSync(
  new URL("../../components/primary/pages/primary-home-page.tsx", import.meta.url),
  "utf8",
);

test("the Primary dashboard shows the calendar state instead of inviting a refused generation", () => {
  // The surface the bug was reported against: a teacher lands here first.
  assert.match(home, /closedForTeaching/);
  assert.match(home, /teachingDayNotice/);
});

test("the dashboard's non-teaching state links to the next teaching day", () => {
  assert.match(home, /\/primary\/today\?date=\$\{teachingNotice\.nextDate\}/);
});

test("the dashboard does not claim a classroom is ready when nothing was generated", () => {
  assert.match(home, /result\.generated\s*\n?\s*\?/);
  assert.match(home, /result\.teaching_status\.headline/);
});
