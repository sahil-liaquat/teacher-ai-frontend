import type { LessonPlan } from "@/lib/api";

export const LESSON_PLAN_STORAGE_PREFIX = "teacher_ai_lesson_plan_";
export const LESSON_PLAN_STORAGE_EVENT = "teacher-ai-lesson-plan-updated";

export function saveLessonPlanGeneration(generation: LessonPlan) {
  if (typeof window === "undefined" || !generation?.id) return;
  window.localStorage.setItem(`${LESSON_PLAN_STORAGE_PREFIX}${generation.id}`, JSON.stringify(generation));
  window.dispatchEvent(new CustomEvent(LESSON_PLAN_STORAGE_EVENT, { detail: generation }));
}

export function listLessonPlanGenerations(userId?: string) {
  if (typeof window === "undefined") return [];
  const items: LessonPlan[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(LESSON_PLAN_STORAGE_PREFIX)) continue;
    const stored = window.localStorage.getItem(key);
    if (!stored) continue;
    try {
      const generation = JSON.parse(stored) as LessonPlan;
      if (!generation?.id) continue;
      if (userId && generation.user_id && generation.user_id !== userId) continue;
      items.push(generation);
    } catch {
    }
  }
  return items.sort((a, b) => new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime());
}
