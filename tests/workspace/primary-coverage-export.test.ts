import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCoverageExportStrings,
  coverageFilename,
  coverageNeedsPrintDialog,
  normaliseForPdf,
  type CoverageExportInput,
} from "../../lib/primary-coverage-export.ts";

const DAY_STATE_LABELS: Record<string, string> = {
  no_plan: "No plan generated",
  plan_cleared: "Plan cleared",
  not_started: "Planned, not marked",
  partly_taught: "Partly taught",
  taught: "Taught",
  not_taught: "Skipped or moved",
};

const THEME_STATE_LABELS: Record<string, string> = {
  not_authored: "No lesson authored yet",
  not_started: "Not started",
  in_progress: "In progress",
  complete: "Complete",
};

const LEVEL_LABELS: Record<string, string> = { nursery: "Nursery", class_4: "Class 4" };

function input(overrides: Partial<CoverageExportInput> = {}): CoverageExportInput {
  const base: CoverageExportInput = {
    teacherName: "Asha Kaul",
    teacherEmail: "asha@example.com",
    rangeLabel: "3 - 9 Aug 2026",
    themeLevelLabel: "Nursery",
    generatedOn: "2 Aug 2026",
    levelLabels: LEVEL_LABELS,
    dayStateLabels: DAY_STATE_LABELS,
    themeStateLabels: THEME_STATE_LABELS,
    report: {
      start: "2026-08-03",
      end: "2026-08-03",
      days: [
        {
          date: "2026-08-03", level: "nursery", subject: "EVS",
          theme_name: "My Family", total: 7, completed: 7, state: "taught",
        },
      ],
      totals: {
        days_in_range: 1, days_with_plan: 1, days_without_plan: 0,
        activities: 7, completed: 7, partially_completed: 0,
        skipped: 0, rescheduled: 0, minutes_planned: 53, minutes_completed: 53,
      },
    },
    themeReport: {
      themes: [
        {
          theme_name: "My Family", subject: "EVS", steps_total: 7,
          steps_taught: 7, completion_pct: 100, state: "complete", authored: true,
        },
      ],
      themes_total: 1, themes_authored: 1, themes_not_authored: 0,
      themes_complete: 1, completion_pct: 100,
    },
  };
  return { ...base, ...overrides };
}

test("normaliseForPdf maps the punctuation the writer can render", () => {
  assert.equal(normaliseForPdf("“Hello”"), '"Hello"');
  assert.equal(normaliseForPdf("don’t"), "don't");
  assert.equal(normaliseForPdf("Mon – Fri"), "Mon - Fri");
  assert.equal(normaliseForPdf("A — B"), "A - B");
  assert.equal(normaliseForPdf("wait…"), "wait...");
  assert.equal(normaliseForPdf("• item"), "- item");
});

test("an all-Latin report uses the built-in writer", () => {
  assert.equal(coverageNeedsPrintDialog(["My Family", "Taught", "3 - 9 Aug 2026"]), false);
});

test("a Devanagari theme name routes to the print dialog", () => {
  // 6 of the 51 seeded theme rows are Devanagari. The writer is Helvetica +
  // WinAnsiEncoding and strips every non-ASCII byte, so these would print blank.
  assert.equal(coverageNeedsPrintDialog(["मेरा परिवार"]), true);
  assert.equal(coverageNeedsPrintDialog(["पशु"]), true);
});

test("smart punctuation alone never forces the print dialog", () => {
  // Normalisation happens BEFORE the test. Without that, a stray em-dash in a
  // theme name would push an otherwise-English report through window.print().
  assert.equal(coverageNeedsPrintDialog(["Fruits – Vegetables"]), false);
  assert.equal(coverageNeedsPrintDialog(["“My Family”"]), false);
  assert.equal(coverageNeedsPrintDialog(["• Circle time"]), false);
});

test("a non-Latin teacher name also routes to the print dialog", () => {
  const strings = buildCoverageExportStrings(input({ teacherName: "आशा" }));
  assert.equal(coverageNeedsPrintDialog(strings), true);
});

test("export strings include every string the writer will draw", () => {
  const strings = buildCoverageExportStrings(input());
  assert.ok(strings.indexOf("Asha Kaul") >= 0);
  assert.ok(strings.indexOf("asha@example.com") >= 0);
  assert.ok(strings.indexOf("3 - 9 Aug 2026") >= 0);
  assert.ok(strings.indexOf("Nursery") >= 0);       // level label, not the raw key
  assert.ok(strings.indexOf("My Family") >= 0);
  assert.ok(strings.indexOf("EVS") >= 0);
  assert.ok(strings.indexOf("Taught") >= 0);
  assert.ok(strings.indexOf("Complete") >= 0);
  assert.ok(strings.indexOf("nursery") < 0);        // the raw enum is never drawn
});

test("a decorative emoji never forces the print dialog", () => {
  // Themes carry an optional emoji column. It is not drawn and not scanned — a
  // single paintbrush must not push an English report into the browser dialog.
  const withEmoji = input();
  (withEmoji.themeReport.themes[0] as unknown as Record<string, unknown>).emoji = "\u{1F3A8}";
  assert.equal(coverageNeedsPrintDialog(buildCoverageExportStrings(withEmoji)), false);
});

test("an unauthored theme contributes its label and never a percentage", () => {
  const strings = buildCoverageExportStrings(
    input({
      themeReport: {
        themes: [
          {
            theme_name: "Money", subject: "Maths", steps_total: 0,
            steps_taught: 0, completion_pct: 0, state: "not_authored", authored: false,
          },
        ],
        themes_total: 1, themes_authored: 0, themes_not_authored: 1,
        themes_complete: 0, completion_pct: 0,
      },
    }),
  );
  assert.ok(strings.indexOf("No lesson authored yet") >= 0);
  assert.ok(strings.indexOf("0%") < 0);
});

test("a day with no plan still contributes a row", () => {
  const strings = buildCoverageExportStrings(
    input({
      report: {
        start: "2026-08-03", end: "2026-08-03",
        days: [
          {
            date: "2026-08-03", level: null, subject: null,
            theme_name: null, total: 0, completed: 0, state: "no_plan",
          },
        ],
        totals: {
          days_in_range: 1, days_with_plan: 0, days_without_plan: 1,
          activities: 0, completed: 0, partially_completed: 0,
          skipped: 0, rescheduled: 0, minutes_planned: 0, minutes_completed: 0,
        },
      },
    }),
  );
  assert.ok(strings.indexOf("No plan generated") >= 0);
});

test("an unknown state key degrades to the key rather than throwing", () => {
  const strings = buildCoverageExportStrings(
    input({ dayStateLabels: {}, themeStateLabels: {} }),
  );
  assert.ok(strings.indexOf("taught") >= 0);
});

test("coverageFilename slugs to ASCII and never returns an empty name", () => {
  assert.equal(coverageFilename("3 - 9 Aug 2026"), "teachpad-primary-coverage-3-9-aug-2026");
  assert.equal(coverageFilename("August 2026"), "teachpad-primary-coverage-august-2026");
  assert.equal(coverageFilename(""), "teachpad-primary-coverage");
  assert.ok(coverageFilename("x".repeat(200)).length <= 90);
});
