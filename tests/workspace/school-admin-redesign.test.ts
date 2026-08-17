import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  DAY_STATUS_LABELS,
  blockingIssues,
  dayStatus,
  focusTarget,
  isPublishable,
} from "../../lib/curriculum-readiness.ts";
import { curriculumHref, resourceCount } from "../../lib/school-admin-curriculum.ts";
import {
  academicYearState,
  ownershipLabel,
  ownershipOf,
  resourceUsages,
  themeLessons,
} from "../../lib/school-admin-support.ts";

function source(relativePath: string) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

function lesson(overrides: Record<string, unknown> = {}) {
  return {
    id: "lesson-a",
    scope: "school",
    organization_id: "school-a",
    source_lesson_id: "master-a",
    theme_id: "theme-a",
    academic_year_id: "year-a",
    topic_id: null,
    title: "Parts of My Body",
    daily_focus: "Identify common body parts",
    month: 9,
    week: 1,
    day: 1,
    level: "nursery",
    version: 1,
    status: "draft",
    objectives: ["Identify common body parts"],
    vocabulary: [],
    assessment_questions: [],
    steps: [{
      id: "step-a",
      position: 0,
      step_type: "circle_time",
      title: "Circle Time",
      instructions: ["Welcome the children."],
      duration_minutes: 20,
      objective_indexes: [0],
      resource_category: "Flashcards",
      resource_ids: ["resource-a"],
      details: {},
    }],
    ...overrides,
  } as any;
}

test("school curriculum readiness comes from the server, and is actionable", () => {
  // Was two assertions over a frontend-only `lessonIssues` rule that the publish
  // endpoint did not share. The contract now under test is the one that matters:
  // whatever the server says is what the UI shows, and every failure carries a
  // message and somewhere to go.
  const incomplete = lesson({
    readiness: {
      ready: false,
      blocking_count: 2,
      checks: [
        { key: "objectives", label: "Learning objectives", ok: false, severity: "blocking", detail: "Add at least one learning objective.", field: "objectives" },
        { key: "step_instructions:1", label: "Story Time — teacher instructions", ok: false, severity: "blocking", detail: "“Story Time” has no teacher instructions.", step_position: 1 },
      ],
    },
  });

  assert.equal(dayStatus(incomplete), "needs_attention");
  assert.equal(isPublishable(incomplete), false);
  assert.equal(blockingIssues(incomplete).length, 2);
  for (const issue of blockingIssues(incomplete)) {
    assert.ok(issue.detail, `${issue.key} has no message`);
    assert.ok(focusTarget(issue), `${issue.key} is a dead end`);
  }
  assert.equal(focusTarget(blockingIssues(incomplete)[1]), "block:1");

  const ready = lesson({ readiness: { ready: true, blocking_count: 0, checks: [] } });
  assert.equal(dayStatus(ready), "ready");
  assert.equal(isPublishable(ready), true);
  assert.deepEqual(blockingIssues(ready), []);
  assert.equal(dayStatus(lesson({ status: "published" })), "published");
});

test("curriculum context and selected day are deep-linkable", () => {
  const href = curriculumHref({ year: "year-a", level: "nursery", month: 9, day: "lesson-a", issue: "resources" });
  assert.equal(href, "/school-admin/curriculum?year=year-a&level=nursery&month=9&day=lesson-a&issue=resources");
});

test("overview is operational rather than an analytics dashboard", () => {
  // ⚠ Rewritten for the command centre. This asserted two named cards —
  // "Drafts waiting" and "Missing resources" — from the original layout. Both
  // are now entries in one computed attention list, which drops any item with
  // nothing to report rather than showing a reassuring zero.
  //
  // The INTENT is unchanged and is what is asserted here: the page reports
  // things to do, each with somewhere to go, and no vanity metrics.
  const overview = source("components/school-admin/overview/school-admin-overview.tsx");
  assert.match(overview, /Needs attention/);
  assert.match(overview, /const attention = \[/, "attention must be computed, not hardcoded");
  // Asserted on the computed value, not the rendered phrase: the wording
  // splits across a singular/plural template expression.
  assert.match(overview, /missingResources/, "resource gaps must still surface");
  assert.match(overview, /resourceIssues\(/, "and must use the one shared rule");
  assert.match(overview, /curriculumHref/, "items must deep-link into curriculum");
  assert.doesNotMatch(overview, /Revenue|Engagement chart|Resource Mapping/);
});

test("curriculum is week-based and mobile switches to a day list", () => {
  const workspace = source("components/school-admin/curriculum/curriculum-workspace.tsx");
  assert.match(workspace, /WEEKS\.map/);
  assert.match(workspace, /xl:hidden/);
  assert.match(workspace, /updateContext/);
});

test("every grid cell state has a distinct label", () => {
  // Was a source regex over the day card asserting the literal "Needs attention"
  // appeared in that file. It broke the moment the labels moved into the shared
  // readiness module — while the behaviour was fine — and it would equally have
  // PASSED if the card had stopped rendering the label at all. Assert the thing
  // that actually matters: the five states an author has to tell apart are all
  // named, and no two share a name.
  const labels = Object.values(DAY_STATUS_LABELS);
  assert.equal(labels.length, 5);
  assert.equal(new Set(labels).size, 5, "two states share a label");
  assert.deepEqual(
    Object.keys(DAY_STATUS_LABELS).sort(),
    ["draft", "needs_attention", "not_started", "published", "ready"],
  );
});

test("day editor uses progressive block editing and safe publishing", () => {
  const editor = source("components/school-admin/day-editor/school-day-editor.tsx");
  assert.match(editor, /What will the teacher do\?/);
  assert.match(editor, /What are children learning\?/);
  assert.match(editor, /What will the teacher need\?/);
  assert.match(editor, /Move up/);
  assert.match(editor, /Move down/);
  assert.match(editor, /Review changes/);
  assert.match(editor, /Publish to teachers/);
  // The shared editor delegates writes to the route-selected ownership adapter.
  assert.match(editor, /adapter\.publishLesson/);
  assert.match(editor, /adapter\.duplicateLesson/);
  assert.match(editor, /scope === "school"/);
  assert.match(editor, /Edit as a new draft/);
  assert.doesNotMatch(editor, /setStage|stage === 4/);
});

test("Phase 2 ownership and usage follow real inherited relationships", () => {
  const masterTheme = { id: "theme-master", scope: "platform" } as any;
  const schoolTheme = { id: "theme-school", scope: "school", source_theme_id: "theme-master" } as any;
  const inherited = lesson({ theme_id: "theme-master" });
  assert.equal(ownershipLabel(ownershipOf(masterTheme)), "TeachPad");
  assert.equal(ownershipLabel(ownershipOf(schoolTheme)), "Customized");
  assert.equal(themeLessons(schoolTheme, [inherited]).length, 1);

  const resource = { id: "resource-school", scope: "school", source_resource_id: "resource-a" } as any;
  const usage = resourceUsages(resource, [inherited]);
  assert.equal(usage.length, 1);
  assert.match(usage[0].href, /day=lesson-a/);
  assert.match(usage[0].href, /block=step-a/);
});

test("academic year state makes the active year unambiguous", () => {
  assert.equal(academicYearState({ is_active: true, starts_on: "2020-01-01", ends_on: "2020-12-31" } as any), "current");
  assert.equal(academicYearState({ is_active: false, starts_on: "2020-01-01", ends_on: "2020-12-31" } as any, new Date("2026-01-01")), "completed");
  assert.equal(academicYearState({ is_active: false, starts_on: "2027-01-01", ends_on: "2027-12-31" } as any, new Date("2026-01-01")), "planning");
});

test("Phase 2 routes use school-admin workspaces instead of legacy authoring panels", () => {
  assert.match(source("app/school-admin/(shell)/themes/page.tsx"), /ThemesWorkspace/);
  assert.match(source("app/school-admin/(shell)/resources/page.tsx"), /ResourcesWorkspace/);
  assert.match(source("app/school-admin/(shell)/academic-years/page.tsx"), /AcademicYearsWorkspace/);
  const settings = source("components/school-admin/settings/settings-workspace.tsx");
  // ⚠ Rewritten twice now. It first asserted that unconfigurable sections were
  // absent; then that they appeared with a `NotConfigurableYet` panel. Both
  // encoded a mechanism. The guarantee underneath has never changed: a school
  // must never be shown a control the product will not honour.
  //
  // Settings now states availability on the INDEX, before the click, so an
  // area with nothing behind it is not even a link — which serves the same
  // guarantee one navigation earlier.
  assert.match(settings, /availability === "unavailable"/, "emptiness is declared");
  assert.match(settings, /Not available yet/, "and stated in words");
  assert.match(settings, /View only/, "read-only is distinguished from missing");
});
