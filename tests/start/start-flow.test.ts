import assert from "node:assert/strict";
import test from "node:test";

import { nextStep } from "../../lib/start-flow.ts";

test("the happy path walks board → class → subject → chapter → tool → generate", () => {
  assert.equal(nextStep("board", { boardId: "b" }), "class");
  assert.equal(nextStep("class", { boardId: "b", classId: "c" }), "subject");
  assert.equal(nextStep("subject", { boardId: "b", classId: "c", subjectId: "s", bookId: "bk" }), "chapter");
  assert.equal(nextStep("chapter", { boardId: "b", classId: "c", subjectId: "s", bookId: "bk", chapterId: "ch" }), "tool");
  assert.equal(
    nextStep("tool", { boardId: "b", classId: "c", subjectId: "s", bookId: "bk", chapterId: "ch", tool: "worksheet" }),
    "generate"
  );
});

test("a step with no answer does not advance", () => {
  assert.equal(nextStep("board", {}), "board");
  assert.equal(nextStep("class", { boardId: "b" }), "class");
});

test("choosing a subject that auto-resolves a single book still requires a chapter", () => {
  assert.equal(nextStep("subject", { boardId: "b", classId: "c", subjectId: "s", bookId: "bk" }), "chapter");
});
