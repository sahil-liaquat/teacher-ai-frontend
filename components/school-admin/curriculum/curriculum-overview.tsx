"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, BookOpen, CalendarDays, CheckCircle2, Library } from "lucide-react";
import { backendApi, type PrimaryCurriculumLesson, type PrimaryCurriculumTheme } from "@/lib/api";
import { curriculumHref, lessonsForMonth, monthLabel, SCHOOL_MONTHS } from "@/lib/school-admin-curriculum";
import {
  blockingIssues,
  curriculumSlots,
  monthMetrics,
  resourceIssues,
} from "@/lib/curriculum-readiness";
import { authoringDays, authoringWeeks } from "@/lib/primary-teaching-week";
import { defaultLevel } from "@/lib/school-admin-levels";
import { useCurriculumContext } from "@/lib/use-curriculum-context";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeading, SchoolAdminPage } from "@/components/school-admin/shared/page-primitives";
import { SectionSubnav } from "@/components/school-admin/shared/section-subnav";
import { SetupPrompt } from "@/components/school-admin/onboarding/setup-prompt";
import { cn } from "@/lib/utils";

/**
 * Curriculum Overview — where curriculum work starts, and where it resumes.
 *
 * ⚠ NOT A DASHBOARD. Every figure here is one an administrator can act on, and
 * every one deep-links to the surface that resolves it. The test for whether a
 * number belongs is whether there is somewhere to send the reader when it looks
 * wrong; a count with no destination is decoration.
 *
 * ⚠ Readiness is the SERVER's, counted in slots. `monthMetrics` reads
 * `lesson.readiness` — the same verdict the publish endpoint applies — so the
 * percentage here and "publish succeeds" are the same claim. Re-deriving it
 * from lesson rows is the exact defect `lib/curriculum-readiness.ts` exists to
 * prevent.
 *
 * ⚠ Vocabulary comes from the programme definition. This page says "Themes" for
 * a theme-based programme and would say "Subjects" for a subject-based one
 * without a branch here — see `useCurriculumContext`.
 */
const DEFAULT_MONTH = new Date().getMonth() + 1;

export function CurriculumOverview() {
  const router = useRouter();
  const params = useSearchParams();
  const { year, level, curriculumLevels, labelFor, vocabulary, isLoading } =
    useCurriculumContext(params.get("level") ?? undefined);

  const levelCode = params.get("level") ?? defaultLevel(curriculumLevels);
  const rawMonth = Number(params.get("month") ?? DEFAULT_MONTH);
  const month = SCHOOL_MONTHS.some((item) => item.value === rawMonth) ? rawMonth : DEFAULT_MONTH;

  const lessons = useQuery<PrimaryCurriculumLesson[]>({
    queryKey: ["school-admin", "lessons", year?.id, levelCode],
    queryFn: () => backendApi.schoolAdminCurriculum({ academic_year_id: year!.id, level: levelCode }),
    enabled: Boolean(year?.id && levelCode),
  });
  const themes = useQuery<PrimaryCurriculumTheme[]>({
    queryKey: ["school-admin", "themes", levelCode],
    queryFn: () => backendApi.schoolAdminThemes(levelCode),
    enabled: Boolean(levelCode),
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
  const activeThemes = (themes.data ?? []).filter((theme) => theme.is_active);
  const structureLabel = vocabulary.labelFor(vocabulary.nodes[0]?.key ?? "theme");

  function setContext(changes: Record<string, string | number>) {
    const next = new URLSearchParams(params.toString());
    Object.entries(changes).forEach(([key, value]) => next.set(key, String(value)));
    router.replace(`/school-admin/curriculum/overview?${next}`, { scroll: false });
  }

  const href = (extra: Record<string, string | number> = {}) =>
    curriculumHref({ year: year?.id, level: levelCode, month, ...extra });

  /**
   * The one thing to do next.
   *
   * ⚠ Ordered by what actually blocks the next step, not by severity in the
   * abstract: you cannot plan days without structure, cannot publish days that
   * have blocking issues, and a fully ready month is ready to ship. A page that
   * offers six equal actions has not decided anything on the reader's behalf.
   */
  const nextAction = (() => {
    if (!year) {
      return { label: "Create an academic year", href: "/school-admin/academic-years", tone: "amber" as const };
    }
    if (!activeThemes.length) {
      return { label: `Create your first ${structureLabel.toLowerCase()}`, href: "/school-admin/themes", tone: "amber" as const };
    }
    if (!metrics.created) {
      return { label: `Plan ${monthLabel(month)}`, href: href(), tone: "blue" as const };
    }
    if (blocked.length) {
      return { label: `Resolve ${blocked.length} ${blocked.length === 1 ? "issue" : "issues"}`, href: href({ issue: "drafts" }), tone: "amber" as const };
    }
    if (metrics.ready) {
      return { label: `Review & publish ${metrics.ready} ${metrics.ready === 1 ? "day" : "days"}`, href: `/school-admin/curriculum/review?year=${year.id}&level=${levelCode}&month=${month}`, tone: "blue" as const };
    }
    return { label: `Continue planning ${monthLabel(month)}`, href: href(), tone: "blue" as const };
  })();

  if (isLoading) {
    return (
      <SchoolAdminPage>
        <SectionSubnav />
        <Skeleton className="h-24" /><Skeleton className="h-32" /><Skeleton className="h-64" />
      </SchoolAdminPage>
    );
  }

  return (
    <SchoolAdminPage>
      <SectionSubnav />
      <SetupPrompt />
      <PageHeading
        eyebrow="Curriculum"
        title="Curriculum overview"
        description={
          year
            ? `${year.name} · ${labelFor(levelCode)} · ${monthLabel(month)}`
            : "Set up an academic year to start planning curriculum."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="overview-level">{vocabulary.levelNoun}</label>
            <select
              id="overview-level"
              value={levelCode}
              onChange={(event) => setContext({ level: event.target.value })}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800"
            >
              {curriculumLevels.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <label className="sr-only" htmlFor="overview-month">Month</label>
            <select
              id="overview-month"
              value={month}
              onChange={(event) => setContext({ month: Number(event.target.value) })}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800"
            >
              {SCHOOL_MONTHS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
        }
      />

      {/* Readiness, and the single next action. One dominant thing to do. */}
      <section className="rounded-3xl bg-slate-950 px-5 py-6 text-white sm:px-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-blue-200">{monthLabel(month)} readiness</p>
            <div className="mt-2 flex items-baseline gap-3">
              <h2 className="text-3xl font-semibold tracking-tight">{metrics.completionPct}%</h2>
              <span className="text-sm text-slate-300">
                {metrics.published} of {metrics.slots} teaching days published
              </span>
            </div>
            <div
              className="mt-5 h-2 overflow-hidden rounded-full bg-white/15"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={metrics.completionPct}
              aria-label={`${metrics.completionPct}% of ${monthLabel(month)} published`}
            >
              <div className="h-full rounded-full bg-blue-400" style={{ width: `${metrics.completionPct}%` }} />
            </div>
          </div>
          <Link
            href={nextAction.href}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-slate-950 hover:bg-slate-100"
          >
            {nextAction.label} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* The journey, with each stage reporting its own state. */}
      <section aria-labelledby="journey-heading">
        <h2 id="journey-heading" className="sr-only">Curriculum stages</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StageCard
            icon={Library}
            label={`${structureLabel}s`}
            value={activeThemes.length}
            caption={activeThemes.length ? `${activeThemes.length} active` : "None yet"}
            ok={activeThemes.length > 0}
            href="/school-admin/themes"
          />
          <StageCard
            icon={BookOpen}
            label="Teaching days"
            value={metrics.created}
            caption={`${metrics.created} of ${metrics.slots} planned`}
            ok={metrics.created >= metrics.slots && metrics.slots > 0}
            href={href()}
          />
          <StageCard
            icon={Library}
            label="Resources"
            value={missingResources.length}
            caption={missingResources.length ? `${missingResources.length} days need resources` : "All days covered"}
            ok={missingResources.length === 0}
            href={missingResources.length ? href({ issue: "resources" }) : "/school-admin/resources"}
          />
          <StageCard
            icon={CalendarDays}
            label="Calendar"
            value={authoringDays(year ?? null).length}
            caption={`${authoringDays(year ?? null).length} teaching days a week`}
            ok={Boolean(year)}
            href="/school-admin/calendar"
          />
        </div>
      </section>

      {/* Issues, each one a link to the exact day that has it. */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.015em] text-slate-950">Needs attention</h2>
            <p className="mt-1 text-sm text-slate-500">
              Every item opens at the teaching day that has the problem.
            </p>
          </div>
          {blocked.length ? (
            <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
              {blocked.length}
            </span>
          ) : null}
        </div>

        {lessons.isLoading ? (
          <Skeleton className="mt-5 h-32" />
        ) : blocked.length ? (
          <ul className="mt-5 divide-y divide-slate-100">
            {blocked.slice(0, 6).map((slot) => {
              const issue = blockingIssues(slot.current)[0];
              return (
                <li key={`${slot.week}-${slot.day}`}>
                  <Link
                    href={href({ day: slot.current.id })}
                    className="group flex items-start gap-3 py-3.5"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-950">
                        {slot.current.title || slot.current.daily_focus || `Week ${slot.week}, day ${slot.day}`}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {issue?.detail ?? issue?.label}
                      </span>
                    </span>
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-700" />
                  </Link>
                </li>
              );
            })}
            {blocked.length > 6 ? (
              <li className="py-3 text-xs font-semibold text-slate-500">
                +{blocked.length - 6} more in {monthLabel(month)}
              </li>
            ) : null}
          </ul>
        ) : (
          /* An empty state that says what it means and where to go next. */
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center">
            <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-600" />
            <p className="mt-3 text-sm font-semibold text-slate-900">
              {metrics.created
                ? `Nothing is blocking ${monthLabel(month)}`
                : `No teaching days planned for ${monthLabel(month)} yet`}
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">
              {metrics.created
                ? `${metrics.ready} ready to publish, ${metrics.published} already live for teachers.`
                : `Plan the month's teaching days against your ${structureLabel.toLowerCase()}s, then review and publish them.`}
            </p>
            <Link
              href={nextAction.href}
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-800 hover:border-blue-200 hover:text-blue-700"
            >
              {nextAction.label} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>
    </SchoolAdminPage>
  );
}

function StageCard({
  icon: Icon,
  label,
  value,
  caption,
  ok,
  href,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number;
  caption: string;
  ok: boolean;
  href: string;
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
      <span className="mt-2 block text-2xl font-semibold tabular-nums text-slate-950">{value}</span>
      {/* Status carried by an icon and wording, never by colour alone. */}
      <span className={cn("mt-1 flex items-center gap-1.5 text-xs font-semibold", ok ? "text-emerald-700" : "text-amber-700")}>
        {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
        {caption}
      </span>
    </Link>
  );
}
