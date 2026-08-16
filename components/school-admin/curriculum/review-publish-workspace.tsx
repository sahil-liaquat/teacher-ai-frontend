"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, CheckCircle2, Eye, X } from "lucide-react";
import type { PrimaryAcademicYear, PrimaryCurriculumLesson } from "@/lib/api";
import { curriculumAdminAdapter, type CurriculumAdminScope } from "@/lib/curriculum-admin-adapter";
import {
  DAY_STATUS_LABELS,
  blockingIssues,
  curriculumSlots,
  monthMetrics,
  publishableDays,
  blockedDays,
} from "@/lib/curriculum-readiness";
import { describeOutcome, runBulkPublish } from "@/lib/curriculum-bulk-publish";
import { levelLabel, lessonsForMonth, monthLabel, SCHOOL_LEVELS, SCHOOL_MONTHS } from "@/lib/school-admin-curriculum";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { PageError, PageHeading, SchoolAdminPage } from "@/components/school-admin/shared/page-primitives";
import { authoringDays, authoringWeeks, weekdayAbbr, weekdayName } from "@/lib/primary-teaching-week";



/**
 * Review & Publish — the final QA surface for a month.
 *
 * ⚠ Deliberately NOT a second Day Editor. It answers three questions and hands
 * off for everything else: what is live, what is ready to ship, and what is
 * blocking. Every issue is a link into the Day Editor at the offending block or
 * field, so a warning is never a dead end.
 *
 * Shared by both scopes for the same reason `CurriculumWorkspace` is: master and
 * school authoring should feel identical, and the ownership difference belongs
 * in the adapter, not in a duplicated screen.
 */
export function ReviewPublishWorkspace({ scope = "school" }: { scope?: CurriculumAdminScope }) {
  const adapter = curriculumAdminAdapter(scope);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const level = searchParams.get("level") ?? "nursery";
  const rawMonth = Number(searchParams.get("month") ?? new Date().getMonth() + 1);
  const month = SCHOOL_MONTHS.some((item) => item.value === rawMonth) ? rawMonth : new Date().getMonth() + 1;
  const requestedYear = searchParams.get("year") ?? "";

  const yearsQuery = useQuery<PrimaryAcademicYear[]>({
    queryKey: [adapter.queryRoot, "academic-years"],
    queryFn: () => adapter.years(),
  });
  const yearId = requestedYear || yearsQuery.data?.find((year) => year.is_active)?.id || yearsQuery.data?.[0]?.id || "";

  const lessonsQuery = useQuery<PrimaryCurriculumLesson[]>({
    queryKey: [adapter.queryRoot, "lessons", yearId, level],
    queryFn: () => adapter.lessons({ academic_year_id: yearId, level }),
    enabled: Boolean(yearId),
  });

  const monthLessons = useMemo(() => lessonsForMonth(lessonsQuery.data ?? [], month), [lessonsQuery.data, month]);
  const reviewYear = yearsQuery.data?.find((year) => year.id === yearId) ?? null;
  const metrics = useMemo(
    () => monthMetrics(monthLessons, {
      weeks: authoringWeeks(reviewYear, month),
      days: authoringDays(reviewYear).length,
    }),
    [monthLessons, reviewYear, month],
  );
  const slots = useMemo(() => curriculumSlots(monthLessons), [monthLessons]);
  const ready = useMemo(() => publishableDays(monthLessons), [monthLessons]);
  const blocked = useMemo(() => blockedDays(monthLessons), [monthLessons]);

  const curriculumRoot = scope === "platform"
    ? "/admin/organizations/master-curriculum/design"
    : "/school-admin/curriculum";

  function openDay(lessonId: string, block?: number | null) {
    const query = new URLSearchParams({ year: yearId, level, month: String(month), day: lessonId });
    if (block !== null && block !== undefined) query.set("block", String(block));
    router.push(`${curriculumRoot}?${query.toString()}`);
  }

  function updateContext(changes: Record<string, string | number>) {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => next.set(key, String(value)));
    router.replace(`?${next.toString()}`, { scroll: false });
  }

  async function publishAllReady() {
    setBusy(true);
    setProgress({ done: 0, total: ready.length });
    try {
      const outcome = await runBulkPublish(
        ready,
        (lessonId) => adapter.publishLesson(lessonId),
        (done, total) => setProgress({ done, total }),
      );
      await queryClient.invalidateQueries({ queryKey: [adapter.queryRoot, "lessons"] });
      const summary = describeOutcome(outcome);
      toast({
        title: summary.title,
        description: summary.description,
        variant: summary.tone === "success" ? "success" : summary.tone === "error" ? "error" : undefined,
      });
      setConfirmOpen(false);
    } catch (error) {
      toast({ title: "Publishing stopped", description: getErrorMessage(error, "Try again."), variant: "error" });
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function publishOne(lesson: PrimaryCurriculumLesson) {
    setBusy(true);
    try {
      await adapter.publishLesson(lesson.id);
      await queryClient.invalidateQueries({ queryKey: [adapter.queryRoot, "lessons"] });
      toast({ title: "Published to teachers", variant: "success" });
    } catch (error) {
      toast({ title: "Could not publish", description: getErrorMessage(error, "Open the day to see what is missing."), variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (yearsQuery.isLoading || (yearId && lessonsQuery.isLoading)) {
    return <SchoolAdminPage><Skeleton className="h-24" /><Skeleton className="h-32" /><Skeleton className="h-[420px]" /></SchoolAdminPage>;
  }
  if (yearsQuery.isError || lessonsQuery.isError) {
    return (
      <SchoolAdminPage>
        <PageHeading title="Review &amp; Publish" description="Final check before teachers receive this curriculum." />
        <PageError description="The curriculum could not be loaded." onRetry={() => { void yearsQuery.refetch(); void lessonsQuery.refetch(); }} />
      </SchoolAdminPage>
    );
  }

  return (
    <SchoolAdminPage>
      <button type="button" onClick={() => router.push(`${curriculumRoot}?year=${yearId}&level=${level}&month=${month}`)} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-700">
        <ArrowLeft className="h-4 w-4" /> Back to {monthLabel(month)} curriculum
      </button>

      <PageHeading
        eyebrow="Safe publishing"
        title="Review &amp; Publish"
        description={`${levelLabel(level)} · ${monthLabel(month)} · ${metrics.slots} curriculum slots`}
        actions={
          <Button onClick={() => setConfirmOpen(true)} disabled={!ready.length || busy}>
            {ready.length ? `Publish ${ready.length} Ready ${ready.length === 1 ? "Day" : "Days"}` : "Nothing ready to publish"}
          </Button>
        }
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">Level</span>
          <select value={level} onChange={(event) => updateContext({ level: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold">
            {SCHOOL_LEVELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="flex-1">
          <span className="sr-only">Month</span>
          <select value={month} onChange={(event) => updateContext({ month: Number(event.target.value) })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold">
            {SCHOOL_MONTHS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Published" value={metrics.published} tone="green" />
        <Metric label="Ready" value={metrics.ready} tone="blue" />
        <Metric label="Needs attention" value={metrics.needsAttention} tone={metrics.needsAttention ? "amber" : "plain"} />
        <Metric label="Empty" value={metrics.empty} tone="plain" />
      </div>

      {!slots.length ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <h2 className="text-lg font-semibold text-slate-950">Nothing planned for {monthLabel(month)}</h2>
          <p className="mt-2 text-sm text-slate-600">Create teaching days before reviewing them.</p>
          <Button className="mt-5" variant="outline" onClick={() => router.push(`${curriculumRoot}?year=${yearId}&level=${level}&month=${month}`)}>Go to curriculum</Button>
        </section>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {slots.map((slot) => {
            const lesson = slot.current;
            const issues = blockingIssues(lesson);
            return (
              <article key={`${slot.week}-${slot.day}`} className="flex flex-col gap-3 border-b border-slate-100 p-4 last:border-b-0 sm:flex-row sm:items-center">
                <span className="w-24 shrink-0 text-xs font-bold uppercase tracking-wide text-slate-400">
                  W{slot.week} {weekdayAbbr(slot.day)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-950">
                    {lesson.title || lesson.daily_focus || "Untitled teaching day"}
                  </span>
                  {issues.length ? (
                    <ul className="mt-1.5 space-y-1">
                      {issues.slice(0, 3).map((issue) => (
                        <li key={issue.key}>
                          <button
                            type="button"
                            onClick={() => openDay(lesson.id, issue.step_position)}
                            className="flex items-start gap-1.5 text-left text-xs text-amber-800 hover:underline"
                          >
                            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                            {issue.detail ?? issue.label}
                          </button>
                        </li>
                      ))}
                      {issues.length > 3 ? (
                        <li className="text-xs text-slate-500">+{issues.length - 3} more</li>
                      ) : null}
                    </ul>
                  ) : (
                    <span className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {slot.hasUnpublishedEdits ? "Live, with changes ready to publish" : DAY_STATUS_LABELS[slot.status]}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 flex-wrap gap-2">
                  <Button variant="outline" onClick={() => openDay(lesson.id)}>Open</Button>
                  <Button variant="outline" onClick={() => openDay(lesson.id)}><Eye className="h-4 w-4" /> Preview</Button>
                  {slot.draft ? (
                    <Button disabled={Boolean(issues.length) || busy} onClick={() => void publishOne(slot.draft as PrimaryCurriculumLesson)}>Publish</Button>
                  ) : null}
                </span>
              </article>
            );
          })}
        </div>
      )}

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="bulk-publish-title">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">Publish curriculum</p>
                <h2 id="bulk-publish-title" className="mt-1 text-lg font-semibold text-slate-950">
                  {levelLabel(level)} · {monthLabel(month)}
                </h2>
              </div>
              <button type="button" aria-label="Cancel" onClick={() => setConfirmOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-5 text-sm text-slate-700">
              {ready.length} curriculum {ready.length === 1 ? "day is" : "days are"} ready and will be published.
            </p>
            {blocked.length ? (
              <p className="mt-2 text-sm text-slate-600">
                {blocked.length} curriculum {blocked.length === 1 ? "day still has issues and will remain a draft" : "days still have issues and will remain drafts"}.
              </p>
            ) : null}
            {progress ? (
              <p className="mt-4 text-xs font-semibold text-slate-500 tabular-nums">
                Publishing {progress.done} of {progress.total}…
              </p>
            ) : null}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={busy}>Cancel</Button>
              <Button onClick={() => void publishAllReady()} disabled={busy || !ready.length}>
                {busy ? "Publishing…" : `Publish ${ready.length} Ready ${ready.length === 1 ? "Day" : "Days"}`}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </SchoolAdminPage>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "green" | "blue" | "amber" | "plain" }) {
  const palette = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
    blue: "border-blue-200 bg-blue-50 text-blue-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    plain: "border-slate-200 bg-white text-slate-900",
  }[tone];
  return (
    <div className={`rounded-2xl border p-4 ${palette}`}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1.5 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
