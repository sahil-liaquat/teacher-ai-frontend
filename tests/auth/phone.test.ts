import assert from "node:assert/strict";
import test from "node:test";

import { normalizeIndianMobile } from "../../lib/phone.ts";

test("a plain Indian mobile still normalizes exactly as before", () => {
  assert.equal(normalizeIndianMobile("9876543210"), "+919876543210");
  assert.equal(normalizeIndianMobile("+91 98765 43210"), "+919876543210");
  assert.equal(normalizeIndianMobile("919876543210"), "+919876543210");
  assert.equal(normalizeIndianMobile("09876543210"), "+919876543210");
});

test("a bare local string that is not an Indian mobile is still rejected", () => {
  assert.equal(normalizeIndianMobile("1234567890"), null);
  assert.equal(normalizeIndianMobile("12345"), null);
  assert.equal(normalizeIndianMobile(""), null);
});

test("an international number with its country code is accepted", () => {
  assert.equal(normalizeIndianMobile("+1 415 555 0132"), "+14155550132");
  assert.equal(normalizeIndianMobile("+971 50 123 4567"), "+971501234567");
  assert.equal(normalizeIndianMobile("+44 7700 900123"), "+447700900123");
});

test("a +91 number that fails the Indian rule stays rejected, not waved through as E.164", () => {
  assert.equal(normalizeIndianMobile("+91 12345 67890"), null);
});

test("E.164 length limits are enforced", () => {
  assert.equal(normalizeIndianMobile("+1234567"), null);
  assert.equal(normalizeIndianMobile("+1234567890123456"), null);
  assert.equal(normalizeIndianMobile("+0123456789"), null);
});
