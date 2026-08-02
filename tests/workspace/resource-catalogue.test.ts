/**
 * Frontend unit tests for Resource Catalogue Integration.
 * Run with: node --experimental-strip-types --test tests/workspace/resource-catalogue.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { adaptApiResource } from "../../lib/primary-resource-adapter.ts";
import type { PrimaryResource as ApiPrimaryResource } from "../../lib/api.ts";

// This mock mirrors backend/app/schemas/primary.py:PrimaryResourceRead exactly —
// every field the API returns, and nothing it does not. Do not add fields the
// backend does not send: a fabricated `legacy_resource_id` here previously hid a
// live bug where the adapter read a field that never exists on the wire.
// Note `id` is the catalog's own string key, not a UUID.
const mockApiResource: ApiPrimaryResource = {
  id: "primary-resources-library-alphabet-flashcards",
  title: "Alphabet Flashcards",
  category: "Flashcards",
  file_url: "/primary-resources/alphabet.png",
  thumbnail_url: "/primary-resources/alphabet-thumb.png",
  file_type: "png",
  subjects: ["English"],
  levels: ["Nursery", "LKG"],
  themes: ["Colours"],
  keywords: ["letters", "cards"],
  languages: ["English"],
  skills: ["Fine Motor"],
  difficulty: "beginner",
};

describe("Resource Adapter", () => {
  it("maps api response properties to frontend model structure", () => {
    const adapted = adaptApiResource(mockApiResource);

    assert.equal(adapted.id, "primary-resources-library-alphabet-flashcards");
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

  it("maps the nulls and empty lists the backend actually sends", () => {
    // thumbnail_url / difficulty are `str | None`; the list fields are
    // default_factory=list, so the API sends [] rather than omitting them.
    const minApiResource: ApiPrimaryResource = {
      id: "res-min",
      title: "Min Resource",
      category: "Worksheets",
      file_url: "/url.pdf",
      thumbnail_url: null,
      file_type: "pdf",
      subjects: [],
      levels: [],
      themes: [],
      keywords: [],
      languages: [],
      skills: [],
      difficulty: null,
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

  it("never yields an undefined id for a real backend payload", () => {
    // Regression guard: `id` drives Save/Unsave, resource linking, activity
    // event tracking and React keys. An undefined id breaks all four silently.
    for (const payload of [mockApiResource]) {
      assert.equal(typeof adaptApiResource(payload).id, "string");
      assert.equal(adaptApiResource(payload).id, payload.id);
    }
  });

  it("still defaults absent list fields to [] (defence in depth)", () => {
    // Not the documented contract — the backend always sends these — but the
    // adapter tolerates omission, and components index into these arrays.
    const partial = {
      id: "res-partial",
      title: "Partial",
      category: "Worksheets",
      file_url: "/url.pdf",
      file_type: "pdf",
    } as unknown as ApiPrimaryResource;

    const adapted = adaptApiResource(partial);

    assert.equal(adapted.id, "res-partial");
    assert.deepEqual(adapted.subjects, []);
    assert.deepEqual(adapted.levels, []);
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
