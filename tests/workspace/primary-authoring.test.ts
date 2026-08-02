import assert from "node:assert/strict";
import test from "node:test";

import {
  RESOURCE_CATEGORIES,
  moveStep,
  renumberSteps,
  validateSteps,
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

// Post-review addition: the backend's StepInput requires title (min_length=1)
// and duration_minutes (ge=1, le=120) — a violation 422s the *entire* steps
// array on save, not just the offending row, so this must be caught
// client-side before the network call, and it must name which step failed.
test("validateSteps flags a blank title", () => {
  const errors = validateSteps([step(0, "")]);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].field, "title");
  assert.equal(errors[0].index, 0);
});

test("validateSteps flags a whitespace-only title the same as blank", () => {
  const errors = validateSteps([step(0, "   ")]);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].field, "title");
});

test("validateSteps flags a title over 255 characters", () => {
  const errors = validateSteps([step(0, "x".repeat(256))]);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].field, "title");
});

test("validateSteps accepts a title at exactly the 255 character limit", () => {
  const errors = validateSteps([step(0, "x".repeat(255))]);
  assert.equal(errors.length, 0);
});

test("validateSteps flags duration_minutes of 0 — the value an emptied number input produces", () => {
  const withZeroDuration = { ...step(0, "Warm-up"), duration_minutes: 0 };
  const errors = validateSteps([withZeroDuration]);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].field, "duration_minutes");
});

test("validateSteps flags duration_minutes over 120", () => {
  const tooLong = { ...step(0, "Warm-up"), duration_minutes: 121 };
  const errors = validateSteps([tooLong]);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].field, "duration_minutes");
});

test("validateSteps accepts duration_minutes at the 1 and 120 boundaries", () => {
  const atMin = { ...step(0, "Warm-up"), duration_minutes: 1 };
  const atMax = { ...step(1, "Wrap-up"), duration_minutes: 120 };
  assert.deepEqual(validateSteps([atMin, atMax]), []);
});

test("validateSteps reports both fields on the same step independently", () => {
  const broken = { ...step(0, ""), duration_minutes: 0 };
  const errors = validateSteps([broken]);
  assert.equal(errors.length, 2);
  assert.deepEqual(errors.map((e) => e.field).sort(), ["duration_minutes", "title"]);
});

test("validateSteps returns no errors for a clean, valid step list", () => {
  const errors = validateSteps([step(0, "Warm-up"), step(1, "Story time")]);
  assert.deepEqual(errors, []);
});
