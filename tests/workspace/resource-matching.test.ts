import assert from "node:assert/strict";
import test from "node:test";

import type { PrimaryResource } from "../../lib/primary-resource-catalog.ts";
import { themeContent } from "../../lib/primary-theme-content.ts";
import { MIN_RESOURCE_SCORE, assembleKit, matchResources, scoreResource } from "../../lib/teaching-kit.ts";
import type { PrimaryTeachingContext } from "../../lib/primary-teaching-context.tsx";

function context(overrides: Partial<PrimaryTeachingContext> = {}): PrimaryTeachingContext {
  return {
    level: "Class 1",
    subject: "EVS",
    theme: "Animals",
    language: "English",
    ...overrides,
  };
}

let counter = 0;
function resource(overrides: Partial<PrimaryResource> = {}): PrimaryResource {
  counter += 1;
  return {
    id: `res-${counter}`,
    title: "Animal Flashcards",
    category: "Flashcards",
    subjects: ["EVS"],
    levels: ["Nursery", "LKG", "UKG", "Class 1", "Class 2"],
    themes: ["Animals"],
    keywords: ["animals", "farm"],
    languages: ["English"],
    skills: ["Vocabulary", "Visual Recognition"],
    difficulty: "intermediate",
    fileUrl: `/primary-resources/test-${counter}.png`,
    fileType: "png",
    ...overrides,
  };
}

const ANIMAL_KEYWORDS = ["animal", "cow", "lion"];

test("scoreResource applies the documented weights", () => {
  const ctx = context();
  const score = scoreResource(resource(), "flashcards", ctx, ANIMAL_KEYWORDS);
  // theme 40 + subject 25 + level 20 + category 15 + keyword 10 + language 10 + skill 10
  assert.equal(score, 130);
});

test("scoreResource penalises an out-of-band level with −40", () => {
  const ctx = context({ level: "Class 5" });
  const entry = resource({ levels: ["Nursery", "LKG", "UKG", "Class 1", "Class 2"] });
  // 40 + 25 + 15 + 10 + 10 + 10 − 40
  assert.equal(scoreResource(entry, "flashcards", ctx, ANIMAL_KEYWORDS), 70);
});

test("scoreResource penalises an already-selected file with −30", () => {
  const ctx = context();
  const entry = resource();
  assert.equal(scoreResource(entry, "flashcards", ctx, ANIMAL_KEYWORDS, [entry.fileUrl]), 100);
});

test("language preference boosts the matching resource by +10", () => {
  const hindi = resource({ id: "hindi-1", title: "जानवर Flashcards", languages: ["Hindi"] });
  const english = resource({ id: "english-1", title: "Animal Flashcards", languages: ["English"] });

  const hindiCtx = context({ language: "Hindi" });
  assert.equal(scoreResource(hindi, "flashcards", hindiCtx, ANIMAL_KEYWORDS), 130);
  assert.equal(scoreResource(english, "flashcards", hindiCtx, ANIMAL_KEYWORDS), 120);

  const bilingualCtx = context({ language: "Bilingual" });
  assert.equal(scoreResource(hindi, "flashcards", bilingualCtx, ANIMAL_KEYWORDS), 130);
});

test("weak category-only matches are below the minimum and not recommended", () => {
  const ctx = context({ subject: "Maths", theme: "Colours" });
  const weak = resource({
    id: "weak-1",
    title: "Rainbow Painting",
    category: "Worksheets",
    subjects: ["Art & Craft"],
    levels: ["Class 1", "Class 2", "Class 3"],
    themes: [],
    keywords: ["canvass", "palette"],
    skills: ["Visual Discrimination"],
  });
  // level 20 + category 15 + language 10 = 45 < 55
  assert.ok(scoreResource(weak, "worksheet", ctx, ["lion"]) < MIN_RESOURCE_SCORE);
  const matched = matchResources(ctx, "worksheet", 100);
  assert.ok(!matched.some((entry) => entry.id === weak.id), "weak match must not be recommended");
  for (const entry of matched) {
    assert.ok(scoreResource(entry, "worksheet", ctx, themeContent(ctx.theme, ctx.subject).keywords) >= MIN_RESOURCE_SCORE);
  }
});

test("exact theme match outranks a keyword-only match by the theme weight", () => {
  const ctx = context();
  const themed = resource({ id: "themed-1", title: "Animal Flashcards", themes: ["Animals"] });
  const keywordOnly = resource({
    id: "keyword-1",
    title: "Cow Zoo Cards",
    themes: ["My School"],
    keywords: ["cow", "zoo"],
    subjects: ["EVS"],
    skills: ["Vocabulary"],
  });
  const themedScore = scoreResource(themed, "flashcards", ctx, ANIMAL_KEYWORDS);
  const keywordScore = scoreResource(keywordOnly, "flashcards", ctx, ANIMAL_KEYWORDS);
  assert.equal(themedScore - keywordScore, 40);
});

test("matchResources hard-gates resources whose band excludes the class", () => {
  const ctx = context({ level: "Class 5", theme: "Animals" });
  const nurseryResource = resource({
    id: "nursery-only",
    title: "Tracing Animals",
    category: "Tracing Sheets",
    levels: ["Nursery", "LKG", "UKG"],
  });
  // theme 40 + subject 25 + category 15 + keyword 10 + language 10 − level mismatch 40
  assert.equal(scoreResource(nurseryResource, "homework", ctx, ANIMAL_KEYWORDS), 60);
  assert.deepEqual(matchResources(ctx, "homework", 10).map((entry) => entry.id), []);

  const young = context({ level: "Nursery" });
  const older = resource({
    id: "older-only",
    title: "Animal Worksheets",
    category: "Worksheets",
    levels: ["Class 1", "Class 2", "Class 3"],
  });
  assert.ok(!matchResources(young, "worksheet", 10).some((entry) => entry.id === older.id));
});

test("no class 5 kit is ever handed a Nursery-level printable", () => {
  const kit = assembleKit(context({ level: "Class 5", theme: "Animals" }));
  for (const item of kit.content.resources) {
    assert.equal(item.fileUrl, undefined);
    assert.ok(item.instruction?.length);
  }
  assert.equal(kit.resources.length, 0);
  assert.equal(kit.content.resources.length, 7);
  for (const step of kit.content.sequence) {
    assert.equal(step.resourceIds.length, 1);
  }
});

test("assembleKit never repeats a file and keeps every step linked", () => {
  const kit = assembleKit(context());
  const printables = kit.content.resources.filter((item) => item.fileUrl);
  assert.ok(printables.length >= 1);
  const fileUrls = printables.map((item) => item.fileUrl);
  assert.equal(new Set(fileUrls).size, fileUrls.length);

  const byId = new Map(kit.content.resources.map((item) => [item.id, item]));
  for (const step of kit.content.sequence) {
    for (const resourceId of step.resourceIds) {
      const linked = byId.get(resourceId);
      assert.ok(linked, `sequence step links to unknown resource ${resourceId}`);
      assert.ok(linked.fileUrl || linked.instruction, `linked resource ${resourceId} has no content`);
    }
  }
});

test("fallback items are recorded against the steps that use them", () => {
  const kit = assembleKit(context({ level: "Class 5", theme: "Animals" }));
  for (const item of kit.content.resources) {
    assert.ok(item.usedFor.length >= 1, `${item.id} is not used by any step`);
  }
});

test("every returned resource fits the requested class across contexts", () => {
  for (const level of ["Nursery", "UKG", "Class 1", "Class 3", "Class 5"] as const) {
    const matched = matchResources(context({ level, theme: "Animals" }), "flashcards", 10);
    for (const entry of matched) {
      assert.ok(entry.levels.includes(level), `${entry.id} unsuitable for ${level}`);
    }
  }
});
