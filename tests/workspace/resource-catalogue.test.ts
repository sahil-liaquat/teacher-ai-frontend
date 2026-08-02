/**
 * Frontend unit tests for Resource Catalogue Integration.
 * Run with: node --experimental-strip-types --test tests/workspace/resource-catalogue.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { adaptApiResource } from "../../lib/primary-resource-adapter.ts";

// Minimal stub for testing mapping and logic

const mockApiResource = {
  id: "some-uuid",
  legacy_resource_id: "res-1234",
  slug: "res-1234",
  title: "Alphabet Flashcards",
  description: "Learn ABCD",
  category: "Flashcards",
  file_url: "/primary-resources/alphabet.png",
  thumbnail_url: "/primary-resources/alphabet-thumb.png",
  file_type: "png",
  subjects: ["English"],
  levels: ["Nursery", "LKG"],
  themes: ["Colours"],
  topics: ["Alphabet"],
  keywords: ["letters", "cards"],
  languages: ["English"],
  skills: ["Fine Motor"],
  learning_objectives: ["Obj 1"],
  difficulty: "beginner",
  estimated_duration_minutes: 15,
  activity_format: "Individual",
  is_active: true,
  content_version: 1,
};

describe("Resource Adapter", () => {
  it("maps api response properties to frontend model structure", () => {
    const adapted = adaptApiResource(mockApiResource);

    assert.equal(adapted.id, "res-1234");
    assert.equal(adapted.title, "Alphabet Flashcards");
    assert.equal(adapted.category, "Flashcards");
    assert.equal(adapted.fileUrl, "/primary-resources/alphabet.png");
    assert.equal(adapted.thumbnailUrl, "/primary-resources/alphabet-thumb.png");
    assert.equal(adapted.fileType, "png");
    assert.deepEqual(adapted.subjects, ["English"]);
    assert.deepEqual(adapted.levels, ["Nursery", "LKG"]);
    assert.deepEqual(adapted.themes, ["Colours"]);
    assert.deepEqual(adapted.keywords, ["letters", "cards"]);
    assert.deepEqual(adapted.languages, ["English"]);
    assert.deepEqual(adapted.skills, ["Fine Motor"]);
    assert.equal(adapted.difficulty, "beginner");
  });

  it("handles missing optional values gracefully", () => {
    const minApiResource = {
      legacy_resource_id: "res-min",
      title: "Min Resource",
      category: "Worksheets",
      file_url: "/url.pdf",
      file_type: "pdf",
    };

    const adapted = adaptApiResource(minApiResource);

    assert.equal(adapted.id, "res-min");
    assert.equal(adapted.title, "Min Resource");
    assert.equal(adapted.category, "Worksheets");
    assert.equal(adapted.fileUrl, "/url.pdf");
    assert.equal(adapted.fileType, "pdf");
    assert.deepEqual(adapted.subjects, []);
    assert.deepEqual(adapted.levels, []);
    assert.deepEqual(adapted.themes, []);
    assert.deepEqual(adapted.keywords, []);
    assert.deepEqual(adapted.languages, []);
    assert.deepEqual(adapted.skills, []);
    assert.equal(adapted.difficulty, undefined);
    assert.equal(adapted.thumbnailUrl, undefined);
  });
});

describe("Matching compatibility scoring", () => {
  // Verifying adapted resources score exactly the same as old catalog items
  const weights = {
    theme: 40,
    subject: 25,
    level: 20,
    category: 15,
  };

  function scoreResource(resource: any, component: string, context: any) {
    let score = 0;
    if (context.theme && resource.themes.includes(context.theme)) {
      score += weights.theme;
    }
    if (resource.subjects.includes(context.subject)) {
      score += weights.subject;
    }
    if (resource.levels.includes(context.level)) {
      score += weights.level;
    }
    return score;
  }

  it("calculates exact matching scores correctly with adapted resources", () => {
    const resource = adaptApiResource(mockApiResource);
    const context = { theme: "Colours", subject: "English", level: "Nursery" };

    const score = scoreResource(resource, "flashcards", context);
    // theme (40) + subject (25) + level (20) = 85
    assert.equal(score, 85);
  });
});
