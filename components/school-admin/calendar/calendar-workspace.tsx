"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CalendarRange, Plus, Sparkles, Sun, Trash2 } from "lucide-react";
import {
  backendApi,
  type PrimaryAcademicTerm,
  type PrimaryAcademicYear,
  type PrimaryCalendarDay,
  type PrimaryCalendarDayType,
  type PrimaryCalendarSummary,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ActionDialog, ConfirmDialog } from "@/components/school-admin/shared/action-dialog";
import { PageError, PageHeading, SchoolAdminPage } from "@/components/school-admin/shared/page-primitives";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

// Monday-first, matching how Indian school weeks are written and how the API
// numbers weekdays (0 = Monday … 6 = Sunday).
const WEEKDAYS = [
  { value: 0, short: "Mon" }, { value: 1, short: "Tue" }, { value: 2, short: "Wed" },
  { value: 3, short: "Thu" }, { value: 4, short: "Fri" }, { value: 5, short: "Sat" },
  { value: 6, short: "Sun" },
] as const;

const DAY_STYLE: Record<PrimaryCalendarDayType, string> = {
  teaching: "bg-emerald-50 text-emerald-800 border-emerald-200",
  holiday: "bg-rose-50 text-rose-800 border-rose-200",
  weekend: "bg-slate-100 text-slate-500 border-slate-200",
};

function iso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthKey(value: string) {
  return value.slice(0, 7);
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
}

export function CalendarWorkspace() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [initOpen, setInitOpen] = useState(false);
  const [termOpen, setTermOpen] = useState(false);
  const [removeTerm, setRemoveTerm] = useState<PrimaryAcademicTerm | null>(null);
  const [teachingWeekdays, setTeachingWeekdays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [termForm, setTermForm] = useState({ name: "", starts_on: "", ends_on: "" });
  const [editDay, setEditDay] = useState<PrimaryCalendarDay | null>(null);
  const [dayLabel, setDayLabel] = useState("");

  const years = useQuery<PrimaryAcademicYear[]>({
    queryKey: ["school-admin", "academic-years"],
    queryFn: backendApi.schoolAdminAcademicYears,
  });
  // The calendar belongs to a year, so it follows the school's current year
  // rather than adding a second place to choose one.
  const year = useMemo(
    () => years.data?.find((item) => item.is_active) ?? years.data?.[0],
    [years.data],
  );

  const summary = useQuery<PrimaryCalendarSummary>({
    queryKey: ["school-admin", "calendar-summary", year?.id],
    queryFn: () => backendApi.schoolAdminCalendarSummary(year!.id),
    enabled: Boolean(year),
  });
  const terms = useQuery<PrimaryAcademicTerm[]>({
    queryKey: ["school-admin", "terms", year?.id],
    queryFn: () => backendApi.schoolAdminTerms(year!.id),
    enabled: Boolean(year),
  });
  const days = useQuery<PrimaryCalendarDay[]>({
    queryKey: ["school-admin", "calendar", year?.id],
    queryFn: () => backendApi.schoolAdminCalendar(year!.id),
    enabled: Boolean(year),
  });

  const months = useMemo(() => {
    const grouped = new Map<string, PrimaryCalendarDay[]>();
    for (const day of days.data ?? []) {
      grouped.set(monthKey(day.date), [...(grouped.get(monthKey(day.date)) ?? []), day]);
    }
    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [days.data]);

  const upcomingClosures = useMemo(() => {
    const today = iso(new Date());
    return (days.data ?? [])
      .filter((day) => day.day_type === "holiday" && day.date >= today)
      .slice(0, 6);
  }, [days.data]);

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["school-admin", "calendar", year?.id] }),
      queryClient.invalidateQueries({ queryKey: ["school-admin", "calendar-summary", year?.id] }),
      queryClient.invalidateQueries({ queryKey: ["school-admin", "terms", year?.id] }),
    ]);
  }

  async function initialize() {
    if (!year) return;
    setBusy(true);
    try {
      const result = await backendApi.schoolAdminInitializeCalendar(year.id, { teaching_weekdays: teachingWeekdays });
      setInitOpen(false);
      await refresh();
      toast({
        title: "Calendar ready",
        description: `${result.created} dates added${result.kept ? `, ${result.kept} of your existing changes kept` : ""}.`,
        variant: "success",
      });
    } catch (error) {
      toast({ title: "Could not set up the calendar", description: getErrorMessage(error, "Try again."), variant: "error" });
    } finally { setBusy(false); }
  }

  async function createTerm() {
    if (!year || !termForm.name.trim() || !termForm.starts_on || !termForm.ends_on) return;
    setBusy(true);
    try {
      await backendApi.schoolAdminCreateTerm(year.id, { name: termForm.name.trim(), starts_on: termForm.starts_on, ends_on: termForm.ends_on });
      setTermOpen(false);
      setTermForm({ name: "", starts_on: "", ends_on: "" });
      await refresh();
      toast({ title: "Term added", variant: "success" });
    } catch (error) {
      // The service explains why — outside the year, or an inverted range.
      toast({ title: "Could not add the term", description: getErrorMessage(error, "Check the dates."), variant: "error" });
    } finally { setBusy(false); }
  }

  async function deleteTerm() {
    if (!removeTerm) return;
    setBusy(true);
    try {
      await backendApi.schoolAdminDeleteTerm(removeTerm.id);
      setRemoveTerm(null);
      await refresh();
      toast({ title: "Term removed", variant: "success" });
    } catch (error) {
      toast({ title: "Could not remove the term", description: getErrorMessage(error, "Try again."), variant: "error" });
    } finally { setBusy(false); }
  }

  async function setDayType(day: PrimaryCalendarDay, dayType: PrimaryCalendarDayType, label: string | null) {
    if (!year) return;
    setBusy(true);
    try {
      await backendApi.schoolAdminSetCalendarDay(year.id, day.date, { day_type: dayType, label });
      setEditDay(null);
      setDayLabel("");
      await refresh();
    } catch (error) {
      toast({ title: "Could not update that date", description: getErrorMessage(error, "Try again."), variant: "error" });
    } finally { setBusy(false); }
  }

  if (years.isLoading) {
    return <SchoolAdminPage><Skeleton className="h-64 rounded-3xl" /></SchoolAdminPage>;
  }

  if (!year) {
    return (
      <SchoolAdminPage>
        <PageHeading eyebrow="School calendar" title="Calendar" description="Set the dates your school can teach on." />
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <CalendarDays className="mx-auto h-7 w-7 text-slate-400" />
          <h2 className="mt-3 text-lg font-semibold text-slate-950">Create an academic year first</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">The calendar describes one academic year, so the year comes first.</p>
        </div>
      </SchoolAdminPage>
    );
  }

  return (
    <SchoolAdminPage>
      <PageHeading
        eyebrow="School calendar"
        title="Calendar"
        description={`Which dates ${year.name} can teach on. Teaching days here are what curriculum gets scheduled onto.`}
        actions={
          <Button onClick={() => setInitOpen(true)}>
            <Sparkles className="h-4 w-4" /> {summary.data?.initialized ? "Re-run setup" : "Set up calendar"}
          </Button>
        }
      />

      {days.isError || terms.isError ? (
        <PageError description="The calendar could not be loaded." onRetry={() => { void days.refetch(); void terms.refetch(); }} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: "Teaching days", value: summary.data?.teaching_days ?? "—", tone: "text-emerald-700" },
              { label: "Holidays", value: summary.data?.holidays ?? "—", tone: "text-rose-700" },
              { label: "Weekends", value: summary.data?.weekends ?? "—", tone: "text-slate-600" },
              { label: "Terms", value: summary.data?.term_count ?? "—", tone: "text-blue-700" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{stat.label}</p>
                <p className={cn("mt-2 text-2xl font-semibold tabular-nums", stat.tone)}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Teaching year</h2>
                  <p className="mt-1 text-sm text-slate-500">Select any date to mark it a holiday or a working day.</p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs font-semibold">
                  {(["teaching", "holiday", "weekend"] as PrimaryCalendarDayType[]).map((type) => (
                    <span key={type} className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 capitalize", DAY_STYLE[type])}>{type}</span>
                  ))}
                </div>
              </div>

              {days.isLoading ? (
                <Skeleton className="mt-5 h-64 rounded-2xl" />
              ) : months.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center">
                  <CalendarRange className="mx-auto h-6 w-6 text-slate-400" />
                  <p className="mt-3 text-sm font-semibold text-slate-900">No calendar yet</p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                    Set up the calendar from your weekly pattern — every date in {year.name} is filled in once, then you adjust the exceptions.
                  </p>
                  <Button className="mt-5" onClick={() => setInitOpen(true)}><Sparkles className="h-4 w-4" /> Set up calendar</Button>
                </div>
              ) : (
                <div className="mt-5 space-y-6">
                  {months.map(([key, monthDays]) => (
                    <div key={key}>
                      <h3 className="mb-2 text-sm font-semibold text-slate-900">{monthLabel(key)}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {monthDays.slice().sort((a, b) => a.date.localeCompare(b.date)).map((day) => (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => { setEditDay(day); setDayLabel(day.label ?? ""); }}
                            title={`${day.date}${day.label ? ` — ${day.label}` : ""}`}
                            className={cn(
                              "h-9 w-9 rounded-lg border text-xs font-semibold tabular-nums transition hover:ring-2 hover:ring-blue-200",
                              DAY_STYLE[day.day_type],
                            )}
                          >
                            {Number(day.date.slice(8, 10))}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-950">Terms</h2>
                  <Button size="sm" variant="outline" onClick={() => setTermOpen(true)}><Plus className="h-4 w-4" /> Add</Button>
                </div>
                <p className="mt-1 text-sm text-slate-500">However many your school runs.</p>
                <div className="mt-4 space-y-2">
                  {terms.isLoading ? <Skeleton className="h-20 rounded-2xl" /> : (terms.data ?? []).length ? (
                    (terms.data ?? []).map((term) => (
                      <div key={term.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-900">{term.name}</span>
                          <span className="text-xs text-slate-500 tabular-nums">{term.starts_on} → {term.ends_on}</span>
                        </span>
                        <button type="button" aria-label={`Remove ${term.name}`} onClick={() => setRemoveTerm(term)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">No terms yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-slate-950">Upcoming closures</h2>
                <div className="mt-4 space-y-2">
                  {upcomingClosures.length ? upcomingClosures.map((day) => (
                    <div key={day.id} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                      <span className="block text-sm font-semibold text-rose-900 tabular-nums">{day.date}</span>
                      <span className="text-xs text-rose-700">{day.label || "Holiday"}</span>
                    </div>
                  )) : (
                    <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                      No holidays marked ahead.
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </>
      )}

      <ActionDialog
        open={initOpen}
        onOpenChange={setInitOpen}
        title="Set up the calendar"
        description={`Choose the days your school normally teaches. Every date in ${year.name} is filled in from that, and you adjust the exceptions afterwards.`}
        footer={<><Button variant="outline" onClick={() => setInitOpen(false)}>Cancel</Button><Button disabled={busy || !teachingWeekdays.length} onClick={() => void initialize()}>{busy ? "Setting up…" : "Set up calendar"}</Button></>}
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">Teaching days each week</p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((weekday) => {
                const on = teachingWeekdays.includes(weekday.value);
                return (
                  <button
                    key={weekday.value}
                    type="button"
                    onClick={() => setTeachingWeekdays((current) => on ? current.filter((v) => v !== weekday.value) : [...current, weekday.value])}
                    className={cn("rounded-xl border px-3 py-2 text-sm font-semibold transition", on ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-500")}
                  >
                    {weekday.short}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Holidays are yours to set — TeachPad does not assume any. Dates you have already changed are kept.
          </p>
        </div>
      </ActionDialog>

      <ActionDialog
        open={termOpen}
        onOpenChange={setTermOpen}
        title="Add a term"
        description={`Terms sit inside ${year.name} (${year.starts_on} to ${year.ends_on}).`}
        footer={<><Button variant="outline" onClick={() => setTermOpen(false)}>Cancel</Button><Button disabled={busy || !termForm.name.trim() || !termForm.starts_on || !termForm.ends_on} onClick={() => void createTerm()}>{busy ? "Adding…" : "Add term"}</Button></>}
      >
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-800">Name
            <Input autoFocus className="mt-2" value={termForm.name} onChange={(event) => setTermForm({ ...termForm, name: event.target.value })} placeholder="Term 1" maxLength={80} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-800">Starts
              <Input type="date" className="mt-2" min={year.starts_on} max={year.ends_on} value={termForm.starts_on} onChange={(event) => setTermForm({ ...termForm, starts_on: event.target.value })} />
            </label>
            <label className="block text-sm font-semibold text-slate-800">Ends
              <Input type="date" className="mt-2" min={year.starts_on} max={year.ends_on} value={termForm.ends_on} onChange={(event) => setTermForm({ ...termForm, ends_on: event.target.value })} />
            </label>
          </div>
        </div>
      </ActionDialog>

      <ActionDialog
        open={Boolean(editDay)}
        onOpenChange={(open) => { if (!open) setEditDay(null); }}
        title={editDay ? editDay.date : "Change date"}
        description="Mark this date a holiday, or make it a working day."
        footer={<Button variant="outline" onClick={() => setEditDay(null)}>Close</Button>}
      >
        {editDay ? (
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-800">Reason <span className="font-normal text-slate-400">(optional)</span>
              <Input className="mt-2" value={dayLabel} onChange={(event) => setDayLabel(event.target.value)} placeholder="Independence Day" maxLength={160} />
            </label>
            <div className="flex flex-wrap gap-2">
              {(["teaching", "holiday", "weekend"] as PrimaryCalendarDayType[]).map((type) => (
                <Button
                  key={type}
                  variant={editDay.day_type === type ? "default" : "outline"}
                  disabled={busy}
                  onClick={() => void setDayType(editDay, type, dayLabel.trim() || null)}
                  className="capitalize"
                >
                  {type === "teaching" ? <Sun className="h-4 w-4" /> : null} {type}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </ActionDialog>

      <ConfirmDialog
        open={Boolean(removeTerm)}
        onOpenChange={(open) => { if (!open) setRemoveTerm(null); }}
        busy={busy}
        onConfirm={deleteTerm}
        title={`Remove ${removeTerm?.name ?? "this term"}?`}
        description="Teaching days and holidays are not affected — terms only group the year."
        confirmLabel="Remove term"
        destructive
      />
    </SchoolAdminPage>
  );
}
