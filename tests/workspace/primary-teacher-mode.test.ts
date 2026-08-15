import assert from "node:assert/strict";
import test from "node:test";

import {
  curriculumSourceLabel,
  schoolContextLabel,
} from "../../lib/primary-teacher-mode.ts";
import {
  authoredSections,
  hasAuthoredContent,
  provenanceLabel,
  stalenessNotice,
} from "../../lib/primary-day-content.ts";
import type {
  PrimaryAssignment,
  PrimaryTeachingDay,
  PrimaryTeacherContextResolved,
} from "../../lib/api.ts";

function resolved(overrides: Partial<PrimaryTeacherContextResolved> = {}): PrimaryTeacherContextResolved {
  return {
    mode: "organization_assigned",
    organization_id: "org-1",
    organization_name: "Sunrise School",
    academic_year_name: "2026-27",
    curriculum_source: "school",
    inherits_master: true,
    assignments: [],
    ...overrides,
  };
}

function assignment(overrides: Partial<PrimaryAssignment> = {}): PrimaryAssignment {
  return {
    assignment_id: "a-1",
    school_class_id: "c-1",
    class_section_id: "cs-1",
    class_name: "Nursery",
    section_name: "A",
    display_name: "Nursery A",
    level: "nursery",
    level_label: "Nursery",
    academic_year_id: "y-1",
    assignment_role: "lead",
    primary_section_id: "ps-1",
    ...overrides,
  };
}

function day(overrides: Partial<PrimaryTeachingDay> = {}): PrimaryTeachingDay {
  return {
    id: "d-1", user_id: "u-1", date: "2026-09-07", level: "nursery",
    language: "English", objectives: [], vocabulary: [], competencies: [],
    materials: [], assessment_questions: [], status: "not_started",
    created_at: "", updated_at: "",
    ...overrides,
  } as PrimaryTeachingDay;
}

// ── Mode presentation ───────────────────────────────────────────────────────

test("an independent teacher is never shown a school context line", () => {
  // There is no school to name, and naming one would be a fiction.
  assert.equal(schoolContextLabel(resolved({ mode: "independent", organization_name: null }), null), null);
});

test("an organization teacher sees their school and assigned class", () => {
  assert.equal(schoolContextLabel(resolved(), assignment()), "Sunrise School · Nursery A");
});

test("an unassigned organization teacher still sees their school", () => {
  // They are waiting on it, not outside it — showing nothing would read as
  // "you have no school", which is the collapse this architecture prevents.
  assert.equal(
    schoolContextLabel(resolved({ mode: "organization_unassigned" }), null),
    "Sunrise School",
  );
});

test("a missing context yields no label rather than a placeholder", () => {
  assert.equal(schoolContextLabel(undefined, null), null);
});

test("the curriculum source reads as school or TeachPad", () => {
  assert.equal(curriculumSourceLabel(resolved({ curriculum_source: "school" })), "School Curriculum");
  assert.equal(curriculumSourceLabel(resolved({ curriculum_source: "platform" })), "TeachPad Master Curriculum");
  assert.equal(curriculumSourceLabel(undefined), "TeachPad Master Curriculum");
});

// ── Authored day content ────────────────────────────────────────────────────

test("a day with no authored content renders no sections", () => {
  // An empty heading reads as a broken feature rather than an absent field.
  assert.deepEqual(authoredSections(day()), []);
  assert.equal(hasAuthoredContent(day()), false);
});

test("every authored field the generator copies is rendered", () => {
  // The regression this replaces: all of these were written onto the teaching
  // day and the Today page read the record for its reflection JSON only.
  const full = day({
    objectives: ["Identify body parts"],
    vocabulary: ["head", "shoulders"],
    assessment_questions: ["Can you point to your nose?"],
    homework: "Draw yourself",
    parent_update: "We learned about the body today",
    home_connection: "Name body parts at bath time",
    learning_outcomes: [{ id: "o1", text: "Names five body parts", level: "nursery", subject: "EVS", is_active: true }],
  });
  assert.deepEqual(
    authoredSections(full).map((section) => section.key),
    ["objectives", "outcomes", "vocabulary", "assessment", "homework", "parent_update", "home_connection"],
  );
});

test("blank strings are not content", () => {
  const blank = day({ objectives: ["   ", ""], homework: "  " });
  assert.deepEqual(authoredSections(blank), []);
});

test("only the populated sections appear", () => {
  const partial = day({ objectives: ["Count to ten"], homework: "Practise counting" });
  assert.deepEqual(
    authoredSections(partial).map((section) => section.key),
    ["objectives", "homework"],
  );
});

test("lists and prose are distinguished so each renders correctly", () => {
  const mixed = day({ vocabulary: ["one", "two"], parent_update: "A note home" });
  const sections = authoredSections(mixed);
  assert.equal(sections.find((s) => s.key === "vocabulary")?.kind, "list");
  assert.equal(sections.find((s) => s.key === "parent_update")?.kind, "prose");
  assert.equal(sections.find((s) => s.key === "parent_update")?.body, "A note home");
});

test("a null day yields nothing rather than throwing", () => {
  assert.deepEqual(authoredSections(null), []);
  assert.deepEqual(authoredSections(undefined), []);
});

// ── Provenance ──────────────────────────────────────────────────────────────

test("provenance names the source and version", () => {
  assert.equal(provenanceLabel({ source: "school", version: 4, is_stale: false }), "School Curriculum · v4");
  assert.equal(provenanceLabel({ source: "platform", version: 7, is_stale: false }), "TeachPad Master Curriculum · v7");
});

test("provenance without a version still names the source", () => {
  assert.equal(provenanceLabel({ source: "platform", is_stale: false }), "TeachPad Master Curriculum");
});

test("a day with no provenance shows none", () => {
  // Better a missing badge than one asserting an origin we cannot prove.
  assert.equal(provenanceLabel(null), null);
  assert.equal(provenanceLabel(undefined), null);
});

// ── Staleness ───────────────────────────────────────────────────────────────

test("a current day shows no notice", () => {
  assert.equal(stalenessNotice({ source: "school", version: 4, latest_version: 4, is_stale: false }), null);
});

test("a stale day names both versions", () => {
  const notice = stalenessNotice({ source: "school", version: 1, latest_version: 3, is_stale: true });
  assert.ok(notice?.includes("v3"));
  assert.ok(notice?.includes("v1"));
});

test("the notice never promises an automatic update", () => {
  // ⚠ The day carries the teacher's notes, reflection, completion state and the
  // observations recorded against it. Nothing can merge those safely, so the
  // copy must not imply anything will happen on its own.
  const notice = stalenessNotice({ source: "school", version: 1, latest_version: 2, is_stale: true }) ?? "";
  for (const forbidden of ["updated automatically", "will update", "has been updated"]) {
    assert.ok(!notice.toLowerCase().includes(forbidden), `notice promises "${forbidden}"`);
  }
  assert.ok(notice.toLowerCase().includes("available"));
});
