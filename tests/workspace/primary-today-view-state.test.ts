import assert from "node:assert/strict";
import test from "node:test";

import { primaryTodayViewState } from "../../lib/primary-today-view-state.ts";

const BASE = {
  contextLoading: false,
  dayLoading: false,
  dayFailed: false,
  generating: false,
  activityCount: 0,
};

test("a failed day fetch is an error, not an empty day", () => {
  // The whole point. Without this the page rendered "No activities planned for
  // this day yet." over a request that never came back, so a teacher whose
  // plan existed was invited to generate it again — which 409s and, before the
  // reservation move, burned their free generation.
  assert.equal(primaryTodayViewState({ ...BASE, dayFailed: true }), "error");
});

test("a genuinely empty day is still empty", () => {
  assert.equal(primaryTodayViewState(BASE), "empty");
});

test("a day with activities renders the plan", () => {
  assert.equal(primaryTodayViewState({ ...BASE, activityCount: 3 }), "plan");
});

test("a stale plan survives a failed refetch", () => {
  // React Query keeps the last good data on a background refetch failure.
  // Replacing a plan the teacher can still teach from with an error panel is
  // worse than showing it — they are mid-class.
  assert.equal(
    primaryTodayViewState({ ...BASE, dayFailed: true, activityCount: 3 }),
    "plan"
  );
});

test("loading beats every resolved state", () => {
  assert.equal(primaryTodayViewState({ ...BASE, dayLoading: true }), "loading");
  assert.equal(primaryTodayViewState({ ...BASE, contextLoading: true }), "loading");
  assert.equal(
    primaryTodayViewState({ ...BASE, dayLoading: true, dayFailed: true }),
    "loading"
  );
});

test("generating beats loading, so the invalidate-refetch doesn't flicker", () => {
  assert.equal(
    primaryTodayViewState({ ...BASE, generating: true, dayLoading: true }),
    "generating"
  );
});

test("generating beats a stale error, so a retry doesn't show the old failure", () => {
  assert.equal(
    primaryTodayViewState({ ...BASE, generating: true, dayFailed: true }),
    "generating"
  );
});

// ── The school calendar's states ────────────────────────────────────────────
// A teacher opening Primary on a Sunday used to get a 400 and a red panel. The
// calendar state now arrives on the successful GET, and the page has somewhere
// calm to put it.

test("a non-teaching day is its own state, not an empty one", () => {
  // "No activities planned for this day yet" + a Generate button invites the
  // teacher to make a request the server will decline. Sunday is not an empty
  // day; it is a closed one.
  assert.equal(
    primaryTodayViewState({ ...BASE, isTeachingDay: false }),
    "no-teaching"
  );
});

test("a teaching day with nothing on it is still just empty", () => {
  assert.equal(primaryTodayViewState({ ...BASE, isTeachingDay: true }), "empty");
});

test("a plan on a non-teaching day still renders", () => {
  // A Saturday catch-up class the teacher already planned, or a date the school
  // closed after the fact. Hiding work they can still teach from is worse than
  // showing it under a calendar that disagrees.
  assert.equal(
    primaryTodayViewState({ ...BASE, isTeachingDay: false, activityCount: 4 }),
    "plan"
  );
});

test("loading and generating still beat the calendar state", () => {
  assert.equal(
    primaryTodayViewState({ ...BASE, isTeachingDay: false, dayLoading: true }),
    "loading"
  );
  assert.equal(
    primaryTodayViewState({ ...BASE, isTeachingDay: false, generating: true }),
    "generating"
  );
});

test("a failed fetch is still an error, even on a Sunday", () => {
  // The calendar state comes from the response that just failed, so trusting a
  // stale one would paint a confident "no teaching today" over an outage.
  assert.equal(
    primaryTodayViewState({ ...BASE, isTeachingDay: false, dayFailed: true }),
    "error"
  );
});

test("an API that sends no calendar state behaves exactly as before", () => {
  assert.equal(primaryTodayViewState(BASE), "empty");
});
