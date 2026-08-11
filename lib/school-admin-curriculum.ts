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

export function stepIssues(step: PrimaryCurriculumStep): string[] {
  const issues: string[] = [];
  if (!step.title?.trim()) issues.push("missing a title");
  if (!step.instructions?.some((instruction) => instruction.trim())) issues.push("missing teacher instructions");
  if (step.resource_category && !(step.resource_ids?.length || step.required_resource_ids?.length)) {
    issues.push("missing a resource");
  }
  return issues;
}

export function lessonIssues(lesson: PrimaryCurriculumLesson): string[] {
  const issues: string[] = [];
  if (!lesson.title?.trim() && !lesson.daily_focus?.trim()) issues.push("Add a topic or daily focus");
  if (!lesson.objectives?.some((objective) => objective.trim())) issues.push("Add a learning objective");
  if (!lesson.steps?.length) issues.push("Add classroom blocks");
  const missingInstructions = lesson.steps?.filter((step) => stepIssues(step).includes("missing teacher instructions")).length ?? 0;
  const missingResources = lesson.steps?.filter((step) => stepIssues(step).includes("missing a resource")).length ?? 0;
  if (missingInstructions) issues.push(`${missingInstructions} ${missingInstructions === 1 ? "block needs" : "blocks need"} teacher instructions`);
  if (missingResources) issues.push(`${missingResources} ${missingResources === 1 ? "block needs" : "blocks need"} resources`);
  return issues;
}

export function lessonStatus(lesson?: PrimaryCurriculumLesson | null): SchoolDayStatus {
  if (!lesson) return "not_started";
  if (lesson.status === "published") return "published";
  if (lessonIssues(lesson).length) return "needs_attention";
  if (lesson.scope === "school") return "ready";
  return "draft";
}

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

export function findLessonForSlot(
  lessons: PrimaryCurriculumLesson[],
  week: number,
  day: number,
): PrimaryCurriculumLesson | undefined {
  return lessons.find((lesson) => lesson.week === week && lesson.day === day);
}
