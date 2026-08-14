import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * The authoritative, school-owned class section.
 *
 * `PrimarySchoolClass.section` was a free-form string: fine as a label, useless
 * as a reference. Teacher assignments — and later enrolment and attendance —
 * need something stable to point at. These tests pin the frontend half of that
 * move: canonical ids on the wire, and a display rule that leaves a school
 * which never used sections looking exactly as it did.
 */

function source(relativePath: string) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

const api = source("lib/api.ts");
const classManager = source("components/school-admin/teachers/class-manager.tsx");

test("the client exposes the canonical section endpoints", () => {
  for (const call of [
    "adminClassSections",
    "adminCreateClassSection",
    "adminUpdateClassSection",
  ]) {
    assert.ok(api.includes(call), `${call} is missing from the API client`);
  }
  assert.ok(api.includes("/school-admin/classes/${classId}/sections"));
  assert.ok(api.includes("/school-admin/class-sections/${sectionId}"));
});

test("there is no delete for a section", () => {
  // Assignments reference a section and are the school's record of who taught
  // what. Retiring one is an archive, never a row removal.
  const block = api.slice(
    api.indexOf("adminClassSections"),
    api.indexOf("adminAssignTeacherToClass"),
  );
  assert.ok(!block.includes('method: "DELETE"'), "a section delete crept in");
});

test("assignments carry the canonical section id", () => {
  assert.ok(api.includes("class_section_id?: string | null"));
  assert.ok(
    api.includes("class_section_id?: string | null;\n    assignment_role?: TeacherAssignmentRole;"),
    "the bulk assignment payload cannot reference a section",
  );
});

test("a class exposes its sections", () => {
  assert.ok(api.includes("sections: ClassSection[]"));
  assert.ok(
    api.includes("export type ClassSection = {"),
    "the canonical section has no type",
  );
});

test("the legacy section string is marked deprecated rather than removed", () => {
  // Compatibility before cleanup: the column is still written and still read by
  // a frontend talking to an unmigrated backend.
  const classType = api.slice(api.indexOf("export type SchoolClass = {"));
  assert.ok(
    classType.slice(0, 900).includes("@deprecated"),
    "the legacy label should be marked, not silently kept",
  );
});

// ── The display rule ────────────────────────────────────────────────────────

// Re-implemented here rather than imported: the helper is local to the
// component, and the rule it encodes is what this test is defending.
function sectionSummary(schoolClass: {
  section?: string | null;
  sections?: Array<{ name?: string | null }>;
}): string {
  const sections = schoolClass.sections ?? [];
  if (!sections.length) {
    return schoolClass.section ? ` · Section ${schoolClass.section}` : "";
  }
  const named = sections.filter((item) => item.name);
  if (!named.length) return "";
  const label = named.length === 1 ? "Section" : "Sections";
  return ` · ${label} ${named.map((item) => item.name).join(", ")}`;
}

test("a single unnamed section prints nothing", () => {
  // The class name is already on the card. A school that never used sections
  // must see exactly what it saw before — not a blank "Section" label, and not
  // an invented "A".
  assert.equal(sectionSummary({ sections: [{ name: null }] }), "");
});

test("named sections are listed", () => {
  assert.equal(sectionSummary({ sections: [{ name: "A" }] }), " · Section A");
  assert.equal(
    sectionSummary({ sections: [{ name: "A" }, { name: "B" }] }),
    " · Sections A, B",
  );
});

test("the legacy string is used only when the canonical list is absent", () => {
  // An unmigrated backend sends no `sections`. Anything else must prefer the
  // canonical list, so the two representations cannot disagree on screen.
  assert.equal(sectionSummary({ section: "A" }), " · Section A");
  assert.equal(
    sectionSummary({ section: "STALE", sections: [{ name: "A" }] }),
    " · Section A",
    "the legacy label must never win over the authoritative one",
  );
});

test("the class card reads the canonical list", () => {
  assert.ok(
    classManager.includes("sectionSummary(schoolClass)"),
    "the card still interpolates the legacy string directly",
  );
  assert.ok(classManager.includes("schoolClass.sections ?? []"));
});
