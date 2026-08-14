import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  ACCOUNT_STATUS_COPY,
  CURRICULUM_STATUS_COPY,
  DEFAULT_TEACHER_FILTERS,
  TEACHER_LEVELS,
  auditActionLabel,
  classWarning,
  curriculumSourceLabel,
  curriculumStatus,
  curriculumWarning,
  filtersFromSearchParams,
  filtersToSearchParams,
  groupClassesByLevel,
  invitationIsExpired,
  levelRank,
  teacherLevelLabel,
} from "../../lib/school-admin-teachers.ts";

function source(relativePath: string) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

function teacher(overrides: Record<string, unknown> = {}) {
  return {
    id: "t1",
    full_name: "Asha Rao",
    email: "asha@school.edu.in",
    role: "teacher",
    is_active: true,
    account_status: "active",
    joined_at: "2026-04-01T00:00:00Z",
    assigned_classes: [],
    assigned_levels: [],
    has_curriculum: false,
    curriculum_gap_levels: [],
    ...overrides,
  } as never;
}

function schoolClass(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    organization_id: "o1",
    academic_year_id: "y1",
    name: "Nursery A",
    level: "nursery",
    is_active: true,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    assigned_teacher_count: 0,
    teachers: [],
    has_published_curriculum: true,
    published_lesson_count: 40,
    ...overrides,
  } as never;
}

// ── navigation ─────────────────────────────────────────────────────────────

test("Teachers sits inside the operating loop and before Settings in the nav", () => {
  // Reads lib/school-admin-nav.ts: the nav left the shell so one definition
  // serves the sidebar and the tests.
  const nav = source("lib/school-admin-nav.ts");
  // Array.from, not spread: tsconfig targets es5, where iterating a matchAll
  // result needs downlevelIteration.
  const order = Array.from(nav.matchAll(/href: "(\/school-admin[^"]*)"/g)).map((match) => match[1]);
  const at = (href: string) => order.indexOf(href);

  assert.ok(at("/school-admin/teachers") > -1, "the Teachers nav item is missing");
  // The old assertion keyed on Academic Years preceding Teachers. Academic
  // Years is no longer top-level navigation — it is calendar sub-navigation —
  // so the surviving invariant is that staffing follows the classes it staffs
  // and still precedes Settings.
  assert.ok(
    at("/school-admin/classes") < at("/school-admin/teachers"),
    "Teachers should follow Classes & Sections",
  );
  assert.ok(
    at("/school-admin/teachers") < at("/school-admin/settings"),
    "Settings stays last",
  );
});

test("the Teachers workspace is only reachable inside the school-admin shell", () => {
  // The shell redirects anyone whose role is not org_admin, so mounting the
  // page under /school-admin is what makes the surface school-admin-only.
  const shell = source("components/school-admin/school-admin-shell.tsx");
  assert.match(shell, /user\.role !== "org_admin"/);
  assert.ok(source("app/school-admin/teachers/page.tsx").includes("TeachersWorkspace"));
});

// ── levels ─────────────────────────────────────────────────────────────────

test("every Primary level can be staffed, not just the ones with authored curriculum", () => {
  assert.deepEqual(
    TEACHER_LEVELS.map((item) => item.value),
    ["nursery", "lkg", "ukg", "class_1", "class_2", "class_3", "class_4", "class_5"],
    "this list mirrors PRIMARY_LEVELS in the backend; a school still has Class 3–5 classes to staff",
  );
  assert.equal(teacherLevelLabel("class_4"), "Class 4");
  assert.equal(teacherLevelLabel("unknown_level"), "unknown_level");
  assert.ok(levelRank("nursery") < levelRank("class_5"));
});

// ── curriculum status ──────────────────────────────────────────────────────

test("an unassigned teacher is not reported as a curriculum gap", () => {
  assert.equal(curriculumStatus(teacher()), "unassigned");
  assert.equal(
    CURRICULUM_STATUS_COPY.unassigned.label,
    "Not assigned",
    "showing 'No curriculum' would send the admin to publish content when the fix is an assignment",
  );
});

test("curriculum status distinguishes a partial gap from a total one", () => {
  const ready = teacher({ assigned_levels: ["nursery"], curriculum_gap_levels: [] });
  const partial = teacher({ assigned_levels: ["nursery", "lkg"], curriculum_gap_levels: ["lkg"] });
  const missing = teacher({ assigned_levels: ["lkg"], curriculum_gap_levels: ["lkg"] });

  assert.equal(curriculumStatus(ready), "ready");
  assert.equal(curriculumStatus(partial), "partial");
  assert.equal(curriculumStatus(missing), "missing");
});

test("curriculum warnings name the level and the academic year", () => {
  const warning = curriculumWarning({ level: "nursery", published_lesson_count: 0, source: "none" });
  assert.equal(warning, "No published Nursery curriculum for this academic year.");
  assert.equal(curriculumWarning({ level: "nursery", published_lesson_count: 40, source: "teachpad" }), null);
  assert.equal(classWarning(schoolClass({ has_published_curriculum: false, level: "lkg" })), "No published LKG curriculum for this academic year.");
  assert.equal(classWarning(schoolClass()), null);
});

test("a level the school has not customised still reads as TeachPad curriculum", () => {
  assert.equal(curriculumSourceLabel("school"), "School curriculum");
  assert.equal(curriculumSourceLabel("teachpad"), "TeachPad curriculum");
  assert.equal(curriculumSourceLabel("none"), "Nothing published");
});

// ── grouping ───────────────────────────────────────────────────────────────

test("classes group by level in teaching order, named alphabetically inside a level", () => {
  const groups = groupClassesByLevel([
    schoolClass({ id: "b", name: "LKG Blue", level: "lkg" }),
    schoolClass({ id: "c", name: "Nursery B" }),
    schoolClass({ id: "a", name: "Nursery A" }),
  ]);

  assert.deepEqual(groups.map((group) => group.level), ["nursery", "lkg"]);
  assert.deepEqual(groups[0].classes.map((item) => item.name), ["Nursery A", "Nursery B"]);
});

// ── filters ────────────────────────────────────────────────────────────────

test("filters round-trip through the URL so a filtered roster stays linkable", () => {
  const filters = {
    search: "asha",
    level: "nursery",
    schoolClassId: "class-1",
    status: "active",
    assignment: "unassigned",
    page: 3,
  };
  const restored = filtersFromSearchParams(filtersToSearchParams(filters));

  assert.deepEqual(restored, filters);
});

test("page 1 is left out of the URL, and a missing query string is the default view", () => {
  assert.equal(filtersToSearchParams({ ...DEFAULT_TEACHER_FILTERS, page: 1 }).size, 0);
  assert.equal(filtersToSearchParams({ ...DEFAULT_TEACHER_FILTERS, page: 2 }).get("page"), "2");
  assert.deepEqual(filtersFromSearchParams(null), DEFAULT_TEACHER_FILTERS);
});

test("a nonsense page in the URL falls back to the first page rather than breaking the query", () => {
  assert.equal(filtersFromSearchParams(new URLSearchParams("page=-4")).page, 1);
  assert.equal(filtersFromSearchParams(new URLSearchParams("page=oops")).page, 1);
});

// ── invitations ────────────────────────────────────────────────────────────

test("an invitation past its expiry reads as expired even while the row still says pending", () => {
  const past = { status: "pending", expires_at: new Date(Date.now() - 1000).toISOString() } as never;
  const future = { status: "pending", expires_at: new Date(Date.now() + 86_400_000).toISOString() } as never;

  assert.equal(invitationIsExpired(past), true);
  assert.equal(invitationIsExpired(future), false);
});

test("an invited person is shown as invited, not as an inactive teacher", () => {
  assert.equal(ACCOUNT_STATUS_COPY.invited.label, "Invited");
  assert.notEqual(ACCOUNT_STATUS_COPY.invited.tone, ACCOUNT_STATUS_COPY.inactive.tone);
});

test("audit actions render as readable history entries", () => {
  assert.equal(auditActionLabel("teacher_assigned"), "Assigned to a class");
  assert.equal(auditActionLabel("assignment_role_changed"), "Role changed");
  assert.equal(auditActionLabel("something_new"), "something new");
});

// ── component contracts ────────────────────────────────────────────────────

test("the invite dialog explains that the teacher must accept, and never claims an email was sent", () => {
  const dialog = source("components/school-admin/teachers/invite-teacher-dialog.tsx");
  assert.match(dialog, /accept/i);
  assert.match(dialog, /Copy link/, "the backend sends no email — the admin has to pass the link on");
  assert.match(dialog, /shown once/, "the token is hashed at rest and cannot be recovered");
  assert.doesNotMatch(dialog, /We(?:'ve| have) emailed|sent an email/i);
});

test("the assignment dialog surfaces every warning the spec calls for", () => {
  const dialog = source("components/school-admin/teachers/assignment-dialog.tsx");
  assert.match(dialog, /already has a lead teacher/);
  assert.match(dialog, /not a member of your school/);
  assert.match(dialog, /academic year is not current/);
  assert.match(dialog, /classWarning/, "per-class curriculum availability is rendered inline");
});

test("bulk assignment sends the complete desired set, not a delta", () => {
  const dialog = source("components/school-admin/teachers/assignment-dialog.tsx");
  assert.match(dialog, /adminReplaceTeacherAssignments/);
  // The desired set is now keyed by TARGET — (class, section) — not by class.
  // Keying on the class alone made the second section of a class overwrite the
  // first in the draft map, so it could never be submitted.
  assert.match(
    dialog,
    /selectedKeys\.map/,
    "omitted targets are ended by the backend, so the payload is the full set",
  );
  assert.match(
    dialog,
    /class_section_id: target\.section\?\.id \?\? null/,
    "each assignment must name the section it attaches to",
  );
});

test("membership and assignment changes invalidate the roster and curriculum queries", () => {
  const workspace = source("components/school-admin/teachers/teachers-workspace.tsx");
  for (const key of [
    "SCHOOL_TEACHERS_QUERY_KEY",
    "SCHOOL_CLASSES_QUERY_KEY",
    "TEACHER_INVITATIONS_QUERY_KEY",
    "academic-year-readiness",
  ]) {
    assert.ok(workspace.includes(key), `refresh() does not invalidate ${key}`);
  }
});

test("the workspace renders empty, loading and error states rather than a blank page", () => {
  const workspace = source("components/school-admin/teachers/teachers-workspace.tsx");
  const table = source("components/school-admin/teachers/teacher-table.tsx");

  assert.match(workspace, /roster\.isError/);
  assert.match(workspace, /PageError/);
  assert.match(table, /isLoading/);
  assert.match(table, /No teachers match these filters/);
});

test("the invitation acceptance page handles expired and already-used links", () => {
  const page = source("app/invitations/[token]/page.tsx");
  assert.match(page, /has expired/);
  assert.match(page, /already been used/);
  assert.match(page, /cancelled/);
  assert.match(page, /acceptOrganizationInvitation/);
});

test("every destructive action is confirmed before it runs", () => {
  const workspace = source("components/school-admin/teachers/teachers-workspace.tsx");
  const classes = source("components/school-admin/teachers/class-manager.tsx");

  assert.equal(
    (workspace.match(/<ConfirmDialog/g) ?? []).length,
    2,
    "removing a teacher and cancelling an invitation both need confirmation",
  );
  assert.match(classes, /<ConfirmDialog/);
  assert.match(classes, /Teaching history is kept/);
});

test("the school-admin surface never renders student or observation data", () => {
  for (const file of [
    "components/school-admin/teachers/teachers-workspace.tsx",
    "components/school-admin/teachers/teacher-table.tsx",
    "components/school-admin/teachers/teacher-detail-drawer.tsx",
    "components/school-admin/teachers/assignment-dialog.tsx",
    "components/school-admin/teachers/class-manager.tsx",
  ]) {
    const contents = source(file);
    // Field access, not the word: the drawer deliberately *mentions*
    // observations to state that it does not show them.
    assert.doesNotMatch(
      contents,
      /PrimaryStudent|PrimaryObservation|\.students\b|\.observations\b/,
      `${file} reaches into teacher-owned roster data`,
    );
  }
  assert.match(
    source("components/school-admin/teachers/teacher-detail-drawer.tsx"),
    /stay private to the teacher/,
    "the drawer states the boundary so nobody adds a students tab to it later",
  );
});
