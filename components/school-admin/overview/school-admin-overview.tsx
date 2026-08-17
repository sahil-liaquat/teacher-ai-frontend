"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  Users,
} from "lucide-react";
import {
  backendApi,
  SCHOOL_TEACHERS_QUERY_KEY,
  type CurriculumCoverage,
  type ExecutionSummary,
  type PrimaryCurriculumLesson,
  type SchoolTeacherRosterResponse,
} from "@/lib/api";
import { curriculumHref, lessonsForMonth, monthLabel } from "@/lib/school-admin-curriculum";
import { blockingIssues, curriculumSlots, monthMetrics, resourceIssues } from "@/lib/curriculum-readiness";
import { authoringDays, authoringWeeks } from "@/lib/primary-teaching-week";
import { defaultLevel } from "@/lib/school-admin-levels";
import { useCurriculumContext } from "@/lib/use-curriculum-context";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeading, SchoolAdminPage } from "@/components/school-admin/shared/page-primitives";
import { SetupPrompt } from "@/components/school-admin/onboarding/setup-prompt";
import { cn } from "@/lib/utils";

/**
 * School Admin Overview — the command centre.
 *
 * ⚠ Built LAST on purpose. Every figure here is integrated from a workflow that
 * actually works: curriculum readiness from the server's verdict, scheduling
 * from the planning layer, delivery from statuses teachers set. A dashboard
 * assembled before those existed would have been decoration, and the brief was
 * explicit that decoration is worse than nothing.
 *
 * ⚠ THE THREE DEFECTS THIS REPLACES, all from the original audit and all
 * unfixed until now because the page was going to be rebuilt:
 *
 *   · It was titled "Primary Curriculum" while the sidebar item said Overview.
 *   · "Recent curriculum" was `lessonsForMonth(...).slice(0, 4)` — no ordering
 *     at all — presented as "recently published days".
 *   · It computed a `published` slot count and never read it.
 *
 * ⚠ EVERY NUMBER LINKS SOMEWHERE. The test for whether a figure belongs is
 * whether there is a destination when it looks wrong. There is no figure here
 * without one.
 */
const DEFAULT_MONTH = new Date().getMonth() + 1;

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export function SchoolAdminOverview() {
  const { year, curriculumLevels, labelFor, vocabulary, isLoading } = useCurriculumContext();
  const level = defaultLevel(curriculumLevels);
  const month = DEFAULT_MONTH;

  const lessons = useQuery<PrimaryCurriculumLesson[]>({
    queryKey: ["school-admin", "lessons", year?.id, level],
    queryFn: () => backendApi.schoolAdminCurriculum({ academic_year_id: year!.id, level }),
    enabled: Boolean(year?.id && level),
  });
  const coverage = useQuery<CurriculumCoverage>({
    queryKey: ["school-admin", "coverage", year?.id, level],
    queryFn: () => backendApi.schoolAdminCoverage(year!.id, level),
    enabled: Boolean(year?.id),
  });
  const execution = useQuery<ExecutionSummary>({
    queryKey: ["school-admin", "execution", "overview", year?.id],
    queryFn: () =>
      backendApi.schoolAdminExecution({
        start: isoDaysAgo(30),
        end: new Date().toISOString().slice(0, 10),
        academic_year_id: year?.id,
      }),
  });
  const roster = useQuery<SchoolTeacherRosterResponse>({
    queryKey: [...SCHOOL_TEACHERS_QUERY_KEY, "overview"],
    queryFn: () => backendApi.adminSchoolTeachers({}),
  });

  const monthLessons = useMemo(
    () => lessonsForMonth(lessons.data ?? [], month),
    [lessons.data, month],
  );
  const metrics = useMemo(
    () => monthMetrics(monthLessons, {
      weeks: authoringWeeks(year ?? null, month),
      days: authoringDays(year ?? null).length,
    }),
    [monthLessons, year, month],
  );
  const slots = useMemo(() => curriculumSlots(monthLessons), [monthLessons]);
  const blocked = slots.filter((slot) => blockingIssues(slot.current).length > 0);
  const missingResources = slots.filter((slot) => resourceIssues(slot.current).length > 0);

  const href = (extra: Record<string, string | number> = {}) =>
    curriculumHref({ year: year?.id, level, month, ...extra });

  /**
   * What needs attention, in the order it blocks the school.
   *
   * ⚠ Assembled only from things that are TRUE and ACTIONABLE. A count of zero
   * contributes nothing rather than rendering a reassuring green row, because
   * a list of nine satisfied checks buries the one that is not.
   */
  const attention = [
    blocked.length && {
      key: "blocked",
      icon: AlertTriangle,
      label: `${blocked.length} teaching ${blocked.length === 1 ? "day has" : "days have"} unresolved issues`,
      detail: `${monthLabel(month)} · ${labelFor(level)}`,
      href: href({ issue: "drafts" }),
    },
    missingResources.length && {
      key: "resources",
      icon: BookOpen,
      label: `${missingResources.length} ${missingResources.length === 1 ? "day needs" : "days need"} resources`,
      detail: "Blocks with a resource type but nothing attached",
      href: href({ issue: "resources" }),
    },
    (roster.data?.metrics?.unassigned_teachers ?? 0) > 0 && {
      key: "unassigned",
      icon: Users,
      label: `${roster.data!.metrics.unassigned_teachers} ${roster.data!.metrics.unassigned_teachers === 1 ? "teacher is" : "teachers are"} not assigned to a class`,
      detail: "They receive no published curriculum until they are",
      href: "/school-admin/teachers?assignment=unassigned",
    },
    (coverage.data?.days_without_plans ?? 0) > 0 && {
      key: "unscheduled",
      icon: CalendarClock,
      label: `${coverage.data!.days_without_plans} teaching ${coverage.data!.days_without_plans === 1 ? "day has" : "days have"} nothing scheduled`,
      detail: "Curriculum is published but not placed on the calendar",
      href: "/school-admin/planning",
    },
    (execution.data?.by_status?.skipped ?? 0) > 0 && {
      key: "skipped",
      icon: AlertTriangle,
      label: `${execution.data!.by_status.skipped} ${execution.data!.by_status.skipped === 1 ? "lesson was" : "lessons were"} skipped`,
      detail: "In the last 30 days",
      href: "/school-admin/teaching",
    },
  ].filter(Boolean) as {
    key: string;
    icon: typeof AlertTriangle;
    label: string;
    detail: string;
    href: string;
  }[];

  if (isLoading) {
    return (
      <SchoolAdminPage>
        <Skeleton className="h-24" /><Skeleton className="h-32" /><Skeleton className="h-64" />
      </SchoolAdminPage>
    );
  }

  return (
    <SchoolAdminPage>
      <SetupPrompt />
      <PageHeading
        eyebrow="School"
        title="Overview"
        description={
          year
            ? `${year.name} · ${labelFor(level)} · ${monthLabel(month)}`
            : "Set up an academic year to start planning curriculum."
        }
      />

      {/* The four stages of the loop, each reporting its own real state. */}
      <section aria-labelledby="loop-heading" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <h2 id="loop-heading" className="sr-only">School status</h2>
        <LoopCard
          icon={BookOpen}
          label="Curriculum"
          value={`${metrics.completionPct}%`}
          caption={`${metrics.published} of ${metrics.slots} days published`}
          ok={metrics.slots > 0 && metrics.published === metrics.slots}
          href="/school-admin/curriculum/overview"
          loading={lessons.isLoading}
        />
        <LoopCard
          icon={CalendarClock}
          label="Scheduled"
          value={coverage.data ? `${coverage.data.days_with_plans}` : "—"}
          caption={
            coverage.data
              ? `${coverage.data.days_without_plans} teaching days still free`
              : "Not loaded"
          }
          ok={Boolean(coverage.data && coverage.data.days_without_plans === 0)}
          href="/school-admin/planning"
          loading={coverage.isLoading}
        />
        <LoopCard
          icon={GraduationCap}
          label="Delivered"
          /* ⚠ Null is "no records", never 0%. */
          value={execution.data?.delivered_pct === null ? "No data" : `${execution.data?.delivered_pct ?? "—"}%`}
          caption={
            execution.data
              ? `${execution.data.reporting_teachers} of ${execution.data.assigned_teachers} teachers recording`
              : "Not loaded"
          }
          ok={Boolean(execution.data?.delivered_pct !== null && (execution.data?.delivered_pct ?? 0) >= 80)}
          href="/school-admin/teaching"
          loading={execution.isLoading}
        />
        <LoopCard
          icon={Users}
          label="People"
          value={`${roster.data?.metrics?.total_teachers ?? "—"}`}
          caption={
            roster.data
              ? `${roster.data.metrics.unassigned_teachers} unassigned`
              : "Not loaded"
          }
          ok={Boolean(roster.data && roster.data.metrics.unassigned_teachers === 0)}
          href="/school-admin/teachers"
          loading={roster.isLoading}
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.015em] text-slate-950">Needs attention</h2>
            <p className="mt-1 text-sm text-slate-500">
              Everything here is something you can act on, and opens where it is fixed.
            </p>
          </div>
          {attention.length ? (
            <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
              {attention.length}
            </span>
          ) : null}
        </div>

        {attention.length ? (
          <ul className="mt-5 divide-y divide-slate-100">
            {attention.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.key}>
                  <Link href={item.href} className="group flex items-start gap-3 py-3.5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-950">{item.label}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{item.detail}</span>
                    </span>
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-700" />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center">
            <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-600" />
            <p className="mt-3 text-sm font-semibold text-slate-900">Nothing needs your attention</p>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-slate-500">
              Curriculum is published, scheduled and being delivered, and every teacher has a class.
            </p>
            <Link
              href="/school-admin/curriculum/overview"
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-800 hover:border-blue-200 hover:text-blue-700"
            >
              Plan ahead in Curriculum <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      <p className="text-xs leading-5 text-slate-500">
        Scheduled counts what is placed on the calendar; delivered counts what teachers recorded
        teaching. A date passing is never treated as a {vocabulary.lessonNoun} taught.
      </p>
    </SchoolAdminPage>
  );
}

function LoopCard({
  icon: Icon,
  label,
  value,
  caption,
  ok,
  href,
  loading,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
  caption: string;
  ok: boolean;
  href: string;
  loading: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{label}</span>
        <Icon className="h-4 w-4 text-slate-300" aria-hidden="true" />
      </span>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-16 rounded-lg" />
      ) : (
        <span className="mt-2 block text-2xl font-semibold tabular-nums text-slate-950">{value}</span>
      )}
      {/* Status carried by an icon and wording, never by colour alone. */}
      <span className={cn("mt-1 flex items-center gap-1.5 text-xs font-semibold", ok ? "text-emerald-700" : "text-slate-500")}>
        {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
        {caption}
      </span>
    </Link>
  );
}
