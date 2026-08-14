/**
 * The frontend's half of the curriculum-definition boundary.
 *
 * The backend has `app/curriculum/`, where Primary's answers — its level
 * vocabulary, its content hierarchy, its month/week/day placement — are named
 * as *Primary's* rather than TeachPad's. This module is the small frontend
 * mirror of that: the curriculum vocabulary the School Admin surface needs,
 * in one place, instead of hand-synced copies.
 *
 * ⚠ Deliberately small, and deliberately NOT a curriculum-type selector. There
 * is one curriculum in production. This exists so a second one arrives as
 * another definition rather than as `if (level.startsWith("grade"))` scattered
 * through components — not so the UI can offer curricula that do not exist.
 *
 * ⚠ Scope is NOT curriculum type. Platform (master) vs school ownership is
 * handled by `curriculum-admin-adapter.ts`, and the two dimensions are
 * independent: the same Primary definition serves the master curriculum and
 * every school's copy of it.
 */

export type CurriculumLevel = {
  /** Wire value — snake_case, matching the backend enum. */
  value: string;
  /** What a teacher reads. */
  label: string;
};

export type CurriculumDefinitionMeta = {
  key: string;
  /** The curriculum family. Never a board: CBSE and JKBOSE both run Secondary. */
  stage: string;
  levels: readonly CurriculumLevel[];
  /** Content hierarchy, outermost first. Primary: theme → topic → lesson. */
  hierarchy: readonly string[];
  /**
   * Scheduling coordinate — separate from `hierarchy` on purpose. Primary leans
   * on month/week/day so heavily it reads like structure; it is placement, and
   * a Secondary curriculum would place into term/week/day/period instead.
   */
  placement: readonly string[];
  /** What one unit of teaching is called. */
  lessonNoun: string;
  /** What the level dimension is called: Primary "level", Secondary "grade". */
  levelNoun: string;
};

/**
 * Primary — the only curriculum TeachPad ships today.
 *
 * The level list mirrors `PRIMARY_LEVELS` in the backend's `models/primary.py`
 * and the labels mirror `PRIMARY_LEVEL_LABELS` in `app/curriculum/primary.py`.
 * That correspondence used to be a comment asking the next reader to keep two
 * lists in sync by hand; `tests/workspace/curriculum-definition.test.ts` now
 * checks it instead.
 */
export const PRIMARY_CURRICULUM: CurriculumDefinitionMeta = {
  key: "primary",
  stage: "primary",
  levels: [
    { value: "nursery", label: "Nursery" },
    { value: "lkg", label: "LKG" },
    { value: "ukg", label: "UKG" },
    { value: "class_1", label: "Class 1" },
    { value: "class_2", label: "Class 2" },
    { value: "class_3", label: "Class 3" },
    { value: "class_4", label: "Class 4" },
    { value: "class_5", label: "Class 5" },
  ],
  hierarchy: ["theme", "topic", "lesson"],
  placement: ["month", "week", "day"],
  lessonNoun: "teaching day",
  levelNoun: "level",
};

/** The definition in force. One curriculum today; resolved, not assumed. */
export function activeCurriculum(): CurriculumDefinitionMeta {
  return PRIMARY_CURRICULUM;
}

export function curriculumLevelLabel(
  level: string,
  definition: CurriculumDefinitionMeta = PRIMARY_CURRICULUM,
): string {
  return definition.levels.find((item) => item.value === level)?.label ?? level;
}
