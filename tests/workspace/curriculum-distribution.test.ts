import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  describeDistribution,
  emptyDistributionOutcome,
  proposeDistribution,
  runDistribution,
  type DistributionProposal,
} from "../../lib/curriculum-distribution.ts";

/**
 * Phase 7 — curriculum onto the calendar, through the existing planning API.
 *
 * ⚠ There is no auto-distribution endpoint. `POST /planning/plans` writes one
 * plan, and the server's calendar gate refuses non-teaching days, dates outside
 * every term, and slots already taken. So a distribution is proposed here,
 * previewed, then applied one call at a time with partial failure reported.
 *
 * The rule these tests defend hardest: this module is a PREVIEW, never a second
 * source of truth. It skips what it can see is unusable so the preview is
 * honest — the server still validates every write.
 */

const ROOT = new URL("../../", import.meta.url);

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, ROOT), "utf8");
}

function lesson(id: string, month = 6, week = 1, day = 1) {
  return { id, title: `Day ${id}`, month, week, day };
}

function teachingDay(id: string, date: string, day_type = "teaching") {
  return { id, date, day_type };
}

// ── Placement ───────────────────────────────────────────────────────────────

test("lessons are placed on free teaching days in curriculum order", () => {
  const result = proposeDistribution({
    // Deliberately out of order on the wire.
    lessons: [lesson("c", 6, 1, 3), lesson("a", 6, 1, 1), lesson("b", 6, 1, 2)],
    teachingDays: [
      teachingDay("d1", "2026-06-01"),
      teachingDay("d2", "2026-06-02"),
      teachingDay("d3", "2026-06-03"),
    ],
    existingPlans: [],
  });

  assert.deepEqual(
    result.proposals.map((proposal) => [proposal.lesson.id, proposal.date]),
    [["a", "2026-06-01"], ["b", "2026-06-02"], ["c", "2026-06-03"]],
  );
  assert.equal(result.unplaced.length, 0);
  assert.equal(result.remainingDays, 0);
});

test("curriculum order spans months and weeks, not just days", () => {
  const result = proposeDistribution({
    lessons: [lesson("later", 7, 1, 1), lesson("earlier", 6, 5, 5)],
    teachingDays: [teachingDay("d1", "2026-06-01"), teachingDay("d2", "2026-06-02")],
    existingPlans: [],
  });
  assert.deepEqual(result.proposals.map((p) => p.lesson.id), ["earlier", "later"]);
});

test("non-teaching days are never proposed", () => {
  // The server refuses them outright, so proposing one guarantees a preview
  // that fails on apply.
  const result = proposeDistribution({
    lessons: [lesson("a")],
    teachingDays: [
      teachingDay("h1", "2026-06-01", "holiday"),
      teachingDay("w1", "2026-06-02", "weekend"),
      teachingDay("d1", "2026-06-03"),
    ],
    existingPlans: [],
  });
  assert.equal(result.proposals.length, 1);
  assert.equal(result.proposals[0].date, "2026-06-03");
});

test("days are used earliest-first regardless of wire order", () => {
  const result = proposeDistribution({
    lessons: [lesson("a")],
    teachingDays: [teachingDay("d2", "2026-06-09"), teachingDay("d1", "2026-06-02")],
    existingPlans: [],
  });
  assert.equal(result.proposals[0].date, "2026-06-02");
});

// ── Re-running must be safe ─────────────────────────────────────────────────

test("a lesson that already has a plan is left exactly where it is", () => {
  const result = proposeDistribution({
    lessons: [lesson("a"), lesson("b", 6, 1, 2)],
    teachingDays: [teachingDay("d1", "2026-06-01"), teachingDay("d2", "2026-06-02")],
    existingPlans: [{ lesson_id: "a", calendar_day_id: "d1", status: "planned" }],
  });

  assert.deepEqual(result.proposals.map((p) => p.lesson.id), ["b"]);
  assert.deepEqual(
    result.unplaced.map((item) => [item.lesson.id, item.reason]),
    [["a", "already_planned"]],
  );
  // And it must not reuse the occupied day.
  assert.equal(result.proposals[0].date, "2026-06-02");
});

test("an occupied day is not offered to another lesson", () => {
  const result = proposeDistribution({
    lessons: [lesson("b")],
    teachingDays: [teachingDay("d1", "2026-06-01"), teachingDay("d2", "2026-06-02")],
    existingPlans: [{ lesson_id: "a", calendar_day_id: "d1", status: "planned" }],
  });
  assert.equal(result.proposals[0].date, "2026-06-02");
});

test("a cancelled plan frees its day and its lesson", () => {
  // Cancelling is how a plan is removed — the row survives with status
  // `cancelled`, so treating every row as occupied would permanently burn the
  // day for a plan the admin explicitly removed.
  const result = proposeDistribution({
    lessons: [lesson("a")],
    teachingDays: [teachingDay("d1", "2026-06-01")],
    existingPlans: [{ lesson_id: "a", calendar_day_id: "d1", status: "cancelled" }],
  });
  assert.equal(result.proposals.length, 1);
  assert.equal(result.proposals[0].date, "2026-06-01");
});

// ── Running out of calendar ─────────────────────────────────────────────────

test("lessons with no teaching day left are reported, not dropped silently", () => {
  const result = proposeDistribution({
    lessons: [lesson("a"), lesson("b", 6, 1, 2), lesson("c", 6, 1, 3)],
    teachingDays: [teachingDay("d1", "2026-06-01")],
    existingPlans: [],
  });
  assert.equal(result.proposals.length, 1);
  assert.deepEqual(
    result.unplaced.map((item) => [item.lesson.id, item.reason]),
    [["b", "no_teaching_day_left"], ["c", "no_teaching_day_left"]],
  );
});

test("remaining free days are reported so the preview can say so", () => {
  const result = proposeDistribution({
    lessons: [lesson("a")],
    teachingDays: [teachingDay("d1", "2026-06-01"), teachingDay("d2", "2026-06-02"), teachingDay("d3", "2026-06-03")],
    existingPlans: [],
  });
  assert.equal(result.remainingDays, 2);
});

test("an empty curriculum proposes nothing rather than throwing", () => {
  const result = proposeDistribution({ lessons: [], teachingDays: [], existingPlans: [] });
  assert.deepEqual(result.proposals, []);
  assert.deepEqual(result.unplaced, []);
});

test("proposing is deterministic for lessons sharing a slot", () => {
  const first = proposeDistribution({
    lessons: [lesson("b", 6, 1, 1), lesson("a", 6, 1, 1)],
    teachingDays: [teachingDay("d1", "2026-06-01"), teachingDay("d2", "2026-06-02")],
    existingPlans: [],
  });
  const second = proposeDistribution({
    lessons: [lesson("a", 6, 1, 1), lesson("b", 6, 1, 1)],
    teachingDays: [teachingDay("d1", "2026-06-01"), teachingDay("d2", "2026-06-02")],
    existingPlans: [],
  });
  assert.deepEqual(
    first.proposals.map((p) => p.lesson.id),
    second.proposals.map((p) => p.lesson.id),
    "a preview that reorders between renders cannot be trusted",
  );
});

// ── Applying ────────────────────────────────────────────────────────────────

function proposal(id: string): DistributionProposal {
  return { lesson: lesson(id), date: "2026-06-01", calendarDayId: "d1" };
}

test("applying reports partial failure rather than hiding it", async () => {
  const outcome = await runDistribution(
    [proposal("a"), proposal("b"), proposal("c")],
    async (item) => {
      if (item.lesson.id === "b") throw new Error("refused");
      return item;
    },
  );
  assert.deepEqual(outcome.created.map((item) => item.lesson.id), ["a", "c"]);
  assert.equal(outcome.failed.length, 1);
  assert.equal(outcome.failed[0].proposal.lesson.id, "b");
});

test("a failure does not stop the rest of the run", async () => {
  const seen: string[] = [];
  await runDistribution([proposal("a"), proposal("b")], async (item) => {
    seen.push(item.lesson.id);
    throw new Error("always fails");
  });
  assert.deepEqual(seen, ["a", "b"], "every proposal must be attempted");
});

test("applying is sequential, because concurrent creates race the slot check", async () => {
  const order: string[] = [];
  await runDistribution([proposal("a"), proposal("b"), proposal("c")], async (item) => {
    order.push(`start:${item.lesson.id}`);
    await new Promise((resolve) => setTimeout(resolve, 1));
    order.push(`end:${item.lesson.id}`);
  });
  assert.deepEqual(order, [
    "start:a", "end:a", "start:b", "end:b", "start:c", "end:c",
  ]);
});

test("progress is reported per completed write", async () => {
  const ticks: number[] = [];
  await runDistribution([proposal("a"), proposal("b")], async () => undefined, (done) => ticks.push(done));
  assert.deepEqual(ticks, [1, 2]);
});

test("the outcome summary distinguishes total, partial and complete failure", () => {
  assert.equal(describeDistribution({ created: [proposal("a")], failed: [] }).tone, "success");
  assert.equal(
    describeDistribution({ created: [], failed: [{ proposal: proposal("a"), error: null }] }).tone,
    "error",
  );
  assert.equal(
    describeDistribution({ created: [proposal("a")], failed: [{ proposal: proposal("b"), error: null }] }).tone,
    "warning",
  );
  assert.deepEqual(emptyDistributionOutcome(), { created: [], failed: [] });
});

// ── The boundaries this phase must not cross ────────────────────────────────

test("the workspace previews before it writes", () => {
  const workspace = source("components/school-admin/planning/planning-workspace.tsx");
  assert.ok(workspace.includes("proposeDistribution("), "it must generate a proposal");
  assert.ok(workspace.includes("setPreview("), "the proposal must land in a preview");
  // The apply path must be reachable only from the preview dialog's action.
  assert.ok(
    /onClick=\{\(\) => void apply\(preview\?\.proposals/.test(workspace),
    "applying must take the previewed proposals, never a freshly generated set",
  );
});

test("planning never re-implements the server's calendar rules", () => {
  const module = source("lib/curriculum-distribution.ts");
  const workspace = source("components/school-admin/planning/planning-workspace.tsx");
  // Term boundaries and calendar membership are the server's gate. A client
  // copy would be a second rule free to disagree with the one that actually
  // refuses the write.
  for (const forbidden of ["starts_on <=", "OUTSIDE_TERMS", "term.ends_on"]) {
    assert.ok(!module.includes(forbidden), `distribution must not evaluate ${forbidden}`);
    assert.ok(!workspace.includes(forbidden), `the workspace must not evaluate ${forbidden}`);
  }
});

test("scheduling counts planned, never taught", () => {
  const workspace = source("components/school-admin/planning/planning-workspace.tsx");
  const code = workspace.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.ok(
    !/\btaught\b/i.test(code.replace(/Whether a lesson was actually delivered[^<]*/g, "")),
    "the planning surface must not claim delivery",
  );
  assert.ok(
    workspace.includes("scheduled"),
    "it must describe its figures as scheduled",
  );
});

test("only published days are offered for scheduling", () => {
  const workspace = source("components/school-admin/planning/planning-workspace.tsx");
  assert.ok(
    workspace.includes('lesson.status === "published"'),
    "a draft is not something a teacher can be sent to on a date",
  );
});
