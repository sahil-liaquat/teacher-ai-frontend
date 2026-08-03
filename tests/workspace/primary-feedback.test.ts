import assert from "node:assert/strict";
import test from "node:test";

import { formatSkipRate, skipSeverity } from "../../lib/primary-feedback.ts";

test("null skip rate is unknown severity, never neutral or alarming", () => {
  assert.equal(skipSeverity(null), "unknown");
});

test("a genuine zero percent is neutral, not unknown", () => {
  assert.equal(skipSeverity(0), "neutral");
});

test("severity thresholds at 25 and 50", () => {
  assert.equal(skipSeverity(24), "neutral");
  assert.equal(skipSeverity(25), "warning");
  assert.equal(skipSeverity(49), "warning");
  assert.equal(skipSeverity(50), "danger");
  assert.equal(skipSeverity(100), "danger");
});

test("formatSkipRate distinguishes no-data from zero", () => {
  assert.equal(formatSkipRate(null), "No data yet");
  assert.equal(formatSkipRate(0), "0% skipped");
  assert.equal(formatSkipRate(37), "37% skipped");
});
