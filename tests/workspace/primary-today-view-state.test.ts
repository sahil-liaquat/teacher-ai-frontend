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
