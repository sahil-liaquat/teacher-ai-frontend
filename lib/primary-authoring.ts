import type { PrimaryCurriculumStep } from "@/lib/api";

export type StepDraft = Omit<PrimaryCurriculumStep, "id"> & { id?: string };

// The only categories present in the catalog. Anything else matches zero
// printables, so this is a select, never a text field.
export const RESOURCE_CATEGORIES = [
  "Flashcards", "Colouring Pages", "Worksheets", "Tracing Sheets",
  "Matching Activities", "Picture Talk Cards", "Vocabulary Cards",
  "Story Cards", "Circle Time Prompts", "Calendar Activities",
] as const;

export const STEP_TYPES = [
  "warm_up", "introduction", "story_or_rhyme", "picture_talk",
  "classroom_activity", "worksheet", "assessment", "movement", "routine",
] as const;

/** The server rejects a gap in positions, so every mutation renumbers. */
export function renumberSteps(steps: StepDraft[]): StepDraft[] {
  return steps.map((step, index) => ({ ...step, position: index }));
}

export function moveStep(steps: StepDraft[], from: number, to: number): StepDraft[] {
  if (from === to) return steps;
  if (from < 0 || to < 0 || from >= steps.length || to >= steps.length) return steps;
  const next = [...steps];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return renumberSteps(next);
}

/** A brand-new, unsaved step — mirrors the server's defaults for a fresh row. */
export function createStepDraft(position: number): StepDraft {
  return {
    position,
    step_type: "warm_up",
    title: "",
    instructions: [],
    duration_minutes: 10,
    objective_indexes: [],
    resource_category: null,
  };
}

/**
 * Splits a line-per-entry textarea into a clean list: trims each line, drops
 * blanks. Only run at submit time, not on every keystroke — filtering blank
 * lines as the admin types would eat the newline the moment they press Enter.
 */
export function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Strips blank instruction lines/titles and renumbers before a save call. */
export function sanitizeStepsForSubmit(steps: StepDraft[]): StepDraft[] {
  return renumberSteps(
    steps.map((step) => ({
      ...step,
      title: step.title.trim(),
      instructions: step.instructions.map((line) => line.trim()).filter(Boolean),
    }))
  );
}

export type StepValidationError = {
  index: number;
  field: "title" | "duration_minutes";
  message: string;
};

const MAX_TITLE_LENGTH = 255;
const MIN_DURATION_MINUTES = 1;
const MAX_DURATION_MINUTES = 120;

/**
 * Mirrors the backend's `StepInput` constraints exactly
 * (`backend/app/schemas/primary_admin.py`: `title` is
 * `Field(..., min_length=1, max_length=255)`, `duration_minutes` is
 * `Field(..., ge=1, le=120)`). A step that fails these 422s the *entire*
 * steps array on save — not just that row — so this must run before the
 * network call, not after, and it must say which step and field is wrong.
 */
export function validateSteps(steps: StepDraft[]): StepValidationError[] {
  const errors: StepValidationError[] = [];
  steps.forEach((step, index) => {
    const title = step.title.trim();
    if (!title) {
      errors.push({ index, field: "title", message: `Step ${index + 1}: title can't be blank.` });
    } else if (title.length > MAX_TITLE_LENGTH) {
      errors.push({
        index,
        field: "title",
        message: `Step ${index + 1}: title is too long (max ${MAX_TITLE_LENGTH} characters).`,
      });
    }
    const duration = step.duration_minutes;
    if (
      typeof duration !== "number" ||
      !Number.isFinite(duration) ||
      duration < MIN_DURATION_MINUTES ||
      duration > MAX_DURATION_MINUTES
    ) {
      errors.push({
        index,
        field: "duration_minutes",
        message: `Step ${index + 1}: duration must be between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES} minutes.`,
      });
    }
  });
  return errors;
}
