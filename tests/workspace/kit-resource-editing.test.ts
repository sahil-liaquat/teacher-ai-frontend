import assert from "node:assert/strict";
import test from "node:test";

import { PRIMARY_RESOURCES, type PrimaryResource } from "../../lib/primary-resource-catalog.ts";
import { MIN_RESOURCE_SCORE, assembleKit, componentForResource, flatResourcesFromContent, removeKitResourceAttachment, replaceKitResource, resourceAlternatives, scoreResource } from "../../lib/teaching-kit.ts";
import type { PrimaryTeachingContext } from "../../lib/primary-teaching-context.tsx";

const ctx: PrimaryTeachingContext = { level: "Class 1", subject: "EVS", theme: "Animals", language: "English" };

function kitContext(overrides: Partial<PrimaryTeachingContext> = {}): PrimaryTeachingContext {
  return { ...ctx, ...overrides };
}

test("componentForResource derives the component from the resource id", () => {
  assert.equal(componentForResource("worksheet-2"), "worksheet");
  assert.equal(componentForResource("warm-up-0"), "warm-up");
  assert.equal(componentForResource("classroom-activity-4"), "classroom-activity");
  assert.equal(componentForResource("flashcards-1"), "flashcards");
  assert.equal(componentForResource("something-else"), "flashcards");
});

test("replaceKitResource swaps the file but keeps id, links and the rest of the kit", () => {
  const kit = assembleKit(kitContext());
  const target = kit.content.resources.find((item) => item.fileUrl);
  assert.ok(target);
  const used = kit.content.resources.map((item) => item.fileUrl).filter((url): url is string => Boolean(url));
  const replacement = PRIMARY_RESOURCES.find((resource) => resource.fileUrl && !used.includes(resource.fileUrl));
  assert.ok(replacement);

  const next = replaceKitResource(kit.content, target.id, replacement);

  const replaced = next.resources.find((item) => item.id === target.id);
  assert.ok(replaced);
  assert.equal(replaced.fileUrl, replacement.fileUrl);
  assert.equal(replaced.title, replacement.title);
  assert.equal(replaced.category, replacement.category);
  assert.equal(replaced.thumbnailUrl, replacement.thumbnailUrl);
  assert.equal(replaced.fileType, replacement.fileType);
  assert.equal(replaced.instruction, undefined);
  assert.deepEqual(replaced.usedFor, target.usedFor);

  assert.equal(next.resources.length, kit.content.resources.length);
  assert.deepEqual(next.sequence, kit.content.sequence, "sequence must not be regenerated");
  assert.deepEqual(next.learningObjectives, kit.content.learningObjectives);
  assert.equal(next.homework, kit.content.homework);

  const fileUrls = next.resources.map((item) => item.fileUrl).filter((url): url is string => Boolean(url));
  assert.equal(new Set(fileUrls).size, fileUrls.length, "no duplicate files after replacement");

  const untouched = kit.content.resources.filter((item) => item.id !== target.id).map((item) => item.id);
  for (const id of untouched) {
    assert.deepEqual(next.resources.find((item) => item.id === id), kit.content.resources.find((item) => item.id === id));
  }
});

test("replaceKitResource clears a prior instructional fallback", () => {
  const kit = assembleKit(kitContext({ level: "Class 5" }));
  const target = kit.content.resources.find((item) => item.instruction);
  assert.ok(target);
  const replacement = PRIMARY_RESOURCES[0];
  const next = replaceKitResource(kit.content, target.id, replacement);
  const replaced = next.resources.find((item) => item.id === target.id);
  assert.ok(replaced);
  assert.equal(replaced.fileUrl, replacement.fileUrl);
  assert.equal(replaced.instruction, undefined);
});

test("removeKitResourceAttachment detaches the file but keeps the instructional component", () => {
  const kit = assembleKit(kitContext());
  const target = kit.content.resources.find((item) => item.fileUrl);
  assert.ok(target);

  const next = removeKitResourceAttachment(kit.content, target.id, "Animals");
  const removed = next.resources.find((item) => item.id === target.id);
  assert.ok(removed);
  assert.equal(removed.fileUrl, undefined);
  assert.equal(removed.thumbnailUrl, undefined);
  assert.equal(removed.fileType, undefined);
  assert.equal(removed.category, undefined);
  assert.ok(removed.instruction?.length, "instructional idea must remain");
  assert.equal(removed.id, target.id);
  assert.deepEqual(removed.usedFor, target.usedFor);

  assert.equal(next.resources.length, kit.content.resources.length);
  assert.deepEqual(next.sequence, kit.content.sequence, "sequence must not be regenerated");
});

test("flatResourcesFromContent lists only printables with derived components", () => {
  const kit = assembleKit(kitContext());
  const flat = flatResourcesFromContent(kit.content);
  assert.equal(flat.length, kit.content.resources.filter((item) => item.fileUrl).length);
  for (const entry of flat) {
    assert.ok(entry.fileUrl);
    assert.equal(entry.component, componentForResource(entry.id));
    assert.equal(entry.title, kit.content.resources.find((item) => item.id === entry.id)?.title);
  }
});

test("resourceAlternatives excludes the current file and every file already in the kit", () => {
  const kit = assembleKit(kitContext());
  const used = kit.content.resources.map((item) => item.fileUrl).filter((url): url is string => Boolean(url));
  for (const item of kit.content.resources) {
    if (!item.fileUrl) continue;
    const component = componentForResource(item.id);
    const alts = resourceAlternatives(ctx, component, used, item.fileUrl);
    assert.ok(alts.length <= 5, `${item.id}: at most five alternatives`);
    assert.ok(alts.length >= 1, `${item.id}: alternatives available`);
    assert.ok(!alts.some((alt) => alt.fileUrl === item.fileUrl), `${item.id}: current file excluded`);
    for (const alt of alts) {
      assert.ok(!used.includes(alt.fileUrl), `${item.id}: already-used files excluded`);
      assert.ok(alt.levels.includes(ctx.level), `${item.id}: alternative fits the class`);
      assert.ok(scoreResource(alt, component, ctx, ["animal", "cow", "farm"]) >= MIN_RESOURCE_SCORE, `${item.id}: alternative clears the quality bar`);
    }
    const scores = alts.map((alt) => scoreResource(alt, component, ctx, ["animal", "cow", "farm"]));
    assert.deepEqual(scores, [...scores].sort((a, b) => b - a), `${item.id}: ranked by score`);
  }
});

test("adding a printable back after removal uses the same picker rules", () => {
  const kit = assembleKit(kitContext());
  const target = kit.content.resources.find((item) => item.fileUrl);
  assert.ok(target);
  const detached = removeKitResourceAttachment(kit.content, target.id, "Animals");
  const instructional = detached.resources.find((item) => item.id === target.id);
  assert.ok(instructional?.instruction);

  const used = detached.resources.map((item) => item.fileUrl).filter((url): url is string => Boolean(url));
  const alts = resourceAlternatives(ctx, componentForResource(target.id), used);
  assert.ok(alts.length >= 1);
  const restored = replaceKitResource(detached, target.id, alts[0]);
  const back = restored.resources.find((item) => item.id === target.id);
  assert.ok(back?.fileUrl);
  assert.equal(back.instruction, undefined);
  assert.ok(!used.includes(back.fileUrl), "restored file is not duplicated elsewhere");
  assert.deepEqual(restored.sequence, kit.content.sequence);
});
