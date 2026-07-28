import assert from "node:assert/strict";
import test from "node:test";

import {
  detectWorksheetLanguage,
  getWorksheetInstructions,
  getWorksheetLocale,
  localizeMarks,
  localizeWorksheetSectionTitle,
} from "../../lib/worksheet-localization.ts";

test("Hindi worksheets localize the complete fixed shell", () => {
  const output = {
    metadata: { subject: "Hindi" },
    instructions: "Read each question carefully.",
    student_worksheet: { sections: [] }
  };
  const locale = getWorksheetLocale(output);

  assert.equal(detectWorksheetLanguage(output), "Hindi");
  assert.equal(locale.instructions, "निर्देश");
  assert.match(getWorksheetInstructions(output, locale), /प्रत्येक प्रश्न/);
  assert.equal(localizeWorksheetSectionTitle("Part A: Multiple Choice Questions", locale, 0), "भाग A: बहुविकल्पीय प्रश्न");
  assert.equal(localizeMarks("2 marks", locale), "2 अंक");
});

test("Urdu worksheets are detected by their script and use RTL shell labels", () => {
  const output = {
    title: "ورک شیٹ",
    instructions: "ہر سوال کو غور سے پڑھیں۔",
    student_worksheet: { sections: [] }
  };
  const locale = getWorksheetLocale(output);

  assert.equal(detectWorksheetLanguage(output), "Urdu");
  assert.equal(locale.dir, "rtl");
  assert.equal(locale.name, "نام");
  assert.equal(localizeWorksheetSectionTitle("Part B: True or False", locale, 1), "حصہ B: صحیح یا غلط");
});

test("English worksheet content remains unchanged", () => {
  const output = { metadata: { language: "English" }, instructions: "Custom instructions" };
  const locale = getWorksheetLocale(output);

  assert.equal(getWorksheetInstructions(output, locale), "Custom instructions");
  assert.equal(localizeWorksheetSectionTitle("Part C: Short Answer Questions", locale, 2), "Part C: Short Answer Questions");
});
