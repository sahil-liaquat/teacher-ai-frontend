"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, MailPlus, Search, UserCheck, UserX, Users } from "lucide-react";
import {
  SCHOOL_CLASSES_QUERY_KEY,
  SCHOOL_TEACHERS_QUERY_KEY,
  TEACHER_INVITATIONS_QUERY_KEY,
  backendApi,
  type PrimaryAcademicYear,
  type SchoolClass,
  type SchoolTeacher,
  type SchoolTeacherRosterResponse,
  type TeacherInvitation,
} from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { academicYearState } from "@/lib/school-admin-support";
import {
  filtersFromSearchParams,
  filtersToSearchParams,
  type TeacherFilters,
} from "@/lib/school-admin-teachers";
import { useSchoolLevels } from "@/lib/use-school-levels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/school-admin/shared/action-dialog";
import { PageError, PageHeading, SchoolAdminPage } from "@/components/school-admin/shared/page-primitives";
import { SectionSubnav } from "@/components/school-admin/shared/section-subnav";
import { AssignmentDialog } from "@/components/school-admin/teachers/assignment-dialog";
import { InviteTeacherDialog } from "@/components/school-admin/teachers/invite-teacher-dialog";
import { TeacherDetailDrawer } from "@/components/school-admin/teachers/teacher-detail-drawer";
import { TeacherTable, type TeacherRowAction } from "@/components/school-admin/teachers/teacher-table";

export function TeachersWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Staffing reads the SAME level list as curriculum. These were two
  // independent vocabularies: five levels here, eight there.
  const { levels: schoolLevels } = useSchoolLevels();
  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams]);
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [assigning, setAssigning] = useState<SchoolTeacher | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<SchoolTeacher | null>(null);
  const [cancelling, setCancelling] = useState<SchoolTeacher | null>(null);
  const [busy, setBusy] = useState(false);

  // The URL owns the filters, so a typed search has to land there too — but
  // only after the user stops typing, or every keystroke becomes a history
  // entry and a request.
  useEffect(() => setSearchDraft(filters.search), [filters.search]);
  useEffect(() => {
    if (searchDraft === filters.search) return;
    const timer = setTimeout(() => setFilters({ search: searchDraft, page: 1 }), 300);
    return () => clearTimeout(timer);
  }, [searchDraft]); // eslint-disable-line react-hooks/exhaustive-deps

  const setFilters = useCallback(
    (patch: Partial<TeacherFilters>) => {
      const next = filtersToSearchParams({ ...filters, ...patch });
      router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
    },
    [filters, pathname, router],
  );

  const years = useQuery<PrimaryAcademicYear[]>({
    queryKey: ["school-admin", "academic-years"],
    queryFn: backendApi.schoolAdminAcademicYears,
  });
  const activeYear = useMemo(
    () => (years.data ?? []).find((year) => year.is_active) ?? (years.data ?? [])[0],
    [years.data],
  );
  const isCurrentYear = activeYear ? academicYearState(activeYear) === "current" : false;

  const roster = useQuery<SchoolTeacherRosterResponse>({
    queryKey: [...SCHOOL_TEACHERS_QUERY_KEY, filters],
    queryFn: () =>
      backendApi.adminSchoolTeachers({
        search: filters.search || undefined,
        level: filters.level || undefined,
        school_class_id: filters.schoolClassId || undefined,
        status: (filters.status || undefined) as never,
        assignment: (filters.assignment || undefined) as never,
        page: filters.page,
      }),
    placeholderData: (previous) => previous,
  });

  const classes = useQuery<SchoolClass[]>({
    queryKey: [...SCHOOL_CLASSES_QUERY_KEY, activeYear?.id ?? "current"],
    queryFn: () => backendApi.adminSchoolClasses({ academic_year_id: activeYear?.id, include_archived: true }),
  });
  const invitations = useQuery<TeacherInvitation[]>({
    queryKey: TEACHER_INVITATIONS_QUERY_KEY,
    queryFn: () => backendApi.adminSchoolTeacherInvitations("pending"),
  });

  /** One refresh for everything a membership or assignment change can move. */
  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: SCHOOL_TEACHERS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: SCHOOL_CLASSES_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: TEACHER_INVITATIONS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ["school-admin", "teacher"] }),
      // Curriculum readiness is derived from the same published lessons the
      // roster reports on, so a stale copy would contradict this page.
      queryClient.invalidateQueries({ queryKey: ["school-admin", "academic-year-readiness"] }),
    ]);
  }, [queryClient]);

  function invitationFor(teacher: SchoolTeacher): TeacherInvitation | undefined {
    return (invitations.data ?? []).find((item) => item.email.toLowerCase() === teacher.email.toLowerCase());
  }

  async function resend(teacher: SchoolTeacher) {
    const invitation = invitationFor(teacher);
    if (!invitation) return;
    try {
      const updated = await backendApi.adminResendTeacherInvitation(invitation.id);
      await refresh();
      toast({
        title: `Invitation for ${updated.email} refreshed`,
        description: "The previous link no longer works. Share the new one from the teacher's row.",
      });
    } catch (error) {
      toast({ title: "Could not resend", description: getErrorMessage(error, "Try again in a moment."), variant: "error" });
    }
  }

  async function removeTeacher() {
    if (!removing) return;
    setBusy(true);
    try {
      await backendApi.adminRemoveSchoolTeacher(removing.id);
      await refresh();
      toast({
        title: `${removing.full_name} removed from your school`,
        description: "Their assignments were ended. Teaching history and their own class roster are untouched.",
      });
      setRemoving(null);
    } catch (error) {
      toast({ title: "Could not remove this teacher", description: getErrorMessage(error, "Try again."), variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function cancelInvitation() {
    if (!cancelling) return;
    const invitation = invitationFor(cancelling);
    if (!invitation) { setCancelling(null); return; }
    setBusy(true);
    try {
      await backendApi.adminCancelTeacherInvitation(invitation.id);
      await refresh();
      toast({ title: "Invitation cancelled", description: "The link that was sent no longer works." });
      setCancelling(null);
    } catch (error) {
      toast({ title: "Could not cancel", description: getErrorMessage(error, "Try again."), variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  function handleRowAction(action: TeacherRowAction, teacher: SchoolTeacher) {
    if (action === "view") setDetailId(teacher.id);
    else if (action === "assign" || action === "edit") setAssigning(teacher);
    else if (action === "resend") void resend(teacher);
    else if (action === "remove") setRemoving(teacher);
    else if (action === "cancel") setCancelling(teacher);
  }

  const metrics = roster.data?.metrics;

  return (
    <SchoolAdminPage>
      <SectionSubnav />
      <PageHeading
        eyebrow="People"
        title="Teachers"
        description="Invite teachers, group them into classes, and let the published school curriculum reach them automatically."
        actions={<Button onClick={() => setInviteOpen(true)}><MailPlus className="h-4 w-4" /> Invite teacher</Button>}
      />

      {roster.isError ? (
        <PageError description={getErrorMessage(roster.error, "The teacher roster could not be loaded.")} onRetry={() => void roster.refetch()} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Total teachers" value={metrics?.total_teachers} icon={Users} loading={roster.isLoading} />
            <Metric label="Active" value={metrics?.active_teachers} icon={UserCheck} loading={roster.isLoading} />
            <Metric label="Awaiting invitation" value={metrics?.awaiting_invitation} icon={CalendarClock} loading={roster.isLoading} tone="blue" />
            <Metric label="Without class assignments" value={metrics?.unassigned_teachers} icon={UserX} loading={roster.isLoading} tone="amber" />
          </div>

          <div className="flex flex-wrap items-end gap-3 rounded-3xl border border-slate-200 bg-white p-4">
            <label className="min-w-[16rem] flex-1 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
              Search
              <span className="relative mt-1.5 block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <Input
                  className="pl-9"
                  placeholder="Name or email"
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                />
              </span>
            </label>
            <FilterSelect label="Level" value={filters.level} onChange={(value) => setFilters({ level: value, page: 1 })}>
              <option value="">All levels</option>
              {schoolLevels.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </FilterSelect>
            <FilterSelect label="Class" value={filters.schoolClassId} onChange={(value) => setFilters({ schoolClassId: value, page: 1 })}>
              <option value="">All classes</option>
              {(classes.data ?? []).filter((item) => item.is_active).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </FilterSelect>
            <FilterSelect label="Account" value={filters.status} onChange={(value) => setFilters({ status: value, page: 1 })}>
              <option value="">Any status</option>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="inactive">Inactive</option>
            </FilterSelect>
            <FilterSelect label="Assignment" value={filters.assignment} onChange={(value) => setFilters({ assignment: value, page: 1 })}>
              <option value="">Any</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </FilterSelect>
            {filtersToSearchParams(filters).size ? (
              <Button variant="ghost" size="sm" onClick={() => router.replace(pathname, { scroll: false })}>Clear filters</Button>
            ) : null}
          </div>

          <TeacherTable
            teachers={roster.data?.items ?? []}
            isLoading={roster.isLoading}
            onAction={handleRowAction}
            page={roster.data?.page ?? 1}
            pages={roster.data?.pages ?? 1}
            total={roster.data?.total ?? 0}
            onPageChange={(page) => setFilters({ page })}
          />

          {/* ⚠ Class management deliberately does NOT render here any more.
              It rendered both on this page and at /school-admin/classes — two
              doors into the same CRUD, with the Classes page telling the admin
              to come here to assign. Classes now live at People → Classes &
              Sections; this page keeps the roster and assignment, which is what
              it is actually for. `classes` is still queried because the filter
              and the assignment dialog both need it. */}
        </>
      )}

      <InviteTeacherDialog open={inviteOpen} onOpenChange={setInviteOpen} onInvited={refresh} />
      <AssignmentDialog
        open={Boolean(assigning)}
        onOpenChange={(open) => { if (!open) setAssigning(null); }}
        teacher={assigning}
        classes={classes.data ?? []}
        academicYear={activeYear}
        isCurrentYear={isCurrentYear}
        onSaved={refresh}
      />
      <TeacherDetailDrawer
        teacherId={detailId}
        academicYearId={activeYear?.id}
        onOpenChange={(open) => { if (!open) setDetailId(null); }}
        onAssign={(teacher) => { setDetailId(null); setAssigning(teacher); }}
      />
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => { if (!open) setRemoving(null); }}
        busy={busy}
        destructive
        title={`Remove ${removing?.full_name ?? "this teacher"} from your school?`}
        description="Their current assignments end and they lose access to school curriculum. Teaching history is preserved, and their own students and notes stay with them."
        confirmLabel="Remove teacher"
        onConfirm={removeTeacher}
      />
      <ConfirmDialog
        open={Boolean(cancelling)}
        onOpenChange={(open) => { if (!open) setCancelling(null); }}
        busy={busy}
        destructive
        title="Cancel this invitation?"
        description="The link you sent stops working immediately. You can invite the same email again later."
        confirmLabel="Cancel invitation"
        onConfirm={cancelInvitation}
      />
    </SchoolAdminPage>
  );
}

function Metric({ label, value, icon: Icon, loading, tone = "slate" }: {
  label: string;
  value?: number;
  icon: typeof Users;
  loading: boolean;
  tone?: "slate" | "blue" | "amber";
}) {
  const accent = tone === "blue" ? "text-blue-600" : tone === "amber" ? "text-amber-600" : "text-slate-400";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p>
        <Icon className={`h-4 w-4 ${accent}`} aria-hidden="true" />
      </div>
      {loading ? <Skeleton className="mt-2 h-8 w-12 rounded-lg" /> : (
        <p className="mt-1.5 text-3xl font-semibold tracking-tight text-slate-950">{value ?? 0}</p>
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
      {label}
      <Select className="mt-1.5 w-44" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </Select>
    </label>
  );
}
