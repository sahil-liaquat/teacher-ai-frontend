import type { ClassSection, SchoolClass, SchoolClassTeacher } from "@/lib/api";

/**
 * Section helpers for the School Admin surface.
 *
 * Pure functions, deliberately kept out of the components: these encode product
 * rules the backend also enforces (which section an assignment means, when the
 * choice is ambiguous), and rules like that are worth testing without mounting
 * a dialog. The frontend must not *re-implement* the business logic — it calls
 * the section endpoints — but it does have to decide what to render and when to
 * force a choice, and that is what lives here.
 */

/** The sections a class actually has, tolerating a pre-migration response. */
export function sectionsOf(schoolClass: SchoolClass): ClassSection[] {
  return schoolClass.sections ?? [];
}

/**
 * What to call a section in the UI.
 *
 * An unnamed section is the class's only, original section — the shape every
 * class had before sections became first-class. It shows as the class name so a
 * school that never used sections sees no change, rather than a blank chip or
 * an invented "A". Mirrors `SchoolTeacherService._section_label`.
 */
export function sectionLabel(section: ClassSection, schoolClass: SchoolClass): string {
  if (section.display_name) return section.display_name;
  return section.name ? `${schoolClass.name} ${section.name}` : schoolClass.name;
}

/**
 * Whether assigning a teacher to this class needs an explicit section.
 *
 * One section (or none, on an unmigrated response) is unambiguous and the
 * server resolves it. Several is genuinely ambiguous, and the server refuses
 * with SECTION_REQUIRED rather than guessing — so the UI must ask first rather
 * than submitting and surfacing an error.
 */
export function sectionChoiceRequired(schoolClass: SchoolClass): boolean {
  return sectionsOf(schoolClass).filter((section) => section.is_active).length > 1;
}

/** The section an assignment defaults to when the admin is not asked. */
export function defaultSectionId(schoolClass: SchoolClass): string | null {
  const active = sectionsOf(schoolClass).filter((section) => section.is_active);
  return active.length === 1 ? active[0].id : null;
}

export type TeacherGroup = {
  /** null for teachers on legacy assignments that carry no section. */
  section: ClassSection | null;
  label: string;
  teachers: SchoolClassTeacher[];
};

/**
 * Teachers grouped by the section they are assigned to.
 *
 * A class with parallel sections otherwise renders as one undifferentiated list
 * of names, which is precisely the ambiguity sections exist to remove: "who
 * leads 1A?" has to be answerable from the card.
 *
 * Sections with no teacher are still returned — an empty section is exactly the
 * thing an admin needs to notice. Unlinked legacy assignments collect into a
 * trailing `section: null` group rather than being hidden.
 */
export function groupTeachersBySection(schoolClass: SchoolClass): TeacherGroup[] {
  const sections = sectionsOf(schoolClass).filter((section) => section.is_active);
  const teachers = schoolClass.teachers ?? [];

  const groups: TeacherGroup[] = sections.map((section) => ({
    section,
    label: sectionLabel(section, schoolClass),
    teachers: teachers.filter((teacher) => teacher.class_section_id === section.id),
  }));

  const known = new Set(sections.map((section) => section.id));
  const unlinked = teachers.filter(
    (teacher) => !teacher.class_section_id || !known.has(teacher.class_section_id),
  );
  if (unlinked.length) {
    groups.push({ section: null, label: schoolClass.name, teachers: unlinked });
  }
  return groups;
}

/**
 * Whether a section can be archived from the UI.
 *
 * The server refuses with SECTION_IN_USE while active assignments remain —
 * assignments are the school's record of who taught what, and archiving out
 * from under them would strand it. Disabling the control up front explains the
 * rule instead of making the admin discover it through a 409.
 */
export function sectionArchiveBlockedReason(section: ClassSection): string | null {
  if (section.assigned_teacher_count > 0) {
    return `${section.assigned_teacher_count} teacher${
      section.assigned_teacher_count === 1 ? "" : "s"
    } still assigned. Reassign them first.`;
  }
  return null;
}


/**
 * One assignable target: a class, and the section within it.
 *
 * The assignment dialog works in these rather than in classes. Keying its draft
 * state on the class alone is the frontend half of the bug the section-aware
 * backend fixed — the second section of a class would overwrite the first in
 * the draft map and could never be submitted.
 */
export type AssignmentTarget = {
  /** Stable composite key. Never a display string — names are renameable. */
  key: string;
  schoolClass: SchoolClass;
  section: ClassSection | null;
  /** What to show in the row. */
  label: string;
  /** Shown as a secondary line only when the class actually has sections. */
  sectionLabel: string | null;
};

export function targetKey(classId: string, sectionId: string | null): string {
  return `${classId}::${sectionId ?? ""}`;
}

/**
 * Every target a teacher can be assigned to, one row per section.
 *
 * A class with no sections yields a single target with `section: null`, which
 * the server resolves to the class's only section — that is what keeps a
 * pre-migration or not-yet-backfilled class assignable.
 */
export function assignmentTargets(classes: SchoolClass[]): AssignmentTarget[] {
  return classes.flatMap((schoolClass): AssignmentTarget[] => {
    const sections = sectionsOf(schoolClass).filter((section) => section.is_active);
    if (!sections.length) {
      return [{
        key: targetKey(schoolClass.id, null),
        schoolClass,
        section: null,
        label: schoolClass.name,
        sectionLabel: null,
      }];
    }
    // A single unnamed section is the class itself — showing "Nursery A ·
    // Nursery A" would be noise, so it carries no secondary label.
    const showSection = sections.length > 1 || Boolean(sections[0].name);
    return sections.map((section) => ({
      key: targetKey(schoolClass.id, section.id),
      schoolClass,
      section,
      label: schoolClass.name,
      sectionLabel: showSection ? section.name ?? schoolClass.name : null,
    }));
  });
}

/**
 * The target key for an assignment a teacher already holds.
 *
 * Falls back to the class's only section when the row carries no section id, so
 * a legacy assignment restores onto the same row the server would heal it into
 * rather than appearing unassigned.
 */
export function existingTargetKey(
  assignment: { school_class_id: string; class_section_id?: string | null },
  classes: SchoolClass[],
): string {
  if (assignment.class_section_id) {
    return targetKey(assignment.school_class_id, assignment.class_section_id);
  }
  const schoolClass = classes.find((item) => item.id === assignment.school_class_id);
  const fallback = schoolClass ? defaultSectionId(schoolClass) : null;
  return targetKey(assignment.school_class_id, fallback);
}

/** One row of the assignment dialog's editable draft. */
export type AssignmentDraft = {
  selected: boolean;
  role: string;
  starts_on: string;
  ends_on: string;
};

/**
 * Seed the assignment dialog from a teacher's real assignments.
 *
 * ⚠ Every field an assignment carries must be seeded here, because
 * `PUT /teacher-assignments/bulk` REPLACES the assignment set: whatever the
 * dialog sends becomes the row. `starts_on`/`ends_on` used to be hardcoded to
 * `""` inline in the component while `role` was seeded correctly, so opening
 * the dialog and pressing Save rewrote both dates to NULL — on assignments the
 * server's own response then counted as "unchanged". A field that is not
 * round-tripped through a replace endpoint is a field that gets destroyed.
 *
 * Extracted from the component so this invariant is unit-testable; the dialog
 * is the form around it, the same way `CreateDayDialog` wraps
 * `curriculum-day-draft`.
 */
export function seedAssignmentDrafts(
  assigned: Array<{
    school_class_id: string;
    class_section_id?: string | null;
    assignment_role: string;
    starts_on?: string | null;
    ends_on?: string | null;
  }>,
  classes: SchoolClass[],
  targets: AssignmentTarget[],
): Record<string, AssignmentDraft> {
  const byKey = new Map(assigned.map((item) => [existingTargetKey(item, classes), item]));
  const drafts: Record<string, AssignmentDraft> = {};
  for (const target of targets) {
    const existing = byKey.get(target.key);
    drafts[target.key] = {
      selected: Boolean(existing),
      role: existing?.assignment_role ?? "lead",
      starts_on: existing?.starts_on ?? "",
      ends_on: existing?.ends_on ?? "",
    };
  }
  return drafts;
}
