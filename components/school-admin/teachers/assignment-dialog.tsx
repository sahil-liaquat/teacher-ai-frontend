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
  teacherLevelLabel,
} from "@/lib/school-admin-teachers";
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
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState(false);

  // Reset from the teacher's real assignments every time the dialog opens, so
  // a cancelled edit never leaks into the next one.
  useEffect(() => {
    if (!open || !teacher) return;
    const assigned = new Map(teacher.assigned_classes.map((item) => [item.school_class_id, item]));
    setDrafts(
      Object.fromEntries(
        classes.map((item) => {
          const existing = assigned.get(item.id);
          return [item.id, {
            selected: Boolean(existing),
            role: (existing?.assignment_role ?? "lead") as TeacherAssignmentRole,
            starts_on: "",
            ends_on: "",
          } satisfies Draft];
        }),
      ),
    );
  }, [open, teacher, classes]);

  const groups = useMemo(() => groupClassesByLevel(classes.filter((item) => item.is_active)), [classes]);
  const selectedIds = useMemo(
    () => Object.entries(drafts).filter(([, draft]) => draft.selected).map(([id]) => id),
    [drafts],
  );
  const notAMember = teacher?.account_status === "invited";

  const leadConflicts = useMemo(() => {
    if (!teacher) return [];
    return classes.filter((item) => {
      const draft = drafts[item.id];
      if (!draft?.selected || draft.role !== "lead") return false;
      const lead = item.teachers.find((entry) => entry.assignment_role === "lead");
      return Boolean(lead && lead.teacher_id !== teacher.id);
    });
  }, [classes, drafts, teacher]);

  function update(classId: string, patch: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [classId]: { ...current[classId], ...patch } }));
  }

  async function save() {
    if (!teacher) return;
    setBusy(true);
    try {
      const result = await backendApi.adminReplaceTeacherAssignments({
        teacher_id: teacher.id,
        academic_year_id: academicYear?.id,
        assignments: selectedIds.map((classId) => ({
          school_class_id: classId,
          assignment_role: drafts[classId].role,
          starts_on: drafts[classId].starts_on || null,
          ends_on: drafts[classId].ends_on || null,
        })),
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
        {leadConflicts.map((item) => (
          <Warning key={item.id}>
            “{item.name}” already has a lead teacher. Choose Assistant, or change the current lead first.
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
                  {group.classes.map((item) => (
                    <ClassRow
                      key={item.id}
                      schoolClass={item}
                      draft={drafts[item.id]}
                      disabled={notAMember}
                      onChange={(patch) => update(item.id, patch)}
                    />
                  ))}
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
  schoolClass,
  draft,
  disabled,
  onChange,
}: {
  schoolClass: SchoolClass;
  draft?: Draft;
  disabled: boolean;
  onChange: (patch: Partial<Draft>) => void;
}) {
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
            <span className="ml-2 text-xs font-medium text-slate-500">
              {schoolClass.published_lesson_count} published day{schoolClass.published_lesson_count === 1 ? "" : "s"}
            </span>
          </span>
        </label>
        {selected ? (
          <Select
            className="w-40"
            aria-label={`Role on ${schoolClass.name}`}
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
