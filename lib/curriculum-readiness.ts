import type { LessonReadinessCheck, PrimaryCurriculumLesson } from "@/lib/api";

/**
 * Readiness, as the SERVER decides it.
 *
 * ⚠ Nothing in this file evaluates a lesson. Every function here reads
 * `lesson.readiness`, which the backend computes with the same
 * `ValidationPolicy.readiness_checks()` call the publish endpoint makes. That is
 * the whole point: this used to be a second, independent rule living in
 * `lib/school-admin-curriculum.ts`, and it disagreed with the server. The two
 * sets overlapped on "has steps" and nothing else, so a day could show a green
 * *Ready* badge and be refused on publish for a missing topic, while a day
 * flagged *Needs attention* for missing objectives published without complaint.
 *
 * If you find yourself adding a condition here, add it to
 * `backend/app/curriculum/primary.py` instead and let it arrive on the payload.
 */

export type CurriculumDayStatus =
  | "not_started"
  | "draft"
  | "needs_attention"
  | "ready"
  | "published";

/** Blocking failures only. Advisory notes are guidance, never problems. */
export function blockingIssues(lesson?: PrimaryCurriculumLesson | null): LessonReadinessCheck[] {
  return (lesson?.readiness?.checks ?? []).filter(
    (check) => !check.ok && check.severity !== "advisory",
  );
}

/** Notes the author may act on but that never stop a publish. */
export function advisoryNotes(lesson?: PrimaryCurriculumLesson | null): LessonReadinessCheck[] {
  return (lesson?.readiness?.checks ?? []).filter(
    (check) => !check.ok && check.severity === "advisory",
  );
}

export function satisfiedChecks(lesson?: PrimaryCurriculumLesson | null): LessonReadinessCheck[] {
  return (lesson?.readiness?.checks ?? []).filter((check) => check.ok);
}

/**
 * Whether the server would accept a publish for this day right now.
 *
 * Falls back to "not ready" when `readiness` is absent — an older payload, or a
 * lesson stub assembled client-side. Refusing to claim readiness we were not
 * told about is the safe direction: the worst case is a publish button the
 * author has to reach through Review, not a publish that fails.
 */
export function isPublishable(lesson?: PrimaryCurriculumLesson | null): boolean {
  return lesson?.readiness?.ready === true;
}

export function dayStatus(lesson?: PrimaryCurriculumLesson | null): CurriculumDayStatus {
  if (!lesson) return "not_started";
  if (lesson.status === "published") return "published";
  if (!lesson.readiness) return "draft";
  return lesson.readiness.ready ? "ready" : "needs_attention";
}

export const DAY_STATUS_LABELS: Record<CurriculumDayStatus, string> = {
  not_started: "Not planned",
  draft: "Draft",
  needs_attention: "Needs attention",
  ready: "Ready",
  published: "Published",
};

/**
 * Where a failed check should send the author.
 *
 * `block:<n>` addresses the nth block in authored order; the lesson-level keys
 * address a control in the Learning or Context section. Returning a stable
 * token rather than a DOM id keeps the editor free to lay itself out however it
 * likes without this module knowing.
 */
export function focusTarget(check: LessonReadinessCheck): string | null {
  if (check.step_position !== null && check.step_position !== undefined) {
    return `block:${check.step_position}`;
  }
  return check.field ? `field:${check.field}` : null;
}

// ── Month metrics ───────────────────────────────────────────────────────────

export const WEEKS_PER_MONTH = 5;
export const DAYS_PER_WEEK = 5;
/** The month grid is 5 weeks x 5 teaching days. Both ends agree on this. */
export const SLOTS_PER_MONTH = WEEKS_PER_MONTH * DAYS_PER_WEEK;

/**
 * One curriculum slot — a (week, day) pair — and the versions living in it.
 *
 * ⚠ A slot is NOT a lesson. It commonly holds two: the version teachers are
 * being served, and the draft the author duplicated in order to change it. Both
 * facts matter and they answer different questions, so collapsing the slot to
 * "the newest row" loses one of them: "how much of September is live for
 * teachers?" is about `published`, while "what still needs my attention?" is
 * about `draft`. Counting lesson ROWS instead of slots is what let readiness
 * exceed 100% and made "18 of 25 ready" overstate by the number of open drafts.
 */
export type CurriculumSlot = {
  week: number;
  day: number;
  /** The version teachers can reach right now, if any. */
  published: PrimaryCurriculumLesson | null;
  /** The newest unpublished version — what the grid cell opens for editing. */
  draft: PrimaryCurriculumLesson | null;
  /** Whichever the author should be shown and taken to. Never null. */
  current: PrimaryCurriculumLesson;
  status: CurriculumDayStatus;
  /** A published day that also has unpublished edits in flight. */
  hasUnpublishedEdits: boolean;
};

export type MonthMetrics = {
  slots: number;
  created: number;
  /** Slots whose working draft the server would publish right now. */
  ready: number;
  /** Slots teachers can reach today. May overlap `ready`. */
  published: number;
  /** Slots whose working draft has blocking issues. */
  needsAttention: number;
  empty: number;
  /** Published slots as a percentage of SLOTS_PER_MONTH. Never above 100. */
  completionPct: number;
};

/** Every occupied slot, in calendar order. Archived versions are not versions. */
export function curriculumSlots(lessons: PrimaryCurriculumLesson[]): CurriculumSlot[] {
  const grouped = new Map<string, PrimaryCurriculumLesson[]>();
  for (const lesson of lessons) {
    if (lesson.week == null || lesson.day == null) continue;
    if (lesson.status === "archived") continue;
    const key = `${lesson.week}:${lesson.day}`;
    grouped.set(key, [...(grouped.get(key) ?? []), lesson]);
  }

  const slots: CurriculumSlot[] = [];
  // Array.from, not a spread: tsconfig targets es5.
  for (const versions of Array.from(grouped.values())) {
    const ordered = versions.slice().sort(byVersionDescending);
    const published = ordered.find((item) => item.status === "published") ?? null;
    const draft = ordered.find((item) => item.status !== "published") ?? null;
    // The draft is what an author works on, so it wins the cell. Falling back to
    // the published row keeps `current` non-null for a slot that only has one.
    const current = draft ?? published ?? ordered[0];
    slots.push({
      week: current.week as number,
      day: current.day as number,
      published,
      draft,
      current,
      status: draft ? dayStatus(draft) : dayStatus(published),
      hasUnpublishedEdits: Boolean(published && draft),
    });
  }
  return slots.sort((a, b) => a.week - b.week || a.day - b.day);
}

/**
 * Highest version first, id descending as a tie-break.
 *
 * The tie-break matters: without it two rows sharing a version number would
 * alternate between renders and the grid cell would appear to flicker between
 * two different days.
 */
function byVersionDescending(a: PrimaryCurriculumLesson, b: PrimaryCurriculumLesson): number {
  if (a.version !== b.version) return b.version - a.version;
  return a.id < b.id ? 1 : -1;
}

export function monthMetrics(lessons: PrimaryCurriculumLesson[]): MonthMetrics {
  const slots = curriculumSlots(lessons);
  let ready = 0;
  let published = 0;
  let needsAttention = 0;
  for (const slot of slots) {
    if (slot.published) published += 1;
    if (slot.draft) {
      if (isPublishable(slot.draft)) ready += 1;
      else needsAttention += 1;
    }
  }
  return {
    slots: SLOTS_PER_MONTH,
    created: slots.length,
    ready,
    published,
    needsAttention,
    empty: Math.max(SLOTS_PER_MONTH - slots.length, 0),
    // Clamped as well as slot-based. The backend accepts week <= 6, so a stray
    // week-6 row is legal data that must not push this over 100.
    completionPct: Math.min(100, Math.round((published / SLOTS_PER_MONTH) * 100)),
  };
}

/** The slot at (week, day), if anything has been authored there. */
export function slotAt(
  lessons: PrimaryCurriculumLesson[],
  week: number,
  day: number,
): CurriculumSlot | undefined {
  return curriculumSlots(lessons).find((slot) => slot.week === week && slot.day === day);
}

/** The lesson a grid cell should open — the working draft where there is one. */
export function slotOccupant(
  lessons: PrimaryCurriculumLesson[],
  week: number,
  day: number,
): PrimaryCurriculumLesson | undefined {
  return slotAt(lessons, week, day)?.current;
}

/**
 * The drafts a bulk publish would actually publish, in calendar order.
 *
 * A slot's PUBLISHED row is never included — republishing it is a no-op that
 * would burn a version number — and a blocked draft is never included, because
 * the server would refuse it and a partial failure mid-batch is worse than not
 * offering it.
 */
export function publishableDays(lessons: PrimaryCurriculumLesson[]): PrimaryCurriculumLesson[] {
  return curriculumSlots(lessons)
    .map((slot) => slot.draft)
    .filter((draft): draft is PrimaryCurriculumLesson => Boolean(draft) && isPublishable(draft));
}

/** The drafts a bulk publish would deliberately leave alone, in calendar order. */
export function blockedDays(lessons: PrimaryCurriculumLesson[]): PrimaryCurriculumLesson[] {
  return curriculumSlots(lessons)
    .map((slot) => slot.draft)
    .filter((draft): draft is PrimaryCurriculumLesson => Boolean(draft) && !isPublishable(draft));
}
