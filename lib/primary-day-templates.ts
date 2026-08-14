import type { PrimaryCurriculumLesson, PrimaryStepType } from "@/lib/api";
// Relative with the extension, like `school-admin-support.ts`: the node test
// runner resolves no `@/` alias, and unlike a type-only import this one is a
// real value import that survives type stripping.
import { createStepDraft, renumberSteps, type StepDraft } from "./primary-authoring.ts";

/**
 * Day templates — the block skeletons an author starts a teaching day from.
 *
 * Migrated verbatim from `components/admin/master-curriculum/curriculum-panel.tsx`,
 * which stopped being routed when Design Curriculum moved onto the shared
 * `CurriculumWorkspace`. The block sequences were real authored content and the
 * only thing in that file worth keeping; everything around them was not.
 *
 * ⚠ Two things were deliberately NOT carried across:
 *
 * 1. `objective_indexes: [0]`. `LessonCreate.objective_indexes_must_point_at_a_real_objective`
 *    rejects an index with no matching objective, so a template carrying `[0]`
 *    422s against a day that has no objectives yet. The old panel worked around
 *    that by seeding fake objectives ("Introduce key theme vocabulary") and
 *    placeholder vocabulary ("cow", "farm") into every day it created — content
 *    an author then had to find and delete. Templates supply structure; the
 *    author supplies meaning, and an empty `objective_indexes` is valid at every
 *    stage.
 *
 * 2. The theme default. Every creation path in that file resolved the theme as
 *    `selectedThemeId || themes[0]?.id`, silently stamping the first active
 *    theme onto the day. Theme is the resource matcher's dominant facet
 *    (THEME_WEIGHT=8) and the axis the teacher picks along, so it is now an
 *    explicit required choice in the create dialog. A template never chooses it.
 */

export type DayTemplateId =
  | "blank"
  | "standard_routine"
  | "story_activity"
  | "worksheet_focus"
  | "assessment_recap"
  | "jkscert_full_day"
  | "copy_previous"
  | "copy_existing";

export type DayTemplate = {
  id: DayTemplateId;
  label: string;
  description: string;
  /** Total taught minutes, derived — never hand-maintained alongside the blocks. */
  minutes: number;
  blocks: number;
  /** Templates that copy an existing day resolve their blocks at pick time. */
  kind: "preset" | "copy";
};

type PresetStep = {
  step_type: PrimaryStepType;
  title: string;
  instructions: string[];
  duration_minutes: number;
};

const PRESETS: Record<string, PresetStep[]> = {
  standard_routine: [
    { step_type: "routine", title: "Arrival & Greeting", instructions: ["Welcome children warmly as they arrive.", "Help them store bags and settle in."], duration_minutes: 10 },
    { step_type: "circle_time", title: "Circle Time discussion", instructions: ["Gather children in a circle.", "Take attendance and discuss theme keywords."], duration_minutes: 10 },
    { step_type: "classroom_activity", title: "Exploratory Sensory Activity", instructions: ["Guide children through sensory stations."], duration_minutes: 20 },
    { step_type: "routine", title: "Cleanup & Dismissal", instructions: ["Pack bag and cleanup the classroom.", "Sing goodbye song."], duration_minutes: 10 },
  ],
  story_activity: [
    { step_type: "warm_up", title: "Warm-up Song", instructions: ["Perform an interactive movement song to activate body."], duration_minutes: 10 },
    { step_type: "story", title: "Theme Story Telling", instructions: ["Read story aloud using picture cards.", "Ask reflective questions about characters."], duration_minutes: 20 },
    { step_type: "classroom_activity", title: "Sensory Roleplay Activity", instructions: ["Divide children in pairs.", "Act out scenes from the story."], duration_minutes: 25 },
    { step_type: "routine", title: "Goodbye song", instructions: ["Recap story lessons.", "Sing goodbye song."], duration_minutes: 10 },
  ],
  worksheet_focus: [
    { step_type: "warm_up", title: "Warm-up Recall", instructions: ["Review vocabulary matching from previous lesson."], duration_minutes: 10 },
    { step_type: "introduction", title: "Concept Introduction", instructions: ["Draw concepts on the board.", "Demonstrate tracing strokes."], duration_minutes: 15 },
    { step_type: "worksheet", title: "Printable Worksheet", instructions: ["Hand out worksheets.", "Support individual tracing work."], duration_minutes: 20 },
    { step_type: "routine", title: "Class cleanup", instructions: ["Gather materials.", "Rate achievements."], duration_minutes: 15 },
  ],
  assessment_recap: [
    { step_type: "circle_time", title: "Weekly review", instructions: ["Ask volunteers to define theme keywords."], duration_minutes: 15 },
    { step_type: "assessment", title: "Individual Checkpoint", instructions: ["Conduct quick 1-on-1 assessment worksheets.", "Mark observations record."], duration_minutes: 25 },
    { step_type: "reflection", title: "Reflective goodbye", instructions: ["Sing matching goodbye song."], duration_minutes: 10 },
  ],
  jkscert_full_day: [
    { step_type: "circle_time", title: "Circle Time (Welcome, prayer, calendar, conversation, rhyme)", instructions: ["Welcome children and open with a short prayer.", "Mark the calendar and date together.", "Discuss theme keywords and let volunteers share."], duration_minutes: 15 },
    { step_type: "free_play", title: "Free Play / Learning Corners", instructions: ["Let children explore learning corners freely.", "Observe and note each child's choices."], duration_minutes: 15 },
    { step_type: "classroom_activity", title: "Theme Activity / Numeracy", instructions: ["Run the day's theme-based numeracy activity.", "Support children at different levels."], duration_minutes: 20 },
    { step_type: "routine", title: "Snack", instructions: ["Wash hands before snack.", "Supervise snack time and table manners."], duration_minutes: 15 },
    { step_type: "movement", title: "Music & Movement", instructions: ["Sing theme rhymes and follow with movement.", "Encourage participation and expression."], duration_minutes: 15 },
    { step_type: "story", title: "Story Time / Emergent Literacy", instructions: ["Read aloud from the theme storybook.", "Ask questions about characters and sequence."], duration_minutes: 20 },
    { step_type: "craft", title: "Art & Craft", instructions: ["Guide children through the theme craft activity.", "Display finished work on the wall."], duration_minutes: 20 },
    { step_type: "practice", title: "Independent Learning Corners", instructions: ["Children practise skills independently at stations.", "Circulate and support where needed."], duration_minutes: 20 },
    { step_type: "routine", title: "Lunch", instructions: ["Wash hands before lunch.", "Supervise lunch and tidy up afterwards."], duration_minutes: 30 },
    { step_type: "movement", title: "Outdoor Play", instructions: ["Supervise outdoor free play.", "Encourage sharing and safe play."], duration_minutes: 20 },
    { step_type: "reflection", title: "Goodbye Circle / Reflection", instructions: ["Recap the day's learning with children.", "Sing the goodbye song and share the parent update."], duration_minutes: 10 },
  ],
};

const LABELS: Record<string, { label: string; description: string }> = {
  blank: { label: "Blank Day", description: "Start with no blocks and build the flow yourself." },
  standard_routine: { label: "Standard Routine", description: "Arrival, circle time, one activity, cleanup." },
  story_activity: { label: "Story and Activity Day", description: "Warm-up song, story telling, roleplay, goodbye." },
  worksheet_focus: { label: "Worksheet-focused Day", description: "Recall, concept introduction, printable, cleanup." },
  assessment_recap: { label: "Assessment and Recap Day", description: "Weekly review, individual checkpoint, reflection." },
  jkscert_full_day: { label: "JKSCERT Full Day", description: "The full eleven-block JKSCERT early-years timetable." },
  copy_previous: { label: "Copy Previous Day", description: "Start from the day before this one, blocks and all." },
  copy_existing: { label: "Copy Existing Day", description: "Start from any other planned day this month." },
};

/** Blocks for a preset, as unsaved step drafts ready for `LessonCreate.steps`. */
export function templateSteps(id: DayTemplateId): StepDraft[] {
  const preset = PRESETS[id];
  if (!preset) return [];
  return renumberSteps(preset.map((step, index) => ({
    ...createStepDraft(index),
    step_type: step.step_type,
    title: step.title,
    instructions: [...step.instructions],
    duration_minutes: step.duration_minutes,
  })));
}

/**
 * Copy the authored content of an existing day, dropping everything that
 * identifies the day it came from.
 *
 * ⚠ Step `id`s are stripped. They are server-assigned primary keys of the SOURCE
 * day's rows; sending them back inside a create payload would either be ignored
 * or, worse, read as an instruction about rows belonging to another lesson.
 * `objective_indexes` are dropped for the same reason they are absent from the
 * presets — they index into the source lesson's objectives, which the new day
 * does not have.
 */
export function stepsFromLesson(lesson: PrimaryCurriculumLesson | null | undefined): StepDraft[] {
  if (!lesson?.steps?.length) return [];
  return renumberSteps(
    [...lesson.steps]
      .sort((a, b) => a.position - b.position)
      .map((step, index) => ({
        ...createStepDraft(index),
        step_type: step.step_type,
        title: step.title,
        instructions: [...(step.instructions ?? [])],
        duration_minutes: step.duration_minutes,
        resource_category: step.resource_category ?? null,
        resource_ids: [...(step.resource_ids ?? [])],
        child_action: [...(step.child_action ?? [])],
        observation_point: step.observation_point ?? null,
        transition: step.transition ?? null,
        required_resource_ids: [...(step.required_resource_ids ?? [])],
        optional_resource_ids: [...(step.optional_resource_ids ?? [])],
        details: { ...(step.details ?? {}) },
      })),
  );
}

function presetSummary(id: DayTemplateId): { minutes: number; blocks: number } {
  const steps = PRESETS[id] ?? [];
  return {
    minutes: steps.reduce((total, step) => total + step.duration_minutes, 0),
    blocks: steps.length,
  };
}

/**
 * The "Start With" options, in the order the create dialog offers them.
 *
 * Copy options are omitted when there is nothing to copy, rather than shown
 * disabled: an author cannot act on "Copy Previous Day" when no previous day
 * exists, and a greyed row invites a click that explains nothing.
 */
export function dayTemplateOptions(context: {
  previousDay?: PrimaryCurriculumLesson | null;
  otherDays?: PrimaryCurriculumLesson[];
}): DayTemplate[] {
  const presets: DayTemplateId[] = [
    "standard_routine", "story_activity", "worksheet_focus",
    "assessment_recap", "jkscert_full_day", "blank",
  ];
  const options: DayTemplate[] = presets.map((id) => ({
    id,
    ...LABELS[id],
    ...presetSummary(id),
    kind: "preset" as const,
  }));

  if (context.previousDay?.steps?.length) {
    options.push({
      id: "copy_previous",
      ...LABELS.copy_previous,
      minutes: context.previousDay.steps.reduce((total, step) => total + step.duration_minutes, 0),
      blocks: context.previousDay.steps.length,
      kind: "copy",
    });
  }
  if ((context.otherDays ?? []).some((lesson) => lesson.steps?.length)) {
    options.push({ id: "copy_existing", ...LABELS.copy_existing, minutes: 0, blocks: 0, kind: "copy" });
  }
  return options;
}

/** The day immediately before (week, day) in the same month, if one is planned. */
export function previousDayInMonth(
  lessons: PrimaryCurriculumLesson[],
  week: number,
  day: number,
): PrimaryCurriculumLesson | null {
  const previous = day > 1 ? { week, day: day - 1 } : { week: week - 1, day: 5 };
  if (previous.week < 1) return null;
  return lessons.find((lesson) => lesson.week === previous.week && lesson.day === previous.day) ?? null;
}
