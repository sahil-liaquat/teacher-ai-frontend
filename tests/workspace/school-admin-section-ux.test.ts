import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  assignmentTargets,
  defaultSectionId,
  existingTargetKey,
  groupTeachersBySection,
  sectionArchiveBlockedReason,
  sectionChoiceRequired,
  sectionLabel,
  targetKey,
} from "../../lib/school-admin-sections.ts";

/**
 * School Admin section management.
 *
 * The re-audit's finding was that the frontend "presents sections as functional
 * when only read-only display exists". These tests cover the two halves of
 * fixing that: the rules the UI applies (which are the frontend's own —
 * business logic stays server-side), and the wiring that makes create, rename,
 * archive and section-specific assignment reachable at all.
 */

function source(relativePath: string) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
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

function teacher(overrides: Record<string, unknown> = {}) {
  return {
    teacher_id: "t1",
    teacher_name: "Asha Rao",
    teacher_email: "asha@x.test",
    assignment_id: "a1",
    assignment_role: "lead",
    ...overrides,
  } as never;
}

// ── When the admin must choose ──────────────────────────────────────────────

test("one section needs no choice — the server resolves it", () => {
  const cls = schoolClass({ sections: [section()] });
  assert.equal(sectionChoiceRequired(cls), false);
  assert.equal(defaultSectionId(cls), "sec-a");
});

test("several sections make class-only assignment ambiguous", () => {
  // The server refuses with SECTION_REQUIRED rather than guessing, so the UI
  // has to ask first instead of submitting and surfacing an error.
  const cls = schoolClass({ sections: [section(), section({ id: "sec-b", name: "B" })] });
  assert.equal(sectionChoiceRequired(cls), true);
  assert.equal(defaultSectionId(cls), null, "there is no safe default to pick");
});

test("archived sections do not count toward the choice", () => {
  const cls = schoolClass({
    sections: [section(), section({ id: "sec-b", name: "B", is_active: false })],
  });
  assert.equal(sectionChoiceRequired(cls), false);
  assert.equal(defaultSectionId(cls), "sec-a");
});

// ── Assignment targets ──────────────────────────────────────────────────────

test("each section is its own assignable target", () => {
  const cls = schoolClass({ sections: [section(), section({ id: "sec-b", name: "B" })] });
  const targets = assignmentTargets([cls]);

  assert.equal(targets.length, 2);
  assert.deepEqual(targets.map((item) => item.key), [
    targetKey("cls", "sec-a"),
    targetKey("cls", "sec-b"),
  ]);
  assert.deepEqual(targets.map((item) => item.sectionLabel), ["A", "B"]);
});

test("a class with no sections is still assignable", () => {
  // A pre-migration or not-yet-backfilled class. The server resolves the null.
  const targets = assignmentTargets([schoolClass()]);
  assert.equal(targets.length, 1);
  assert.equal(targets[0].section, null);
  assert.equal(targets[0].sectionLabel, null);
});

test("a lone unnamed section carries no redundant label", () => {
  // "Nursery A · Nursery A" would be noise — the class name already says it.
  const cls = schoolClass({ sections: [section({ name: null })] });
  assert.equal(assignmentTargets([cls])[0].sectionLabel, null);
});

test("an existing assignment restores onto its own section's row", () => {
  const cls = schoolClass({ sections: [section(), section({ id: "sec-b", name: "B" })] });
  assert.equal(
    existingTargetKey({ school_class_id: "cls", class_section_id: "sec-b" }, [cls]),
    targetKey("cls", "sec-b"),
  );
});

test("a legacy assignment restores onto the section the server would heal it into", () => {
  // Otherwise a teacher who IS assigned appears unassigned, and saving the
  // dialog would silently end their assignment.
  const cls = schoolClass({ sections: [section()] });
  assert.equal(
    existingTargetKey({ school_class_id: "cls", class_section_id: null }, [cls]),
    targetKey("cls", "sec-a"),
  );
});

// ── Grouping teachers ───────────────────────────────────────────────────────

test("teachers are grouped by the section they teach", () => {
  const cls = schoolClass({
    sections: [section(), section({ id: "sec-b", name: "B" })],
    teachers: [
      teacher({ class_section_id: "sec-a" }),
      teacher({ assignment_id: "a2", teacher_name: "Ravi", class_section_id: "sec-b" }),
    ],
  });

  const groups = groupTeachersBySection(cls);
  assert.deepEqual(groups.map((g) => g.teachers.map((t) => t.teacher_name)), [["Asha Rao"], ["Ravi"]]);
});

test("an empty section is still listed", () => {
  // An unstaffed section is exactly what an admin needs to notice.
  const cls = schoolClass({
    sections: [section(), section({ id: "sec-b", name: "B" })],
    teachers: [teacher({ class_section_id: "sec-a" })],
  });
  const groups = groupTeachersBySection(cls);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups[1].teachers, []);
});

test("unlinked legacy assignments are shown, not hidden", () => {
  const cls = schoolClass({ sections: [section()], teachers: [teacher({ class_section_id: null })] });
  const groups = groupTeachersBySection(cls);
  const unlinked = groups.find((group) => group.section === null);
  assert.ok(unlinked, "a teacher with no section must still appear somewhere");
  assert.equal(unlinked.teachers.length, 1);
});

// ── Archive safety ──────────────────────────────────────────────────────────

test("a section with assignments cannot be archived from the UI", () => {
  // The server refuses with SECTION_IN_USE. Disabling up front explains the
  // rule instead of making the admin discover it through a 409.
  const reason = sectionArchiveBlockedReason(section({ assigned_teacher_count: 2 }));
  assert.match(reason ?? "", /2 teachers still assigned/);
});

test("an empty section can be archived", () => {
  assert.equal(sectionArchiveBlockedReason(section()), null);
});

// ── Display ─────────────────────────────────────────────────────────────────

test("an unnamed section shows as the class itself", () => {
  const cls = schoolClass({ name: "LKG" });
  assert.equal(sectionLabel(section({ name: null, display_name: "" }), cls), "LKG");
  assert.equal(sectionLabel(section({ name: "B", display_name: "" }), cls), "LKG B");
});

// ── Wiring ──────────────────────────────────────────────────────────────────

test("the section manager can create, rename and archive", () => {
  const manager = source("components/school-admin/teachers/section-manager.tsx");
  assert.match(manager, /adminCreateClassSection/);
  assert.match(manager, /adminUpdateClassSection/);
  assert.match(manager, /is_active: false/, "archiving must go through the update endpoint");
  assert.ok(!manager.includes("adminDeleteClassSection"), "sections are archived, never deleted");
});

test("the section manager is reachable from a class card", () => {
  const classManager = source("components/school-admin/teachers/class-manager.tsx");
  assert.match(classManager, /SectionManager/);
  assert.match(classManager, /Manage sections of/, "the control needs an accessible label");
});

test("class cards group their teachers by section", () => {
  const classManager = source("components/school-admin/teachers/class-manager.tsx");
  assert.match(classManager, /groupTeachersBySection/);
});

test("the section manager reports failures rather than failing silently", () => {
  const manager = source("components/school-admin/teachers/section-manager.tsx");
  assert.match(manager, /getErrorMessage/);
  assert.match(manager, /variant: "error"/);
});
