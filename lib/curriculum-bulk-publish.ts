import type { PrimaryCurriculumLesson } from "@/lib/api";
import { isPublishable } from "./curriculum-readiness.ts";

/**
 * Publishing many days at once, honestly.
 *
 * ⚠ There is no bulk endpoint, and this does not pretend otherwise. The backend
 * publishes ONE lesson per call because `publish_lesson` archives the previous
 * published version of that exact identity inside its own transaction — a
 * server-side loop would either hold one long transaction across unrelated days
 * or fake atomicity it does not have. So the run is sequential and its outcome
 * is REPORTED rather than smoothed over: a day that fails leaves the days before
 * it published, and the caller is told exactly which.
 *
 * Sequential rather than `Promise.all` on purpose. Concurrent publishes of days
 * sharing an identity race on the archive-then-publish ordering the partial
 * unique index requires, and a 409 from that race is indistinguishable from a
 * real conflict.
 */

export type BulkPublishOutcome = {
  published: PrimaryCurriculumLesson[];
  failed: { lesson: PrimaryCurriculumLesson; error: unknown }[];
  /** Days deliberately not attempted because the server would refuse them. */
  skipped: PrimaryCurriculumLesson[];
};

export function emptyOutcome(): BulkPublishOutcome {
  return { published: [], failed: [], skipped: [] };
}

/**
 * Publish each ready day in turn.
 *
 * `publish` is injected so this is testable without a network and so the caller
 * chooses the ownership-correct endpoint via the adapter — this module never
 * decides which tenant it is acting for.
 */
export async function runBulkPublish(
  candidates: PrimaryCurriculumLesson[],
  publish: (lessonId: string) => Promise<PrimaryCurriculumLesson>,
  onProgress?: (completed: number, total: number) => void,
): Promise<BulkPublishOutcome> {
  const outcome = emptyOutcome();
  // Re-check rather than trusting the caller's filter. This is the last gate
  // before a write, and publishing something the server flagged as incomplete
  // is the one outcome a bulk action must never produce.
  const ready = candidates.filter((lesson) => isPublishable(lesson));
  outcome.skipped = candidates.filter((lesson) => !isPublishable(lesson));

  // An index loop, not `entries()`: tsconfig targets es5 and iterating an array
  // iterator needs downlevelIteration.
  for (let index = 0; index < ready.length; index += 1) {
    const lesson = ready[index];
    try {
      outcome.published.push(await publish(lesson.id));
    } catch (error) {
      outcome.failed.push({ lesson, error });
    }
    onProgress?.(index + 1, ready.length);
  }
  return outcome;
}

/**
 * What to tell the admin afterwards.
 *
 * Partial failure is stated plainly and never rounded to success — a run that
 * published four of six days and reports "published" would leave two days the
 * admin believes teachers can see.
 */
export function describeOutcome(outcome: BulkPublishOutcome): {
  tone: "success" | "partial" | "error";
  title: string;
  description: string;
} {
  const published = outcome.published.length;
  const failed = outcome.failed.length;
  const skipped = outcome.skipped.length;
  const stillDraft = failed + skipped;
  const draftNote = stillDraft
    ? ` ${stillDraft} ${stillDraft === 1 ? "day" : "days"} still ${stillDraft === 1 ? "requires" : "require"} attention.`
    : "";

  if (failed && !published) {
    return {
      tone: "error",
      title: "Nothing was published",
      description: `${failed} ${failed === 1 ? "day" : "days"} could not be published. Open each one to see why.`,
    };
  }
  if (failed) {
    return {
      tone: "partial",
      title: `${published} of ${published + failed} days published`,
      description: `${failed} ${failed === 1 ? "day" : "days"} failed and ${failed === 1 ? "remains" : "remain"} a draft. Open them to see why.`,
    };
  }
  if (!published) {
    return {
      tone: "error",
      title: "No days were ready",
      description: skipped
        ? `${skipped} ${skipped === 1 ? "day" : "days"} still ${skipped === 1 ? "has" : "have"} issues to resolve.`
        : "There are no drafts waiting to publish.",
    };
  }
  return {
    tone: "success",
    title: `${published} curriculum ${published === 1 ? "day" : "days"} published`,
    description: `Teachers can now plan from ${published === 1 ? "it" : "them"}.${draftNote}`,
  };
}
