/**
 * Learning objectives, as the UI should see them.
 *
 * ⚠ THIS EXISTS TO HIDE A SHAPE THAT IS GOING TO CHANGE. An objective is a
 * plain string in `lesson.objectives`, and a block claims one by its POSITION
 * in that array (`step.objective_indexes: number[]`). There is no objective
 * entity, no id, no reuse across lessons, and no way to ask "where is this
 * objective taught".
 *
 * That is a real gap, not an oversight to route around — but it is a BACKEND
 * gap, and blocking the authoring UI on it would be the wrong trade. So the UI
 * talks to objectives through this module instead of touching the array, and
 * when first-class objectives land only this file changes.
 *
 * ⚠ POSITIONAL LINKAGE IS THE DANGEROUS PART, and it is why the mutation
 * helpers here return BOTH halves. Removing objective #1 silently repoints
 * every block that referenced #2 unless every index above it shifts down. That
 * logic lived inline in the day editor, untested, with the hazard recorded in a
 * comment — which is exactly the kind of rule that survives until someone
 * refactors the component around it.
 */

/** One objective, with an identity the UI can key on safely. */
export type CurriculumObjective = {
  /** Position in `lesson.objectives`. What `objective_indexes` stores. */
  index: number;
  text: string;
  /**
   * A stable-per-render key for React lists.
   *
   * ⚠ Not the index. The editor keyed rows on the array index while allowing
   * removal from the middle, so React reused the wrong input's DOM node and a
   * half-typed objective could appear to jump rows.
   */
  key: string;
};

type StepLike = { objective_indexes?: number[] | null };

export function objectivesOf(objectives: readonly string[] | null | undefined): CurriculumObjective[] {
  return (objectives ?? []).map((text, index) => ({
    index,
    text,
    // Content plus position: stable while an objective is only edited, and
    // distinct between two objectives that happen to share text.
    key: `${index}:${text}`,
  }));
}

/** Objectives that carry no text yet. The server drops these on save. */
export function blankObjectives(objectives: readonly string[]): number[] {
  return objectives.reduce<number[]>((blanks, text, index) => {
    if (!text.trim()) blanks.push(index);
    return blanks;
  }, []);
}

export function addObjective(objectives: readonly string[]): string[] {
  return [...objectives, ""];
}

export function updateObjective(
  objectives: readonly string[],
  index: number,
  text: string,
): string[] {
  return objectives.map((item, position) => (position === index ? text : item));
}

/**
 * Remove an objective and repair every block that pointed into the list.
 *
 * ⚠ Returns both halves because both MUST change together. A caller that
 * removed the objective and forgot the steps would leave blocks silently
 * claiming a different objective than the one the author chose — a corruption
 * with no error and no visible symptom until someone reads the published day.
 */
export function removeObjective<TStep extends StepLike>(
  input: { objectives: readonly string[]; steps: readonly TStep[] },
  index: number,
): { objectives: string[]; steps: TStep[] } {
  return {
    objectives: input.objectives.filter((_, position) => position !== index),
    steps: input.steps.map((step) => ({
      ...step,
      objective_indexes: (step.objective_indexes ?? [])
        .filter((value) => value !== index)
        // Everything above the hole shifts down to close it.
        .map((value) => (value > index ? value - 1 : value)),
    })),
  };
}

/** Whether a block claims to teach the objective at this position. */
export function stepTeaches(step: StepLike, index: number): boolean {
  return (step.objective_indexes ?? []).includes(index);
}

export function toggleStepObjective<TStep extends StepLike>(
  step: TStep,
  index: number,
  on: boolean,
): number[] {
  const current = step.objective_indexes ?? [];
  if (on) return current.includes(index) ? [...current] : [...current, index].sort((a, b) => a - b);
  return current.filter((value) => value !== index);
}

/** The objectives one block teaches, resolved to their text. */
export function objectivesForStep(
  step: StepLike,
  objectives: readonly string[],
): CurriculumObjective[] {
  return objectivesOf(objectives).filter((objective) => stepTeaches(step, objective.index));
}

/**
 * Objectives no block claims to teach.
 *
 * ⚠ Advisory, and deliberately NOT a readiness rule. Readiness is the server's
 * single verdict and this module does not get to add a second one — an
 * uncovered objective may be perfectly intentional. It is a signal the author
 * can act on, rendered as a note, never as a blocker.
 */
export function uncoveredObjectives(
  objectives: readonly string[],
  steps: readonly StepLike[],
): CurriculumObjective[] {
  const covered = new Set<number>();
  for (const step of steps) {
    for (const index of step.objective_indexes ?? []) covered.add(index);
  }
  return objectivesOf(objectives).filter(
    (objective) => objective.text.trim() !== "" && !covered.has(objective.index),
  );
}

/**
 * How much of the day's stated intent is actually delivered by its blocks.
 *
 * Counts only objectives with text: an empty row is an author mid-typing, not
 * an uncovered objective, and counting it would make the figure drop as soon as
 * someone clicked "add".
 */
export function objectiveCoverage(
  objectives: readonly string[],
  steps: readonly StepLike[],
): { total: number; covered: number; percent: number } {
  const real = objectivesOf(objectives).filter((objective) => objective.text.trim() !== "");
  const uncovered = uncoveredObjectives(objectives, steps).length;
  const covered = real.length - uncovered;
  return {
    total: real.length,
    covered,
    percent: real.length ? Math.round((covered / real.length) * 100) : 0,
  };
}
