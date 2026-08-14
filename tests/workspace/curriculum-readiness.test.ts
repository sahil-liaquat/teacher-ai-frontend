import assert from "node:assert/strict";
import test from "node:test";

import {
  DAYS_PER_WEEK,
  SLOTS_PER_MONTH,
  WEEKS_PER_MONTH,
  advisoryNotes,
  blockedDays,
  blockingIssues,
  curriculumSlots,
  dayStatus,
  focusTarget,
  isPublishable,
  monthMetrics,
  publishableDays,
  slotAt,
  slotOccupant,
} from "../../lib/curriculum-readiness.ts";
import type { LessonReadinessCheck, PrimaryCurriculumLesson } from "../../lib/api.ts";

/** A lesson exactly as the server serialises it, readiness included. */
function lesson(overrides: Partial<PrimaryCurriculumLesson> = {}): PrimaryCurriculumLesson {
  const checks: LessonReadinessCheck[] = overrides.readiness?.checks ?? [
    { key: "daily_focus", label: "Title or daily focus", ok: true, severity: "blocking", field: "daily_focus" },
    { key: "topic", label: "Topic valid for Theme", ok: true, severity: "blocking", field: "topic" },
  ];
  const blocking = checks.filter((check) => !check.ok && check.severity === "blocking");
  return {
    id: "lesson-1",
    scope: "school",
    theme_id: "theme-1",
    level: "nursery",
    version: 1,
    status: "draft",
    objectives: [],
    vocabulary: [],
    assessment_questions: [],
    steps: [],
    week: 1,
    day: 1,
    readiness: { ready: blocking.length === 0, blocking_count: blocking.length, checks },
    ...overrides,
  } as PrimaryCurriculumLesson;
}

function failing(field: string): LessonReadinessCheck[] {
  return [
    { key: field, label: field, ok: false, severity: "blocking", detail: `fix ${field}`, field },
  ];
}

// ── The verdict comes from the server, never from here ──────────────────────

test("readiness is read off the payload, not recomputed", () => {
  // A lesson with no objectives, no title and no steps is READY here, because
  // the server said so. That looks wrong and is exactly the point: if this
  // module ever decides for itself, it has become the second rule again.
  const serverSaysReady = lesson({
    title: null, daily_focus: null, objectives: [], steps: [],
    readiness: { ready: true, blocking_count: 0, checks: [] },
  });
  assert.equal(isPublishable(serverSaysReady), true);
  assert.equal(dayStatus(serverSaysReady), "ready");
});

test("a lesson with no readiness is never claimed to be publishable", () => {
  // An older backend, or a stub assembled client-side. Refusing to claim
  // readiness we were not told about is the safe direction.
  const stub = lesson({ readiness: undefined });
  assert.equal(isPublishable(stub), false);
  assert.equal(dayStatus(stub), "draft");
});

test("published beats every other status", () => {
  const published = lesson({ status: "published", readiness: { ready: false, blocking_count: 2, checks: failing("topic") } });
  assert.equal(dayStatus(published), "published");
});

test("a missing lesson is not planned rather than not ready", () => {
  assert.equal(dayStatus(undefined), "not_started");
  assert.equal(dayStatus(null), "not_started");
});

// ── Blocking vs advisory ────────────────────────────────────────────────────

test("an advisory note is not an issue and does not stop a publish", () => {
  const withNote = lesson({
    readiness: {
      ready: true,
      blocking_count: 0,
      checks: [
        { key: "step_resource:2", label: "Worksheet — printable", ok: false, severity: "advisory", detail: "will auto-match", step_position: 2 },
      ],
    },
  });
  assert.equal(blockingIssues(withNote).length, 0);
  assert.equal(advisoryNotes(withNote).length, 1);
  assert.equal(isPublishable(withNote), true);
  assert.equal(dayStatus(withNote), "ready");
});

test("blocking failures are surfaced as issues", () => {
  const broken = lesson({ readiness: { ready: false, blocking_count: 1, checks: failing("objectives") } });
  assert.equal(blockingIssues(broken).length, 1);
  assert.equal(dayStatus(broken), "needs_attention");
});

// ── Never a dead end ────────────────────────────────────────────────────────

test("a per-block failure focuses that block, a field failure focuses the field", () => {
  assert.equal(
    focusTarget({ key: "step_instructions:3", label: "x", ok: false, severity: "blocking", step_position: 3 }),
    "block:3",
  );
  assert.equal(
    focusTarget({ key: "topic", label: "x", ok: false, severity: "blocking", field: "topic" }),
    "field:topic",
  );
});

test("block 0 focuses block 0 rather than falling through to the field", () => {
  // The bug a truthiness check would introduce: step_position 0 is falsy.
  assert.equal(
    focusTarget({ key: "step_title:0", label: "x", ok: false, severity: "blocking", step_position: 0, field: "steps" }),
    "block:0",
  );
});

// ── Metrics count slots, not versions ───────────────────────────────────────

test("the month grid is five weeks of five teaching days", () => {
  assert.equal(WEEKS_PER_MONTH, 5);
  assert.equal(DAYS_PER_WEEK, 5);
  assert.equal(SLOTS_PER_MONTH, 25);
});

test("two versions of one day count as one slot", () => {
  // The bug this replaces: a month's lesson list carries every non-archived
  // version, so duplicating a published day to edit it inflated every count.
  const lessons = [
    lesson({ id: "v1", week: 1, day: 1, version: 1, status: "published" }),
    lesson({ id: "v2", week: 1, day: 1, version: 2, status: "draft" }),
  ];
  const metrics = monthMetrics(lessons);
  assert.equal(metrics.created, 1);
  assert.equal(curriculumSlots(lessons).length, 1);
});

test("a slot keeps both the live version and the draft being worked on", () => {
  // Collapsing to "the newest row" would lose the fact that teachers are still
  // being served v1 while the author edits v2.
  const lessons = [
    lesson({ id: "v1", week: 1, day: 1, version: 1, status: "published" }),
    lesson({ id: "v2", week: 1, day: 1, version: 2, status: "draft" }),
  ];
  const [slot] = curriculumSlots(lessons);
  assert.equal(slot.published?.id, "v1");
  assert.equal(slot.draft?.id, "v2");
  assert.equal(slot.current.id, "v2", "the author works on the draft");
  assert.equal(slot.hasUnpublishedEdits, true);
});

test("a slot with only a published version has no draft and no pending edits", () => {
  const [slot] = curriculumSlots([lesson({ week: 1, day: 1, status: "published" })]);
  assert.equal(slot.draft, null);
  assert.equal(slot.hasUnpublishedEdits, false);
  assert.equal(slot.status, "published");
});

test("archived versions do not occupy a slot", () => {
  // Retiring a day is what frees its slot, on both ends.
  assert.deepEqual(curriculumSlots([lesson({ week: 1, day: 1, status: "archived" })]), []);
});

test("slots come back in calendar order", () => {
  const lessons = [
    lesson({ id: "w2d1", week: 2, day: 1 }),
    lesson({ id: "w1d3", week: 1, day: 3 }),
    lesson({ id: "w1d1", week: 1, day: 1 }),
  ];
  assert.deepEqual(curriculumSlots(lessons).map((slot) => slot.current.id), ["w1d1", "w1d3", "w2d1"]);
});

test("a published slot with a clean draft is both published and ready", () => {
  // Not a partition: "live for teachers" and "has changes I could ship" are
  // different questions about the same slot, and the admin needs both answers.
  const metrics = monthMetrics([
    lesson({ id: "v1", week: 1, day: 1, version: 1, status: "published" }),
    lesson({ id: "v2", week: 1, day: 1, version: 2, status: "draft" }),
  ]);
  assert.equal(metrics.created, 1);
  assert.equal(metrics.published, 1);
  assert.equal(metrics.ready, 1);
  assert.equal(metrics.needsAttention, 0);
});

test("the newest version is the one the grid opens", () => {
  const lessons = [
    lesson({ id: "v1", week: 2, day: 3, version: 1, status: "published" }),
    lesson({ id: "v2", week: 2, day: 3, version: 2, status: "draft" }),
  ];
  assert.equal(slotOccupant(lessons, 2, 3)?.id, "v2");
  // ...and the answer does not depend on arrival order.
  assert.equal(slotOccupant([...lessons].reverse(), 2, 3)?.id, "v2");
});

test("readiness never exceeds one hundred percent", () => {
  // Twenty-five published days plus a draft version of each: fifty rows, still
  // twenty-five slots. Counting rows gave 200%.
  const lessons: PrimaryCurriculumLesson[] = [];
  for (let week = 1; week <= 5; week += 1) {
    for (let day = 1; day <= 5; day += 1) {
      lessons.push(lesson({ id: `p-${week}-${day}`, week, day, version: 1, status: "published" }));
      lessons.push(lesson({ id: `d-${week}-${day}`, week, day, version: 2, status: "draft" }));
    }
  }
  const metrics = monthMetrics(lessons);
  assert.equal(metrics.created, 25);
  assert.equal(metrics.published, 25);
  assert.equal(metrics.completionPct, 100);
  assert.ok(metrics.completionPct <= 100);
});

test("a day outside the five-week grid cannot push completion past 100", () => {
  // The backend accepts week <= 6, so this row is legal data.
  const lessons: PrimaryCurriculumLesson[] = [];
  for (let week = 1; week <= 5; week += 1) {
    for (let day = 1; day <= 5; day += 1) {
      lessons.push(lesson({ id: `p-${week}-${day}`, week, day, status: "published" }));
    }
  }
  lessons.push(lesson({ id: "overflow", week: 6, day: 1, status: "published" }));
  assert.equal(monthMetrics(lessons).completionPct, 100);
});

test("empty is the slots with nothing in them", () => {
  const metrics = monthMetrics([lesson({ week: 1, day: 1 })]);
  assert.equal(metrics.created, 1);
  assert.equal(metrics.empty, 24);
});

test("a lesson with no calendar coordinate occupies no slot", () => {
  // Authors draft content before deciding when to teach it.
  assert.equal(curriculumSlots([lesson({ week: null, day: null })]).length, 0);
});

test("metrics split ready, published and needs-attention without double counting", () => {
  const lessons = [
    lesson({ id: "a", week: 1, day: 1, status: "published" }),
    lesson({ id: "b", week: 1, day: 2 }),
    lesson({ id: "c", week: 1, day: 3, readiness: { ready: false, blocking_count: 2, checks: failing("topic") } }),
  ];
  const metrics = monthMetrics(lessons);
  assert.equal(metrics.created, 3);
  assert.equal(metrics.published, 1);
  assert.equal(metrics.ready, 1);
  assert.equal(metrics.needsAttention, 1);
});

// ── Bulk publish selection ──────────────────────────────────────────────────

test("bulk publish takes only unpublished days the server would accept", () => {
  const lessons = [
    lesson({ id: "ready-1", week: 1, day: 2 }),
    lesson({ id: "already", week: 1, day: 1, status: "published" }),
    lesson({ id: "broken", week: 1, day: 3, readiness: { ready: false, blocking_count: 1, checks: failing("objectives") } }),
  ];
  assert.deepEqual(publishableDays(lessons).map((item) => item.id), ["ready-1"]);
  assert.deepEqual(blockedDays(lessons).map((item) => item.id), ["broken"]);
});

test("bulk publish is offered in calendar order", () => {
  const lessons = [
    lesson({ id: "w2d1", week: 2, day: 1 }),
    lesson({ id: "w1d3", week: 1, day: 3 }),
    lesson({ id: "w1d1", week: 1, day: 1 }),
  ];
  assert.deepEqual(publishableDays(lessons).map((item) => item.id), ["w1d1", "w1d3", "w2d1"]);
});

test("a slot whose draft is blocked is not bulk published", () => {
  // The published v1 is live; the v2 draft the author is working on has issues.
  // Publishing v1 again would be a no-op, and publishing v2 would fail.
  const lessons = [
    lesson({ id: "v1", week: 1, day: 1, version: 1, status: "published" }),
    lesson({ id: "v2", week: 1, day: 1, version: 2, status: "draft", readiness: { ready: false, blocking_count: 1, checks: failing("topic") } }),
  ];
  assert.deepEqual(publishableDays(lessons), []);
  assert.deepEqual(blockedDays(lessons).map((item) => item.id), ["v2"]);
});

test("an already published slot is never re-published by a bulk run", () => {
  // Republishing burns a version number for no change.
  const lessons = [lesson({ id: "live", week: 1, day: 1, status: "published" })];
  assert.deepEqual(publishableDays(lessons), []);
  assert.deepEqual(blockedDays(lessons), []);
});

test("slotAt finds nothing in an empty slot", () => {
  assert.equal(slotAt([lesson({ week: 1, day: 1 })], 3, 4), undefined);
});
