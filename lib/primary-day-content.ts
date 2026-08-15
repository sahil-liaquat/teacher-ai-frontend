import type { PrimaryCurriculumProvenance, PrimaryTeachingDay } from "@/lib/api";

/**
 * The authored content on a teaching day, ready to render.
 *
 * ⚠ This exists because the generator has always copied the admin's authored
 * day onto `primary_teaching_days` — objectives, vocabulary, assessment
 * questions, homework, parent update, learning outcomes — and the Today page
 * read the record for its reflection JSON and nothing else. An admin writing a
 * parent update was writing into a void.
 *
 * Every section here is OMITTED when empty rather than rendered blank. A day
 * with no homework should show no homework heading; an empty card reads as a
 * missing feature rather than an absent field.
 */

export type AuthoredSection = {
  key: string;
  label: string;
  /** "list" renders bullets, "prose" a paragraph. */
  kind: "list" | "prose";
  items: string[];
  body?: string;
};

function cleanList(values: readonly string[] | null | undefined): string[] {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

function cleanText(value: string | null | undefined): string {
  return (value ?? "").trim();
}

/**
 * The authored sections that actually have content, in teaching order.
 *
 * Order mirrors how a teacher reads a day: what they are aiming at, then the
 * words the children need, then how it is checked, then what goes home.
 */
export function authoredSections(day: PrimaryTeachingDay | null | undefined): AuthoredSection[] {
  if (!day) return [];
  const sections: AuthoredSection[] = [];

  const objectives = cleanList(day.objectives);
  if (objectives.length) {
    sections.push({ key: "objectives", label: "Learning objectives", kind: "list", items: objectives });
  }

  const outcomes = cleanList((day.learning_outcomes ?? []).map((outcome) => outcome.text));
  if (outcomes.length) {
    sections.push({ key: "outcomes", label: "Learning outcomes", kind: "list", items: outcomes });
  }

  const vocabulary = cleanList(day.vocabulary);
  if (vocabulary.length) {
    sections.push({ key: "vocabulary", label: "Vocabulary", kind: "list", items: vocabulary });
  }

  const assessment = cleanList(day.assessment_questions);
  if (assessment.length) {
    sections.push({ key: "assessment", label: "Check understanding", kind: "list", items: assessment });
  }

  const homework = cleanText(day.homework);
  if (homework) {
    sections.push({ key: "homework", label: "Homework", kind: "prose", items: [], body: homework });
  }

  const parentUpdate = cleanText(day.parent_update);
  if (parentUpdate) {
    sections.push({ key: "parent_update", label: "Parent update", kind: "prose", items: [], body: parentUpdate });
  }

  const homeConnection = cleanText(day.home_connection);
  if (homeConnection) {
    sections.push({ key: "home_connection", label: "Home connection", kind: "prose", items: [], body: homeConnection });
  }

  return sections;
}

export function hasAuthoredContent(day: PrimaryTeachingDay | null | undefined): boolean {
  return authoredSections(day).length > 0;
}

/**
 * "School Curriculum · v4" / "TeachPad Master Curriculum · v7".
 *
 * Deliberately terse — provenance is a footnote that establishes where content
 * came from and supports feedback and versioning, not a banner.
 */
export function provenanceLabel(
  provenance: PrimaryCurriculumProvenance | null | undefined,
): string | null {
  if (!provenance) return null;
  const name = provenance.source === "school" ? "School Curriculum" : "TeachPad Master Curriculum";
  return provenance.version ? `${name} · v${provenance.version}` : name;
}

/**
 * The staleness line, or null when the day is current.
 *
 * ⚠ Wording is deliberately passive. There is no safe automatic update: the
 * day carries the teacher's notes, reflection, completion state and the
 * observations recorded against it. Telling them a newer version exists is the
 * whole of the feature; acting on it is not.
 */
export function stalenessNotice(
  provenance: PrimaryCurriculumProvenance | null | undefined,
): string | null {
  if (!provenance?.is_stale) return null;
  return provenance.latest_version
    ? `A newer curriculum version (v${provenance.latest_version}) is available. This day is still on v${provenance.version}.`
    : "A newer curriculum version is available for this day.";
}
