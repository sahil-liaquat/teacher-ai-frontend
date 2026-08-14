import assert from "node:assert/strict";
import test from "node:test";

import {
  EMPTY_SELECTION,
  applySelectionChange,
  canCreateDay,
  selectionProblem,
  subthemeGroups,
  topicOptions,
} from "../../lib/curriculum-day-draft.ts";
import type { PrimaryCurriculumTheme, PrimaryCurriculumTopic } from "../../lib/api.ts";

function topic(overrides: Partial<PrimaryCurriculumTopic> & { id: string; name: string }): PrimaryCurriculumTopic {
  return {
    theme_id: "theme-family",
    scope: "platform",
    parent_topic_id: null,
    subtheme: null,
    description: null,
    position: 0,
    keywords: [],
    aliases: [],
    is_active: true,
    has_published_lesson: false,
    ...overrides,
  } as PrimaryCurriculumTopic;
}

/**
 *  Me and My Family
 *  ├── My Body            (group)
 *  │   ├── Parts of the Body
 *  │   └── Five Senses
 *  └── My Family          (group)
 *      ├── Family Members
 *      └── My Home
 */
const FAMILY: PrimaryCurriculumTheme = {
  id: "theme-family",
  scope: "platform",
  name: "Me and My Family",
  language: "English",
  subject: "EVS",
  is_active: true,
  keywords: [],
  aliases: [],
  illustration_pack: [],
  color_palette: {},
  icon_map: {},
  decorations: [],
  has_published_lesson: false,
  topics: [
    topic({ id: "grp-body", name: "My Body", position: 0 }),
    topic({ id: "parts", name: "Parts of the Body", parent_topic_id: "grp-body", position: 1 }),
    topic({ id: "senses", name: "Five Senses", parent_topic_id: "grp-body", position: 2 }),
    topic({ id: "grp-family", name: "My Family", position: 3 }),
    topic({ id: "members", name: "Family Members", parent_topic_id: "grp-family", position: 4 }),
    topic({ id: "home", name: "My Home", parent_topic_id: "grp-family", position: 5 }),
    topic({ id: "retired", name: "Old Topic", parent_topic_id: "grp-body", is_active: false, position: 6 }),
  ],
} as PrimaryCurriculumTheme;

const SEASONS: PrimaryCurriculumTheme = {
  ...FAMILY,
  id: "theme-seasons",
  name: "Seasons",
  topics: [topic({ id: "rain", name: "Rainy Season", theme_id: "theme-seasons" })],
} as PrimaryCurriculumTheme;

const THEMES = [FAMILY, SEASONS];

// ── No hidden decisions ─────────────────────────────────────────────────────

test("nothing is selected by default", () => {
  // The bug this replaces: createDay() resolved the theme as
  // `themes.find(t => t.is_active) ?? themes[0]` and never asked.
  assert.equal(EMPTY_SELECTION.themeId, "");
  assert.equal(EMPTY_SELECTION.topicId, "");
  assert.equal(canCreateDay(THEMES, EMPTY_SELECTION), false);
});

test("a day cannot be created without an explicit theme", () => {
  assert.equal(selectionProblem(THEMES, EMPTY_SELECTION), "theme");
});

test("a day cannot be created without a topic", () => {
  const selection = { themeId: "theme-family", subthemeId: "", topicId: "" };
  assert.equal(selectionProblem(THEMES, selection), "topic");
  assert.equal(canCreateDay(THEMES, selection), false);
});

test("a complete selection can create a day", () => {
  const selection = { themeId: "theme-family", subthemeId: "grp-body", topicId: "parts" };
  assert.equal(selectionProblem(THEMES, selection), null);
  assert.equal(canCreateDay(THEMES, selection), true);
});

// ── Topics are scoped to the theme ──────────────────────────────────────────

test("topic options come only from the selected theme", () => {
  const ids = topicOptions(THEMES, { themeId: "theme-seasons", subthemeId: "" }).map((item) => item.id);
  assert.deepEqual(ids, ["rain"]);
});

test("archived topics are never offered", () => {
  // The publish gate refuses an archived topic, so offering one is a dead end.
  const ids = topicOptions(THEMES, { themeId: "theme-family", subthemeId: "grp-body" }).map((item) => item.id);
  assert.ok(!ids.includes("retired"));
  assert.deepEqual(ids, ["parts", "senses"]);
});

test("sub-theme groups are the topics that have children", () => {
  // A sub-theme is not a separate entity — a topic with children IS the group.
  assert.deepEqual(subthemeGroups(THEMES, "theme-family").map((item) => item.id), ["grp-body", "grp-family"]);
});

test("a group is not offered as a topic to attach a day to", () => {
  const ids = topicOptions(THEMES, { themeId: "theme-family", subthemeId: "" }).map((item) => item.id);
  assert.ok(!ids.includes("grp-body"));
  assert.deepEqual(ids, ["parts", "senses", "members", "home"]);
});

test("a theme with no nesting still offers its topics", () => {
  // Otherwise a flat theme would present an empty topic list and dead-end.
  assert.deepEqual(topicOptions(THEMES, { themeId: "theme-seasons", subthemeId: "" }).map((i) => i.id), ["rain"]);
});

test("an unknown theme offers nothing rather than throwing", () => {
  assert.deepEqual(topicOptions(THEMES, { themeId: "nope", subthemeId: "" }), []);
});

test("topics are offered in authored order", () => {
  const names = topicOptions(THEMES, { themeId: "theme-family", subthemeId: "grp-family" }).map((i) => i.name);
  assert.deepEqual(names, ["Family Members", "My Home"]);
});

// ── Changing the theme clears what it invalidates ───────────────────────────

test("changing the theme clears the topic", () => {
  const before = { themeId: "theme-family", subthemeId: "grp-body", topicId: "parts" };
  const after = applySelectionChange(THEMES, before, { themeId: "theme-seasons" });
  assert.equal(after.themeId, "theme-seasons");
  assert.equal(after.topicId, "");
  assert.equal(after.subthemeId, "");
});

test("re-selecting the same theme keeps the topic", () => {
  // Clearing on every change would fight an author who reopens the dropdown.
  const before = { themeId: "theme-family", subthemeId: "grp-body", topicId: "parts" };
  assert.deepEqual(applySelectionChange(THEMES, before, { themeId: "theme-family" }), before);
});

test("changing the sub-theme clears a topic outside it", () => {
  const before = { themeId: "theme-family", subthemeId: "grp-body", topicId: "parts" };
  const after = applySelectionChange(THEMES, before, { subthemeId: "grp-family" });
  assert.equal(after.topicId, "");
});

test("clearing the sub-theme filter keeps a still-valid topic", () => {
  const before = { themeId: "theme-family", subthemeId: "grp-body", topicId: "parts" };
  const after = applySelectionChange(THEMES, before, { subthemeId: "" });
  assert.equal(after.topicId, "parts");
});

test("an inconsistent pair can never leave this function", () => {
  // Belt and braces: whatever changed, the result is checked before returning,
  // so no render can observe a topic that does not belong to the theme.
  const after = applySelectionChange(
    THEMES,
    { themeId: "theme-seasons", subthemeId: "", topicId: "parts" },
    { subthemeId: "" },
  );
  assert.equal(after.topicId, "");
});

test("a topic from another theme is reported as a mismatch, not as missing", () => {
  // The author picked something; telling them "choose a topic" would be a lie.
  const problem = selectionProblem(THEMES, {
    themeId: "theme-seasons", subthemeId: "", topicId: "parts",
  });
  assert.equal(problem, "topic_theme_mismatch");
});

test("selecting a topic directly is allowed and complete", () => {
  const after = applySelectionChange(THEMES, EMPTY_SELECTION, { themeId: "theme-family" });
  const withTopic = applySelectionChange(THEMES, after, { topicId: "home" });
  assert.equal(canCreateDay(THEMES, withTopic), true);
});
