import assert from "node:assert/strict";
import test from "node:test";

import {
  OBSERVATION_RATINGS,
  OBSERVATION_TRENDS,
  RATING_LABELS,
  RATING_SHORT_LABELS,
  TREND_LABELS,
  defaultTermRange,
  formatTermLabel,
  isValidStudentCode,
  normaliseStudentCode,
  ratingOrdinal,
  ratingTone,
  summariseRatings,
  toLocalISODate,
  trendFrom,
} from "../../lib/primary-roster.ts";

// The backend sends these keys verbatim. Pinning the exact arrays is what makes
// a rename on one side fail the other side's build instead of silently
// rendering an undefined label.
test("rating vocabulary matches the backend exactly, lowest to highest", () => {
  assert.deepEqual([...OBSERVATION_RATINGS], ["not_yet", "emerging", "secure"]);
});

test("trend vocabulary matches the backend exactly", () => {
  assert.deepEqual([...OBSERVATION_TRENDS], ["single", "improving", "steady", "slipping"]);
});

test("every rating and trend has a label", () => {
  for (const rating of OBSERVATION_RATINGS) {
    assert.equal(typeof RATING_LABELS[rating], "string");
    assert.ok(RATING_LABELS[rating].length > 0);
    assert.ok(RATING_SHORT_LABELS[rating].length > 0);
  }
  for (const trend of OBSERVATION_TRENDS) {
    assert.ok(TREND_LABELS[trend].length > 0);
  }
});

test("every rating has a tone with all three class slots", () => {
  for (const rating of OBSERVATION_RATINGS) {
    const tone = ratingTone(rating);
    assert.ok(tone.dot.length > 0);
    assert.ok(tone.chip.length > 0);
    assert.ok(tone.text.length > 0);
  }
});

test("rating ordinals run lowest to highest", () => {
  assert.ok(ratingOrdinal("not_yet") < ratingOrdinal("emerging"));
  assert.ok(ratingOrdinal("emerging") < ratingOrdinal("secure"));
});

test("a single observation has no direction", () => {
  assert.equal(trendFrom(["secure"]), "single");
  assert.equal(trendFrom([]), "single");
});

test("trend compares the first and last rating, not the average", () => {
  assert.equal(trendFrom(["not_yet", "secure", "emerging"]), "improving");
  assert.equal(trendFrom(["secure", "not_yet"]), "slipping");
  assert.equal(trendFrom(["emerging", "secure", "emerging"]), "steady");
});

test("summariseRatings tallies each rating and the total", () => {
  const summary = summariseRatings(["secure", "secure", "not_yet"]);
  assert.deepEqual(summary, { not_yet: 1, emerging: 0, secure: 2, total: 3 });
});

test("summarising nothing gives all zeroes", () => {
  assert.deepEqual(summariseRatings([]), { not_yet: 0, emerging: 0, secure: 0, total: 0 });
});

test("student codes collapse whitespace and trim", () => {
  assert.equal(normaliseStudentCode("  A   01 "), "A 01");
  assert.equal(normaliseStudentCode("\tR7\n"), "R7");
});

test("student codes are truncated to the column width", () => {
  assert.equal(normaliseStudentCode("x".repeat(60)).length, 40);
});

test("a blank code is not valid", () => {
  assert.equal(isValidStudentCode("   "), false);
  assert.equal(isValidStudentCode(""), false);
  assert.equal(isValidStudentCode("A01"), true);
});

// Pinned to exact strings rather than compared against lib/primary-coverage.ts:
// this module is import-free by design, so the two copies are kept honest by
// both being pinned to the same literal output.
test("toLocalISODate uses local calendar fields, never UTC", () => {
  assert.equal(toLocalISODate(new Date(2026, 7, 3)), "2026-08-03");
  assert.equal(toLocalISODate(new Date(2026, 0, 9)), "2026-01-09");
  // 23:30 local on the 31st must not roll forward into the next month.
  assert.equal(toLocalISODate(new Date(2026, 11, 31, 23, 30)), "2026-12-31");
});

test("the default term is the Indian academic year containing today", () => {
  assert.deepEqual(defaultTermRange(new Date(2026, 7, 3)), {
    start: "2026-04-01",
    end: "2027-03-31",
  });
});

test("January falls in the academic year that started the previous April", () => {
  assert.deepEqual(defaultTermRange(new Date(2027, 0, 15)), {
    start: "2026-04-01",
    end: "2027-03-31",
  });
});

test("April 1 starts a new academic year", () => {
  assert.deepEqual(defaultTermRange(new Date(2027, 3, 1)), {
    start: "2027-04-01",
    end: "2028-03-31",
  });
});

test("the term label is ASCII only and reads as two dates", () => {
  const label = formatTermLabel("2026-04-01", "2027-03-31");
  assert.equal(label, "1 Apr 2026 - 31 Mar 2027");
  // eslint-disable-next-line no-control-regex
  assert.ok(/^[\x20-\x7e]+$/.test(label), `non-ASCII in ${label}`);
});
