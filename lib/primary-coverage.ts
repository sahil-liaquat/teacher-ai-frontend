/**
 * Pure helpers behind /primary/coverage.
 *
 * IMPORT-FREE ON PURPOSE. This module is executed by
 * `node --experimental-strip-types --test`, which resolves neither the `@/*`
 * path alias nor a transitive module graph. It therefore OWNS the three wire
 * unions (levels, day states, theme states) as runtime arrays, and `lib/api.ts`
 * type-imports them from here — not the other way round.
 *
 * tsconfig is `target: "es5"` with no `downlevelIteration`: never iterate or
 * spread a Set/Map in this file. Arrays only.
 *
 * No `toLocaleDateString` anywhere: its output varies with the runtime's ICU
 * build, which would make these labels untestable AND could emit non-ASCII
 * characters into an ASCII-only PDF writer.
 */

export const PRIMARY_LEVEL_KEYS = [
  "nursery",
  "lkg",
  "ukg",
  "class_1",
  "class_2",
  "class_3",
  "class_4",
  "class_5",
] as const;
export type PrimaryLevelKey = (typeof PRIMARY_LEVEL_KEYS)[number];

export const COVERAGE_DAY_STATES = [
  "no_plan",
  "plan_cleared",
  "not_started",
  "partly_taught",
  "taught",
  "not_taught",
] as const;
export type PrimaryCoverageDayState = (typeof COVERAGE_DAY_STATES)[number];

export const THEME_COVERAGE_STATES = [
  "not_authored",
  "not_started",
  "in_progress",
  "complete",
] as const;
export type PrimaryThemeCoverageState = (typeof THEME_COVERAGE_STATES)[number];

export type CoverageRangeMode = "week" | "month";

export type StateTone = { dot: string; chip: string; text: string };

const LEVEL_LABELS: Record<PrimaryLevelKey, string> = {
  nursery: "Nursery",
  lkg: "LKG",
  ukg: "UKG",
  class_1: "Class 1",
  class_2: "Class 2",
  class_3: "Class 3",
  class_4: "Class 4",
  class_5: "Class 5",
};

export const DAY_STATE_LABELS: Record<PrimaryCoverageDayState, string> = {
  no_plan: "No plan generated",
  plan_cleared: "Plan cleared",
  not_started: "Planned, not marked",
  partly_taught: "Partly taught",
  taught: "Taught",
  not_taught: "Skipped or moved",
};

// "No lesson authored yet" is deliberately NOT "0% taught". TeachPad's missing
// content is not the teacher's gap, and Sahil's prototype conflated the two by
// emitting filler so a teacher could not tell the difference.
export const THEME_STATE_LABELS: Record<PrimaryThemeCoverageState, string> = {
  not_authored: "No lesson authored yet",
  not_started: "Not started",
  in_progress: "In progress",
  complete: "Complete",
};

const DAY_STATE_TONES: Record<PrimaryCoverageDayState, StateTone> = {
  no_plan: { dot: "bg-slate-300", chip: "bg-slate-50 border-slate-200", text: "text-slate-500" },
  plan_cleared: { dot: "bg-slate-400", chip: "bg-slate-50 border-slate-200", text: "text-slate-600" },
  not_started: { dot: "bg-amber-400", chip: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  partly_taught: { dot: "bg-blue-500", chip: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  taught: { dot: "bg-emerald-500", chip: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  not_taught: { dot: "bg-rose-400", chip: "bg-rose-50 border-rose-200", text: "text-rose-700" },
};

const THEME_STATE_TONES: Record<PrimaryThemeCoverageState, StateTone> = {
  not_authored: { dot: "bg-slate-300", chip: "bg-slate-50 border-slate-200", text: "text-slate-500" },
  not_started: { dot: "bg-amber-400", chip: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  in_progress: { dot: "bg-blue-500", chip: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  complete: { dot: "bg-emerald-500", chip: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
};

export function dayStateTone(state: PrimaryCoverageDayState): StateTone {
  return DAY_STATE_TONES[state];
}

export function themeStateTone(state: PrimaryThemeCoverageState): StateTone {
  return THEME_STATE_TONES[state];
}

export function levelLabel(level: PrimaryLevelKey): string {
  return LEVEL_LABELS[level];
}

/**
 * "Class 1" -> "class_1". The teaching context stores display strings
 * (lib/primary-theme-content.ts:4) while the API speaks the enum, and this is
 * the single place that bridge lives.
 */
export function levelFromDisplay(value: string | null | undefined): PrimaryLevelKey | null {
  const normalized = String(value == null ? "" : value)
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/[\s-]+/g, "_");
  for (const key of PRIMARY_LEVEL_KEYS) {
    if (key === normalized) return key;
  }
  return null;
}

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTH_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
// Monday-first, matching startOfWeek. Indexed by (getDay() + 6) % 7.
const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const WEEKDAY_HEADINGS: string[] = WEEKDAY_SHORT;

export function toLocalISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Anchored at noon so a DST shift can never move the calendar date. */
export function parseLocalISODate(value: string): Date {
  const parts = value.split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12);
}

function atNoon(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

export function addDays(date: Date, days: number): Date {
  const next = atNoon(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Monday. getDay() is 0 for Sunday, so the shift is (getDay() + 6) % 7. */
export function startOfWeek(date: Date): Date {
  const next = atNoon(date);
  next.setDate(next.getDate() - ((next.getDay() + 6) % 7));
  return next;
}

export function endOfWeek(date: Date): Date {
  return addDays(startOfWeek(date), 6);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

export function endOfMonth(date: Date): Date {
  // Day 0 of the next month is the last day of this one, leap years included.
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 12);
}

export function shiftWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

/** Anchors on the 1st so Jan 31 + 1 month is February, not March. */
export function shiftMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1, 12);
}

export function rangeFor(mode: CoverageRangeMode, anchor: Date): { start: string; end: string } {
  if (mode === "month") {
    return { start: toLocalISODate(startOfMonth(anchor)), end: toLocalISODate(endOfMonth(anchor)) };
  }
  return { start: toLocalISODate(startOfWeek(anchor)), end: toLocalISODate(endOfWeek(anchor)) };
}

export function eachDate(start: string, end: string): string[] {
  const first = parseLocalISODate(start);
  const last = parseLocalISODate(end);
  const out: string[] = [];
  let cursor = first;
  while (cursor.getTime() <= last.getTime()) {
    out.push(toLocalISODate(cursor));
    cursor = addDays(cursor, 1);
  }
  return out;
}

/** Six Monday-first weeks — always 42 cells, so the grid never reflows. */
export function monthGridDates(anchor: Date): string[] {
  const gridStart = startOfWeek(startOfMonth(anchor));
  const out: string[] = [];
  for (let index = 0; index < 42; index += 1) {
    out.push(toLocalISODate(addDays(gridStart, index)));
  }
  return out;
}

export function isSameMonth(value: string, anchor: Date): boolean {
  const date = parseLocalISODate(value);
  return date.getMonth() === anchor.getMonth() && date.getFullYear() === anchor.getFullYear();
}

export function formatDayLabel(value: string): string {
  const date = parseLocalISODate(value);
  return `${WEEKDAY_SHORT[(date.getDay() + 6) % 7]} ${date.getDate()} ${MONTH_SHORT[date.getMonth()]}`;
}

export function formatShortDate(value: string): string {
  const date = parseLocalISODate(value);
  return `${date.getDate()} ${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatRangeLabel(mode: CoverageRangeMode, start: string, end: string): string {
  const first = parseLocalISODate(start);
  const last = parseLocalISODate(end);
  if (mode === "month") {
    return `${MONTH_LONG[first.getMonth()]} ${first.getFullYear()}`;
  }
  if (first.getFullYear() !== last.getFullYear()) {
    return `${formatShortDate(start)} - ${formatShortDate(end)}`;
  }
  if (first.getMonth() !== last.getMonth()) {
    return (
      `${first.getDate()} ${MONTH_SHORT[first.getMonth()]} - ` +
      `${last.getDate()} ${MONTH_SHORT[last.getMonth()]} ${last.getFullYear()}`
    );
  }
  return `${first.getDate()} - ${last.getDate()} ${MONTH_SHORT[first.getMonth()]} ${first.getFullYear()}`;
}

export function formatMinutes(minutes: number): string {
  const total = Math.max(0, Math.round(minutes || 0));
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
