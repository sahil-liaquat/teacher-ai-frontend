import assert from "node:assert/strict";
import test from "node:test";

import {
  dayTemplateOptions,
  previousDayInMonth,
  stepsFromLesson,
  templateSteps,
  type DayTemplateId,
} from "../../lib/primary-day-templates.ts";
import { STEP_TYPES, validateSteps } from "../../lib/primary-authoring.ts";
import type { PrimaryCurriculumLesson } from "../../lib/api.ts";

const PRESETS: DayTemplateId[] = [
  "standard_routine", "story_activity", "worksheet_focus",
  "assessment_recap", "jkscert_full_day",
];

test("every migrated preset produces blocks the server would accept", () => {
  // `StepInput` requires a non-blank title and a duration in 1..120, and a
  // failing step 422s the WHOLE steps array — so a bad preset would make its
  // template silently unusable rather than partially applied.
  for (const id of PRESETS) {
    const steps = templateSteps(id);
    assert.ok(steps.length, `${id} produced no blocks`);
    assert.deepEqual(validateSteps(steps), [], `${id} has invalid blocks`);
  }
});

test("preset blocks only use step types the backend knows", () => {
  for (const id of PRESETS) {
    for (const step of templateSteps(id)) {
      assert.ok(
        (STEP_TYPES as readonly string[]).includes(step.step_type),
        `${id} uses unknown step type ${step.step_type}`,
      );
    }
  }
});

test("no preset carries an objective index", () => {
  // ⚠ The reason the old panel seeded fake objectives. `LessonCreate` validates
  // objective_indexes against the lesson's objectives, so a template shipping
  // `[0]` 422s on a day that has none yet — and "fixing" that by inventing
  // objectives left "Introduce key theme vocabulary" and vocabulary "cow",
  // "farm" on every day an author created.
  for (const id of PRESETS) {
    for (const step of templateSteps(id)) {
      assert.deepEqual(step.objective_indexes, [], `${id} would 422 on a fresh day`);
    }
  }
});

test("no preset attaches a resource or presumes a category", () => {
  // A template supplies structure. Attaching printables would bind master
  // catalog ids into a school's day before the author has chosen anything.
  for (const id of PRESETS) {
    for (const step of templateSteps(id)) {
      assert.deepEqual(step.resource_ids, []);
      assert.equal(step.resource_category, null);
    }
  }
});

test("preset blocks are numbered contiguously from zero", () => {
  // `StepsReplaceRequest.positions_must_be_contiguous_from_zero`.
  for (const id of PRESETS) {
    const positions = templateSteps(id).map((step) => step.position);
    assert.deepEqual(positions, positions.map((_, index) => index), id);
  }
});

test("the JKSCERT full day keeps all eleven blocks", () => {
  const steps = templateSteps("jkscert_full_day");
  assert.equal(steps.length, 11);
  assert.equal(steps.reduce((total, step) => total + step.duration_minutes, 0), 200);
  assert.equal(steps[0].title, "Circle Time (Welcome, prayer, calendar, conversation, rhyme)");
});

test("a blank day is genuinely blank", () => {
  assert.deepEqual(templateSteps("blank"), []);
});

test("an unknown template id yields no blocks rather than throwing", () => {
  assert.deepEqual(templateSteps("nonsense" as DayTemplateId), []);
});

// ── Copying an existing day ─────────────────────────────────────────────────

function lesson(overrides: Partial<PrimaryCurriculumLesson> = {}): PrimaryCurriculumLesson {
  return {
    id: "source", scope: "school", theme_id: "theme-1", level: "nursery",
    version: 1, status: "published", objectives: ["Old objective"],
    vocabulary: [], assessment_questions: [], week: 1, day: 1,
    steps: [
      {
        id: "server-step-2", position: 1, step_type: "story", title: "Story Time",
        instructions: ["Read aloud"], duration_minutes: 20, objective_indexes: [0],
        resource_category: "Story Cards", resource_ids: ["a-story-card"],
        child_action: [], required_resource_ids: [], optional_resource_ids: [], details: { story_text: "…" },
      },
      {
        id: "server-step-1", position: 0, step_type: "circle_time", title: "Circle Time",
        instructions: ["Gather round"], duration_minutes: 10, objective_indexes: [0],
        resource_category: null, resource_ids: [],
        child_action: [], required_resource_ids: [], optional_resource_ids: [], details: {},
      },
    ],
    ...overrides,
  } as PrimaryCurriculumLesson;
}

test("copying a day keeps its blocks, in order, with content intact", () => {
  const steps = stepsFromLesson(lesson());
  assert.deepEqual(steps.map((step) => step.title), ["Circle Time", "Story Time"]);
  assert.deepEqual(steps[1].instructions, ["Read aloud"]);
  assert.deepEqual(steps[1].resource_ids, ["a-story-card"]);
  assert.equal(steps[1].resource_category, "Story Cards");
  assert.deepEqual(steps[1].details, { story_text: "…" });
});

test("copying a day drops the source rows' server ids", () => {
  // These are primary keys of ANOTHER lesson's step rows. Sending them inside a
  // create payload is at best ignored and at worst read as an instruction about
  // rows this day does not own.
  for (const step of stepsFromLesson(lesson())) {
    assert.equal(step.id, undefined);
  }
});

test("copying a day drops objective indexes pointing at the source's objectives", () => {
  for (const step of stepsFromLesson(lesson())) {
    assert.deepEqual(step.objective_indexes, []);
  }
});

test("copied blocks are renumbered from zero", () => {
  assert.deepEqual(stepsFromLesson(lesson()).map((step) => step.position), [0, 1]);
});

test("copying an empty or missing day yields nothing", () => {
  assert.deepEqual(stepsFromLesson(null), []);
  assert.deepEqual(stepsFromLesson(undefined), []);
  assert.deepEqual(stepsFromLesson(lesson({ steps: [] })), []);
});

test("copied blocks do not alias the source's arrays", () => {
  // Two lessons sharing one array would let editing the copy mutate the source
  // in the cache — invisibly, until the next save wrote both.
  const source = lesson();
  const copied = stepsFromLesson(source);
  copied[1].instructions.push("Extra line");
  assert.deepEqual(source.steps.find((step) => step.title === "Story Time")?.instructions, ["Read aloud"]);
});

// ── The option list ─────────────────────────────────────────────────────────

test("presets are always offered and blank is among them", () => {
  const ids = dayTemplateOptions({}).map((option) => option.id);
  for (const id of PRESETS) assert.ok(ids.includes(id), `${id} missing`);
  assert.ok(ids.includes("blank"));
});

test("copy options are hidden when there is nothing to copy", () => {
  // A greyed-out row invites a click that explains nothing.
  const ids = dayTemplateOptions({}).map((option) => option.id);
  assert.ok(!ids.includes("copy_previous"));
  assert.ok(!ids.includes("copy_existing"));
});

test("copy previous appears only when the previous day has blocks", () => {
  assert.ok(
    !dayTemplateOptions({ previousDay: lesson({ steps: [] }) })
      .some((option) => option.id === "copy_previous"),
  );
  const offered = dayTemplateOptions({ previousDay: lesson() });
  const copyPrevious = offered.find((option) => option.id === "copy_previous");
  assert.ok(copyPrevious);
  assert.equal(copyPrevious.blocks, 2);
  assert.equal(copyPrevious.minutes, 30);
});

test("copy existing appears when any other day this month has blocks", () => {
  const ids = dayTemplateOptions({ otherDays: [lesson()] }).map((option) => option.id);
  assert.ok(ids.includes("copy_existing"));
});

test("every option reports the block count and minutes it will create", () => {
  for (const option of dayTemplateOptions({})) {
    const steps = templateSteps(option.id);
    assert.equal(option.blocks, steps.length, option.id);
    assert.equal(option.minutes, steps.reduce((total, step) => total + step.duration_minutes, 0), option.id);
  }
});

// ── Locating the previous day ───────────────────────────────────────────────

test("the previous day is the one before it in the same week", () => {
  const days = [lesson({ id: "w2d2", week: 2, day: 2 }), lesson({ id: "w2d1", week: 2, day: 1 })];
  assert.equal(previousDayInMonth(days, 2, 3)?.id, "w2d2");
});

test("the previous day of a Monday is the Friday before", () => {
  const days = [lesson({ id: "w1d5", week: 1, day: 5 })];
  assert.equal(previousDayInMonth(days, 2, 1)?.id, "w1d5");
});

test("the first day of the month has no previous day", () => {
  assert.equal(previousDayInMonth([lesson()], 1, 1), null);
});

test("an unplanned previous slot yields nothing rather than a wrong day", () => {
  assert.equal(previousDayInMonth([lesson({ week: 1, day: 1 })], 1, 4), null);
});
