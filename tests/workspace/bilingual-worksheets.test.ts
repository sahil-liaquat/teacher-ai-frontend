import assert from "node:assert/strict";
import test from "node:test";

import {
  isPaired,
  pairingName,
  parsePairing,
  plainText,
  primaryText,
} from "../../lib/localized-text.ts";

test("legacy string fields are the single-language case", () => {
  assert.equal(isPaired("What is photosynthesis?"), false);
  assert.equal(plainText("What is photosynthesis?"), "What is photosynthesis?");
  assert.equal(primaryText("What is photosynthesis?"), "What is photosynthesis?");
});

test("a pair flattens to both lines, primary first", () => {
  const value = { primary: "What is photosynthesis?", secondary: "प्रकाश संश्लेषण क्या है?" };
  assert.equal(isPaired(value), true);
  assert.equal(plainText(value), "What is photosynthesis?\nप्रकाश संश्लेषण क्या है?");
  assert.equal(primaryText(value), "What is photosynthesis?");
});

test("missing and malformed values never render [object Object]", () => {
  assert.equal(plainText(undefined), "");
  assert.equal(plainText(null), "");
  assert.equal(plainText({ primary: "half" }), "");
  assert.equal(plainText(42), "42");
});

test("pairing names round-trip", () => {
  assert.equal(pairingName("English", "Hindi"), "English + Hindi");
  assert.deepEqual(parsePairing("English + Hindi"), { primary: "English", secondary: "Hindi" });
  assert.equal(parsePairing("Hindi"), null);
  assert.equal(parsePairing("English + Klingon"), null);
});
