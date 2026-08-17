/**
 * The canonical level vocabulary — the rules half.
 *
 * Pure and dependency-free on purpose. The hooks that fetch live in
 * `use-school-levels.ts`; everything here is unit-testable under the node test
 * runner, which cannot resolve the `@/` alias for value imports. Same split the
 * codebase already uses for `curriculum-day-draft` vs `CreateDayDialog`.
 *
 * ⚠ THIS REPLACES `SCHOOL_LEVELS` AND `TEACHER_LEVELS` FOR SCHOOL SCOPE.
 * Those were two independently hardcoded lists — five entries stopping at
 * Class 2 for curriculum, eight for staffing — while the school's own
 * `school_grade_levels` rows, the actual source of truth, drove nothing. A
 * school could staff a Class 4 it could not author curriculum for, and could
 * define "Prep" that no surface would ever render.
 */
// Relative with an explicit extension, not the "@/" alias: this is a VALUE
// import and the node test runner resolves it at runtime, where the alias does
// not exist. Same reason `school-admin-teachers.ts` does it.
import { PRIMARY_CURRICULUM } from "./curriculum-definition.ts";

export type SchoolLevelOption = {
  /** The wire value: what `?level=` and every API call carries. */
  value: string;
  /** What this school calls it. School rows shadow platform rows by code. */
  label: string;
  /** False for a school-defined level the curriculum engine cannot author yet. */
  supportsCurriculum: boolean;
  scope: "platform" | "school";
  programmeId: string | null;
};

/** Shape of one `TeachableSchoolLevel` row, without importing the API module. */
type LevelRow = {
  code: string;
  name: string;
  scope: "platform" | "school";
  programme_id: string | null;
  supports_curriculum: boolean;
};

/**
 * The compiled list, as options.
 *
 * ⚠ Used ONLY as the in-flight fallback. An empty level dropdown during a normal
 * page load is indistinguishable from a school that has configured no levels,
 * and would make every curriculum surface look broken.
 */
export const COMPILED_FALLBACK: SchoolLevelOption[] = PRIMARY_CURRICULUM.levels.map(
  (item) => ({
    value: item.value,
    label: item.label,
    supportsCurriculum: true,
    scope: "platform" as const,
    programmeId: null,
  }),
);

export function toLevelOption(level: LevelRow): SchoolLevelOption {
  return {
    value: level.code,
    label: level.name,
    supportsCurriculum: level.supports_curriculum,
    scope: level.scope,
    programmeId: level.programme_id,
  };
}

export function levelOptionsFrom(rows: LevelRow[] | undefined): SchoolLevelOption[] {
  return rows?.length ? rows.map(toLevelOption) : COMPILED_FALLBACK;
}

/** A resolver from wire code to this school's label. */
export function levelLabelResolver(levels: SchoolLevelOption[]): (code: string) => string {
  const byCode = new Map(levels.map((level) => [level.value, level.label]));
  // Falls back to the raw code rather than throwing: a lesson may reference a
  // level the school has since archived, and the roster already treats an
  // unknown code as an ordinary state rather than a bug.
  return (code: string) => byCode.get(code) ?? code;
}

/**
 * The default level for a surface with none in its URL yet.
 *
 * ⚠ Replaces a literal `"nursery"` in five workspaces. A school whose lowest
 * level is Class 6 was landed on a Nursery it does not teach, saw an empty
 * curriculum, and had to notice the dropdown to recover.
 */
export function defaultLevel(levels: SchoolLevelOption[]): string {
  return (
    levels.find((level) => level.supportsCurriculum)?.value
    ?? levels[0]?.value
    ?? PRIMARY_CURRICULUM.levels[0].value
  );
}

// ── Curriculum vocabulary ───────────────────────────────────────────────────

export type CurriculumVocabulary = {
  /** Content nodes, outermost first. */
  nodes: { key: string; label: string; depth: number; required: boolean }[];
  /** What one unit of teaching is called: Primary's "teaching day". */
  lessonNoun: string;
  /** What the level dimension is called: "level", "grade", "year". */
  levelNoun: string;
  labelFor: (nodeKey: string) => string;
  has: (nodeKey: string) => boolean;
  source: "compiled" | "structure" | "fallback";
};

type DefinitionRow = {
  source: "compiled" | "structure";
  lesson_noun: string;
  level_noun: string;
  nodes: { key: string; label: string; depth: number; is_required: boolean }[];
};

function titleCase(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/** The shape a school mid-onboarding renders with — no programme, no rows. */
export const COMPILED_VOCABULARY: CurriculumVocabulary = {
  nodes: PRIMARY_CURRICULUM.hierarchy.map((key, depth) => ({
    key,
    label: titleCase(key),
    depth,
    // Primary topics are optional; themes are not. Mirrors HierarchyPolicy.
    required: key !== "topic",
  })),
  lessonNoun: PRIMARY_CURRICULUM.lessonNoun,
  levelNoun: PRIMARY_CURRICULUM.levelNoun,
  labelFor: titleCase,
  has: (nodeKey) => PRIMARY_CURRICULUM.hierarchy.includes(nodeKey),
  source: "fallback",
};

/**
 * Build the vocabulary the UI renders from the server's resolved definition.
 *
 * ⚠ A school's own word wins over the definition's. `resolve_terminology`
 * already merged framework defaults under the school's overrides server-side,
 * so this is one lookup rather than a second precedence rule in the browser.
 */
/** Re-label an existing vocabulary with the school's own words. */
function applyTerminology(
  base: CurriculumVocabulary,
  terminology: Record<string, string>,
): CurriculumVocabulary {
  const nodes = base.nodes.map((node) => ({
    ...node,
    label: terminology[node.key] ?? node.label,
  }));
  const byKey = new Map(nodes.map((node) => [node.key, node.label]));
  return {
    ...base,
    nodes,
    lessonNoun: terminology.lesson ?? base.lessonNoun,
    levelNoun: terminology.level ?? base.levelNoun,
    labelFor: (nodeKey) => byKey.get(nodeKey) ?? titleCase(nodeKey),
  };
}

export function vocabularyFrom(
  definition: DefinitionRow | undefined,
  terminology: Record<string, string> | undefined,
): CurriculumVocabulary {
  // ⚠ Terminology applies EVEN WITHOUT A PROGRAMME. This used to return the
  // compiled vocabulary untouched, so a school that renamed "level" to "Year"
  // in Settings kept seeing "level" everywhere until it happened to have a
  // programme with a resolved definition — which is most schools, most of the
  // time. A setting that works only under a condition the admin cannot see is
  // indistinguishable from one that does not work.
  if (!definition) {
    return terminology
      ? applyTerminology(COMPILED_VOCABULARY, terminology)
      : COMPILED_VOCABULARY;
  }
  const nodes = definition.nodes
    .slice()
    .sort((a, b) => a.depth - b.depth)
    .map((node) => ({
      key: node.key,
      label: terminology?.[node.key] ?? node.label,
      depth: node.depth,
      required: node.is_required,
    }));
  const byKey = new Map(nodes.map((node) => [node.key, node.label]));
  return {
    nodes,
    lessonNoun: terminology?.lesson ?? definition.lesson_noun,
    levelNoun: terminology?.level ?? definition.level_noun,
    labelFor: (nodeKey) => byKey.get(nodeKey) ?? titleCase(nodeKey),
    has: (nodeKey) => byKey.has(nodeKey),
    source: definition.source,
  };
}
