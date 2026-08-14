import type { PrimaryCurriculumLesson, PrimaryCurriculumStep } from "@/lib/api";

export const SCHOOL_MONTHS = [
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
] as const;

export const SCHOOL_LEVELS = [
  { value: "nursery", label: "Nursery" },
  { value: "lkg", label: "LKG" },
  { value: "ukg", label: "UKG" },
  { value: "class_1", label: "Class 1" },
  { value: "class_2", label: "Class 2" },
] as const;

export type SchoolDayStatus = "not_started" | "draft" | "needs_attention" | "ready" | "published";

export function monthLabel(month: number): string {
  return SCHOOL_MONTHS.find((item) => item.value === month)?.label ?? "Month";
}

export function levelLabel(level: string): string {
  return SCHOOL_LEVELS.find((item) => item.value === level)?.label ?? level;
}

/**
 * ⚠ `stepIssues`, `lessonIssues` and `lessonStatus` used to live here.
 *
 * They were a SECOND readiness rule, evaluated in the browser, and it disagreed
 * with the one the publish endpoint applies: the two sets overlapped on "has
 * steps" and nothing else. A day could show a green *Ready* badge and then be
 * refused for a missing topic, while a day flagged *Needs attention* for missing
 * objectives published without complaint.
 *
 * Readiness is now decided once, on the server, and arrives on
 * `lesson.readiness`. Read it through `lib/curriculum-readiness.ts`. If a new
 * criterion is needed, add it to `backend/app/curriculum/primary.py` — putting
 * one back here recreates exactly the split this removed.
 */

export function resourceCount(lesson: PrimaryCurriculumLesson): number {
  return (lesson.steps ?? []).reduce((total, step) => (
    total
    + (step.resource_ids?.length ?? 0)
    + (step.required_resource_ids?.length ?? 0)
    + (step.optional_resource_ids?.length ?? 0)
  ), 0);
}

export function curriculumHref(input: {
  year?: string;
  level?: string;
  month?: number;
  day?: string;
  issue?: string;
  block?: string;
}): string {
  const query = new URLSearchParams();
  if (input.year) query.set("year", input.year);
  if (input.level) query.set("level", input.level);
  if (input.month) query.set("month", String(input.month));
  if (input.day) query.set("day", input.day);
  if (input.issue) query.set("issue", input.issue);
  if (input.block) query.set("block", input.block);
  return `/school-admin/curriculum${query.size ? `?${query.toString()}` : ""}`;
}

export function lessonsForMonth(lessons: PrimaryCurriculumLesson[], month: number): PrimaryCurriculumLesson[] {
  return lessons.filter((lesson) => lesson.month === month && lesson.status !== "archived");
}

/**
 * ⚠ `findLessonForSlot` was removed. It took the FIRST row matching (week, day),
 * which silently picked one of the two versions a slot commonly holds — the
 * published one teachers see, and the draft the author is editing. Use
 * `slotAt`/`slotOccupant` from `lib/curriculum-readiness.ts`, which model the
 * slot as holding both.
 */
