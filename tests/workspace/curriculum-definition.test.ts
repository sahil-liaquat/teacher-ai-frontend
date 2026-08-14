import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  PRIMARY_CURRICULUM,
  activeCurriculum,
  curriculumLevelLabel,
} from "../../lib/curriculum-definition.ts";
import { TEACHER_LEVELS, teacherLevelLabel, levelRank } from "../../lib/school-admin-teachers.ts";

/**
 * The frontend half of the curriculum-definition boundary.
 *
 * Primary is one curriculum TeachPad supports, not the shape every future
 * curriculum must take. These tests hold two things: Primary's vocabulary is
 * unchanged, and the genuinely shared pieces stay curriculum-agnostic.
 */

function source(relativePath: string) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

// ── Primary is unchanged ────────────────────────────────────────────────────

test("the eight Primary levels and their labels are unchanged", () => {
  assert.deepEqual(
    PRIMARY_CURRICULUM.levels.map((level) => level.value),
    ["nursery", "lkg", "ukg", "class_1", "class_2", "class_3", "class_4", "class_5"],
  );
  assert.equal(curriculumLevelLabel("lkg"), "LKG");
  assert.equal(curriculumLevelLabel("class_3"), "Class 3");
  assert.equal(curriculumLevelLabel("nursery"), "Nursery");
});

test("an unknown level falls back to its raw value rather than blanking", () => {
  assert.equal(curriculumLevelLabel("grade_9"), "grade_9");
});

test("the teacher level list now derives from the definition", () => {
  // It used to be a hand-copied duplicate carrying a comment asking the next
  // reader to keep it in sync with the backend by hand.
  assert.deepEqual(TEACHER_LEVELS, PRIMARY_CURRICULUM.levels);
});

test("teacher level labels and ordering are unchanged", () => {
  assert.equal(teacherLevelLabel("ukg"), "UKG");
  assert.equal(teacherLevelLabel("class_5"), "Class 5");
  // Order is load-bearing: "class_10" must never sort between 1 and 2.
  assert.ok(levelRank("nursery") < levelRank("class_1"));
  assert.ok(levelRank("class_1") < levelRank("class_5"));
});

test("one curriculum is active, and it is resolved rather than assumed", () => {
  assert.equal(activeCurriculum().key, "primary");
});

// ── Content is not scheduling ───────────────────────────────────────────────

test("hierarchy and placement are separate lists", () => {
  // Primary leans on month/week/day so heavily it reads like curriculum
  // structure. It is placement. A Secondary curriculum keeps the same content
  // tree idea and schedules into term/week/day/period instead.
  assert.deepEqual(PRIMARY_CURRICULUM.hierarchy, ["theme", "topic", "lesson"]);
  assert.deepEqual(PRIMARY_CURRICULUM.placement, ["month", "week", "day"]);

  for (const node of PRIMARY_CURRICULUM.hierarchy) {
    assert.ok(
      !PRIMARY_CURRICULUM.placement.includes(node),
      `${node} appears in both hierarchy and placement — the distinction has collapsed`,
    );
  }
});

// ── The shared adapter stays about SCOPE, not curriculum ───────────────────

test("the scope adapter carries no curriculum vocabulary", () => {
  // `curriculum-admin-adapter.ts` chooses between the platform (master) and
  // school API doors. Scope and curriculum type are independent dimensions:
  // the same Primary definition serves both. If Primary levels, months or
  // themes leaked in here, adding a second curriculum would mean forking it.
  const adapter = source("lib/curriculum-admin-adapter.ts");
  for (const primaryism of ["nursery", "lkg", "ukg", "month", "theme_id", "PRIMARY_LEVELS"]) {
    assert.ok(
      !adapter.includes(primaryism),
      `the shared scope adapter mentions ${primaryism}`,
    );
  }
});

test("the adapter still offers both ownership doors", () => {
  const adapter = source("lib/curriculum-admin-adapter.ts");
  assert.match(adapter, /"school" \| "platform"/);
  assert.match(adapter, /master-curriculum/);
  assert.match(adapter, /school-admin/);
});

// ── No speculative curriculum UI ────────────────────────────────────────────

test("no curriculum-type selector was added to the UI", () => {
  // There is exactly one curriculum in production. The boundary exists so a
  // second arrives as a definition, not so the UI can offer curricula that do
  // not exist.
  const definition = source("lib/curriculum-definition.ts");
  assert.ok(!definition.includes("secondary"), "Secondary must not be exposed to the frontend");
  assert.ok(!definition.includes("vocational"));
});

test("the definition module holds metadata, not API calls", () => {
  const definition = source("lib/curriculum-definition.ts");
  assert.ok(!definition.includes("backendApi"), "a definition must not call the API");
  assert.ok(!definition.includes("apiFetch"));
});
