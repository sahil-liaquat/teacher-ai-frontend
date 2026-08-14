import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  curriculumHref,
  lessonIssues,
  lessonStatus,
  resourceCount,
} from "../../lib/school-admin-curriculum.ts";
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

test("school curriculum readiness reports actionable incomplete states", () => {
  const ready = lesson();
  assert.deepEqual(lessonIssues(ready), []);
  assert.equal(lessonStatus(ready), "ready");
  assert.equal(resourceCount(ready), 1);

  const incomplete = lesson({ objectives: [], steps: [{ ...ready.steps[0], instructions: [], resource_ids: [] }] });
  assert.equal(lessonStatus(incomplete), "needs_attention");
  assert.match(lessonIssues(incomplete).join(" "), /learning objective/);
  assert.match(lessonIssues(incomplete).join(" "), /teacher instructions/);
  assert.match(lessonIssues(incomplete).join(" "), /resources/);

  assert.equal(lessonStatus(lesson({ status: "published" })), "published");
});

test("curriculum context and selected day are deep-linkable", () => {
  const href = curriculumHref({ year: "year-a", level: "nursery", month: 9, day: "lesson-a", issue: "resources" });
  assert.equal(href, "/school-admin/curriculum?year=year-a&level=nursery&month=9&day=lesson-a&issue=resources");
});

test("overview is operational rather than an analytics dashboard", () => {
  const overview = source("components/school-admin/overview/school-admin-overview.tsx");
  assert.match(overview, /Needs attention/);
  assert.match(overview, /Drafts waiting/);
  assert.match(overview, /Missing resources/);
  assert.match(overview, /curriculumHref/);
  assert.doesNotMatch(overview, /Revenue|Engagement chart|Resource Mapping/);
});

test("curriculum is week-based and mobile switches to a day list", () => {
  const workspace = source("components/school-admin/curriculum/curriculum-workspace.tsx");
  const card = source("components/school-admin/curriculum/curriculum-day-card.tsx");
  assert.match(workspace, /WEEKS\.map/);
  assert.match(workspace, /xl:hidden/);
  assert.match(workspace, /updateContext/);
  assert.match(card, /Needs attention|lessonStatus/);
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
  assert.match(source("app/school-admin/themes/page.tsx"), /ThemesWorkspace/);
  assert.match(source("app/school-admin/resources/page.tsx"), /ResourcesWorkspace/);
  assert.match(source("app/school-admin/academic-years/page.tsx"), /AcademicYearsWorkspace/);
  const settings = source("components/school-admin/settings/settings-workspace.tsx");
  // Settings now spans the full academic architecture, so the old "only
  // settings backed by real behavior appear here" claim no longer holds — the
  // sections DO appear. The guarantee it protected is unchanged and stronger:
  // a section that cannot be configured says so rather than rendering a
  // control the product will not honour.
  assert.match(settings, /Not configurable here yet/);
  assert.match(settings, /NotConfigurableYet/);
  assert.doesNotMatch(settings, /type="checkbox"|Save settings/);
});
