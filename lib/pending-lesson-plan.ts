import type { LessonPlanGeneratePayload } from "@/lib/api";

const PENDING_LESSON_PLAN_KEY = "teacher_ai_pending_lesson_plan";
const PENDING_LESSON_PLAN_TTL_MS = 2 * 60 * 60 * 1000;

type PendingLessonPlanRecord = {
  payload: LessonPlanGeneratePayload;
  savedAt: number;
};

export type PendingLessonPlanResult =
  | { ok: true; payload: LessonPlanGeneratePayload }
  | { ok: false; reason: "missing" | "expired" | "invalid" };

export function savePendingLessonPlan(payload: LessonPlanGeneratePayload) {
  if (typeof window === "undefined") return;
  const record: PendingLessonPlanRecord = {
    payload,
    savedAt: Date.now()
  };
  window.localStorage.setItem(PENDING_LESSON_PLAN_KEY, JSON.stringify(record));
}

export function readPendingLessonPlan(): PendingLessonPlanResult {
  if (typeof window === "undefined") return { ok: false, reason: "missing" };
  const raw = window.localStorage.getItem(PENDING_LESSON_PLAN_KEY);
  if (!raw) return { ok: false, reason: "missing" };

  try {
    const parsed = JSON.parse(raw) as Partial<PendingLessonPlanRecord> | LessonPlanGeneratePayload;
    const payload = "payload" in parsed ? parsed.payload : parsed;
    const savedAt = "savedAt" in parsed && typeof parsed.savedAt === "number" ? parsed.savedAt : Date.now();

    if (Date.now() - savedAt > PENDING_LESSON_PLAN_TTL_MS) {
      clearPendingLessonPlan();
      return { ok: false, reason: "expired" };
    }
    if (!isLessonPlanPayload(payload)) {
      clearPendingLessonPlan();
      return { ok: false, reason: "invalid" };
    }
    return { ok: true, payload };
  } catch {
    clearPendingLessonPlan();
    return { ok: false, reason: "invalid" };
  }
}

export function clearPendingLessonPlan() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PENDING_LESSON_PLAN_KEY);
}

function isLessonPlanPayload(value: unknown): value is LessonPlanGeneratePayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<LessonPlanGeneratePayload>;
  return Boolean(payload.book_id && payload.chapter_name && payload.topic);
}
