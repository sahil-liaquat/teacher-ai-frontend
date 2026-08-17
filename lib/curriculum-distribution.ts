/**
 * Distributing curriculum across the school calendar.
 *
 * ⚠ THERE IS NO AUTO-DISTRIBUTION ENDPOINT, and this does not pretend
 * otherwise. The backend exposes `POST /school-admin/planning/plans` for one
 * plan at a time, and every write goes through the calendar gate that refuses
 * non-teaching days, dates outside every term, and slots already taken. So a
 * distribution is PROPOSED here and APPLIED one call at a time, with the
 * outcome reported rather than smoothed over.
 *
 * ⚠ THIS IS NOT A SECOND SOURCE OF TRUTH. The proposal skips dates it can see
 * are unusable purely so the preview is honest — the server still validates
 * every single write, and a proposal that slips through is refused there, not
 * here. If the two ever disagree the server is right by construction. Nothing
 * in this module may become a rule the server does not also apply.
 *
 * ⚠ PREVIEW IS MANDATORY. `proposeDistribution` writes nothing. Placing a term
 * of curriculum onto a calendar is a large, hard-to-reverse change, and the
 * admin sees exactly what will happen before anything is sent.
 *
 * Modelled on `curriculum-bulk-publish.ts`, deliberately: same sequential run,
 * same honest partial-failure outcome, same injected writer so it is testable
 * without a network.
 */

/** A lesson in curriculum order, with just enough to place and name it. */
export type DistributableLesson = {
  id: string;
  title?: string | null;
  daily_focus?: string | null;
  month?: number | null;
  week?: number | null;
  day?: number | null;
};

export type DistributionDay = {
  id: string;
  date: string;
  day_type: string;
};

export type ExistingPlan = {
  lesson_id: string;
  calendar_day_id: string;
  status: "planned" | "cancelled";
};

export type DistributionProposal = {
  lesson: DistributableLesson;
  date: string;
  calendarDayId: string;
};

export type UnplacedLesson = {
  lesson: DistributableLesson;
  reason: "already_planned" | "no_teaching_day_left";
};

export type DistributionPlan = {
  proposals: DistributionProposal[];
  unplaced: UnplacedLesson[];
  /** Teaching days left free after the proposal, for the preview to report. */
  remainingDays: number;
};

/** Curriculum order: month, then week, then day. Nulls sort last. */
function byCurriculumOrder(a: DistributableLesson, b: DistributableLesson): number {
  const rank = (value: number | null | undefined) => (value == null ? Number.MAX_SAFE_INTEGER : value);
  return (
    rank(a.month) - rank(b.month)
    || rank(a.week) - rank(b.week)
    || rank(a.day) - rank(b.day)
    // A stable tie-break, so two lessons in the same slot do not swap between
    // renders and make the preview look non-deterministic.
    || (a.id < b.id ? -1 : 1)
  );
}

/**
 * Lay unscheduled lessons onto the school's free teaching days, in order.
 *
 * One lesson per teaching day, earliest day first, curriculum order preserved.
 * That is deliberately the simplest rule that is defensible: anything cleverer
 * — balancing across terms, respecting subject rhythm — is a decision the
 * school should make, and guessing at it inside a preview the admin is expected
 * to trust would be worse than laying them out predictably.
 */
export function proposeDistribution(input: {
  lessons: readonly DistributableLesson[];
  teachingDays: readonly DistributionDay[];
  existingPlans: readonly ExistingPlan[];
}): DistributionPlan {
  // Only real teaching days. The server refuses anything else, so proposing one
  // would produce a preview that is guaranteed to fail on apply.
  const usableDays = input.teachingDays
    .filter((day) => day.day_type === "teaching")
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  const active = input.existingPlans.filter((plan) => plan.status === "planned");
  // A day already carrying a plan is occupied. This mirrors the server's slot
  // check closely enough for an honest preview; the server still owns the rule.
  const occupiedDayIds = new Set(active.map((plan) => plan.calendar_day_id));
  const alreadyPlanned = new Set(active.map((plan) => plan.lesson_id));

  const freeDays = usableDays.filter((day) => !occupiedDayIds.has(day.id));
  const ordered = input.lessons.slice().sort(byCurriculumOrder);

  const proposals: DistributionProposal[] = [];
  const unplaced: UnplacedLesson[] = [];
  let cursor = 0;

  for (const lesson of ordered) {
    if (alreadyPlanned.has(lesson.id)) {
      // Re-running a distribution must be safe. A lesson that already has a
      // plan is left exactly where the admin put it.
      unplaced.push({ lesson, reason: "already_planned" });
      continue;
    }
    if (cursor >= freeDays.length) {
      unplaced.push({ lesson, reason: "no_teaching_day_left" });
      continue;
    }
    const day = freeDays[cursor];
    cursor += 1;
    proposals.push({ lesson, date: day.date, calendarDayId: day.id });
  }

  return { proposals, unplaced, remainingDays: Math.max(freeDays.length - cursor, 0) };
}

// ── Applying, one write at a time ───────────────────────────────────────────

export type DistributionOutcome = {
  created: DistributionProposal[];
  failed: { proposal: DistributionProposal; error: unknown }[];
};

export function emptyDistributionOutcome(): DistributionOutcome {
  return { created: [], failed: [] };
}

/**
 * Apply an approved proposal, sequentially.
 *
 * Sequential rather than `Promise.all`: concurrent creates against the same
 * calendar day race the slot-uniqueness check, and a 409 from that race is
 * indistinguishable from a real conflict. Partial success is reported, never
 * hidden — a run that fails halfway leaves the plans before it in place, and
 * the caller is told exactly which.
 */
export async function runDistribution(
  proposals: readonly DistributionProposal[],
  create: (proposal: DistributionProposal) => Promise<unknown>,
  onProgress?: (completed: number, total: number) => void,
): Promise<DistributionOutcome> {
  const outcome = emptyDistributionOutcome();
  // An index loop, not `entries()`: tsconfig targets es5.
  for (let index = 0; index < proposals.length; index += 1) {
    const proposal = proposals[index];
    try {
      await create(proposal);
      outcome.created.push(proposal);
    } catch (error) {
      outcome.failed.push({ proposal, error });
    }
    onProgress?.(index + 1, proposals.length);
  }
  return outcome;
}

export function describeDistribution(outcome: DistributionOutcome): {
  title: string;
  description: string;
  tone: "success" | "warning" | "error";
} {
  const { created, failed } = outcome;
  if (!failed.length) {
    return {
      title: `${created.length} ${created.length === 1 ? "day" : "days"} scheduled`,
      description: "Teachers see these on the dates they are planned for.",
      tone: "success",
    };
  }
  if (!created.length) {
    return {
      title: "Nothing was scheduled",
      description: `All ${failed.length} ${failed.length === 1 ? "day" : "days"} were refused. Check the calendar for that period.`,
      tone: "error",
    };
  }
  return {
    title: `${created.length} scheduled, ${failed.length} refused`,
    description: "The refused days were left unscheduled. Nothing already planned was changed.",
    tone: "warning",
  };
}
