import type { PrimaryStepType } from "@/lib/api";

/**
 * Per-step-type authoring fields, stored on the step's free-form `details`
 * JSONB dict. One source of truth shared by:
 *  - the admin Classroom Flow editor (renders the inputs)
 *  - the teacher's block page (renders the saved values)
 *
 * The common fields (Activity Title, Duration, Learning Objectives,
 * Teacher Instructions) stay on the step's own columns — only the
 * type-specific extras live in `details`.
 */
export type StepDetailFieldType = "text" | "textarea" | "image" | "resource" | "resource_multi" | "list";

export type StepDetailField = {
  /** Key inside the step's `details` dict. */
  key: string;
  label: string;
  type: StepDetailFieldType;
  /** Optional inputs still render (with an "Optional" tag) but can be left empty. */
  optional?: boolean;
  placeholder?: string;
  /** Catalog display category ("Flashcards", "Story Cards", ...) used to pre-filter resource pickers. */
  category?: string;
  note?: string;
};

export const STEP_DETAIL_FIELDS: Partial<Record<PrimaryStepType, StepDetailField[]>> = {
  circle_time: [
    { key: "theme_conversation", label: "Theme Conversation", type: "textarea", placeholder: "Questions and prompts to open the conversation about today's theme…" },
    { key: "rhyme_resource_id", label: "Rhyme", type: "resource", note: "Pick the rhyme printable for the class to sing together." },
    { key: "supporting_flashcards", label: "Supporting Flashcards", type: "resource_multi", category: "Flashcards" },
    { key: "theme_image", label: "Theme Image", type: "image", placeholder: "https://…/theme-image.webp" },
    { key: "vocabulary_list", label: "Vocabulary List", type: "list" },
    { key: "youtube_url", label: "YouTube Video Link", type: "text", optional: true, placeholder: "https://youtube.com/… (action rhyme/video)" },
    { key: "media_links", label: "Media Links (YouTube/Images)", type: "list", optional: true, placeholder: "Add a video or image URL (https://…)" },
    { key: "teacher_notes", label: "Teacher Notes", type: "textarea", optional: true },
  ],
  free_play: [
    { key: "learning_areas", label: "Learning Areas", type: "list", placeholder: "e.g. Block area, Art corner, Pretend play…" },
    { key: "corner_instructions", label: "Corner Instructions", type: "textarea", placeholder: "How to set up and run each learning corner…" },
    { key: "materials_required", label: "Materials Required", type: "list" },
    { key: "observation_points", label: "Observation Points", type: "list" },
    { key: "media_links", label: "Media Links (YouTube/Images)", type: "list", optional: true, placeholder: "Add a video or image URL (https://…)" },
    { key: "teacher_notes", label: "Teacher Notes", type: "textarea", optional: true },
  ],
  story: [
    { key: "story_resource_id", label: "Story", type: "resource", category: "Story Cards", note: "Pick the story printable from the catalog." },
    { key: "story_text", label: "Story Text", type: "textarea", placeholder: "The full story to narrate…" },
    { key: "story_cover_image", label: "Story Cover Image", type: "image", placeholder: "https://…/story-cover.webp" },
    { key: "narration_audio", label: "Narration Audio", type: "text", placeholder: "https://…/narration.mp3" },
    { key: "props", label: "Props", type: "list" },
    { key: "supporting_picture_cards", label: "Supporting Picture / Sequence Cards", type: "resource_multi", category: "Picture Talk Cards" },
    { key: "youtube_url", label: "YouTube Video Link", type: "text", optional: true, placeholder: "https://youtube.com/… (story narration/animated story)" },
    { key: "media_links", label: "Media Links (YouTube/Images)", type: "list", optional: true, placeholder: "Add a video or image URL (https://…)" },
    { key: "teacher_notes", label: "Teacher Notes", type: "textarea", optional: true },
  ],
  numeracy_time: [
    { key: "activity_resource", label: "Activity Resource", type: "resource", note: "Pick the main numeracy activity printable." },
    { key: "printable_activity", label: "Printable Activity", type: "resource", category: "Worksheets" },
    { key: "manipulatives_required", label: "Manipulatives Required", type: "list", placeholder: "e.g. Counters, number cards, abacus…" },
    { key: "youtube_url", label: "YouTube Video Link", type: "text", optional: true, placeholder: "https://youtube.com/… (demonstration/counting activity)" },
    { key: "media_links", label: "Media Links (YouTube/Images)", type: "list", optional: true, placeholder: "Add a video or image URL (https://…)" },
    { key: "assessment_observation", label: "Assessment / Observation", type: "textarea" },
    { key: "teacher_notes", label: "Teacher Notes", type: "textarea", optional: true },
  ],
  meal_time: [
    { key: "meal_prayer", label: "Meal Prayer", type: "textarea", placeholder: "The prayer / thanks to say before the meal…" },
    { key: "hygiene_checklist", label: "Hygiene Checklist", type: "list", placeholder: "e.g. Wash hands, use napkin, clean up…" },
    { key: "media_links", label: "Media Links (YouTube/Images)", type: "list", optional: true, placeholder: "Add a video or image URL (https://…)" },
    { key: "teacher_notes", label: "Teacher Notes", type: "textarea", optional: true },
  ],
  creative_time: [
    { key: "art_craft_resource", label: "Art / Craft Resource", type: "resource", note: "Pick the art or craft guide printable." },
    { key: "materials_required", label: "Materials Required", type: "list" },
    { key: "reference_image", label: "Reference Image", type: "image", placeholder: "https://…/reference.webp" },
    { key: "activity_steps", label: "Activity Steps", type: "list" },
    { key: "youtube_url", label: "YouTube Video Link", type: "text", optional: true, placeholder: "https://youtube.com/… (craft demonstration)" },
    { key: "media_links", label: "Media Links (YouTube/Images)", type: "list", optional: true, placeholder: "Add a video or image URL (https://…)" },
    { key: "observation_points", label: "Observation Points", type: "list" },
    { key: "teacher_notes", label: "Teacher Notes", type: "textarea", optional: true },
  ],
  literacy_time: [
    { key: "worksheet_resource_id", label: "Worksheet", type: "resource", category: "Worksheets", note: "Pick the literacy worksheet printable." },
    { key: "supporting_flashcards", label: "Supporting Flashcards", type: "resource_multi", category: "Flashcards", optional: true },
    { key: "letter_word_focus", label: "Letter / Word Focus", type: "text", placeholder: "e.g. Letter S, sight word 'the'…" },
    { key: "youtube_url", label: "YouTube Video Link", type: "text", optional: true, placeholder: "https://youtube.com/… (phonics/letter formation)" },
    { key: "media_links", label: "Media Links (YouTube/Images)", type: "list", optional: true, placeholder: "Add a video or image URL (https://…)" },
    { key: "assessment_observation", label: "Assessment / Observation", type: "textarea" },
    { key: "teacher_notes", label: "Teacher Notes", type: "textarea", optional: true },
  ],
  outdoor_play: [
    { key: "activity_selection", label: "Activity Selection", type: "text", placeholder: "e.g. Relay race, parachute games, hopscotch…" },
    { key: "materials_required", label: "Materials Required", type: "list" },
    { key: "safety_instructions", label: "Safety Instructions", type: "list" },
    { key: "youtube_url", label: "YouTube Video Link", type: "text", optional: true, placeholder: "https://youtube.com/… (game demonstration)" },
    { key: "media_links", label: "Media Links (YouTube/Images)", type: "list", optional: true, placeholder: "Add a video or image URL (https://…)" },
    { key: "observation_notes", label: "Observation Notes", type: "textarea" },
    { key: "teacher_notes", label: "Teacher Notes", type: "textarea", optional: true },
  ],
  goodbye: [
    { key: "day_recap_prompts", label: "Day Recap Prompts", type: "list" },
    { key: "feelings_checkin_questions", label: "Feelings Check-in Questions", type: "list" },
    { key: "goodbye_song", label: "Goodbye Song", type: "resource", category: "Circle Time Prompts" },
    { key: "tomorrow_preview", label: "Tomorrow Preview", type: "textarea", placeholder: "What's coming up tomorrow…" },
    { key: "youtube_url", label: "YouTube Video Link", type: "text", optional: true, placeholder: "https://youtube.com/… (goodbye song)" },
    { key: "media_links", label: "Media Links (YouTube/Images)", type: "list", optional: true, placeholder: "Add a video or image URL (https://…)" },
    { key: "teacher_notes", label: "Teacher Notes", type: "textarea", optional: true },
  ],

  // ── Story-variant types ────────────────────────────────────────────────────
  // story_or_rhyme combines a read-aloud story with a rhyme/song component.
  story_or_rhyme: [
    { key: "story_resource_id", label: "Story", type: "resource", category: "Story Cards", note: "Pick the story printable from the catalog." },
    { key: "story_text", label: "Story Text", type: "textarea", placeholder: "The full story to narrate…" },
    { key: "story_cover_image", label: "Story Cover Image", type: "image", placeholder: "https://…/story-cover.webp" },
    { key: "rhyme_resource_id", label: "Rhyme / Song", type: "resource", category: "Circle Time Prompts", optional: true, note: "Pick the rhyme or action song printable." },
    { key: "props", label: "Props", type: "list", optional: true },
    { key: "supporting_picture_cards", label: "Supporting Picture / Sequence Cards", type: "resource_multi", category: "Picture Talk Cards", optional: true },
    { key: "vocabulary_list", label: "Vocabulary List", type: "list", optional: true },
    { key: "youtube_url", label: "YouTube Video Link", type: "text", optional: true, placeholder: "https://youtube.com/… (story narration/animated story)" },
    { key: "media_links", label: "Media Links (YouTube/Images)", type: "list", optional: true, placeholder: "Add a video or image URL (https://…)" },
    { key: "teacher_notes", label: "Teacher Notes", type: "textarea", optional: true },
  ],

  // story_rhyme_picture_talk is a combined block: story + rhyme + picture discussion.
  story_rhyme_picture_talk: [
    { key: "story_resource_id", label: "Story", type: "resource", category: "Story Cards", note: "Pick the story printable from the catalog." },
    { key: "story_text", label: "Story Text", type: "textarea", placeholder: "The full story to narrate…" },
    { key: "story_cover_image", label: "Story Cover Image", type: "image", placeholder: "https://…/story-cover.webp" },
    { key: "rhyme_resource_id", label: "Rhyme / Song", type: "resource", category: "Circle Time Prompts", optional: true, note: "Pick the rhyme or action song printable." },
    { key: "theme_image", label: "Picture Talk Image", type: "image", placeholder: "https://…/picture-talk.webp", optional: true },
    { key: "theme_conversation", label: "Picture Talk Questions", type: "textarea", placeholder: "Questions to prompt discussion about the picture…", optional: true },
    { key: "supporting_picture_cards", label: "Supporting Picture / Sequence Cards", type: "resource_multi", category: "Picture Talk Cards", optional: true },
    { key: "props", label: "Props", type: "list", optional: true },
    { key: "vocabulary_list", label: "Vocabulary List", type: "list", optional: true },
    { key: "youtube_url", label: "YouTube Video Link", type: "text", optional: true, placeholder: "https://youtube.com/… (story narration/animated story)" },
    { key: "media_links", label: "Media Links (YouTube/Images)", type: "list", optional: true, placeholder: "Add a video or image URL (https://…)" },
    { key: "teacher_notes", label: "Teacher Notes", type: "textarea", optional: true },
  ],

  // picture_talk is a standalone image-led discussion activity.
  picture_talk: [
    { key: "theme_image", label: "Picture Talk Image", type: "image", placeholder: "https://…/picture-talk.webp" },
    { key: "theme_conversation", label: "Discussion Questions & Prompts", type: "textarea", placeholder: "Questions to prompt discussion about the picture…" },
    { key: "supporting_picture_cards", label: "Supporting Picture Cards", type: "resource_multi", category: "Picture Talk Cards", optional: true },
    { key: "supporting_flashcards", label: "Supporting Flashcards", type: "resource_multi", category: "Flashcards", optional: true },
    { key: "vocabulary_list", label: "Vocabulary List", type: "list", optional: true },
    { key: "youtube_url", label: "YouTube Video Link", type: "text", optional: true, placeholder: "https://youtube.com/… (related video)" },
    { key: "media_links", label: "Media Links (YouTube/Images)", type: "list", optional: true, placeholder: "Add a video or image URL (https://…)" },
    { key: "teacher_notes", label: "Teacher Notes", type: "textarea", optional: true },
  ],
};

export function stepDetailFields(stepType: string): StepDetailField[] {
  return STEP_DETAIL_FIELDS[stepType as PrimaryStepType] ?? [];
}

export const STEP_TYPE_OPTIONS: Array<{ value: PrimaryStepType; label: string }> = [
  { value: "routine", label: "Routine" },
  { value: "circle_time", label: "Circle Time" },
  { value: "free_play", label: "Free Play" },
  { value: "story", label: "Story Time" },
  { value: "numeracy_time", label: "Numeracy Time" },
  { value: "meal_time", label: "Meal Time" },
  { value: "creative_time", label: "Creative Time" },
  { value: "literacy_time", label: "Literacy Time" },
  { value: "outdoor_play", label: "Outdoor Play" },
  { value: "goodbye", label: "Goodbye" },
  { value: "classroom_activity", label: "Classroom Activity" },
  { value: "flashcards", label: "Flashcards" },
  { value: "worksheet", label: "Worksheet" },
  { value: "craft", label: "Craft" },
  { value: "song", label: "Song" },
  { value: "movement", label: "Movement" },
  { value: "game", label: "Game" },
  { value: "assessment", label: "Assessment" },
  { value: "reflection", label: "Reflection" },
  { value: "parent_note", label: "Parent Note" },
  { value: "warm_up", label: "Warm Up" },
  { value: "introduction", label: "Introduction" },
  { value: "story_or_rhyme", label: "Story or Rhyme" },
  { value: "picture_talk", label: "Picture Talk" },
  { value: "arrival_routine", label: "Arrival Routine" },
  { value: "story_rhyme_picture_talk", label: "Story Rhyme Picture Talk" },
  { value: "concept_exploration", label: "Concept Exploration" },
  { value: "classroom_activity_game", label: "Classroom Activity Game" },
  { value: "practice", label: "Practice" },
];
