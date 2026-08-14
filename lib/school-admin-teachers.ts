import type {
  CurriculumSource,
  SchoolClass,
  SchoolTeacher,
  TeacherCurriculumSlot,
  TeacherInvitation,
} from "@/lib/api";
// Relative with an explicit extension, not the "@/" alias: this is a VALUE
// import, and the node test runner resolves it at runtime where the alias
// does not exist. Type-only imports elsewhere in this file survive the alias
// because strip-types erases them before resolution.
import { PRIMARY_CURRICULUM } from "./curriculum-definition.ts";

/**
 * Every level the curriculum defines. Deliberately not `SCHOOL_LEVELS` from
 * school-admin-curriculum: that list stops at Class 2 because the authoring UI
 * only ships curriculum that far, but a school still has Class 3–5 classes to
 * staff — a real product difference, not a duplicate.
 *
 * Now derived from the curriculum definition rather than hand-copied. The
 * previous comment asked the next reader to keep this in sync with the
 * backend's PRIMARY_LEVELS by hand; a test checks it instead.
 */
export const TEACHER_LEVELS = PRIMARY_CURRICULUM.levels;

export type TeacherLevel = string;

export function teacherLevelLabel(level: string): string {
  return TEACHER_LEVELS.find((item) => item.value === level)?.label ?? level;
}

export function levelRank(level: string): number {
  const index = TEACHER_LEVELS.findIndex((item) => item.value === level);
  return index === -1 ? TEACHER_LEVELS.length : index;
}

export const ASSIGNMENT_ROLE_LABELS: Record<string, string> = {
  lead: "Lead teacher",
  assistant: "Assistant",
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  teacher_invited: "Invited",
  teacher_joined: "Joined the school",
  teacher_removed: "Removed from school",
  class_created: "Class created",
  class_archived: "Class archived",
  teacher_assigned: "Assigned to a class",
  teacher_unassigned: "Assignment ended",
  assignment_role_changed: "Role changed",
};

export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}

export type CurriculumStatus = "ready" | "partial" | "missing" | "unassigned";

/**
 * The roster's "Curriculum status" column. `unassigned` is distinct from
 * `missing` on purpose: a teacher with no classes has no curriculum gap to
 * fix, they have an assignment to make, and showing both as red sends the
 * admin to the wrong screen.
 */
export function curriculumStatus(teacher: SchoolTeacher): CurriculumStatus {
  if (!teacher.assigned_levels.length) return "unassigned";
  if (!teacher.curriculum_gap_levels.length) return "ready";
  return teacher.curriculum_gap_levels.length === teacher.assigned_levels.length
    ? "missing"
    : "partial";
}

export const CURRICULUM_STATUS_COPY: Record<CurriculumStatus, { label: string; tone: string }> = {
  ready: { label: "Curriculum available", tone: "bg-emerald-50 text-emerald-700" },
  partial: { label: "Some levels missing", tone: "bg-amber-50 text-amber-800" },
  missing: { label: "No curriculum", tone: "bg-rose-50 text-rose-700" },
  unassigned: { label: "Not assigned", tone: "bg-slate-100 text-slate-600" },
};

export const ACCOUNT_STATUS_COPY: Record<string, { label: string; tone: string }> = {
  active: { label: "Active", tone: "bg-emerald-50 text-emerald-700" },
  inactive: { label: "Inactive", tone: "bg-slate-100 text-slate-600" },
  invited: { label: "Invited", tone: "bg-blue-50 text-blue-700" },
};

export function curriculumSourceLabel(source: CurriculumSource): string {
  if (source === "school") return "School curriculum";
  if (source === "teachpad") return "TeachPad curriculum";
  return "Nothing published";
}

export function curriculumWarning(slot: TeacherCurriculumSlot): string | null {
  return slot.source === "none"
    ? `No published ${teacherLevelLabel(slot.level)} curriculum for this academic year.`
    : null;
}

export function classWarning(schoolClass: SchoolClass): string | null {
  return schoolClass.has_published_curriculum
    ? null
    : `No published ${teacherLevelLabel(schoolClass.level)} curriculum for this academic year.`;
}

export function groupClassesByLevel(classes: SchoolClass[]): Array<{ level: string; classes: SchoolClass[] }> {
  const groups = new Map<string, SchoolClass[]>();
  for (const item of classes) {
    const bucket = groups.get(item.level);
    if (bucket) bucket.push(item);
    else groups.set(item.level, [item]);
  }
  // Array.from, not spread: tsconfig targets es5, where iterating a Map needs
  // downlevelIteration.
  return Array.from(groups.entries())
    .sort((a, b) => levelRank(a[0]) - levelRank(b[0]))
    .map(([level, items]) => ({
      level,
      classes: items.slice().sort((a: SchoolClass, b: SchoolClass) => a.name.localeCompare(b.name)),
    }));
}

export function invitationIsExpired(invitation: TeacherInvitation): boolean {
  return invitation.status === "expired" || new Date(invitation.expires_at).getTime() <= Date.now();
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(parsed);
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  }).format(parsed);
}

export type TeacherFilters = {
  search: string;
  level: string;
  schoolClassId: string;
  status: string;
  assignment: string;
  page: number;
};

export const DEFAULT_TEACHER_FILTERS: TeacherFilters = {
  search: "",
  level: "",
  schoolClassId: "",
  status: "",
  assignment: "",
  page: 1,
};

/**
 * Filters live in the URL so a filtered roster can be linked, reloaded and
 * navigated back to. `page` is dropped when it is 1 to keep the common URL clean.
 */
export function filtersToSearchParams(filters: TeacherFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.level) params.set("level", filters.level);
  if (filters.schoolClassId) params.set("class", filters.schoolClassId);
  if (filters.status) params.set("status", filters.status);
  if (filters.assignment) params.set("assignment", filters.assignment);
  if (filters.page > 1) params.set("page", String(filters.page));
  return params;
}

export function filtersFromSearchParams(params: URLSearchParams | null): TeacherFilters {
  if (!params) return { ...DEFAULT_TEACHER_FILTERS };
  const page = Number(params.get("page") ?? "1");
  return {
    search: params.get("q") ?? "",
    level: params.get("level") ?? "",
    schoolClassId: params.get("class") ?? "",
    status: params.get("status") ?? "",
    assignment: params.get("assignment") ?? "",
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
  };
}
