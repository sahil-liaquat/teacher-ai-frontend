/**
 * The Settings map — which areas exist, and what each one is worth opening for.
 *
 * ⚠ PROGRESSIVE DISCLOSURE STARTS BEFORE THE CLICK. The old Settings showed a
 * permanent list of seven sections with no indication of what was inside any of
 * them, so finding out that "Integrations" is empty cost a navigation. Three of
 * the seven had no controls at all.
 *
 * An index that reports each area's real state — what it is set to, or that it
 * cannot be configured yet — is what makes the disclosure honest: the reader
 * decides what to open knowing what they will find.
 *
 * ⚠ `availability` is a claim about the PRODUCT, not about this school.
 * `configurable` means controls exist; `read_only` means the concept is real and
 * fixed in this release; `unavailable` means nothing is built. Marking an empty
 * area as configurable would put a dead end behind a click, which is the exact
 * defect this replaces.
 */

export type SettingsAvailability = "configurable" | "read_only" | "unavailable";

export type SettingsArea = {
  key: string;
  title: string;
  /** One line, in the admin's terms, about what this decides. */
  purpose: string;
  availability: SettingsAvailability;
};

export const SETTINGS_AREAS: readonly SettingsArea[] = [
  {
    key: "profile",
    title: "School profile",
    purpose: "Your school's name, location and the people TeachPad should contact.",
    availability: "configurable",
  },
  {
    key: "academic",
    title: "Academic setup",
    purpose: "The board you follow, the stages you offer and the levels you run.",
    availability: "configurable",
  },
  {
    key: "calendar",
    title: "Academic year",
    purpose: "Which year is current, and where terms and teaching days are set.",
    availability: "configurable",
  },
  {
    key: "curriculum",
    title: "Curriculum source",
    purpose: "Whether your curriculum starts from TeachPad's or from your own.",
    availability: "configurable",
  },
  {
    key: "terminology",
    title: "Your words",
    purpose: "What this school calls levels, subjects and lessons.",
    availability: "configurable",
  },
  {
    key: "roles",
    title: "Roles & permissions",
    // Real, and fixed in this release. Read-only is not the same as missing,
    // and an admin deciding who can do what needs to know which it is.
    purpose: "Who can do what inside your school.",
    availability: "read_only",
  },
  {
    key: "integrations",
    title: "Integrations",
    purpose: "Connections to systems outside TeachPad.",
    availability: "unavailable",
  },
] as const;

export function settingsArea(key: string | null): SettingsArea | undefined {
  return SETTINGS_AREAS.find((area) => area.key === key);
}

/**
 * The three stages of academic setup, in dependency order.
 *
 * ⚠ These are REAL dependencies, not a designed sequence. The server refuses
 * programmes without a framework ("Enable X before putting levels in it") and
 * levels without an enabled programme. Disclosing them one at a time therefore
 * mirrors what the API will actually accept — a school cannot be shown a level
 * form that its own configuration makes unusable.
 */
export type AcademicStage = {
  key: "framework" | "programmes" | "levels";
  title: string;
  /** Why the previous stage has to come first, in the admin's terms. */
  blockedReason: string;
};

export const ACADEMIC_STAGES: readonly AcademicStage[] = [
  {
    key: "framework",
    title: "Board or framework",
    blockedReason: "",
  },
  {
    key: "programmes",
    title: "Programmes",
    blockedReason: "Choose a framework first — programmes belong to it.",
  },
  {
    key: "levels",
    title: "Levels",
    blockedReason: "Offer at least one programme first — every level sits inside one.",
  },
] as const;

/** Which academic stages are reachable, given what is configured. */
export function reachableStages(input: {
  hasFramework: boolean;
  hasProgramme: boolean;
}): Record<AcademicStage["key"], boolean> {
  return {
    framework: true,
    programmes: input.hasFramework,
    levels: input.hasFramework && input.hasProgramme,
  };
}

/**
 * The stage an admin should be working on.
 *
 * The first unmet one, or `levels` when everything is configured — levels are
 * the stage a running school revisits, so that is where a finished setup lands
 * rather than on a framework it chose once.
 */
export function activeStage(input: {
  hasFramework: boolean;
  hasProgramme: boolean;
  hasLevel: boolean;
}): AcademicStage["key"] {
  if (!input.hasFramework) return "framework";
  if (!input.hasProgramme) return "programmes";
  return "levels";
}

/** The keys the terminology editor offers, in the order they are met. */
export const TERMINOLOGY_KEYS = [
  { key: "programme", hint: "Stage, Programme, Section" },
  { key: "level", hint: "Class, Grade, Year" },
  { key: "section", hint: "Section, Division, House" },
  { key: "subject", hint: "Subject, Learning area" },
  { key: "theme", hint: "Theme, Unit, Topic cluster" },
  { key: "lesson", hint: "Teaching day, Lesson, Period" },
  { key: "term", hint: "Term, Semester, Trimester" },
] as const;
