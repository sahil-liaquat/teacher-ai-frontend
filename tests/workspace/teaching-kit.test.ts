import assert from "node:assert/strict";
import test from "node:test";

import { assembleKit, matchResources, removeKitResourceAttachment, replaceKitResource, scoreResourceDetailed } from "../../lib/teaching-kit.ts";
import { type PrimaryResource } from "../../lib/primary-resource-catalog.ts";
import { type PrimaryTeachingContext } from "../../lib/primary-context-helpers.ts";

const mockCatalog: PrimaryResource[] = [
  {
    id: "res-theme-maths",
    title: "Numbers Fun",
    category: "worksheets",
    fileUrl: "/numbers-fun.png",
    levels: ["UKG", "Class 1"],
    subjects: ["Maths"],
    themes: ["Numbers 1-10"],
    skills: ["Counting"],
    keywords: ["count", "numbers"],
    languages: ["English"],
    fileType: "png"
  },
  {
    id: "res-diff-level",
    title: "Advanced Math",
    category: "worksheets",
    fileUrl: "/advanced.png",
    levels: ["Class 4"],
    subjects: ["Maths"],
    themes: ["Numbers 1-10"],
    skills: ["Counting"],
    keywords: ["count"],
    languages: ["English"],
    fileType: "png"
  },
  {
    id: "res-diff-lang",
    title: "Numbers Hindi",
    category: "worksheets",
    fileUrl: "/numbers-hindi.png",
    levels: ["UKG"],
    subjects: ["Maths"],
    themes: ["Numbers 1-10"],
    skills: ["Counting"],
    keywords: ["count"],
    languages: ["Hindi"],
    fileType: "png"
  }
];

test("scoreResourceDetailed: level fits vs level mismatch", () => {
  const context: PrimaryTeachingContext = {
    level: "UKG",
    subject: "Maths",
    theme: "Numbers 1-10",
    language: "English"
  };
  
  const resultFit = scoreResourceDetailed(mockCatalog[0], "worksheet", context, ["numbers"]);
  assert.equal(resultFit.score >= 55, true);
  assert.ok(resultFit.reasons.some(r => r.includes("Level fits")));

  const resultMismatch = scoreResourceDetailed(mockCatalog[1], "worksheet", context, ["numbers"]);
  assert.ok(resultMismatch.reasons.some(r => r.includes("Level mismatch")));
});

test("matchResources: strictly rejects incompatible level & language", () => {
  const context: PrimaryTeachingContext = {
    level: "UKG",
    subject: "Maths",
    theme: "Numbers 1-10",
    language: "English"
  };

  const results = matchResources(context, "worksheet", 10);
  for (const res of results) {
    // Assert level fits
    assert.equal(res.levels.includes(context.level) || res.levels.includes("All Classes") || res.levels.includes("All"), true);
    // Assert language matches
    assert.equal(res.languages.includes(context.language) || res.languages.includes("Bilingual") || context.language === "Bilingual", true);
  }
});

test("assembleKit: initializes correct default sources", () => {
  const context: PrimaryTeachingContext = {
    level: "UKG",
    subject: "Maths",
    theme: "Numbers 1-10",
    language: "English"
  };

  const kit = assembleKit(context);
  assert.equal(kit.content.version, 2);
  assert.equal(kit.content.homeworkSource, "curated");
  assert.equal(kit.content.parentUpdateSource, "template");
  assert.equal(kit.content.objectivesSource, "template");

  // Every objective must default to "curated"
  assert.ok(kit.content.learningObjectives.every(obj => obj.source === "curated"));

  // Check step default sources
  assert.ok(kit.content.sequence.length > 0);
  for (const step of kit.content.sequence) {
    assert.ok(step.source === "resource" || step.source === "curated");
  }
});

test("removeKitResourceAttachment: keeps instructional fallback without deleting component", () => {
  const context: PrimaryTeachingContext = {
    level: "UKG",
    subject: "Maths",
    theme: "Numbers 1-10",
    language: "English"
  };

  const kit = assembleKit(context);
  const resourceId = kit.content.resources[0].id;
  
  const updated = removeKitResourceAttachment(kit.content, resourceId, "Numbers 1-10");
  const item = updated.resources.find(r => r.id === resourceId);
  
  assert.ok(item);
  assert.equal(item.fileUrl, undefined);
  assert.ok(item.instruction?.includes("No printable found") || item.instruction?.includes("Explore"));
});
