import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  assignmentTargets,
  seedAssignmentDrafts,
} from "../../lib/school-admin-sections.ts";

/**
 * Assignment dates must survive editing.
 *
 * `PUT /school-admin/teacher-assignments/bulk` is a REPLACE: the desired set it
 * receives becomes the stored set, and `replace_assignments` assigns
 * `existing.starts_on = item.starts_on` even on the branch it counts as
 * "unchanged". The dialog therefore has to send the assignment's real dates
 * back, and to do that it has to be able to read them.
 *
 * Both halves failed at once:
 *   - the roster payload never carried `starts_on`/`ends_on`, so the client
 *     could not know them, and
 *   - the draft initialiser hardcoded both to "".
 *
 * The result was silent data loss on a no-op save. These tests pin the fix at
 * the seam where it is testable — the seeding rule — plus the wire contract it
 * depends on.
 */

function source(relativePath: string) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

function schoolClass(overrides: Record<string, unknown> = {}) {
  return {
    id: "cls",
    organization_id: "org",
    academic_year_id: "yr",
    name: "Nursery A",
    level: "nursery",
    subjects: [],
    is_active: true,
    created_at: "",
    updated_at: "",
    assigned_teacher_count: 0,
    teachers: [],
    has_published_curriculum: true,
    published_lesson_count: 4,
    sections: [],
    ...overrides,
  } as never;
}

function section(overrides: Record<string, unknown> = {}) {
  return {
    id: "sec-a",
    organization_id: "org",
    school_class_id: "cls",
    name: "A",
    is_active: true,
    created_at: "",
    updated_at: "",
    display_name: "",
    assigned_teacher_count: 0,
    ...overrides,
  } as never;
}

test("an existing assignment's dates are seeded, not blanked", () => {
  const classes = [schoolClass({ sections: [section()] })];
  const targets = assignmentTargets(classes);
  const drafts = seedAssignmentDrafts(
    [
      {
        school_class_id: "cls",
        class_section_id: "sec-a",
        assignment_role: "lead",
        starts_on: "2026-04-01",
        ends_on: "2027-03-31",
      },
    ],
    classes,
    targets,
  );

  const draft = drafts[targets[0].key];
  assert.equal(draft.selected, true);
  assert.equal(draft.role, "lead");
  // The regression: these were "" regardless of what the assignment held.
  assert.equal(draft.starts_on, "2026-04-01");
  assert.equal(draft.ends_on, "2027-03-31");
});

test("an assignment with no dates seeds empty, not undefined", () => {
  const classes = [schoolClass({ sections: [section()] })];
  const targets = assignmentTargets(classes);
  const drafts = seedAssignmentDrafts(
    [{ school_class_id: "cls", class_section_id: "sec-a", assignment_role: "assistant" }],
    classes,
    targets,
  );

  const draft = drafts[targets[0].key];
  assert.equal(draft.role, "assistant");
  // `undefined` would render an uncontrolled <input> and warn; "" is the
  // controlled empty value the date inputs expect.
  assert.equal(draft.starts_on, "");
  assert.equal(draft.ends_on, "");
});

test("an unassigned target is unselected and carries no dates", () => {
  const classes = [schoolClass({ sections: [section()] })];
  const targets = assignmentTargets(classes);
  const drafts = seedAssignmentDrafts([], classes, targets);

  const draft = drafts[targets[0].key];
  assert.equal(draft.selected, false);
  assert.equal(draft.role, "lead");
  assert.equal(draft.starts_on, "");
  assert.equal(draft.ends_on, "");
});

test("dates follow the target key, so parallel sections do not share them", () => {
  const classes = [
    schoolClass({
      sections: [section({ id: "sec-a", name: "A" }), section({ id: "sec-b", name: "B" })],
    }),
  ];
  const targets = assignmentTargets(classes);
  const drafts = seedAssignmentDrafts(
    [
      {
        school_class_id: "cls",
        class_section_id: "sec-a",
        assignment_role: "lead",
        starts_on: "2026-04-01",
        ends_on: null,
      },
    ],
    classes,
    targets,
  );

  const a = targets.find((item) => item.section?.id === "sec-a")!;
  const b = targets.find((item) => item.section?.id === "sec-b")!;
  assert.equal(drafts[a.key].starts_on, "2026-04-01");
  assert.equal(drafts[a.key].selected, true);
  // Section B holds no assignment, so it must not inherit A's dates.
  assert.equal(drafts[b.key].selected, false);
  assert.equal(drafts[b.key].starts_on, "");
});

test("a legacy section-less assignment still restores its dates", () => {
  // `existingTargetKey` heals a NULL section onto the class's only section.
  // The dates have to travel with it or the heal itself becomes the data loss.
  const classes = [schoolClass({ sections: [section()] })];
  const targets = assignmentTargets(classes);
  const drafts = seedAssignmentDrafts(
    [
      {
        school_class_id: "cls",
        class_section_id: null,
        assignment_role: "lead",
        starts_on: "2026-06-15",
        ends_on: "2026-12-20",
      },
    ],
    classes,
    targets,
  );

  const draft = drafts[targets[0].key];
  assert.equal(draft.selected, true);
  assert.equal(draft.starts_on, "2026-06-15");
  assert.equal(draft.ends_on, "2026-12-20");
});

test("the wire type carries the dates the dialog has to replay", () => {
  const api = source("lib/api.ts");
  const summary = api.slice(
    api.indexOf("export type SchoolClassAssignmentSummary"),
    api.indexOf("export type SchoolTeacher = {"),
  );
  assert.ok(summary.includes("starts_on"), "SchoolClassAssignmentSummary must carry starts_on");
  assert.ok(summary.includes("ends_on"), "SchoolClassAssignmentSummary must carry ends_on");
});

test("the dialog seeds through the shared rule rather than inline literals", () => {
  const dialog = source("components/school-admin/teachers/assignment-dialog.tsx");
  assert.ok(
    dialog.includes("seedAssignmentDrafts"),
    "the dialog must seed via the tested helper",
  );
  assert.ok(
    !/starts_on:\s*""/.test(dialog),
    "the dialog must not hardcode an empty starts_on — that is the original defect",
  );
  assert.ok(
    !/ends_on:\s*""/.test(dialog),
    "the dialog must not hardcode an empty ends_on — that is the original defect",
  );
});
