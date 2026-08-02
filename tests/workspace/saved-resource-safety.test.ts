import assert from "node:assert/strict";
import test from "node:test";

import { resolveSavedResources } from "../../lib/primary-saved-resources-helpers.ts";
import { type PrimaryResource } from "../../lib/primary-resource-catalog.ts";

const mockCatalog: PrimaryResource[] = [
  { id: "res-1", title: "Resource 1", category: "worksheets", fileUrl: "/file1.png", themes: [], skills: [], subjects: ["English"], levels: ["UKG"], fileType: "png", keywords: [], languages: ["English"] },
  { id: "res-2", title: "Resource 2", category: "flashcards", fileUrl: "/file2.png", themes: [], skills: [], subjects: ["Maths"], levels: ["Class 1"], fileType: "png", keywords: [], languages: ["English"] },
  { id: "res-3", title: "Resource 3", category: "worksheets", fileUrl: "/file3.png", themes: [], skills: [], subjects: ["EVS"], levels: ["Class 2"], fileType: "png", keywords: [], languages: ["English"] },
];

test("resolveSavedResources: all IDs resolve", () => {
  const saved = new Set(["res-1", "res-3"]);
  const { resolved, unresolvedIds } = resolveSavedResources(saved, mockCatalog);
  assert.equal(resolved.length, 2);
  assert.equal(resolved[0].id, "res-1");
  assert.equal(resolved[1].id, "res-3");
  assert.equal(unresolvedIds.length, 0);
});

test("resolveSavedResources: one ID is missing from catalog", () => {
  const saved = new Set(["res-1", "res-deleted", "res-3"]);
  const { resolved, unresolvedIds } = resolveSavedResources(saved, mockCatalog);
  assert.equal(resolved.length, 2);
  assert.equal(resolved[0].id, "res-1");
  assert.equal(resolved[1].id, "res-3");
  assert.equal(unresolvedIds.length, 1);
  assert.equal(unresolvedIds[0], "res-deleted");
});

test("resolveSavedResources: handles duplicates cleanly", () => {
  const saved = ["res-1", "res-1", "res-2", "res-deleted", "res-deleted"];
  const { resolved, unresolvedIds } = resolveSavedResources(saved, mockCatalog);
  assert.equal(resolved.length, 2);
  assert.equal(resolved[0].id, "res-1");
  assert.equal(resolved[1].id, "res-2");
  assert.equal(unresolvedIds.length, 1);
  assert.equal(unresolvedIds[0], "res-deleted");
});

test("resolveSavedResources: handles empty saved list", () => {
  const saved = new Set<string>();
  const { resolved, unresolvedIds } = resolveSavedResources(saved, mockCatalog);
  assert.equal(resolved.length, 0);
  assert.equal(unresolvedIds.length, 0);
});

test("resolveSavedResources: handles catalog changes after save", () => {
  // Save res-2
  const saved = ["res-2"];
  
  // Res-2 is removed from catalog
  const catalogAfterRemoval = mockCatalog.filter(r => r.id !== "res-2");
  
  const { resolved, unresolvedIds } = resolveSavedResources(saved, catalogAfterRemoval);
  assert.equal(resolved.length, 0);
  assert.equal(unresolvedIds.length, 1);
  assert.equal(unresolvedIds[0], "res-2");
});
