import assert from "node:assert/strict";
import test from "node:test";

import { mapFontSize } from "../../lib/type-scale.ts";

test("everything illegible is raised to the 12px floor", () => {
  for (const px of [7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5]) {
    assert.equal(mapFontSize(px), "text-micro", `${px}px should become text-micro`);
  }
});

test("the small band collapses onto 14px", () => {
  for (const px of [13, 13.5, 14, 14.5, 15, 15.5]) assert.equal(mapFontSize(px), "text-sm");
});

test("12px stays micro and 16px stays base", () => {
  assert.equal(mapFontSize(12), "text-micro");
  assert.equal(mapFontSize(16), "text-base");
  assert.equal(mapFontSize(16.5), "text-base");
});

test("the lead and heading bands map to their tokens", () => {
  assert.equal(mapFontSize(18), "text-lead");
  assert.equal(mapFontSize(21), "text-lead");
  assert.equal(mapFontSize(22), "text-h3");
  assert.equal(mapFontSize(27), "text-h3");
  assert.equal(mapFontSize(28), "text-h2");
  assert.equal(mapFontSize(33), "text-h2");
  assert.equal(mapFontSize(36), "text-h1");
  assert.equal(mapFontSize(43), "text-h1");
});

test("anything display-sized collapses to the display token", () => {
  for (const px of [44, 48, 50, 64, 72, 120]) assert.equal(mapFontSize(px), "text-display");
});

test("the mapping is total — every size in the codebase resolves", () => {
  for (let px = 7; px <= 120; px += 0.5) {
    assert.match(mapFontSize(px), /^text-(micro|sm|base|lead|h3|h2|h1|display)$/);
  }
});
