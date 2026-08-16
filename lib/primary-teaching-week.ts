import type { PrimaryAcademicYear } from "@/lib/api";

/**
 * The school's working week, and the authoring grid it produces.
 *
 * ⚠ THE GRID IS NO LONGER FIVE COLUMNS WIDE FOR EVERYBODY. It used to be —
 * `const DAYS = [1, 2, 3, 4, 5]`, in the workspace, in the review screen, in
 * the platform master admin — which meant a school that had declared
 * Monday–Saturday in its calendar had an open Saturday and nowhere to author
 * its curriculum. The columns now come from
 * `primary_academic_years.teaching_weekdays`, the same list the admin chose
 * when they set the calendar up.
 *
 * ⚠ 1-BASED AND ISO-ALIGNED: Monday = 1 … Sunday = 7, matching the backend's
 * `day` column on every lesson ever published. That is what makes Saturday
 * ADDITIVE — existing Monday–Friday curriculum keeps days 1–5 meaning exactly
 * what they always meant, and Saturday arrives as a sixth column numbered 6
 * rather than renumbering anything.
 *
 * Mirrors `app/curriculum/primary.py`. The two ends have always agreed on the
 * grid's shape (`WEEKS_PER_MONTH`/`DAYS_PER_WEEK` in `curriculum-readiness.ts`
 * said so); this keeps that agreement while making the shape a variable.
 */

/** Monday = 0 … Sunday = 6, matching Python's `date.weekday()`. */
export const DEFAULT_TEACHING_WEEKDAYS = [0, 1, 2, 3, 4];

/** Five week rows, as the grid has always drawn. */
export const WEEK_ROWS = 5;

const WEEKDAY_NAMES = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

/** "Monday" for day 1 … "Sunday" for day 7. */
export function weekdayName(day: number): string {
  return WEEKDAY_NAMES[day - 1] ?? `Day ${day}`;
}

/** "MON" … "SUN" — the column heading. */
export function weekdayAbbr(day: number): string {
  return weekdayName(day).slice(0, 3).toUpperCase();
}

/**
 * The `day` columns this academic year authors into, in calendar order.
 *
 * A year that declares nothing — one created before the column existed, or the
 * platform master curriculum — falls back to Monday–Friday, so every existing
 * school sees exactly the grid it has always seen.
 */
export function authoringDays(
  year?: Pick<PrimaryAcademicYear, "teaching_weekdays"> | null,
): number[] {
  const stored = (year?.teaching_weekdays ?? []).filter(
    (value) => Number.isInteger(value) && value >= 0 && value <= 6,
  );
  const weekdays = stored.length ? stored : DEFAULT_TEACHING_WEEKDAYS;
  return Array.from(new Set(weekdays)).sort((a, b) => a - b).map((value) => value + 1);
}

/** Local-noon date, so a month's shape never shifts across a timezone. */
const at = (year: number, month: number, day: number) => new Date(year, month - 1, day, 12);

/** Monday = 0 … Sunday = 6, from a JS `getDay()` where Sunday = 0. */
const weekdayOf = (date: Date) => (date.getDay() + 6) % 7;

/**
 * Which real year a month NUMBER means inside an academic year.
 *
 * An academic year spans two — June 2026 to March 2027 — so "month 3" is March
 * 2027 while "month 9" is September 2026.
 */
export function calendarYearOf(
  year: Pick<PrimaryAcademicYear, "starts_on" | "ends_on"> | null | undefined,
  month: number,
): number {
  const fallback = new Date().getFullYear();
  if (!year?.starts_on || !year?.ends_on) return fallback;
  const startsOn = new Date(`${year.starts_on}T12:00:00`);
  const endsOn = new Date(`${year.ends_on}T12:00:00`);
  for (let candidate = startsOn.getFullYear(); candidate <= endsOn.getFullYear(); candidate += 1) {
    const first = at(candidate, month, 1);
    if (first >= startsOn && first <= endsOn) return candidate;
    if (candidate === endsOn.getFullYear() && month === endsOn.getMonth() + 1) return candidate;
    if (candidate === startsOn.getFullYear() && month === startsOn.getMonth() + 1) return candidate;
  }
  return startsOn.getFullYear();
}

/**
 * How many week ROWS this month's grid needs.
 *
 * ⚠ Never fewer than five, even when a month genuinely spans four teaching
 * weeks — the grid has always drawn five and shrinking it would strand any
 * lesson already placed in week 5.
 *
 * A SIXTH row appears only when the month's teaching days genuinely span six
 * Monday-anchored weeks, which only a school teaching outside Monday–Friday can
 * reach: a 31-day month opening on a Saturday gives a Monday–Saturday school a
 * teaching day on the 1st (before the month's first Monday) and another on the
 * 31st, five Mondays later. March 2025 is exactly that month.
 */
export function authoringWeeks(
  year: Pick<PrimaryAcademicYear, "starts_on" | "ends_on" | "teaching_weekdays"> | null | undefined,
  month: number,
): number {
  const weekdays = new Set(authoringDays(year).map((day) => day - 1));
  const calendarYear = calendarYearOf(year, month);
  let first: Date | null = null;
  let last: Date | null = null;
  for (let dayNumber = 1; dayNumber <= 31; dayNumber += 1) {
    const date = at(calendarYear, month, dayNumber);
    if (date.getMonth() !== month - 1) break;
    if (!weekdays.has(weekdayOf(date))) continue;
    if (!first) first = date;
    last = date;
  }
  if (!first || !last) return WEEK_ROWS;
  const firstMonday = at(first.getFullYear(), first.getMonth() + 1, first.getDate() - weekdayOf(first));
  const lastMonday = at(last.getFullYear(), last.getMonth() + 1, last.getDate() - weekdayOf(last));
  const spanned = Math.round((lastMonday.getTime() - firstMonday.getTime()) / 604_800_000) + 1;
  return Math.max(WEEK_ROWS, spanned);
}

/** `[1, 2, 3, 4, 5]` — the week rows to render, as a list. */
export function weekRows(
  year: Pick<PrimaryAcademicYear, "starts_on" | "ends_on" | "teaching_weekdays"> | null | undefined,
  month: number,
): number[] {
  return Array.from({ length: authoringWeeks(year, month) }, (_, index) => index + 1);
}
