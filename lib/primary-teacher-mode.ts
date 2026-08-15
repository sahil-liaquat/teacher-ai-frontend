import type { PrimaryAssignment, PrimaryTeacherContextResolved } from "@/lib/api";

/**
 * Presentation helpers for the resolved teacher mode.
 *
 * Split from the hook because these are pure and worth unit-testing, and the
 * node test runner resolves no `@/` alias for value imports — the same reason
 * `primary-day-content.ts` imports types only. `use-primary-teacher-mode.ts`
 * re-exports both, so call sites are unaffected.
 */

/** "Sunrise School · Nursery A", for the small context line on Today. */
export function schoolContextLabel(
  context: PrimaryTeacherContextResolved | undefined,
  assignment?: PrimaryAssignment | null,
): string | null {
  if (!context || context.mode === "independent") return null;
  const parts = [context.organization_name, assignment?.display_name].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

/**
 * "School Curriculum" / "TeachPad Master Curriculum".
 *
 * Per-DAY provenance is authoritative and names the exact lesson and version;
 * this is the coarse school-level answer for surfaces with no day in hand.
 */
export function curriculumSourceLabel(
  context: PrimaryTeacherContextResolved | undefined,
): string {
  return context?.curriculum_source === "school"
    ? "School Curriculum"
    : "TeachPad Master Curriculum";
}
