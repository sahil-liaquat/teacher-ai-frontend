import assert from "node:assert/strict";
import test from "node:test";

import { hasIngestedContent, usableClasses } from "../../lib/board-availability.ts";

test("a board with ingested books is usable", () => {
  assert.equal(hasIngestedContent({ ingested_books: 48 }), true);
});

test("a board with zero ingested books is not usable", () => {
  assert.equal(hasIngestedContent({ ingested_books: 0 }), false);
});

test("a missing count is treated as not usable rather than assumed", () => {
  assert.equal(hasIngestedContent({}), false);
});

test("hollow classes are filtered out of the class step", () => {
  const classes = [
    { id: "1", ingested_books: 12 },
    { id: "2", ingested_books: 0 },
    { id: "3" }
  ];
  assert.deepEqual(usableClasses(classes).map((c) => c.id), ["1"]);
});
