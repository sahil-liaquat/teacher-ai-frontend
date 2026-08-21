"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CalendarDays, CalendarX2, Sparkles, Trash2 } from "lucide-react";
import {
  backendApi,
  CURRICULUM_PLANS_QUERY_KEY,
  type CurriculumCoverage,
  type CurriculumPlan,
  type PlanningContext,
  type PrimaryCurriculumLesson,
} from "@/lib/api";
import {
  describeDistribution,
  proposeDistribution,
  runDistribution,
  type DistributionProposal,
} from "@/lib/curriculum-distribution";
import { defaultLevel } from "@/lib/school-admin-levels";
import { useCurriculumContext } from "@/lib/use-curriculum-context";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ActionDialog } from "@/components/school-admin/shared/action-dialog";
import { PageError, PageHeading, SchoolAdminPage } from "@/components/school-admin/shared/page-primitives";
import { SectionSubnav } from "@/components/school-admin/shared/section-subnav";
import { cn } from "@/lib/utils";

/**
 * Curriculum → Calendar: placing authored teaching days onto real dates.
 *
 * ⚠ Consumes `/school-admin/planning` entirely. Calendar validity, term
 * boundaries and slot collision are all enforced server-side and none of it is
 * re-implemented here — when a write is refused, the service's own message is
 * what the admin reads, because it names the actual date and the actual reason.
 *
 * ⚠ PLANNED IS NOT TAUGHT, and this surface must never blur that. Coverage here
 * counts days that have something scheduled on them. Whether a lesson was
 * delivered lives in the teaching-execution layer and is deliberately absent.
 */
function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(
    new Date(`${value}T00:00:00`),
  );
}

export function PlanningWorkspace() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [preview, setPreview] = useState<ReturnType<typeof proposeDistribution> | null>(null);
  const [selectedProposalIds, setSelectedProposalIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [rescheduling, setRescheduling] = useState<{ planId: string; label: string } | null>(null);
  const [newDate, setNewDate] = useState("");

  const { year, curriculumLevels, labelFor, vocabulary } = useCurriculumContext(
    params.get("level") ?? undefined,
  );
  const level = params.get("level") ?? defaultLevel(curriculumLevels);

  const context = useQuery<PlanningContext>({
    queryKey: ["school-admin", "planning-context", year?.id],
    queryFn: () => backendApi.schoolAdminPlanningContext({ academic_year_id: year!.id }),
    enabled: Boolean(year?.id),
  });
  const coverage = useQuery<CurriculumCoverage>({
    queryKey: ["school-admin", "coverage", year?.id, level],
    queryFn: () => backendApi.schoolAdminCoverage(year!.id, level),
    enabled: Boolean(year?.id),
  });
  const lessons = useQuery<PrimaryCurriculumLesson[]>({
    queryKey: ["school-admin", "lessons", year?.id, level],
    queryFn: () => backendApi.schoolAdminCurriculum({ academic_year_id: year!.id, level }),
    enabled: Boolean(year?.id),
  });

  // Only published days are worth scheduling: a draft is not something teachers
  // can be sent to on a date.
  const schedulable = useMemo(
    () => (lessons.data ?? []).filter((lesson) => lesson.status === "published"),
    [lessons.data],
  );
  const plans = useMemo(
    () => (context.data?.plans ?? []).filter((plan) => plan.status === "planned"),
    [context.data],
  );
  const lessonById = useMemo(
    () => new Map((lessons.data ?? []).map((lesson) => [lesson.id, lesson])),
    [lessons.data],
  );
  const dayById = useMemo(
    () => new Map((context.data?.teaching_days ?? []).map((day) => [day.id, day])),
    [context.data],
  );

  const scheduled = useMemo(
    () =>
      plans
        .map((plan) => ({ plan, day: dayById.get(plan.calendar_day_id), lesson: lessonById.get(plan.lesson_id) }))
        .filter((row) => row.day)
        .sort((a, b) => (a.day!.date).localeCompare(b.day!.date)),
    [plans, dayById, lessonById],
  );

  function setLevel(next: string) {
    const query = new URLSearchParams(params.toString());
    query.set("level", next);
    router.replace(`/school-admin/planning?${query}`, { scroll: false });
  }

  /**
   * ⚠ Generates a PROPOSAL. Nothing is written until the admin applies it.
   * Placing a term of curriculum onto a calendar is large and awkward to
   * reverse, so the preview is not optional.
   */
  function generate() {
    const next = proposeDistribution({
      lessons: schedulable,
      teachingDays: context.data?.teaching_days ?? [],
      existingPlans: context.data?.plans ?? [],
    });
    setPreview(next);
    setSelectedProposalIds(new Set(next.proposals.map((proposal) => proposal.lesson.id)));
  }

  const selectedProposals = useMemo(
    () => preview?.proposals.filter((proposal) => selectedProposalIds.has(proposal.lesson.id)) ?? [],
    [preview, selectedProposalIds],
  );

  function closePreview() {
    setPreview(null);
    setSelectedProposalIds(new Set());
  }

  async function apply(proposals: DistributionProposal[]) {
    if (!year) return;
    setBusy(true);
    setProgress({ done: 0, total: proposals.length });
    try {
      const outcome = await runDistribution(
        proposals,
        (proposal) =>
          backendApi.schoolAdminCreatePlan({
            academic_year_id: year.id,
            lesson_id: proposal.lesson.id,
            date: proposal.date,
          }),
        (done, total) => setProgress({ done, total }),
      );
      await queryClient.invalidateQueries({ queryKey: ["school-admin", "planning-context"] });
      await queryClient.invalidateQueries({ queryKey: ["school-admin", "coverage"] });
      const summary = describeDistribution(outcome);
      toast({
        title: summary.title,
        description: summary.description,
        variant: summary.tone === "success" ? "success" : summary.tone === "error" ? "error" : undefined,
      });
      closePreview();
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  /**
   * ⚠ Rescheduling is a first-class action, not a delete-and-recreate. The
   * service moves the plan and keeps its identity, so provenance survives —
   * recreating it would lose that a day was MOVED rather than newly planned,
   * which is exactly the distinction execution reporting depends on.
   *
   * The new date is validated server-side against the school calendar, so an
   * invalid one comes back with the service's own message naming the date and
   * the reason.
   */
  const reschedule = useMutation({
    mutationFn: ({ planId, date }: { planId: string; date: string }) =>
      backendApi.schoolAdminReschedulePlan(planId, date),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["school-admin", "planning-context"] });
      await queryClient.invalidateQueries({ queryKey: ["school-admin", "coverage"] });
      setRescheduling(null);
      setNewDate("");
      toast({ title: "Moved", description: "Teachers see it on the new date." });
    },
    onError: (error) =>
      toast({
        title: "Could not move that day",
        // The service names the date and why — a holiday, outside every term,
        // or already taken. Its wording beats anything generic here.
        description: getErrorMessage(error, "Choose a different date."),
        variant: "error",
      }),
  });

  const cancel = useMutation({
    mutationFn: (planId: string) => backendApi.schoolAdminCancelPlan(planId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["school-admin", "planning-context"] });
      await queryClient.invalidateQueries({ queryKey: ["school-admin", "coverage"] });
      toast({ title: "Removed from the calendar", description: "The teaching day itself is unchanged." });
    },
    onError: (error) =>
      toast({
        title: "Could not unschedule that day",
        description: getErrorMessage(error, "Try again."),
        variant: "error",
      }),
  });

  if (!year) {
    return (
      <SchoolAdminPage>
        <SectionSubnav />
        <PageHeading eyebrow="Curriculum" title="Calendar mapping" description="Place teaching days on real dates." />
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <CalendarDays className="mx-auto h-7 w-7 text-slate-400" />
          <h2 className="mt-3 text-lg font-semibold text-slate-950">Create an academic year first</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Curriculum is scheduled against one year&rsquo;s calendar, so the year comes first.
          </p>
          <Button className="mt-5" onClick={() => router.push("/school-admin/academic-years")}>
            Set up academic year
          </Button>
        </div>
      </SchoolAdminPage>
    );
  }

  return (
    <SchoolAdminPage>
      <SectionSubnav />
      <PageHeading
        eyebrow="Curriculum"
        title="Calendar mapping"
        description={`Place published ${vocabulary.lessonNoun}s on real dates in ${year.name}.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="planning-level">{vocabulary.levelNoun}</label>
            <select
              id="planning-level"
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800"
            >
              {curriculumLevels.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <Button onClick={generate} disabled={!schedulable.length || context.isLoading}>
              <Sparkles className="h-4 w-4" /> Propose a schedule
            </Button>
          </div>
        }
      />

      {context.isError || lessons.isError ? (
        <PageError
          description="The planning calendar could not be loaded."
          onRetry={() => { void context.refetch(); void lessons.refetch(); }}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Teaching days" value={coverage.data?.teaching_days} />
            <Stat label="Days with a plan" value={coverage.data?.days_with_plans} tone="emerald" />
            <Stat label="Days still free" value={coverage.data?.days_without_plans} tone="amber" />
            <Stat label={`Published ${vocabulary.lessonNoun}s`} value={schedulable.length} />
          </div>

          {/* ⚠ Says "planned", never "taught". */}
          <p className="mt-3 text-xs leading-5 text-slate-500">
            These count what is <strong className="font-semibold text-slate-700">scheduled</strong>.
            Whether a lesson was actually delivered is tracked in Teaching, not here.
          </p>

          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.015em] text-slate-950">Scheduled</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {labelFor(level)} · {scheduled.length} {scheduled.length === 1 ? "day" : "days"} placed
                </p>
              </div>
            </div>

            {context.isLoading || lessons.isLoading ? (
              <div className="mt-5 space-y-2">{[0, 1, 2].map((row) => <Skeleton key={row} className="h-14 rounded-2xl" />)}</div>
            ) : scheduled.length ? (
              <ul className="mt-5 divide-y divide-slate-100">
                {scheduled.map(({ plan, day, lesson }) => (
                  <li key={plan.id} className="flex items-center gap-3 py-3">
                    <span className="w-20 shrink-0 text-sm font-bold tabular-nums text-slate-500">
                      {formatDate(day!.date)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-950">
                        {lesson?.title || lesson?.daily_focus || "Scheduled teaching day"}
                      </span>
                      {plan.source === "ai_proposal" ? (
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                          AI suggested
                        </span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 items-center gap-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Move ${formatDate(day!.date)} to another date`}
                        onClick={() => {
                          setRescheduling({ planId: plan.id, label: formatDate(day!.date) });
                          setNewDate(day!.date);
                        }}
                      >
                        <CalendarClock className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Unschedule ${formatDate(day!.date)}`}
                        disabled={cancel.isPending}
                        onClick={() => cancel.mutate(plan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              /* An empty state that explains and offers the next action. */
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center">
                <CalendarX2 className="mx-auto h-7 w-7 text-slate-400" />
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  Nothing is on the calendar for {labelFor(level)} yet
                </p>
                <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-slate-500">
                  {schedulable.length
                    ? `${schedulable.length} published ${vocabulary.lessonNoun}${schedulable.length === 1 ? "" : "s"} are ready to place. Propose a schedule and review it before anything is written.`
                    : `Publish some ${vocabulary.lessonNoun}s first — only published days can be scheduled, because a draft is not something a teacher can be sent to.`}
                </p>
                {schedulable.length ? (
                  <Button className="mt-5" onClick={generate}>
                    <Sparkles className="h-4 w-4" /> Propose a schedule
                  </Button>
                ) : (
                  <Button className="mt-5" variant="outline" onClick={() => router.push("/school-admin/curriculum/review")}>
                    Review &amp; publish
                  </Button>
                )}
              </div>
            )}
          </section>
        </>
      )}

      <ActionDialog
        open={Boolean(rescheduling)}
        onOpenChange={(next) => { if (!next) setRescheduling(null); }}
        size="sm"
        title={`Move ${rescheduling?.label ?? "this day"}`}
        description="Pick a teaching day. The school calendar decides which dates are valid."
        footer={
          <>
            <Button variant="outline" onClick={() => setRescheduling(null)}>Cancel</Button>
            <Button
              disabled={!newDate || reschedule.isPending}
              onClick={() => rescheduling && reschedule.mutate({ planId: rescheduling.planId, date: newDate })}
            >
              {reschedule.isPending ? "Moving…" : "Move"}
            </Button>
          </>
        }
      >
        <label className="block text-sm font-semibold text-slate-800">
          New date
          <Input
            type="date"
            className="mt-2"
            value={newDate}
            min={year?.starts_on}
            max={year?.ends_on}
            onChange={(event) => setNewDate(event.target.value)}
          />
        </label>
      </ActionDialog>

      {/* ⚠ Preview before apply. Never a silent mass write. */}
      <ActionDialog
        open={Boolean(preview)}
        onOpenChange={(next) => { if (!next && !busy) closePreview(); }}
        size="lg"
        title="Review the proposed schedule"
        description="Nothing is written until you apply this. Days already on the calendar are left exactly where they are."
        footer={
          <>
            <Button variant="outline" disabled={busy} onClick={closePreview}>Cancel</Button>
            <Button
              disabled={busy || !selectedProposals.length}
              onClick={() => void apply(selectedProposals)}
            >
              {busy
                ? `Scheduling ${progress?.done ?? 0} of ${progress?.total ?? 0}…`
                : `Schedule ${selectedProposals.length} ${selectedProposals.length === 1 ? "day" : "days"}`}
            </Button>
          </>
        }
      >
        {preview ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Choose which proposed days to place. {selectedProposals.length} of {preview.proposals.length} selected;
              dates stay in curriculum order. {preview.remainingDays} teaching{" "}
              {preview.remainingDays === 1 ? "day stays" : "days stay"} free.
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedProposalIds(new Set(preview.proposals.map((proposal) => proposal.lesson.id)))}
              >
                Select all
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSelectedProposalIds(new Set())}
              >
                Clear
              </Button>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200">
              <ul className="divide-y divide-slate-100">
                {preview.proposals.slice(0, 40).map((proposal) => (
                  <li key={proposal.lesson.id} className="flex items-center gap-3 px-4 py-2.5">
                    <input
                      type="checkbox"
                      aria-label={`Schedule ${proposal.lesson.title || proposal.lesson.daily_focus || "teaching day"}`}
                      checked={selectedProposalIds.has(proposal.lesson.id)}
                      onChange={(event) => {
                        setSelectedProposalIds((current) => {
                          const next = new Set(current);
                          if (event.target.checked) next.add(proposal.lesson.id);
                          else next.delete(proposal.lesson.id);
                          return next;
                        });
                      }}
                      className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="w-20 shrink-0 text-xs font-bold tabular-nums text-slate-500">
                      {formatDate(proposal.date)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                      {proposal.lesson.title || proposal.lesson.daily_focus || "Teaching day"}
                    </span>
                  </li>
                ))}
              </ul>
              {preview.proposals.length > 40 ? (
                <p className="border-t border-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-500">
                  +{preview.proposals.length - 40} more
                </p>
              ) : null}
            </div>

            {preview.unplaced.length ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <p className="text-sm font-bold text-amber-900">
                  {preview.unplaced.length} not included
                </p>
                <ul className="mt-1.5 space-y-1 text-xs leading-5 text-amber-900/80">
                  {preview.unplaced.filter((item) => item.reason === "already_planned").length ? (
                    <li>
                      {preview.unplaced.filter((item) => item.reason === "already_planned").length} already
                      on the calendar — left where you put them.
                    </li>
                  ) : null}
                  {preview.unplaced.filter((item) => item.reason === "no_teaching_day_left").length ? (
                    <li>
                      {preview.unplaced.filter((item) => item.reason === "no_teaching_day_left").length} have
                      no free teaching day left this year. Add teaching days in the Calendar, or schedule them by hand.
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </ActionDialog>
    </SchoolAdminPage>
  );
}

function Stat({ label, value, tone = "slate" }: { label: string; value?: number; tone?: "slate" | "emerald" | "amber" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-2xl font-semibold tabular-nums",
          tone === "emerald" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : "text-slate-950",
        )}
      >
        {value ?? "—"}
      </p>
    </div>
  );
}
