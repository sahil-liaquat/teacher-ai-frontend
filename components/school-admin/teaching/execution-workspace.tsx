"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, CheckCircle2, CircleDashed, MinusCircle, SkipForward } from "lucide-react";
import { backendApi, type ExecutionSummary } from "@/lib/api";
import { useCurriculumContext } from "@/lib/use-curriculum-context";
import { Skeleton } from "@/components/ui/skeleton";
import { PageError, PageHeading, SchoolAdminPage } from "@/components/school-admin/shared/page-primitives";
import { SectionSubnav } from "@/components/school-admin/shared/section-subnav";
import { cn } from "@/lib/utils";

/**
 * Teaching → Coverage: what was actually delivered.
 *
 * ⚠ THIS IS THE SURFACE THAT MUST NOT CONFUSE PLANNED WITH TAUGHT. Every figure
 * comes from statuses teachers set on their own planner — completed, partially
 * completed, skipped, rescheduled — never from a date having passed. That
 * distinction is the reason the planning and execution layers are separate all
 * the way down, and this page is where a reader would most easily lose it.
 *
 * ⚠ `delivered_pct` is nullable and rendered as such. Zero recorded activities
 * is "no data", not "0% delivered": a school whose teachers have not opened
 * their planners has not failed to teach, it has failed to record.
 */
const WINDOWS = [
  { key: "7", label: "Last 7 days", days: 7 },
  { key: "30", label: "Last 30 days", days: 30 },
  { key: "90", label: "Last 90 days", days: 90 },
] as const;

const STATUS_META: Record<string, { label: string; icon: typeof CheckCircle2; tone: string }> = {
  completed: { label: "Completed", icon: CheckCircle2, tone: "text-emerald-700" },
  "partially completed": { label: "Partly done", icon: MinusCircle, tone: "text-blue-700" },
  planned: { label: "Still planned", icon: CircleDashed, tone: "text-slate-600" },
  skipped: { label: "Skipped", icon: SkipForward, tone: "text-amber-700" },
  rescheduled: { label: "Rescheduled", icon: CalendarClock, tone: "text-violet-700" },
};

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export function ExecutionWorkspace() {
  const [windowKey, setWindowKey] = useState<(typeof WINDOWS)[number]["key"]>("30");
  const { year } = useCurriculumContext();
  const days = WINDOWS.find((item) => item.key === windowKey)!.days;
  const range = useMemo(
    () => ({ start: isoDaysAgo(days), end: new Date().toISOString().slice(0, 10) }),
    [days],
  );

  const execution = useQuery<ExecutionSummary>({
    queryKey: ["school-admin", "execution", range.start, range.end, year?.id],
    queryFn: () => backendApi.schoolAdminExecution({ ...range, academic_year_id: year?.id }),
  });

  const summary = execution.data;
  const noRecords = summary && summary.recorded === 0;

  return (
    <SchoolAdminPage>
      <SectionSubnav />
      <PageHeading
        eyebrow="Teaching"
        title="Coverage"
        description="What your teachers recorded delivering — not what the calendar says should have happened."
        actions={
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
            {WINDOWS.map((option) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={windowKey === option.key}
                onClick={() => setWindowKey(option.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                  windowKey === option.key ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      />

      {execution.isError ? (
        <PageError
          description="Teaching records could not be loaded."
          onRetry={() => void execution.refetch()}
        />
      ) : execution.isLoading ? (
        <div className="space-y-3"><Skeleton className="h-28" /><Skeleton className="h-40" /></div>
      ) : (
        <>
          <section className="rounded-3xl bg-slate-950 px-5 py-6 text-white sm:px-7">
            <p className="text-sm font-semibold text-blue-200">Delivered in the last {days} days</p>
            {/* ⚠ Null is rendered as "no data", never as 0%. */}
            {summary?.delivered_pct === null ? (
              <>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">No records yet</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  {summary.reporting_teachers} of {summary.assigned_teachers} assigned teachers have
                  recorded anything in this period. A school with no records has not failed to
                  teach — it has not yet marked what it taught.
                </p>
              </>
            ) : (
              <>
                <div className="mt-2 flex items-baseline gap-3">
                  <h2 className="text-3xl font-semibold tracking-tight">{summary?.delivered_pct}%</h2>
                  <span className="text-sm text-slate-300">
                    {summary?.delivered} of {summary?.recorded} recorded activities delivered
                  </span>
                </div>
                <div
                  className="mt-5 h-2 overflow-hidden rounded-full bg-white/15"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={summary?.delivered_pct ?? 0}
                  aria-label={`${summary?.delivered_pct}% of recorded activities delivered`}
                >
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${summary?.delivered_pct}%` }} />
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  {summary?.reporting_teachers} of {summary?.assigned_teachers} assigned teachers recorded activity.
                </p>
              </>
            )}
          </section>

          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold tracking-[-0.015em] text-slate-950">By status</h2>
            <p className="mt-1 text-sm text-slate-500">
              Set by teachers as they teach. A day that passed without being marked stays{" "}
              <em>still planned</em> — it is not counted as taught.
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {Object.entries(STATUS_META).map(([status, meta]) => {
                const Icon = meta.icon;
                return (
                  <li key={status} className="rounded-2xl border border-slate-200 p-4">
                    <span className={cn("flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em]", meta.tone)}>
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {meta.label}
                    </span>
                    <span className="mt-2 block text-2xl font-semibold tabular-nums text-slate-950">
                      {summary?.by_status?.[status] ?? 0}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          {noRecords ? (
            /* An empty state that explains, rather than a zeroed dashboard. */
            <section className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <p className="text-sm font-semibold text-slate-900">
                Nothing recorded in the last {days} days
              </p>
              <p className="mx-auto mt-1.5 max-w-lg text-sm leading-6 text-slate-500">
                Teachers mark lessons as they teach them, from their own planner. If curriculum is
                published and scheduled but nothing appears here, the gap is in recording rather
                than in teaching — start by checking that teachers are assigned to classes.
              </p>
              <Link
                href="/school-admin/teachers"
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-800 hover:border-blue-200 hover:text-blue-700"
              >
                Check teacher assignments <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          ) : null}

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Individual teacher notes and observations are private to the teacher and are never shown here.
          </p>
        </>
      )}
    </SchoolAdminPage>
  );
}
