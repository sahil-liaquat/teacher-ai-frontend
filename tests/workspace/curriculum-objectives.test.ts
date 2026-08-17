import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  addObjective,
  blankObjectives,
  objectiveCoverage,
  objectivesForStep,
  objectivesOf,
  removeObjective,
  stepTeaches,
  toggleStepObjective,
  uncoveredObjectives,
  updateObjective,
} from "../../lib/curriculum-objectives.ts";

/**
 * Phase 5 — objectives behind an abstraction.
 *
 * An objective is a plain string and a block claims one by its POSITION in the
 * array. There is no objective entity, no id and no reuse — a real backend gap,
 * and one the authoring UI must not be blocked on. So the UI talks to
 * objectives through this module, and the positional hazard is tested here
 * rather than living inline in a 900-line component.
 */

const ROOT = new URL("../../", import.meta.url);

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, ROOT), "utf8");
}

function step(indexes: number[]) {
  return { objective_indexes: indexes };
}

// ── The dangerous one: removal reindexes every reference ────────────────────

test("removing an objective shifts every higher reference down", () => {
  // The defect this prevents: block B claimed objective #2. Remove #1 without
  // reindexing and B now silently teaches what used to be #3 — no error, no
  // symptom, until someone reads the published day.
  const result = removeObjective(
    {
      objectives: ["count to ten", "name shapes", "sort by colour"],
      steps: [step([0]), step([1]), step([2]), step([1, 2])],
    },
    1,
  );

  assert.deepEqual(result.objectives, ["count to ten", "sort by colour"]);
  assert.deepEqual(result.steps[0].objective_indexes, [0], "below the hole, unchanged");
  assert.deepEqual(result.steps[1].objective_indexes, [], "the removed one is dropped");
  assert.deepEqual(result.steps[2].objective_indexes, [1], "above the hole, shifted down");
  assert.deepEqual(result.steps[3].objective_indexes, [1], "mixed: dropped and shifted");
});

test("removing the first objective still shifts everything", () => {
  const result = removeObjective(
    { objectives: ["a", "b", "c"], steps: [step([0, 1, 2])] },
    0,
  );
  assert.deepEqual(result.objectives, ["b", "c"]);
  assert.deepEqual(result.steps[0].objective_indexes, [0, 1]);
});

test("removing the last objective shifts nothing", () => {
  const result = removeObjective(
    { objectives: ["a", "b"], steps: [step([0, 1])] },
    1,
  );
  assert.deepEqual(result.objectives, ["a"]);
  assert.deepEqual(result.steps[0].objective_indexes, [0]);
});

test("removal tolerates blocks with no objective list at all", () => {
  const result = removeObjective(
    { objectives: ["a"], steps: [{ objective_indexes: null }, {}] },
    0,
  );
  assert.deepEqual(result.steps[0].objective_indexes, []);
  assert.deepEqual(result.steps[1].objective_indexes, []);
});

test("removal never mutates its inputs", () => {
  const objectives = ["a", "b"];
  const steps = [step([1])];
  removeObjective({ objectives, steps }, 0);
  assert.deepEqual(objectives, ["a", "b"], "input objectives must be untouched");
  assert.deepEqual(steps[0].objective_indexes, [1], "input steps must be untouched");
});

// ── Identity ────────────────────────────────────────────────────────────────

test("objectives carry a key that is not their array index", () => {
  // Index keys made React reuse the wrong input's DOM node when a row was
  // removed from the middle, so a half-typed objective appeared to jump rows.
  const [first, second] = objectivesOf(["count to ten", "name shapes"]);
  assert.notEqual(first.key, "0");
  assert.notEqual(first.key, second.key);
  assert.equal(first.index, 0);
  assert.equal(second.text, "name shapes");
});

test("two objectives with the same text still get distinct keys", () => {
  const [first, second] = objectivesOf(["same", "same"]);
  assert.notEqual(first.key, second.key);
});

test("objectivesOf tolerates a missing list", () => {
  assert.deepEqual(objectivesOf(undefined), []);
  assert.deepEqual(objectivesOf(null), []);
});

// ── Editing ─────────────────────────────────────────────────────────────────

test("adding and updating leave other rows alone", () => {
  assert.deepEqual(addObjective(["a"]), ["a", ""]);
  assert.deepEqual(updateObjective(["a", "b"], 1, "changed"), ["a", "changed"]);
  assert.deepEqual(updateObjective(["a"], 5, "ignored"), ["a"], "an out-of-range index is a no-op");
});

test("blank objectives are identifiable, because the server drops them", () => {
  assert.deepEqual(blankObjectives(["a", "", "  ", "b"]), [1, 2]);
});

// ── Block linkage ───────────────────────────────────────────────────────────

test("toggling a block's objective keeps the list sorted and unique", () => {
  assert.deepEqual(toggleStepObjective(step([2, 0]), 1, true), [0, 1, 2]);
  assert.deepEqual(toggleStepObjective(step([0, 1]), 1, false), [0]);
  assert.deepEqual(toggleStepObjective(step([0]), 0, true), [0], "already on stays on");
  assert.deepEqual(toggleStepObjective(step([0]), 9, false), [0], "removing an absent one is a no-op");
});

test("stepTeaches and objectivesForStep resolve through position", () => {
  const objectives = ["count to ten", "name shapes", "sort by colour"];
  const block = step([0, 2]);
  assert.equal(stepTeaches(block, 0), true);
  assert.equal(stepTeaches(block, 1), false);
  assert.deepEqual(
    objectivesForStep(block, objectives).map((objective) => objective.text),
    ["count to ten", "sort by colour"],
  );
});

// ── Coverage, which is advisory and must stay that way ──────────────────────

test("uncovered objectives are those no block claims", () => {
  const uncovered = uncoveredObjectives(["a", "b", "c"], [step([0]), step([2])]);
  assert.deepEqual(uncovered.map((objective) => objective.text), ["b"]);
});

test("an empty objective is not counted as uncovered", () => {
  // An author mid-typing must not make the figure drop the moment they click
  // "add objective".
  assert.deepEqual(uncoveredObjectives(["a", "  "], [step([0])]), []);
  assert.deepEqual(objectiveCoverage(["a", ""], [step([0])]), { total: 1, covered: 1, percent: 100 });
});

test("coverage of a day with no objectives is zero, not NaN", () => {
  assert.deepEqual(objectiveCoverage([], []), { total: 0, covered: 0, percent: 0 });
});

test("coverage counts partial delivery honestly", () => {
  assert.deepEqual(
    objectiveCoverage(["a", "b", "c", "d"], [step([0, 1])]),
    { total: 4, covered: 2, percent: 50 },
  );
});

// ── The boundary this module defends ────────────────────────────────────────

test("coverage is never treated as a readiness rule", () => {
  // Readiness is the server's single verdict. An uncovered objective can be
  // perfectly intentional, and turning it into a publish gate would recreate
  // the exact client/server split `curriculum-readiness.ts` removed.
  const module = source("lib/curriculum-objectives.ts");
  assert.ok(
    !/readiness|isPublishable|blocksPublish/i.test(module.replace(/\/\*[\s\S]*?\*\//g, "")),
    "the objectives module must not reach into readiness",
  );

  const editor = source("components/school-admin/day-editor/school-day-editor.tsx");
  assert.ok(
    !/isPublishable\([\s\S]{0,80}coverage/.test(editor),
    "objective coverage must not gate publishing",
  );
});

test("the day editor no longer reindexes objectives inline", () => {
  const editor = source("components/school-admin/day-editor/school-day-editor.tsx");
  assert.ok(editor.includes("removeObjective({ objectives, steps }"), "removal must go through the module");
  assert.ok(
    !/value > index \? value - 1 : value/.test(editor),
    "the reindex rule must live in the tested module, not in the component",
  );
  assert.ok(editor.includes("toggleStepObjective("), "block linkage must go through the module");
  assert.ok(editor.includes("objectivesOf("), "rendering must go through the module");
});

test("the editor keys objective rows on identity, not array position", () => {
  const editor = source("components/school-admin/day-editor/school-day-editor.tsx");
  assert.ok(editor.includes("key={objective.key}"), "rows must key on the objective's own key");
});
