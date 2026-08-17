"use client";

import { useState } from "react";
import { AlertTriangle, Archive, Layers, Plus, Users } from "lucide-react";
import { backendApi, type PrimaryAcademicYear, type SchoolClass } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import {
  ASSIGNMENT_ROLE_LABELS,
  classWarning,
  groupClassesByLevel,
} from "@/lib/school-admin-teachers";
import { useSchoolLevels } from "@/lib/use-school-levels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ActionDialog, ConfirmDialog } from "@/components/school-admin/shared/action-dialog";
import { SectionManager } from "@/components/school-admin/teachers/section-manager";
import { groupTeachersBySection } from "@/lib/school-admin-sections";
import { SectionHeading } from "@/components/school-admin/shared/page-primitives";
import { cn } from "@/lib/utils";

export function ClassManager({
  classes,
  isLoading,
  academicYear,
  onChanged,
}: {
  classes: SchoolClass[];
  isLoading: boolean;
  academicYear?: PrimaryAcademicYear | null;
  onChanged: () => Promise<void> | void;
}) {
  const { toast } = useToast();
  const { labelFor: teacherLevelLabel } = useSchoolLevels();
  const [createOpen, setCreateOpen] = useState(false);
  const [archiving, setArchiving] = useState<SchoolClass | null>(null);
  const [managingSections, setManagingSections] = useState<SchoolClass | null>(null);
  const [busy, setBusy] = useState(false);
  const groups = groupClassesByLevel(classes);

  async function archive() {
    if (!archiving) return;
    setBusy(true);
    try {
      const result = await backendApi.adminDeleteSchoolClass(archiving.id);
      await onChanged();
      toast({
        title: result.archived ? `${archiving.name} archived` : `${archiving.name} deleted`,
        description: result.archived
          ? "Its teaching history is preserved and current assignments have ended."
          : "Nobody had been assigned to it, so nothing was left to keep.",
      });
      setArchiving(null);
    } catch (error) {
      toast({
        title: "Could not archive this class",
        description: getErrorMessage(error, "Try again."),
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <SectionHeading
        title="School classes"
        description={`Classes and sections for ${academicYear?.name ?? "this academic year"}. Assigned teachers receive the published curriculum for the class level automatically.`}
        action={<Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Create class</Button>}
      />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-36 rounded-2xl" />)}</div>
      ) : groups.length ? (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.level}>
              <h3 className="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{teacherLevelLabel(group.level)}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.classes.map((item) => (
                  <ClassCard
                    key={item.id}
                    schoolClass={item}
                    onArchive={() => setArchiving(item)}
                    onManageSections={() => setManagingSections(item)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <Users className="mx-auto h-7 w-7 text-slate-400" />
          <h3 className="mt-3 text-base font-semibold text-slate-950">Create your first class</h3>
          <p className="mt-2 text-sm text-slate-500">Classes like “Nursery A” are what teachers are assigned to.</p>
          <Button className="mt-5" onClick={() => setCreateOpen(true)}>Create class</Button>
        </div>
      )}

      <CreateClassDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        academicYear={academicYear}
        existing={classes}
        onCreated={onChanged}
      />
      <SectionManager
        schoolClass={managingSections}
        open={Boolean(managingSections)}
        onOpenChange={(open) => { if (!open) setManagingSections(null); }}
        onChanged={onChanged}
      />
      <ConfirmDialog
        open={Boolean(archiving)}
        onOpenChange={(open) => { if (!open) setArchiving(null); }}
        busy={busy}
        destructive
        title={`Archive ${archiving?.name ?? "this class"}?`}
        description="Current assignments end and the class stops accepting new ones. Teaching history is kept — a class that has never been assigned is removed outright instead."
        confirmLabel="Archive class"
        onConfirm={archive}
      />
    </section>
  );
}

/**
 * What to print after the level.
 *
 * Reads the authoritative `sections` list, and falls back to the legacy
 * `section` string only when the list is absent — which happens for exactly one
 * reason worth supporting: this build talking to a backend that has not yet
 * been migrated. Named sections are listed; a single UNNAMED section prints
 * nothing, because that is the class's only section and the class name above
 * already says which class it is.
 */
function sectionSummary(schoolClass: SchoolClass): string {
  const sections = schoolClass.sections ?? [];
  if (!sections.length) {
    return schoolClass.section ? ` · Section ${schoolClass.section}` : "";
  }
  const named = sections.filter((item) => item.name);
  if (!named.length) return "";
  const label = named.length === 1 ? "Section" : "Sections";
  return ` · ${label} ${named.map((item) => item.name).join(", ")}`;
}

function ClassCard({
  schoolClass,
  onArchive,
  onManageSections,
}: {
  schoolClass: SchoolClass;
  onArchive: () => void;
  onManageSections: () => void;
}) {
  const { labelFor: teacherLevelLabel } = useSchoolLevels();
  const warning = classWarning(schoolClass);
  const groups = groupTeachersBySection(schoolClass);
  const showSectionHeadings = groups.length > 1;
  return (
    <article className={cn("rounded-2xl border bg-white p-4", schoolClass.is_active ? "border-slate-200" : "border-slate-200 bg-slate-50 opacity-75")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-base font-semibold tracking-tight text-slate-950">{schoolClass.name}</h4>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            {teacherLevelLabel(schoolClass.level)}{sectionSummary(schoolClass)}{schoolClass.is_active ? "" : " · Archived"}
          </p>
          {schoolClass.subjects?.length ? <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">{schoolClass.subjects.join(" · ")}</p> : null}
        </div>
        {schoolClass.is_active ? (
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Manage sections of ${schoolClass.name}`}
              onClick={onManageSections}
            >
              <Layers className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" aria-label={`Archive ${schoolClass.name}`} onClick={onArchive}>
              <Archive className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>
      <div className="mt-3 space-y-2.5">
        {groups.length ? (
          groups.map((group) => (
            <div key={group.section?.id ?? "unlinked"} className="space-y-1">
              {/* The section heading only earns its place once there is more
                  than one — a single-section class would otherwise repeat its
                  own name back at the reader. */}
              {showSectionHeadings ? (
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  {group.section?.name ?? "Unassigned section"}
                </p>
              ) : null}
              {group.teachers.length ? (
                group.teachers.map((teacher) => (
                  <p key={teacher.assignment_id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-semibold text-slate-700">{teacher.teacher_name}</span>
                    <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 font-bold text-slate-500">
                      {ASSIGNMENT_ROLE_LABELS[teacher.assignment_role] ?? teacher.assignment_role}
                    </span>
                  </p>
                ))
              ) : (
                <p className="text-xs font-semibold text-amber-700">No teacher assigned</p>
              )}
            </div>
          ))
        ) : (
          <p className="text-xs font-semibold text-amber-700">No teacher assigned</p>
        )}
      </div>
      {warning ? (
        <p className="mt-3 flex items-start gap-1.5 border-t border-slate-100 pt-2.5 text-[11px] font-semibold leading-4 text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {warning}
        </p>
      ) : (
        <p className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] font-semibold text-emerald-700">
          {schoolClass.published_lesson_count} published teaching day{schoolClass.published_lesson_count === 1 ? "" : "s"}
        </p>
      )}
    </article>
  );
}

function CreateClassDialog({
  open,
  onOpenChange,
  academicYear,
  existing,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academicYear?: PrimaryAcademicYear | null;
  existing: SchoolClass[];
  onCreated: () => Promise<void> | void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const { levels: schoolLevels, labelFor: teacherLevelLabel } = useSchoolLevels();
  const [level, setLevel] = useState<string>("");
  const [section, setSection] = useState("");
  const [subjects, setSubjects] = useState("");
  const [busy, setBusy] = useState(false);

  const duplicate = existing.some((item) => item.name.trim().toLowerCase() === name.trim().toLowerCase());
  const resolvedLevel = level || schoolLevels[0]?.value || "";

  async function create() {
    if (!name.trim() || duplicate) return;
    setBusy(true);
    try {
      const created = await backendApi.adminCreateSchoolClass({
        name: name.trim(),
        level: resolvedLevel,
        academic_year_id: academicYear?.id,
        section: section.trim() || null,
        subjects: subjects.split(",").map((item) => item.trim()).filter(Boolean),
      });
      await onCreated();
      onOpenChange(false);
      setName("");
      setSection("");
      setSubjects("");
      toast({ title: `${created.name} created`, description: `Ready to take ${teacherLevelLabel(created.level)} teachers.` });
    } catch (error) {
      toast({
        title: "Could not create this class",
        description: getErrorMessage(error, "Try a different name."),
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
      title="Create class"
      description={`Classes are unique per academic year${academicYear ? ` — this one belongs to ${academicYear.name}` : ""}.`}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={busy || !name.trim() || duplicate || !resolvedLevel} onClick={() => void create()}>
            {busy ? "Creating…" : "Create class"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-900 sm:col-span-2">
          Class name
          <Input autoFocus className="mt-2" placeholder="Nursery A" value={name} onChange={(event) => setName(event.target.value)} />
          {duplicate ? <span className="mt-1.5 block text-xs font-semibold text-rose-600">A class with this name already exists for this year.</span> : null}
        </label>
        <label className="text-sm font-semibold text-slate-900">
          Level
          <Select className="mt-2" value={resolvedLevel} onChange={(event) => setLevel(event.target.value)}>
            {schoolLevels.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </Select>
        </label>
        <label className="text-sm font-semibold text-slate-900">
          Section
          <Input className="mt-2" placeholder="A or Blue" value={section} onChange={(event) => setSection(event.target.value)} />
        </label>
        <label className="text-sm font-semibold text-slate-900 sm:col-span-2">
          Subjects
          <Input className="mt-2" placeholder="English, Mathematics, EVS" value={subjects} onChange={(event) => setSubjects(event.target.value)} />
          <span className="mt-1 block text-xs font-normal text-slate-500">Separate subjects with commas.</span>
        </label>
      </div>
    </ActionDialog>
  );
}
