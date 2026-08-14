import assert from "node:assert/strict";
import test from "node:test";

import { describeOutcome, runBulkPublish } from "../../lib/curriculum-bulk-publish.ts";
import type { PrimaryCurriculumLesson } from "../../lib/api.ts";

function lesson(id: string, ready: boolean): PrimaryCurriculumLesson {
  return {
    id, scope: "school", theme_id: "theme-1", level: "nursery", version: 1,
    status: "draft", objectives: [], vocabulary: [], assessment_questions: [],
    steps: [], week: 1, day: 1,
    readiness: {
      ready,
      blocking_count: ready ? 0 : 1,
      checks: ready ? [] : [{ key: "topic", label: "Topic", ok: false, severity: "blocking", detail: "no topic" }],
    },
  } as PrimaryCurriculumLesson;
}

const succeed = async (id: string) => lesson(id, true);

test("only days the server would accept are published", () => {
  return runBulkPublish([lesson("a", true), lesson("b", false), lesson("c", true)], succeed)
    .then((outcome) => {
      assert.deepEqual(outcome.published.map((item) => item.id), ["a", "c"]);
      assert.deepEqual(outcome.skipped.map((item) => item.id), ["b"]);
      assert.deepEqual(outcome.failed, []);
    });
});

test("a day marked needs-attention is never published, even if handed in", () => {
  // The last gate before a write. A caller filtering wrongly must not be able to
  // publish an incomplete day through this path.
  return runBulkPublish([lesson("broken", false)], async () => {
    throw new Error("should never be called");
  }).then((outcome) => {
    assert.deepEqual(outcome.published, []);
    assert.deepEqual(outcome.skipped.map((item) => item.id), ["broken"]);
  });
});

test("publishing is sequential, not concurrent", async () => {
  // Concurrent publishes of days sharing an identity race on the
  // archive-then-publish ordering the partial unique index requires.
  let inFlight = 0;
  let maxInFlight = 0;
  await runBulkPublish([lesson("a", true), lesson("b", true), lesson("c", true)], async (id) => {
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise((resolve) => setTimeout(resolve, 1));
    inFlight -= 1;
    return lesson(id, true);
  });
  assert.equal(maxInFlight, 1);
});

test("a failure part-way through does not abandon the rest", async () => {
  const outcome = await runBulkPublish(
    [lesson("a", true), lesson("b", true), lesson("c", true)],
    async (id) => {
      if (id === "b") throw new Error("409");
      return lesson(id, true);
    },
  );
  assert.deepEqual(outcome.published.map((item) => item.id), ["a", "c"]);
  assert.deepEqual(outcome.failed.map((item) => item.lesson.id), ["b"]);
});

test("progress is reported per attempted day", async () => {
  const seen: string[] = [];
  await runBulkPublish([lesson("a", true), lesson("b", false), lesson("c", true)], succeed,
    (done, total) => seen.push(`${done}/${total}`));
  // Two ready days, so two ticks — the skipped one is never attempted.
  assert.deepEqual(seen, ["1/2", "2/2"]);
});

// ── Reporting ───────────────────────────────────────────────────────────────

test("a clean run reports what teachers can now reach", () => {
  const summary = describeOutcome({ published: [lesson("a", true), lesson("b", true)], failed: [], skipped: [] });
  assert.equal(summary.tone, "success");
  assert.match(summary.title, /2 curriculum days published/);
});

test("partial failure is never rounded up to success", () => {
  // The outcome that matters most: 4 of 6 published must not read as "published",
  // or the admin believes teachers can see two days they cannot.
  const summary = describeOutcome({
    published: [lesson("a", true)],
    failed: [{ lesson: lesson("b", true), error: new Error("boom") }],
    skipped: [],
  });
  assert.equal(summary.tone, "partial");
  assert.match(summary.title, /1 of 2 days published/);
  assert.match(summary.description, /remains a draft/);
});

test("a run where everything failed is an error, not a partial success", () => {
  const summary = describeOutcome({
    published: [],
    failed: [{ lesson: lesson("a", true), error: new Error("boom") }],
    skipped: [],
  });
  assert.equal(summary.tone, "error");
  assert.equal(summary.title, "Nothing was published");
});

test("skipped days are named in the success message", () => {
  const summary = describeOutcome({ published: [lesson("a", true)], failed: [], skipped: [lesson("b", false)] });
  assert.equal(summary.tone, "success");
  assert.match(summary.description, /1 day still requires attention/);
});

test("a run with nothing ready says so rather than claiming success", () => {
  const summary = describeOutcome({ published: [], failed: [], skipped: [lesson("a", false), lesson("b", false)] });
  assert.equal(summary.tone, "error");
  assert.match(summary.description, /2 days still have issues/);
});

test("singular and plural read correctly", () => {
  const one = describeOutcome({ published: [lesson("a", true)], failed: [], skipped: [] });
  assert.match(one.title, /1 curriculum day published/);
  assert.match(one.description, /plan from it/);
});
