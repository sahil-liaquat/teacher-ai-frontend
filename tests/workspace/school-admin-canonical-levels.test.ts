import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  COMPILED_FALLBACK,
  defaultLevel,
  levelLabelResolver,
  levelOptionsFrom,
  vocabularyFrom,
  type SchoolLevelOption,
} from "../../lib/school-admin-levels.ts";

/**
 * Phase 1 — one canonical level vocabulary.
 *
 * Three lists governed levels before this: `SCHOOL_LEVELS` (five, stopping at
 * Class 2) drove curriculum; `TEACHER_LEVELS` (eight, compiled) drove staffing;
 * and the school's own `school_grade_levels` rows — the actual source of truth —
 * drove nothing. A school could staff a Class 4 it could not author curriculum
 * for, and could define "Prep" that no surface would ever render.
 */

const ROOT = new URL("../../", import.meta.url);

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, ROOT), "utf8");
}

function schoolAdminComponents(): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(new URL(dir, ROOT), { withFileTypes: true })) {
      if (entry.isDirectory()) walk(`${dir}${entry.name}/`);
      else if (entry.name.endsWith(".tsx")) files.push(`${dir}${entry.name}`);
    }
  };
  walk("components/school-admin/");
  return files;
}

function option(overrides: Partial<SchoolLevelOption> = {}): SchoolLevelOption {
  return {
    value: "nursery",
    label: "Nursery",
    supportsCurriculum: true,
    scope: "platform",
    programmeId: null,
    ...overrides,
  };
}

// ── The canonical source ────────────────────────────────────────────────────

test("the client reads the union endpoint, not the school-only one, for selection", () => {
  const api = source("lib/api.ts");
  assert.ok(
    api.includes("schoolAdminAvailableLevels"),
    "a client for /levels/available must exist",
  );
  assert.ok(
    api.includes("/school-admin/academic/levels/available"),
    "selection must read the platform+school union",
  );

  const hook = source("lib/use-school-levels.ts");
  assert.ok(
    hook.includes("schoolAdminAvailableLevels"),
    "useSchoolLevels must read the union endpoint",
  );
  assert.ok(
    !hook.includes("schoolAdminLevels("),
    "useSchoolLevels must not read the school-only list — it is empty for most schools",
  );
});

// ── No surface keeps its own vocabulary ─────────────────────────────────────

test("no School Admin surface selects from a hardcoded level list", () => {
  // The two shared curriculum workspaces keep a compiled branch for PLATFORM
  // scope only: the master curriculum has no school, and
  // /levels/available is guarded by get_current_org_admin.
  const allowed = new Set([
    "components/school-admin/curriculum/curriculum-workspace.tsx",
    "components/school-admin/curriculum/review-publish-workspace.tsx",
  ]);
  const offenders = schoolAdminComponents().filter((file) => {
    if (allowed.has(file)) return false;
    const text = source(file);
    return /\b(SCHOOL_LEVELS|TEACHER_LEVELS)\b/.test(text.replace(/\/\/.*$/gm, ""));
  });
  assert.deepEqual(offenders, [], `these must use useSchoolLevels: ${offenders.join(", ")}`);
});

test("the two scope-shared workspaces gate the compiled list behind platform scope", () => {
  for (const file of [
    "components/school-admin/curriculum/curriculum-workspace.tsx",
    "components/school-admin/curriculum/review-publish-workspace.tsx",
  ]) {
    const text = source(file);
    assert.ok(
      text.includes('scope === "platform"') && text.includes("SCHOOL_LEVELS"),
      `${file} must use the compiled list only on the platform branch`,
    );
    assert.ok(text.includes("useSchoolLevels"), `${file} must read school levels for school scope`);
  }
});

test("no School Admin surface defaults a level to the literal \"nursery\"", () => {
  // A school whose lowest level is Class 6 landed on a Nursery it does not
  // teach, saw an empty curriculum, and had to notice the dropdown to recover.
  const offenders = schoolAdminComponents().filter((file) =>
    /\?\?\s*"nursery"|useState\("nursery"\)/.test(source(file)),
  );
  assert.deepEqual(offenders, [], `use defaultLevel(): ${offenders.join(", ")}`);
});

test("the academic-year card no longer truncates readiness to three levels", () => {
  // Comments stripped: the file explains the fix by naming the old expression.
  const text = source("components/school-admin/academic-years/academic-years-workspace.tsx")
    .replace(/\/\/.*$/gm, "");
  assert.ok(
    !/SCHOOL_LEVELS\.slice\(0,\s*3\)/.test(text),
    "three levels' readiness must not be presented as the year's",
  );
  assert.ok(text.includes("curriculumLevels"), "it must show every curriculum level");
});

// ── Custom levels are supported, and honestly ───────────────────────────────

test("a school-defined level is offered but flagged as not curriculum-capable", () => {
  // `primary_curriculum_lessons` has a CHECK constraint pinning `level` to the
  // eight compiled codes, so "Prep" can hold classes and teachers but cannot
  // hold curriculum. Hiding it would make level configuration a lie; offering
  // it silently would walk the admin into a 422.
  const levels = [
    option({ value: "prep", label: "Prep", scope: "school", supportsCurriculum: false }),
    option({ value: "class_1", label: "Class 1" }),
  ];
  const curriculumOnly = levels.filter((level) => level.supportsCurriculum);
  assert.equal(curriculumOnly.length, 1);
  assert.equal(curriculumOnly[0].value, "class_1");
  // But the full list still carries it, for staffing.
  assert.equal(levels.length, 2);
});

test("defaultLevel prefers a curriculum-capable level over a custom one", () => {
  assert.equal(
    defaultLevel([
      option({ value: "prep", scope: "school", supportsCurriculum: false }),
      option({ value: "class_3", label: "Class 3" }),
    ]),
    "class_3",
  );
});

test("defaultLevel falls back to the first level when none supports curriculum", () => {
  assert.equal(
    defaultLevel([option({ value: "prep", scope: "school", supportsCurriculum: false })]),
    "prep",
  );
});

test("defaultLevel survives an empty list rather than returning undefined", () => {
  // The loading window. An undefined level would put `?level=undefined` in the
  // URL and 422 the curriculum call.
  assert.equal(typeof defaultLevel([]), "string");
  assert.ok(defaultLevel([]).length > 0);
});

// ── The loading fallback ────────────────────────────────────────────────────

test("the hook falls back to compiled levels rather than rendering an empty list", () => {
  const hook = source("lib/school-admin-levels.ts");
  assert.ok(
    hook.includes("COMPILED_FALLBACK"),
    "an empty dropdown during load is indistinguishable from a school with no levels",
  );
  assert.ok(
    hook.includes("rows?.length ? rows.map(toLevelOption) : COMPILED_FALLBACK"),
    "the fallback must apply only when the server returned nothing",
  );
});

// ── Programme definition drives vocabulary ──────────────────────────────────

test("a theme-based definition renders Theme / Topic vocabulary", () => {
  const vocabulary = vocabularyFrom(
    {
      source: "compiled",
      lesson_noun: "teaching day",
      level_noun: "level",
      nodes: [
        { key: "theme", label: "Theme", depth: 0, is_required: true },
        { key: "topic", label: "Topic", depth: 1, is_required: false },
      ],
    },
    undefined,
  );
  assert.deepEqual(vocabulary.nodes.map((node) => node.label), ["Theme", "Topic"]);
  assert.equal(vocabulary.lessonNoun, "teaching day");
  assert.equal(vocabulary.levelNoun, "level");
  assert.equal(vocabulary.labelFor("theme"), "Theme");
  assert.equal(vocabulary.has("theme"), true);
  assert.equal(vocabulary.has("subject"), false);
});

test("a subject-based definition renders Subject / Unit / Lesson through the same code", () => {
  // The whole point of consuming the definition: no `if (primary)` branch. The
  // same call produces a completely different vocabulary.
  const vocabulary = vocabularyFrom(
    {
      source: "structure",
      lesson_noun: "lesson",
      level_noun: "grade",
      nodes: [
        { key: "subject", label: "Subject", depth: 0, is_required: true },
        { key: "unit", label: "Unit", depth: 1, is_required: true },
        { key: "lesson", label: "Lesson", depth: 2, is_required: true },
      ],
    },
    undefined,
  );
  assert.deepEqual(vocabulary.nodes.map((node) => node.label), ["Subject", "Unit", "Lesson"]);
  assert.equal(vocabulary.lessonNoun, "lesson");
  assert.equal(vocabulary.levelNoun, "grade");
  assert.equal(vocabulary.has("theme"), false, "a subject curriculum has no theme");
  assert.equal(vocabulary.source, "structure");
});

test("nodes are ordered by depth regardless of wire order", () => {
  const vocabulary = vocabularyFrom(
    {
      source: "structure",
      lesson_noun: "lesson",
      level_noun: "grade",
      nodes: [
        { key: "lesson", label: "Lesson", depth: 2, is_required: true },
        { key: "subject", label: "Subject", depth: 0, is_required: true },
        { key: "unit", label: "Unit", depth: 1, is_required: true },
      ],
    },
    undefined,
  );
  assert.deepEqual(vocabulary.nodes.map((node) => node.key), ["subject", "unit", "lesson"]);
});

test("school terminology overrides the definition's nouns and node labels", () => {
  // `resolve_terminology` already merged framework defaults under the school's
  // overrides server-side, so this is one lookup, not a second precedence rule.
  const vocabulary = vocabularyFrom(
    {
      source: "structure",
      lesson_noun: "lesson",
      level_noun: "grade",
      nodes: [
        { key: "subject", label: "Subject", depth: 0, is_required: true },
        { key: "unit", label: "Unit", depth: 1, is_required: true },
      ],
    },
    { subject: "Learning Area", level: "Year", lesson: "Period" },
  );
  assert.equal(vocabulary.labelFor("subject"), "Learning Area");
  assert.equal(vocabulary.levelNoun, "Year");
  assert.equal(vocabulary.lessonNoun, "Period");
  // Untouched nodes keep the definition's own label.
  assert.equal(vocabulary.labelFor("unit"), "Unit");
});

test("no definition yields the compiled vocabulary rather than an empty hierarchy", () => {
  // A school mid-onboarding has no programme and still has to render.
  const vocabulary = vocabularyFrom(undefined, undefined);
  assert.equal(vocabulary.source, "fallback");
  assert.ok(vocabulary.nodes.length > 0, "an empty hierarchy would make every check pass vacuously");
  assert.equal(vocabulary.has("theme"), true);
});

test("the definition query does not fire without a programme id", () => {
  const hook = source("lib/use-school-levels.ts");
  assert.ok(hook.includes("schoolAdminProgrammeDefinition"), "must read the definition endpoint");
  assert.ok(hook.includes("enabled: Boolean(programmeId)"), "must not fire with no programme");
});

// ── Level option mapping ────────────────────────────────────────────────────

test("server rows map to options and an empty response falls back", () => {
  const mapped = levelOptionsFrom([
    { code: "prep", name: "Prep", scope: "school", programme_id: "p1", supports_curriculum: false },
  ]);
  assert.equal(mapped.length, 1);
  assert.deepEqual(mapped[0], {
    value: "prep",
    label: "Prep",
    supportsCurriculum: false,
    scope: "school",
    programmeId: "p1",
  });
  assert.equal(levelOptionsFrom([]), COMPILED_FALLBACK);
  assert.equal(levelOptionsFrom(undefined), COMPILED_FALLBACK);
});

test("the label resolver uses the school's own name and tolerates archived codes", () => {
  const labelFor = levelLabelResolver([
    option({ value: "class_1", label: "Year 2", scope: "school" }),
  ]);
  assert.equal(labelFor("class_1"), "Year 2", "a school's relabelling must win");
  // A lesson may reference a level the school has since archived.
  assert.equal(labelFor("class_9"), "class_9");
});
