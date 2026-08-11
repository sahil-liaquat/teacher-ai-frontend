import type {
  PrimaryAcademicYear,
  PrimaryCurriculumLesson,
  PrimaryCurriculumTheme,
  PrimaryResource,
} from "./api";
import { curriculumHref, lessonStatus, levelLabel, monthLabel } from "./school-admin-curriculum.ts";

export type Ownership = "teachpad" | "school" | "customized";

export function ownershipOf(item: { scope: string; source_theme_id?: string | null; source_resource_id?: string | null }): Ownership {
  if (item.scope === "platform") return "teachpad";
  if (item.source_theme_id || item.source_resource_id) return "customized";
  return "school";
}

export function ownershipLabel(ownership: Ownership): string {
  return ownership === "teachpad" ? "TeachPad" : ownership === "customized" ? "Customized" : "Your school";
}

export function themeLessons(theme: PrimaryCurriculumTheme, lessons: PrimaryCurriculumLesson[]): PrimaryCurriculumLesson[] {
  const ids = new Set([theme.id, theme.source_theme_id].filter(Boolean));
  return lessons.filter((lesson) => ids.has(lesson.theme_id) && lesson.status !== "archived");
}

function containsResource(value: unknown, resourceId: string): boolean {
  if (value === resourceId) return true;
  if (Array.isArray(value)) return value.some((item) => containsResource(item, resourceId));
  if (value && typeof value === "object") return Object.values(value).some((item) => containsResource(item, resourceId));
  return false;
}

export type ResourceUsage = {
  lesson: PrimaryCurriculumLesson;
  stepId: string;
  stepTitle: string;
  href: string;
};

export function resourceUsages(resource: PrimaryResource, lessons: PrimaryCurriculumLesson[]): ResourceUsage[] {
  const ids = new Set<string>([resource.id, resource.source_resource_id].filter((id): id is string => Boolean(id)));
  const usages: ResourceUsage[] = [];
  for (const lesson of lessons) {
    if (lesson.status === "archived") continue;
    for (const step of lesson.steps ?? []) {
      const direct = [...(step.resource_ids ?? []), ...(step.required_resource_ids ?? []), ...(step.optional_resource_ids ?? [])];
      if (!Array.from(ids).some((id) => direct.includes(id) || containsResource(step.details, id))) continue;
      usages.push({
        lesson,
        stepId: step.id,
        stepTitle: step.title,
        href: curriculumHref({
          year: lesson.academic_year_id ?? undefined,
          level: lesson.level,
          month: lesson.month ?? undefined,
          day: lesson.id,
          block: step.id,
        }),
      });
    }
  }
  return usages;
}

export function lessonLocation(lesson: PrimaryCurriculumLesson): string {
  const parts = [levelLabel(lesson.level)];
  if (lesson.month) parts.push(monthLabel(lesson.month));
  if (lesson.week) parts.push(`Week ${lesson.week}`);
  if (lesson.day) parts.push(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][lesson.day - 1] ?? `Day ${lesson.day}`);
  return parts.join(" · ");
}

export type AcademicYearState = "current" | "planning" | "completed";

export function academicYearState(year: PrimaryAcademicYear, today = new Date()): AcademicYearState {
  if (year.is_active) return "current";
  const current = today.toISOString().slice(0, 10);
  if (year.ends_on < current) return "completed";
  return "planning";
}

export function yearReadiness(lessons: PrimaryCurriculumLesson[], level: string) {
  const relevant = lessons.filter((lesson) => lesson.level === level && lesson.status !== "archived");
  const ready = relevant.filter((lesson) => ["ready", "published"].includes(lessonStatus(lesson))).length;
  return { ready, total: 300, percent: Math.min(100, Math.round((ready / 300) * 100)) };
}

export function resourceKind(resource: Pick<PrimaryResource, "category" | "file_type" | "is_digital">): string {
  const category = resource.category.trim();
  if (/flash/i.test(category)) return "Flashcards";
  if (/work|print/i.test(category)) return "Printable";
  if (/story|book/i.test(category)) return "Story material";
  if (/video|youtube/i.test(category) || resource.file_type.toLowerCase().includes("video")) return "Video";
  if (/audio|song|rhyme/i.test(category) || resource.file_type.toLowerCase().includes("audio")) return "Audio";
  if (resource.is_digital) return "Digital activity";
  return category || "Classroom resource";
}
