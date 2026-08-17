"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BookOpen, CalendarRange, School, ShieldCheck, X } from "lucide-react";
import { backendApi, type SchoolTeacherDetail } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import {
  ACCOUNT_STATUS_COPY,
  ASSIGNMENT_ROLE_LABELS,
  auditActionLabel,
  curriculumSourceLabel,
  formatDate,
  formatDateTime,
} from "@/lib/school-admin-teachers";
import { useSchoolLevels } from "@/lib/use-school-levels";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function TeacherDetailDrawer({
  teacherId,
  academicYearId,
  onOpenChange,
  onAssign,
}: {
  teacherId: string | null;
  academicYearId?: string;
  onOpenChange: (open: boolean) => void;
  onAssign: (teacher: SchoolTeacherDetail) => void;
}) {
  const detail = useQuery<SchoolTeacherDetail>({
    queryKey: ["school-admin", "teacher", teacherId, academicYearId ?? "current"],
    queryFn: () => backendApi.adminSchoolTeacher(teacherId as string, academicYearId),
    enabled: Boolean(teacherId),
  });

  return (
    <Dialog.Root open={Boolean(teacherId)} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[1px]" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(34rem,100vw)] flex-col overflow-y-auto border-l border-slate-200 bg-white shadow-2xl focus:outline-none">
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
            <div className="min-w-0">
              <Dialog.Title className="truncate text-xl font-semibold tracking-tight text-slate-950">
                {detail.data?.full_name ?? "Teacher"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 truncate text-sm text-slate-500">
                {detail.data?.email ?? "Loading account…"}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 space-y-7 px-6 py-6">
            {detail.isError ? (
              <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-center">
                <p className="text-sm font-semibold text-rose-800">
                  {getErrorMessage(detail.error, "This teacher's details could not be loaded.")}
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => void detail.refetch()}>Try again</Button>
              </div>
            ) : detail.isLoading || !detail.data ? (
              <div className="space-y-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-28 rounded-2xl" />)}</div>
            ) : (
              <DetailBody detail={detail.data} onAssign={onAssign} />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DetailBody({ detail, onAssign }: { detail: SchoolTeacherDetail; onAssign: (teacher: SchoolTeacherDetail) => void }) {
  const { labelFor: teacherLevelLabel } = useSchoolLevels();
  const account = ACCOUNT_STATUS_COPY[detail.account_status] ?? ACCOUNT_STATUS_COPY.inactive;
  const gaps = detail.curriculum.filter((slot) => slot.source === "none");

  return (
    <>
      <Section title="Account" icon={ShieldCheck}>
        <Row label="Status">
          <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold", account.tone)}>{account.label}</span>
        </Row>
        <Row label="Role">{detail.role === "org_admin" ? "School administrator" : "Teacher"}</Row>
        <Row label="Joined">{formatDate(detail.joined_at)}</Row>
      </Section>

      <Section title="School membership" icon={School}>
        <Row label="School">{detail.organization_name ?? "—"}</Row>
        <Row label="Academic year">
          <span className="inline-flex items-center gap-1.5">
            <CalendarRange className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            {detail.academic_year_name ?? "—"}
          </span>
        </Row>
      </Section>

      <Section
        title="Assigned classes"
        icon={BookOpen}
        action={<Button size="sm" variant="outline" onClick={() => onAssign(detail)}>Edit assignment</Button>}
      >
        {detail.assigned_classes.length ? (
          <ul className="space-y-2">
            {detail.assigned_classes.map((item) => (
              <li key={item.assignment_id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5">
                <span>
                  <span className="block text-sm font-semibold text-slate-950">{item.name}</span>
                  <span className="block text-xs text-slate-500">{teacherLevelLabel(item.level)}</span>
                </span>
                <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
                  {ASSIGNMENT_ROLE_LABELS[item.assignment_role] ?? item.assignment_role}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 px-3.5 py-6 text-center text-sm text-slate-500">
            Not assigned to any class yet.
          </p>
        )}
      </Section>

      <Section title="Available curriculum" icon={BookOpen}>
        {detail.curriculum.length ? (
          <ul className="space-y-2">
            {detail.curriculum.map((slot) => (
              <li key={slot.level} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm">
                <span className="font-semibold text-slate-900">{teacherLevelLabel(slot.level)}</span>
                <span className={cn("text-xs font-semibold", slot.source === "none" ? "text-rose-600" : "text-slate-500")}>
                  {curriculumSourceLabel(slot.source)}
                  {slot.published_lesson_count ? ` · ${slot.published_lesson_count} days` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Assign a class to see which curriculum this teacher receives.</p>
        )}
        {gaps.map((slot) => (
          <p key={slot.level} role="alert" className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-semibold leading-5 text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            No published {teacherLevelLabel(slot.level)} curriculum for this academic year. This teacher
            falls back to TeachPad master content only if it exists for that level.
          </p>
        ))}
      </Section>

      <Section title="Assignment history" icon={CalendarRange}>
        {detail.assignment_history.length ? (
          <ol className="space-y-3 border-l border-slate-200 pl-4">
            {detail.assignment_history.map((entry) => (
              <li key={entry.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-slate-300" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-900">{auditActionLabel(entry.action)}</p>
                {entry.summary ? <p className="mt-0.5 text-xs leading-5 text-slate-600">{entry.summary}</p> : null}
                <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                  {formatDateTime(entry.created_at)}{entry.actor_name ? ` · ${entry.actor_name}` : ""}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-slate-500">No membership or assignment changes recorded yet.</p>
        )}
      </Section>

      <p className="rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
        Students, teacher notes and observations stay private to the teacher and are never shown here.
      </p>
    </>
  );
}

function Section({ title, icon: Icon, action, children }: { title: string; icon: typeof School; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-slate-500">
          <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
          {title}
        </h3>
        {action}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{children}</span>
    </div>
  );
}
