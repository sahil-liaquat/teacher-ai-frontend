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

import {
  getWorksheetInstructions,
  getWorksheetLocale,
  localizeWorksheetSectionTitle,
  pairingChips,
  toLines,
} from "../../lib/worksheet-localization.ts";

test("toLines returns one line for a legacy string and two for a pair", () => {
  const single = toLines("What is photosynthesis?", { primary: "English" });
  assert.equal(single.length, 1);
  assert.deepEqual(single[0], { text: "What is photosynthesis?", language: "English", dir: "ltr" });

  const pair = toLines(
    { primary: "What is photosynthesis?", secondary: "پودے کیا ہیں؟" },
    { primary: "English", secondary: "Urdu" }
  );
  assert.equal(pair.length, 2);
  assert.equal(pair[0].dir, "ltr");
  // Urdu is RTL — this per-line direction is why pairs are objects, not one string.
  assert.equal(pair[1].dir, "rtl");
  assert.equal(pair[1].language, "Urdu");
});

test("a bilingual worksheet is not mistaken for a Hindi one", () => {
  // namedLanguage tests /hindi/ before /english/, so "English + Hindi" would
  // otherwise resolve to Hindi and wrap the page in Hindi-only chrome.
  const output = { metadata: { language: "English + Hindi" }, student_worksheet: { sections: [] } };
  assert.equal(getWorksheetLocale(output).language, "English");
});

test("locale helpers read paired fields instead of stringifying them", () => {
  const locale = getWorksheetLocale({ metadata: { language: "English" } });
  const title = localizeWorksheetSectionTitle(
    { primary: "Part A: Multiple Choice Questions", secondary: "भाग A: बहुविकल्पीय प्रश्न" },
    locale,
    0
  );
  assert.equal(title, "Part A: Multiple Choice Questions");

  const output = {
    metadata: { language: "English + Hindi" },
    instructions: { primary: "Answer all questions.", secondary: "सभी प्रश्नों के उत्तर दें।" }
  };
  assert.equal(getWorksheetInstructions(output, locale), "Answer all questions.");
});

test("pairing chips unlock only when the secondary variant exists", () => {
  const locked = pairingChips("English", ["English"]);
  assert.deepEqual(locked.map((chip) => chip.name), ["English + Hindi", "English + Urdu"]);
  assert.equal(locked.every((chip) => chip.unlocked === false), true);

  const unlocked = pairingChips("English", ["English", "Hindi"]);
  assert.equal(unlocked.find((chip) => chip.name === "English + Hindi")?.unlocked, true);
  assert.equal(unlocked.find((chip) => chip.name === "English + Urdu")?.unlocked, false);
});

test("a Hindi-primary worksheet offers Hindi-first pairings", () => {
  const chips = pairingChips("Hindi", ["Hindi", "English"]);
  assert.equal(chips.find((chip) => chip.name === "Hindi + English")?.unlocked, true);
});

import { canUseBuiltInWorksheetPdf } from "../../lib/worksheet-localization.ts";

test("only English worksheets may use the built-in PDF writer", () => {
  // The writer is Helvetica + WinAnsiEncoding and deletes every non-ASCII
  // character, so anything else downloads blank.
  assert.equal(canUseBuiltInWorksheetPdf(getWorksheetLocale({ metadata: { language: "English" } })), true);
  assert.equal(canUseBuiltInWorksheetPdf(getWorksheetLocale({ metadata: { language: "Hindi" } })), false);
  assert.equal(canUseBuiltInWorksheetPdf(getWorksheetLocale({ metadata: { language: "Urdu" } })), false);
});

test("every pairing is barred from the built-in writer", () => {
  // A pairing resolves to its primary, which may be English — but half its text
  // is not, and the writer would emit the English lines and silently drop the
  // rest: a PDF that looks correct and is not.
  const locale = getWorksheetLocale({ metadata: { language: "English + Hindi" } });
  assert.equal(canUseBuiltInWorksheetPdf(locale, "English + Hindi"), false);
});
