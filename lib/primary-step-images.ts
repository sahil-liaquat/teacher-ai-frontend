import type { PrimaryStepType } from "@/lib/api";

const STEP_IMAGE_ROOT = "/assets/primary/steps";

/**
 * Default classroom-plan artwork for every step type an admin can author.
 * These are deliberately independent of theme and resource attachments: the
 * step type controls the card's visual identity everywhere in Primary.
 */
export const PRIMARY_STEP_IMAGES: Record<PrimaryStepType, string> = {
  warm_up: `${STEP_IMAGE_ROOT}/warm-up.webp`,
  introduction: `${STEP_IMAGE_ROOT}/introduction.webp`,
  story_or_rhyme: `${STEP_IMAGE_ROOT}/story-or-rhyme.webp`,
  picture_talk: `${STEP_IMAGE_ROOT}/picture-talk.webp`,
  classroom_activity: `${STEP_IMAGE_ROOT}/classroom-activity.webp`,
  worksheet: `${STEP_IMAGE_ROOT}/worksheet.webp`,
  assessment: `${STEP_IMAGE_ROOT}/assessment.webp`,
  movement: `${STEP_IMAGE_ROOT}/movement.webp`,
  routine: `${STEP_IMAGE_ROOT}/routine.webp`,
  circle_time: `${STEP_IMAGE_ROOT}/circle-time.webp`,
  story: `${STEP_IMAGE_ROOT}/story.webp`,
  flashcards: `${STEP_IMAGE_ROOT}/flashcards.webp`,
  craft: `${STEP_IMAGE_ROOT}/craft.webp`,
  song: `${STEP_IMAGE_ROOT}/song.webp`,
  game: `${STEP_IMAGE_ROOT}/game.webp`,
  reflection: `${STEP_IMAGE_ROOT}/reflection.webp`,
  parent_note: `${STEP_IMAGE_ROOT}/parent-note.webp`,
  arrival_routine: `${STEP_IMAGE_ROOT}/routine.webp`,
  free_play: `${STEP_IMAGE_ROOT}/game.webp`,
  story_rhyme_picture_talk: `${STEP_IMAGE_ROOT}/story-or-rhyme.webp`,
  concept_exploration: `${STEP_IMAGE_ROOT}/introduction.webp`,
  classroom_activity_game: `${STEP_IMAGE_ROOT}/classroom-activity.webp`,
  practice: `${STEP_IMAGE_ROOT}/worksheet.webp`,
};

export function primaryStepImage(stepType?: string | null): string | undefined {
  if (!stepType) return undefined;
  return PRIMARY_STEP_IMAGES[stepType as PrimaryStepType];
}
