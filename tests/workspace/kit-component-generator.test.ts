import assert from "node:assert/strict";
import test from "node:test";

import { assembleKit } from "../../lib/teaching-kit.ts";
import { applyKitComponent, generateKitComponent, isKitComponentName, registerKitComponentGenerator, type KitComponentInput } from "../../lib/kit-component-generator.ts";
import type { PrimaryTeachingContext } from "../../lib/primary-teaching-context.tsx";

const CONTEXT = { class_level: "UKG", subject: "English", theme: "My Family", language: "English" };

function input(component: KitComponentInput["component"], overrides: Partial<KitComponentInput> = {}): KitComponentInput {
  return {
    component,
    context: CONTEXT,
    learning_objectives: ["Identify family members", "Name family members using key words"],
    current_component: {},
    constraints: { duration: 5, materials: ["board"], avoid_repetition: true },
    ...overrides,
  };
}

const kitContext: PrimaryTeachingContext = { level: "Class 1", subject: "EVS", theme: "Animals", language: "English" };

test("every supported component returns a well-formed output", async () => {
  for (const component of ["warm_up", "classroom_activity", "homework", "parent_update", "assessment_instructions"] as const) {
    const output = await generateKitComponent(input(component));
    assert.equal(output.component, component);
    assert.ok(isKitComponentName(output.component));
  }
});

test("warm-up output carries instructions, duration and the theme", async () => {
  const output = await generateKitComponent(input("warm_up"));
  assert.equal(output.component, "warm_up");
  assert.ok(output.value.instructions.length >= 3);
  assert.equal(output.value.duration, 5);
  assert.ok(output.value.title.toLowerCase().includes("my family"));
  assert.ok(output.value.instructions.join(" ").toLowerCase().includes("my family"));
});

test("classroom activity honours the constraints duration", async () => {
  const output = await generateKitComponent(input("classroom_activity", { constraints: { duration: 12, materials: ["chart", "glue"], avoid_repetition: true } }));
  assert.ok(output.component === "classroom_activity");
  assert.equal(output.value.duration, 12);
  assert.ok(output.value.instructions.length >= 3);
});

test("homework and parent update return themed text", async () => {
  const homework = await generateKitComponent(input("homework"));
  assert.ok(homework.component === "homework");
  assert.ok(homework.value.text.includes("My Family"));

  const parentUpdate = await generateKitComponent(input("parent_update"));
  assert.ok(parentUpdate.component === "parent_update");
  assert.ok(parentUpdate.value.text.includes("UKG"));
  assert.ok(parentUpdate.value.text.toLowerCase().includes("my family"));
  assert.ok(parentUpdate.value.text.toLowerCase().includes("identify family members"));
});

test("assessment instructions return title, questions and criteria", async () => {
  const output = await generateKitComponent(input("assessment_instructions"));
  assert.ok(output.component === "assessment_instructions");
  assert.ok(output.value.questions.length >= 3);
  assert.ok(output.value.successCriteria.length >= 3);
  assert.ok(output.value.title.toLowerCase().includes("my family"));
});

test("regenerating never returns exactly the same content twice", async () => {
  const first = await generateKitComponent(input("warm_up", { current_component: { title: "Original warm-up", instructions: ["old"], duration: 5 } }));
  const second = await generateKitComponent(input("warm_up", { current_component: first.value }));
  if (first.component !== "warm_up" || second.component !== "warm_up") throw new Error("expected warm_up");
  assert.notDeepEqual(second.value, first.value);
  assert.notDeepEqual(second.value.title, first.value.title);

  const homeworkOne = await generateKitComponent(input("homework", { current_component: "Original homework text" }));
  if (homeworkOne.component !== "homework") throw new Error("expected homework");
  const homeworkTwo = await generateKitComponent(input("homework", { current_component: homeworkOne.value.text }));
  if (homeworkTwo.component !== "homework") throw new Error("expected homework");
  assert.notEqual(homeworkTwo.value.text, homeworkOne.value.text);
});

test("applyKitComponent replaces only the warm-up step", async () => {
  const kit = assembleKit(kitContext);
  const output = await generateKitComponent(input("warm_up"));
  const next = applyKitComponent(kit.content, output);

  const warmUp = next.sequence.find((item) => item.type === "warm_up");
  assert.deepEqual({ title: warmUp?.title, instructions: warmUp?.instructions, duration: warmUp?.duration }, output.value);

  for (const item of next.sequence) {
    if (item.type === "warm_up") continue;
    assert.deepEqual(item, kit.content.sequence.find((entry) => entry.id === item.id));
  }
  assert.deepEqual(next.resources, kit.content.resources, "resources must be untouched");
  assert.deepEqual(next.learningObjectives, kit.content.learningObjectives);
  assert.equal(next.homework, kit.content.homework);
  assert.equal(next.parentUpdate, kit.content.parentUpdate);
});

test("applyKitComponent replaces only the classroom activity step", async () => {
  const kit = assembleKit(kitContext);
  const output = await generateKitComponent(input("classroom_activity"));
  const next = applyKitComponent(kit.content, output);

  const activity = next.sequence.find((item) => item.type === "classroom_activity");
  assert.deepEqual({ title: activity?.title, instructions: activity?.instructions, duration: activity?.duration }, output.value);
  assert.deepEqual(next.sequence.filter((item) => item.type !== "classroom_activity"), kit.content.sequence.filter((item) => item.type !== "classroom_activity"));
});

test("regenerating homework alters nothing but the homework text", async () => {
  const kit = assembleKit(kitContext);
  const warmUpBefore = kit.content.sequence.find((item) => item.type === "warm_up");
  const resourcesBefore = kit.content.resources;

  const output = await generateKitComponent(input("homework"));
  if (output.component !== "homework") throw new Error("expected homework");
  const next = applyKitComponent(kit.content, output);

  assert.equal(next.homework, output.value.text);
  assert.notEqual(next.homework, kit.content.homework);
  assert.equal(next.parentUpdate, kit.content.parentUpdate);
  assert.deepEqual(next.sequence, kit.content.sequence);
  assert.deepEqual(next.sequence.find((item) => item.type === "warm_up"), warmUpBefore);
  assert.deepEqual(next.resources, resourcesBefore);
  assert.deepEqual(next.assessment, kit.content.assessment);
});

test("regenerating the parent update alters only the parent update", async () => {
  const kit = assembleKit(kitContext);
  const output = await generateKitComponent(input("parent_update"));
  if (output.component !== "parent_update") throw new Error("expected parent_update");
  const next = applyKitComponent(kit.content, output);
  assert.equal(next.parentUpdate, output.value.text);
  assert.equal(next.homework, kit.content.homework);
  assert.deepEqual(next.sequence, kit.content.sequence);
  assert.deepEqual(next.resources, kit.content.resources);
});

test("regenerating assessment instructions replaces the assessment block only", async () => {
  const kit = assembleKit(kitContext);
  const output = await generateKitComponent(input("assessment_instructions"));
  if (output.component !== "assessment_instructions") throw new Error("expected assessment_instructions");
  const next = applyKitComponent(kit.content, output);
  assert.equal(next.assessment.title, output.value.title);
  assert.deepEqual(next.assessment.questions, output.value.questions);
  assert.deepEqual(next.assessment.successCriteria, output.value.successCriteria);
  assert.equal(next.homework, kit.content.homework);
  assert.deepEqual(next.sequence, kit.content.sequence);
  assert.deepEqual(next.resources, kit.content.resources);
});

test("a registered generator replaces the template implementation", async () => {
  const unregister = registerKitComponentGenerator(async () => ({ component: "homework", value: { text: "AI-generated homework" } }));
  try {
    const output = await generateKitComponent(input("homework"));
    assert.deepEqual(output, { component: "homework", value: { text: "AI-generated homework" } });
  } finally {
    unregister();
  }
  const restored = await generateKitComponent(input("homework"));
  assert.ok(restored.component === "homework");
  assert.notDeepEqual(restored.value, { text: "AI-generated homework" });
});
