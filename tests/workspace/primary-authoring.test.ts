import assert from "node:assert/strict";
import test from "node:test";

import {
  RESOURCE_CATEGORIES,
  moveStep,
  renumberSteps,
} from "../../lib/primary-authoring.ts";

const step = (position: number, title: string) => ({
  position,
  step_type: "warm_up" as const,
  title,
  instructions: [] as string[],
  duration_minutes: 5,
  objective_indexes: [] as number[],
  resource_category: null,
});

test("RESOURCE_CATEGORIES offers exactly the ten that exist in the catalog", () => {
  // A category outside this list matches zero printables, and the teacher gets
  // a step with nothing attached and no explanation.
  assert.deepEqual([...RESOURCE_CATEGORIES].sort(), [
    "Calendar Activities", "Circle Time Prompts", "Colouring Pages",
    "Flashcards", "Matching Activities", "Picture Talk Cards",
    "Story Cards", "Tracing Sheets", "Vocabulary Cards", "Worksheets",
  ]);
});

test("renumberSteps makes positions contiguous from zero", () => {
  // The server rejects a gap; deleting a middle step must not produce one.
  const out = renumberSteps([step(0, "A"), step(4, "B"), step(9, "C")]);
  assert.deepEqual(out.map((s) => s.position), [0, 1, 2]);
});

test("renumberSteps preserves order", () => {
  const out = renumberSteps([step(0, "A"), step(4, "B")]);
  assert.deepEqual(out.map((s) => s.title), ["A", "B"]);
});

test("moveStep moves a step down and renumbers", () => {
  const out = moveStep([step(0, "A"), step(1, "B"), step(2, "C")], 0, 2);
  assert.deepEqual(out.map((s) => s.title), ["B", "C", "A"]);
  assert.deepEqual(out.map((s) => s.position), [0, 1, 2]);
});

test("moveStep moves a step up and renumbers", () => {
  const out = moveStep([step(0, "A"), step(1, "B"), step(2, "C")], 2, 0);
  assert.deepEqual(out.map((s) => s.title), ["C", "A", "B"]);
  assert.deepEqual(out.map((s) => s.position), [0, 1, 2]);
});

test("moveStep is a no-op when the indexes match", () => {
  const out = moveStep([step(0, "A"), step(1, "B")], 1, 1);
  assert.deepEqual(out.map((s) => s.title), ["A", "B"]);
});

test("moveStep ignores an out-of-range index instead of dropping a step", () => {
  const out = moveStep([step(0, "A"), step(1, "B")], 0, 9);
  assert.equal(out.length, 2);
});
