import type { PrimaryTeachingDayStatus } from "@/lib/api";

/**
 * Rendering the school calendar's answer.
 *
 * ⚠ THE RULE THIS MODULE ENCODES: "today has no teaching scheduled" is not an
 * error. It is a valid state of the curriculum calendar, and it gets the same
 * calm treatment as any other empty state — never a red panel, never a toast,
 * never a retry button. The teacher did nothing wrong; their school is shut.
 *
 * The sentences themselves are authored server-side, beside the calendar rows
 * that decide them, and are rendered verbatim. This module only decides SHAPE:
 * which date to print, where "next" points, and what the button should say.
 */

/** Parsed at noon LOCAL, like every other date in the Primary workspace.
 *  `new Date("2026-08-16")` is UTC midnight, which prints as the 15th for any
 *  teacher west of Greenwich — and the whole feature is about naming the right
 *  day. */
const parseLocalISODate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
};

const formatLong = (value: string) =>
  parseLocalISODate(value).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

const weekdayOf = (value: string) =>
  parseLocalISODate(value).toLocaleDateString("en-US", { weekday: "long" });

/** ⚠ Absence means "assume a teaching day". An older backend, or a caller with
 *  no school to resolve, sends nothing — and the workspace must keep working
 *  exactly as it did rather than declaring every day closed. */
export const isNonTeachingDay = (status?: PrimaryTeachingDayStatus | null) =>
  status?.is_teaching_day === false;

export type PrimaryTeachingDayNotice = {
  headline: string;
  detail: string | null;
  /** "Sunday, August 16" — the date this state is about, spelled out, because
   *  a teacher who navigated three days forward needs to know which one. */
  dateLabel: string;
  nextDate: string | null;
  nextDateLabel: string | null;
  /** "View Monday's Plan" — named, so the button says where it goes. */
  nextActionLabel: string | null;
  /**
   * `closed` — the school is shut: weekend, holiday, break.
   * `gap` — the school is OPEN and nobody authored curriculum for this date.
   *
   * ⚠ Two tones because they have different owners. A closure is nobody's
   * problem to fix; a gap belongs to the school admin, and flattening them into
   * one empty state is how a missing month of curriculum stays invisible.
   */
  tone: "closed" | "gap";
};

export function teachingDayNotice(
  status: PrimaryTeachingDayStatus | null | undefined,
  today?: string,
): PrimaryTeachingDayNotice | null {
  if (!status) return null;

  const isToday = today !== undefined && today === status.date;
  // The server writes "No teaching scheduled today." because that is the case
  // it is nearly always answering. On a date the teacher navigated to, "today"
  // would be a lie, so the one time-bound sentence is restated — and only that
  // one. "School Holiday" and "Academic Break" are already date-neutral.
  const headline =
    status.status === "non_teaching_day" && !isToday
      ? "No teaching scheduled"
      : status.headline;

  const next = status.next_teaching_day ?? null;
  return {
    headline,
    detail: status.detail ?? null,
    dateLabel: formatLong(status.date),
    nextDate: next,
    nextDateLabel: next ? formatLong(next) : null,
    nextActionLabel: next ? `View ${weekdayOf(next)}'s Plan` : null,
    tone: status.is_teaching_day ? "gap" : "closed",
  };
}
