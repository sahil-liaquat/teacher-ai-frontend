import assert from "node:assert/strict";
import test from "node:test";

import { fieldAria } from "../../lib/field-aria.ts";

const base = { fallbackId: "gen1", hasHelper: false, hasError: false };

test("an explicit htmlFor wins over the child's id and the generated one", () => {
  const aria = fieldAria({ ...base, htmlFor: "topic", childId: "child" });
  assert.equal(aria.controlId, "topic");
  assert.equal(aria.helperId, "topic-helper");
  assert.equal(aria.errorId, "topic-error");
});

test("a control that already has an id keeps it", () => {
  assert.equal(fieldAria({ ...base, childId: "child" }).controlId, "child");
});

test("with no id anywhere, the generated one is used", () => {
  assert.equal(fieldAria(base).controlId, "gen1");
});

test("nothing to describe means no aria-describedby at all", () => {
  assert.equal(fieldAria(base).describedBy, undefined);
});

test("helper and error are both announced, in reading order", () => {
  const aria = fieldAria({ ...base, htmlFor: "t", hasHelper: true, hasError: true });
  assert.equal(aria.describedBy, "t-helper t-error");
});

test("either message alone is announced on its own", () => {
  assert.equal(fieldAria({ ...base, htmlFor: "t", hasHelper: true }).describedBy, "t-helper");
  assert.equal(fieldAria({ ...base, htmlFor: "t", hasError: true }).describedBy, "t-error");
});

test("aria-invalid tracks the error and is absent, not false, when valid", () => {
  assert.equal(fieldAria({ ...base, hasError: true }).invalid, true);
  assert.equal(fieldAria(base).invalid, undefined);
});

test("aria-required is absent rather than false when the field is optional", () => {
  assert.equal(fieldAria({ ...base, required: true }).required, true);
  assert.equal(fieldAria({ ...base, required: false }).required, undefined);
  assert.equal(fieldAria(base).required, undefined);
});

test("an empty htmlFor falls through instead of producing a bare -error id", () => {
  assert.equal(fieldAria({ ...base, htmlFor: "", childId: "child" }).controlId, "child");
  assert.equal(fieldAria({ ...base, htmlFor: "", childId: "" }).controlId, "gen1");
});
