import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { SCHOOL_ADMIN_NAV, SCHOOL_ADMIN_SUBNAV, activeTopLevel } from "../../lib/school-admin-nav.ts";
import { vocabularyFrom } from "../../lib/school-admin-levels.ts";

/**
 * Phase 4 — Curriculum becomes one journey with a command centre at its head.
 *
 * Curriculum work started on a month grid: no statement of where the school was
 * in the process, no next action, and the four stages of authoring scattered
 * across unrelated destinations. The overview answers "what do I do next?" and
 * every figure on it is one an administrator can act on.
 */

const ROOT = new URL("../../", import.meta.url);

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, ROOT), "utf8");
}

const OVERVIEW = "components/school-admin/curriculum/curriculum-overview.tsx";
const CURRICULUM = "/school-admin/curriculum/overview";

// ── Where Curriculum lands ──────────────────────────────────────────────────

test("the Curriculum sidebar item lands on the overview, not the grid", () => {
  const item = SCHOOL_ADMIN_NAV.find((entry) => entry.label === "Curriculum");
  assert.equal(item?.href, CURRICULUM);
  assert.ok(existsSync(new URL("app/school-admin/(shell)/curriculum/overview/page.tsx", ROOT)));
});

test("the teaching-days grid keeps its URL, because every deep link points at it", () => {
  // `curriculumHref()` builds `/school-admin/curriculum?...&day=<id>`, and the
  // day editor, resources, themes and the Overview all use it. The sidebar
  // destination and the deep-link target are allowed to differ; moving the
  // target would have broken all of them.
  const helper = source("lib/school-admin-curriculum.ts");
  assert.ok(
    helper.includes("`/school-admin/curriculum${query.size"),
    "curriculumHref must still build the grid URL",
  );
  assert.ok(
    SCHOOL_ADMIN_SUBNAV[CURRICULUM].some((child) => child.href === "/school-admin/curriculum"),
    "the grid must stay reachable from the section",
  );
  assert.equal(activeTopLevel("/school-admin/curriculum"), CURRICULUM);
});

test("the curriculum section walks the authoring journey in order", () => {
  assert.deepEqual(
    SCHOOL_ADMIN_SUBNAV[CURRICULUM].map((child) => child.label),
    ["Overview", "Structure", "Teaching days", "Resources", "Calendar", "Review & Publish", "Schedule"],
  );
});

// ── One primary action, derived from real state ─────────────────────────────

test("the overview computes a single next action rather than offering many", () => {
  const overview = source(OVERVIEW);
  assert.ok(overview.includes("const nextAction"), "there must be one computed next action");
  // Ordered by what actually blocks the next step: no year → no structure →
  // nothing planned → blocking issues → ready to publish.
  for (const gate of [
    "Create an academic year",
    "Plan ",
    "Resolve ",
    "Review & publish ",
  ]) {
    assert.ok(overview.includes(gate), `the next action must cover: ${gate}`);
  }
});

test("every figure on the overview links somewhere it can be acted on", () => {
  const overview = source(OVERVIEW);
  // A count with no destination is decoration. Each stage card takes an href.
  assert.ok(overview.includes("function StageCard"), "stage cards must exist");
  assert.ok(/href: string;/.test(overview), "a stage card must require a destination");
  assert.ok(
    overview.includes("<Link\n      href={href}"),
    "the stage card must render its destination as a link",
  );
});

test("issues deep-link to the exact teaching day that has them", () => {
  const overview = source(OVERVIEW);
  assert.ok(
    overview.includes("href({ day: slot.current.id })"),
    "an issue must open at the day it belongs to, not at the month",
  );
});

// ── Readiness stays the server's ────────────────────────────────────────────

test("the overview reads server readiness and never recomputes it", () => {
  const overview = source(OVERVIEW);
  assert.ok(overview.includes("monthMetrics("), "readiness must come from the shared slot metrics");
  assert.ok(overview.includes("blockingIssues("), "issues must come from the server verdict");
  assert.ok(overview.includes("resourceIssues("), "resource gaps must use the one shared rule");
  // The defect `curriculum-readiness.ts` exists to prevent.
  assert.ok(
    !/lesson\.(steps|objectives)\??\.length\s*(===|<|>)/.test(overview),
    "the overview must not judge a lesson's readiness from its own fields",
  );
});

test("the readiness bar is not colour-only and carries its value", () => {
  const overview = source(OVERVIEW);
  assert.ok(overview.includes('role="progressbar"'));
  assert.ok(overview.includes("aria-valuenow={metrics.completionPct}"));
  // Stage cards pair their tone with an icon and wording.
  assert.ok(
    overview.includes("ok ? <CheckCircle2") && overview.includes(": <AlertTriangle"),
    "status must not be carried by colour alone",
  );
});

// ── Vocabulary adapts to the programme ──────────────────────────────────────

test("the overview names the structure node from the programme definition", () => {
  const overview = source(OVERVIEW);
  assert.ok(
    overview.includes("vocabulary.labelFor(vocabulary.nodes[0]?.key"),
    "the structure label must come from the definition",
  );
  // Comments stripped: the file's own header explains the behaviour by naming
  // the word it must not hardcode.
  const code = overview.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.ok(
    !/["'`]Themes["'`]/.test(code),
    "the overview must not hardcode 'Themes' — a subject programme says 'Subjects'",
  );
});

test("the structure page renders the definition's own words", () => {
  const structure = source("components/school-admin/themes/themes-workspace.tsx");
  assert.ok(structure.includes("useCurriculumContext"), "structure must resolve the vocabulary");
  assert.ok(structure.includes("nodeLabel"), "its heading must use the resolved label");
  assert.ok(
    structure.includes('title="Structure"'),
    "the page is Structure — the noun below it is what varies",
  );
});

test("a subject-based definition drives entirely different labels", () => {
  // The behavioural half: same code, different programme, different words.
  const themed = vocabularyFrom(
    {
      source: "compiled", lesson_noun: "teaching day", level_noun: "level",
      nodes: [
        { key: "theme", label: "Theme", depth: 0, is_required: true },
        { key: "topic", label: "Topic", depth: 1, is_required: false },
      ],
    },
    undefined,
  );
  const subjects = vocabularyFrom(
    {
      source: "structure", lesson_noun: "lesson", level_noun: "grade",
      nodes: [
        { key: "subject", label: "Subject", depth: 0, is_required: true },
        { key: "unit", label: "Unit", depth: 1, is_required: true },
      ],
    },
    undefined,
  );
  assert.equal(themed.labelFor(themed.nodes[0].key), "Theme");
  assert.equal(subjects.labelFor(subjects.nodes[0].key), "Subject");
  assert.equal(themed.levelNoun, "level");
  assert.equal(subjects.levelNoun, "grade");
});

// ── Context is resolved once ────────────────────────────────────────────────

test("the programme comes from the level rather than a separate picker", () => {
  const context = source("lib/use-curriculum-context.ts");
  assert.ok(
    context.includes("useCurriculumVocabulary(level?.programmeId)"),
    "choosing a level already chooses the programme",
  );
  assert.ok(
    !context.includes("useState"),
    "the context must be derived, not a fourth piece of local state",
  );
});

test("curriculum context is URL-owned so the overview is linkable", () => {
  const overview = source(OVERVIEW);
  assert.ok(overview.includes("useSearchParams"), "level and month must live in the URL");
  assert.ok(
    overview.includes("router.replace"),
    "context changes must not push a history entry per dropdown change",
  );
});

// ── Empty states teach ──────────────────────────────────────────────────────

test("the empty state explains what is missing and offers the next action", () => {
  const overview = source(OVERVIEW);
  assert.ok(
    overview.includes("No teaching days planned for"),
    "an empty month must say so specifically, not 'No data'",
  );
  assert.ok(
    /nextAction\.href[\s\S]{0,400}nextAction\.label/.test(overview),
    "the empty state must carry the same primary action",
  );
});
