import type { PrimaryCurriculumTheme, PrimaryCurriculumTopic } from "@/lib/api";

/**
 * The Theme/Topic choice behind creating a teaching day.
 *
 * ⚠ Pure and separate from the dialog on purpose. This is the rule that
 * replaced the silent default — `createDay()` used to resolve the theme as
 * `themes.find(t => t.is_active) ?? themes[0]`, stamping whichever theme
 * happened to sort first onto every day an author created from the grid. Theme
 * is the resource matcher's dominant facet (THEME_WEIGHT=8) and the axis the
 * teacher picks along, and the Day Editor had no theme control, so the
 * assignment could not even be corrected afterwards.
 *
 * The rules are small enough to state completely:
 *   - a theme must be chosen; there is no default;
 *   - topics offered are exactly the chosen theme's active ones;
 *   - a topic must be chosen, because a day with none is unreachable in the
 *     teacher's planner and the publish gate refuses it;
 *   - changing the theme clears a topic that does not belong to the new one.
 */

export type DayDraftSelection = {
  themeId: string;
  /** A parent topic acting as a sub-theme group, or "" for all. */
  subthemeId: string;
  topicId: string;
};

export const EMPTY_SELECTION: DayDraftSelection = {
  themeId: "",
  subthemeId: "",
  topicId: "",
};

function activeTopics(theme: PrimaryCurriculumTheme | undefined): PrimaryCurriculumTopic[] {
  return (theme?.topics ?? []).filter((topic) => topic.is_active);
}

export function findTheme(
  themes: PrimaryCurriculumTheme[],
  themeId: string,
): PrimaryCurriculumTheme | undefined {
  return themes.find((theme) => theme.id === themeId);
}

/**
 * Sub-theme groups: topics that other topics point at.
 *
 * A sub-theme is not a separate entity — `parent_topic_id` is the whole model,
 * so a topic with children IS the group. Returning only real parents keeps the
 * dropdown from listing every leaf topic as its own group.
 */
export function subthemeGroups(
  themes: PrimaryCurriculumTheme[],
  themeId: string,
): PrimaryCurriculumTopic[] {
  const topics = activeTopics(findTheme(themes, themeId));
  const parentIds = new Set(
    topics.map((topic) => topic.parent_topic_id).filter(Boolean) as string[],
  );
  return topics.filter((topic) => parentIds.has(topic.id));
}

/**
 * The topics that may be picked, given the theme and any sub-theme filter.
 *
 * Group rows are excluded from the leaf list: picking "My Body" when it exists
 * only to hold "Parts of the Body" and "Five Senses" would attach the day to a
 * heading rather than to content.
 */
export function topicOptions(
  themes: PrimaryCurriculumTheme[],
  selection: Pick<DayDraftSelection, "themeId" | "subthemeId">,
): PrimaryCurriculumTopic[] {
  const topics = activeTopics(findTheme(themes, selection.themeId));
  const groupIds = new Set(subthemeGroups(themes, selection.themeId).map((topic) => topic.id));
  const leaves = topics.filter((topic) => !groupIds.has(topic.id));
  const scoped = selection.subthemeId
    ? leaves.filter((topic) => topic.parent_topic_id === selection.subthemeId)
    : leaves;
  // A theme whose topics are all groups would otherwise offer nothing at all.
  const usable = scoped.length || selection.subthemeId ? scoped : topics;
  return [...usable].sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
}

/**
 * Apply a change to the selection, dropping anything it invalidates.
 *
 * Clearing happens HERE rather than in an effect so the selection is never
 * momentarily inconsistent: an effect that reacts to a theme change would leave
 * one render in which the old topic is still selected under the new theme, and
 * a fast submit in that window is exactly the mismatch this prevents.
 */
export function applySelectionChange(
  themes: PrimaryCurriculumTheme[],
  selection: DayDraftSelection,
  change: Partial<DayDraftSelection>,
): DayDraftSelection {
  const next = { ...selection, ...change };
  if (change.themeId !== undefined && change.themeId !== selection.themeId) {
    // A new theme owns none of the old theme's topics.
    next.subthemeId = "";
    next.topicId = "";
  }
  if (change.subthemeId !== undefined && change.subthemeId !== selection.subthemeId) {
    const stillOffered = topicOptions(themes, next).some((topic) => topic.id === next.topicId);
    if (!stillOffered) next.topicId = "";
  }
  // Final guard, whatever changed: the pair must be consistent on the way out.
  if (next.topicId && !topicOptions(themes, next).some((topic) => topic.id === next.topicId)) {
    next.topicId = "";
  }
  return next;
}

export type SelectionProblem = "theme" | "topic" | "topic_theme_mismatch";

/**
 * Why this selection cannot create a day yet, or null when it can.
 *
 * ⚠ These mirror the server. `create_lesson` refuses a topic that does not
 * belong to the theme with PRIMARY_TOPIC_THEME_MISMATCH, and the publish gate
 * refuses a day with no topic at all. Checking here turns a 400 into a disabled
 * button with a reason, without becoming a second, softer rule — the server
 * still decides.
 */
export function selectionProblem(
  themes: PrimaryCurriculumTheme[],
  selection: DayDraftSelection,
): SelectionProblem | null {
  if (!selection.themeId) return "theme";
  if (!selection.topicId) return "topic";
  const topic = activeTopics(findTheme(themes, selection.themeId))
    .find((item) => item.id === selection.topicId);
  return topic ? null : "topic_theme_mismatch";
}

export const SELECTION_PROBLEM_MESSAGES: Record<SelectionProblem, string> = {
  theme: "Choose the theme this teaching day belongs to.",
  topic: "Choose a topic. Teachers pick a theme and then a topic, so a day with none never reaches them.",
  topic_theme_mismatch: "That topic belongs to a different theme. Pick one from the selected theme.",
};

export function canCreateDay(
  themes: PrimaryCurriculumTheme[],
  selection: DayDraftSelection,
): boolean {
  return selectionProblem(themes, selection) === null;
}
