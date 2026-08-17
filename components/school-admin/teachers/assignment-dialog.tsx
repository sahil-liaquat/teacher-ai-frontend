"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarRange, GraduationCap } from "lucide-react";
import {
  backendApi,
  type PrimaryAcademicYear,
  type SchoolClass,
  type SchoolTeacher,
  type TeacherAssignmentRole,
} from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import {
  classWarning,
  groupClassesByLevel,
} from "@/lib/school-admin-teachers";
import {
  type AssignmentTarget,
  assignmentTargets,
  seedAssignmentDrafts,
} from "@/lib/school-admin-sections";
import { useSchoolLevels } from "@/lib/use-school-levels";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { ActionDialog } from "@/components/school-admin/shared/action-dialog";
import { cn } from "@/lib/utils";

type Draft = { selected: boolean; role: TeacherAssignmentRole; starts_on: string; ends_on: string };

export function AssignmentDialog({
  open,
  onOpenChange,
  teacher,
  classes,
  academicYear,
  isCurrentYear,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: SchoolTeacher | null;
  classes: SchoolClass[];
  academicYear?: PrimaryAcademicYear | null;
  isCurrentYear: boolean;
  onSaved: () => Promise<void> | void;
}) {
  const { toast } = useToast();
  const { labelFor: teacherLevelLabel } = useSchoolLevels();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState(false);

  // Reset from the teacher's real assignments every time the dialog opens, so
  // a cancelled edit never leaks into the next one.
  useEffect(() => {
    if (!open || !teacher) return;
    // Keyed by TARGET — (class, section) — not by class. Keying on the class
    // made the second section of a class overwrite the first, so it could never
    // be submitted however well the backend understood sections.
    //
    // The seeding rule itself lives in lib/school-admin-sections so the
    // "every field must round-trip a REPLACE" invariant is unit-testable.
    setDrafts(
      seedAssignmentDrafts(
        teacher.assigned_classes,
        classes,
        assignmentTargets(classes),
      ) as Record<string, Draft>,
    );
  }, [open, teacher, classes]);

  const activeClasses = useMemo(() => classes.filter((item) => item.is_active), [classes]);
  const groups = useMemo(() => groupClassesByLevel(activeClasses), [activeClasses]);
  const targetsByClass = useMemo(() => {
    const map = new Map<string, AssignmentTarget[]>();
    for (const target of assignmentTargets(activeClasses)) {
      map.set(target.schoolClass.id, [...(map.get(target.schoolClass.id) ?? []), target]);
    }
    return map;
  }, [activeClasses]);
  const allTargets = useMemo(() => assignmentTargets(activeClasses), [activeClasses]);
  const selectedKeys = useMemo(
    () => Object.entries(drafts).filter(([, draft]) => draft.selected).map(([key]) => key),
    [drafts],
  );
  const notAMember = teacher?.account_status === "invited";

  // A lead conflict is now per SECTION: Section A having a lead says nothing
  // about Section B, and warning class-wide would block a legal assignment.
  const leadConflicts = useMemo(() => {
    if (!teacher) return [];
    return allTargets.filter((target) => {
      const draft = drafts[target.key];
      if (!draft?.selected || draft.role !== "lead") return false;
      const lead = target.schoolClass.teachers.find(
        (entry) =>
          entry.assignment_role === "lead" &&
          (target.section
            ? entry.class_section_id === target.section.id
            : !entry.class_section_id),
      );
      return Boolean(lead && lead.teacher_id !== teacher.id);
    });
  }, [allTargets, drafts, teacher]);

  function update(key: string, patch: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
  }

  async function save() {
    if (!teacher) return;
    setBusy(true);
    try {
      const result = await backendApi.adminReplaceTeacherAssignments({
        teacher_id: teacher.id,
        academic_year_id: academicYear?.id,
        assignments: selectedKeys.map((key) => {
          const target = allTargets.find((item) => item.key === key)!;
          return {
            school_class_id: target.schoolClass.id,
            class_section_id: target.section?.id ?? null,
            assignment_role: drafts[key].role,
            starts_on: drafts[key].starts_on || null,
            ends_on: drafts[key].ends_on || null,
          };
        }),
      });
      await onSaved();
      onOpenChange(false);
      toast({
        title: `${teacher.full_name}'s classes updated`,
        description: `${result.created} added, ${result.role_changed} role change(s), ${result.deactivated} ended.`,
      });
    } catch (error) {
      toast({
        title: "Could not update these assignments",
        description: getErrorMessage(error, "Nothing was changed. Try again."),
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={teacher ? `Assign classes to ${teacher.full_name}` : "Assign classes"}
      description="Teachers receive the published curriculum for the levels they are assigned to — you never assign lessons one by one."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={busy || notAMember || leadConflicts.length > 0} onClick={() => void save()}>
            {busy ? "Saving…" : "Save assignment"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <dl className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Academic year</dt>
            <dd className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-950">
              <CalendarRange className="h-4 w-4 text-slate-400" aria-hidden="true" />
              {academicYear?.name ?? "Not set"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Teacher</dt>
            <dd className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-950">
              <GraduationCap className="h-4 w-4 text-slate-400" aria-hidden="true" />
              {teacher?.full_name ?? "—"}
            </dd>
          </div>
        </dl>

        {notAMember ? (
          <Warning>This teacher is not a member of your school. They must accept their invitation before you can assign classes.</Warning>
        ) : null}
        {!isCurrentYear && academicYear ? (
          <Warning>The academic year is not current. Assignments you make here apply to {academicYear.name}, not to the year teachers are planning today.</Warning>
        ) : null}
        {leadConflicts.map((target) => (
          <Warning key={target.key}>
            “{target.sectionLabel ? `${target.label} ${target.sectionLabel}` : target.label}”
            already has a lead teacher. Choose Assistant, or change the current lead first.
          </Warning>
        ))}

        {groups.length ? (
          <div className="space-y-4">
            {groups.map((group) => (
              <fieldset key={group.level}>
                <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  {teacherLevelLabel(group.level)}
                </legend>
                <div className="space-y-2">
                  {group.classes.flatMap((item) =>
                    (targetsByClass.get(item.id) ?? []).map((target) => (
                      <ClassRow
                        key={target.key}
                        target={target}
                        draft={drafts[target.key]}
                        disabled={notAMember}
                        onChange={(patch) => update(target.key, patch)}
                      />
                    )),
                  )}
                </div>
              </fieldset>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
            Create a class first — there is nothing to assign yet.
          </p>
        )}
      </div>
    </ActionDialog>
  );
}

function ClassRow({
  target,
  draft,
  disabled,
  onChange,
}: {
  target: AssignmentTarget;
  draft?: Draft;
  disabled: boolean;
  onChange: (patch: Partial<Draft>) => void;
}) {
  const schoolClass = target.schoolClass;
  const warning = classWarning(schoolClass);
  const selected = Boolean(draft?.selected);

  return (
    <div className={cn("rounded-2xl border p-3.5 transition", selected ? "border-blue-300 bg-blue-50/40" : "border-slate-200")}>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex flex-1 items-center gap-3 text-sm font-semibold text-slate-900">
          <Checkbox
            checked={selected}
            disabled={disabled}
            onChange={(event) => onChange({ selected: event.target.checked })}
          />
          <span>
            {schoolClass.name}
            {/* The section is what the assignment actually attaches to, so it
                is part of the row's identity rather than a footnote. Absent for
                a class whose only section is unnamed — there the class name
                already says everything. */}
            {target.sectionLabel ? (
              <span className="ml-1.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600">
                {target.sectionLabel}
              </span>
            ) : null}
            <span className="ml-2 text-xs font-medium text-slate-500">
              {schoolClass.published_lesson_count} published day{schoolClass.published_lesson_count === 1 ? "" : "s"}
            </span>
          </span>
        </label>
        {selected ? (
          <Select
            className="w-40"
            aria-label={`Role on ${schoolClass.name}${target.sectionLabel ? ` ${target.sectionLabel}` : ""}`}
            value={draft?.role ?? "lead"}
            onChange={(event) => onChange({ role: event.target.value as TeacherAssignmentRole })}
          >
            <option value="lead">Lead teacher</option>
            <option value="assistant">Assistant</option>
          </Select>
        ) : null}
      </div>
      {selected ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">
            Starts (optional)
            <Input type="date" className="mt-1.5" value={draft?.starts_on ?? ""} onChange={(event) => onChange({ starts_on: event.target.value })} />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Ends (optional)
            <Input type="date" className="mt-1.5" value={draft?.ends_on ?? ""} onChange={(event) => onChange({ ends_on: event.target.value })} />
          </label>
        </div>
      ) : null}
      {warning ? <p className="mt-2.5 flex items-start gap-1.5 text-xs font-semibold text-amber-800"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />{warning}</p> : null}
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs font-semibold leading-5 text-amber-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}
