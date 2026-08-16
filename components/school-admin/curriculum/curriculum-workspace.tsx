"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, Eye, MoreHorizontal, Sparkles, X } from "lucide-react";
import { type PrimaryAcademicYear, type PrimaryAIProposalRequest, type PrimaryCurriculumLesson, type PrimaryCurriculumTheme, type PrimaryLevel } from "@/lib/api";
import { curriculumAdminAdapter, type CurriculumAdminScope } from "@/lib/curriculum-admin-adapter";
import {
  lessonsForMonth,
  levelLabel,
  monthLabel,
  SCHOOL_LEVELS,
  SCHOOL_MONTHS,
} from "@/lib/school-admin-curriculum";
import {
  DAY_STATUS_LABELS,
  blockingIssues,
  dayStatus,
  slotOccupant,
  curriculumSlots,
  monthMetrics,
  type CurriculumSlot,
} from "@/lib/curriculum-readiness";
import {
  authoringDays,
  weekdayAbbr,
  weekdayName,
  weekRows,
} from "@/lib/primary-teaching-week";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { PageError, PageHeading, SchoolAdminPage } from "@/components/school-admin/shared/page-primitives";
import { SectionSubnav } from "@/components/school-admin/shared/section-subnav";
import { CurriculumDayCard } from "@/components/school-admin/curriculum/curriculum-day-card";
import { CreateDayDialog, type CreateDayRequest } from "@/components/school-admin/curriculum/create-day-dialog";
import { SchoolDayEditor } from "@/components/school-admin/day-editor/school-day-editor";
import { AIProposalDialog } from "@/components/school-admin/ai/ai-proposal-dialog";
import { StatusBadge } from "@/components/school-admin/shared/status-badge";

// ⚠ NOT CONSTANTS ANY MORE. `const DAYS = [1,2,3,4,5]` here, and its copies in
// the review screen and the platform master admin, were the front half of the
// five-day limitation: a school could declare Monday–Saturday in its calendar,
// get an open Saturday in the teacher planner, and still have no column to
// author it in. Both axes now come from the academic year — see
// `lib/primary-teaching-week.ts`.
const DEFAULT_MONTH = new Date().getMonth() + 1;

export function CurriculumWorkspace({ scope = "school" }: { scope?: CurriculumAdminScope }) {
  const adapter = curriculumAdminAdapter(scope);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [previewScope, setPreviewScope] = useState<"month" | number | null>(null);
  const [aiRequest, setAIRequest] = useState<PrimaryAIProposalRequest | null>(null);
  const [aiTitle, setAITitle] = useState("AI curriculum proposal");
  const [createSlot, setCreateSlot] = useState<{ week: number; day: number } | null>(null);
  const [creating, setCreating] = useState(false);

  const requestedYear = searchParams.get("year") ?? "";
  const level = searchParams.get("level") ?? "nursery";
  const rawMonth = Number(searchParams.get("month") ?? DEFAULT_MONTH);
  const month = SCHOOL_MONTHS.some((item) => item.value === rawMonth) ? rawMonth : DEFAULT_MONTH;
  const selectedDayId = searchParams.get("day");
  const selectedBlockId = searchParams.get("block");
  const issueFilter = searchParams.get("issue");

  const yearsQuery = useQuery<PrimaryAcademicYear[]>({
    queryKey: [adapter.queryRoot, "academic-years"],
    queryFn: () => adapter.years(),
  });
  const yearId = requestedYear || yearsQuery.data?.find((year) => year.is_active)?.id || yearsQuery.data?.[0]?.id || "";

  useEffect(() => {
    if (!requestedYear && yearId) updateContext({ year: yearId });
    // updateContext is intentionally URL-only and stable for this initialization.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedYear, yearId]);

  const themesQuery = useQuery<PrimaryCurriculumTheme[]>({
    queryKey: [adapter.queryRoot, "themes", level],
    queryFn: () => adapter.themes(level),
  });
  const lessonsQuery = useQuery<PrimaryCurriculumLesson[]>({
    queryKey: [adapter.queryRoot, "lessons", yearId, level],
    queryFn: () => adapter.lessons({ academic_year_id: yearId, level }),
    enabled: Boolean(yearId),
  });

  const monthLessons = useMemo(() => lessonsForMonth(lessonsQuery.data ?? [], month), [lessonsQuery.data, month]);
  // ⚠ Counted in SLOTS, from the server's readiness verdict. These used to count
  // lesson ROWS against a frontend rule the publish endpoint did not share, so a
  // published day and the draft opened to edit it were counted twice and
  // "N of 25 ready" could exceed 25. See lib/curriculum-readiness.ts.
  // The year the grid is being authored in decides its shape: one column per
  // teaching weekday, and a sixth week row for the rare month whose teaching
  // days genuinely span six weeks.
  const activeYear = yearsQuery.data?.find((year) => year.id === yearId) ?? null;
  const DAYS = useMemo(() => authoringDays(activeYear), [activeYear]);
  const WEEKS = useMemo(() => weekRows(activeYear, month), [activeYear, month]);
  const metrics = useMemo(
    () => monthMetrics(monthLessons, { weeks: WEEKS.length, days: DAYS.length }),
    [monthLessons, WEEKS.length, DAYS.length],
  );
  const slots = useMemo(() => curriculumSlots(monthLessons), [monthLessons]);
  const slotFor = (week: number, day: number) => slots.find((slot) => slot.week === week && slot.day === day);
  // Review & Publish is a real surface, not a modal over the grid. It carries
  // the same year/level/month context so the admin never reselects it.
  const reviewHref = `${scope === "platform" ? "/admin/organizations/master-curriculum/review" : "/school-admin/curriculum/review"}?year=${yearId}&level=${level}&month=${month}`;

  function updateContext(changes: Record<string, string | number | null>) {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "") next.delete(key);
      else next.set(key, String(value));
    });
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  function openAI(operation: PrimaryAIProposalRequest["operation"], action: string, week?: number) {
    const theme = themesQuery.data?.find((item) => item.is_active) ?? themesQuery.data?.[0];
    if (!yearId || !theme) {
      toast({ title: "A theme and academic year are required", description: "Set up the school year and a curriculum theme first.", variant: "error" });
      return;
    }
    setAITitle(action);
    setAIRequest({ operation, academic_year_id: yearId, level: level as PrimaryLevel, month, week, theme_id: theme.id });
  }

  /**
   * ⚠ Opens the dialog. It does NOT create anything.
   *
   * This used to create a day on the spot with
   * `themesQuery.data?.find((item) => item.is_active) ?? themesQuery.data?.[0]`
   * as the theme — the first active theme in the list, never chosen and, since
   * the Day Editor had no theme control, never correctable. Theme drives both
   * the teacher's lookup and the resource matcher's dominant facet, so it is
   * now an explicit decision. See components/school-admin/curriculum/create-day-dialog.tsx.
   */
  function openCreateDay(week: number, day: number) {
    if (!yearId) {
      toast({ title: "An academic year is required", description: "Set up the school year before planning teaching days.", variant: "error" });
      return;
    }
    setCreateSlot({ week, day });
  }

  async function createDay(request: CreateDayRequest) {
    if (!createSlot || !yearId) return;
    setCreating(true);
    try {
      const lesson = await adapter.createLesson({
        academic_year_id: yearId,
        theme_id: request.themeId,
        topic_id: request.topicId,
        level,
        month,
        week: createSlot.week,
        day: createSlot.day,
        title: "New teaching day",
        daily_focus: request.dailyFocus,
        objectives: [],
        vocabulary: [],
        assessment_questions: [],
        steps: request.steps,
      });
      await queryClient.invalidateQueries({ queryKey: [adapter.queryRoot, "lessons", yearId, level] });
      setCreateSlot(null);
      updateContext({ day: lesson.id });
    } catch (error) {
      toast({
        title: "Could not create the teaching day",
        description: getErrorMessage(error, "Check the theme and topic and try again."),
        variant: "error",
      });
    } finally {
      setCreating(false);
    }
  }

  if (selectedDayId) {
    return (
      <SchoolDayEditor
        scope={scope}
        lessonId={selectedDayId}
        academicYearId={yearId}
        themes={themesQuery.data ?? []}
        initialBlockId={selectedBlockId}
        onBack={() => updateContext({ day: null, block: null })}
        onLessonChanged={(lessonId) => updateContext({ day: lessonId, block: null })}
      />
    );
  }

  if (yearsQuery.isLoading || (yearId && lessonsQuery.isLoading)) {
    return <SchoolAdminPage>
      <SectionSubnav /><Skeleton className="h-24" /><Skeleton className="h-16" /><Skeleton className="h-[540px]" /></SchoolAdminPage>;
  }

  if (!yearsQuery.data?.length) {
    return (
      <SchoolAdminPage>
      <SectionSubnav />
        <PageHeading title="Curriculum" description="Set up an academic year before planning teaching days." />
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <h2 className="text-xl font-semibold text-slate-950">This curriculum needs an academic year</h2>
          <p className="mt-2 text-sm text-slate-600">Academic years keep drafts and published curriculum in the correct ownership context.</p>
          <Button className="mt-6" onClick={() => router.push(scope === "platform" ? "/admin/organizations/master-curriculum" : "/school-admin/academic-years")}>Set up academic year</Button>
        </div>
      </SchoolAdminPage>
    );
  }

  if (yearsQuery.isError || lessonsQuery.isError || themesQuery.isError) {
    return (
      <SchoolAdminPage>
      <SectionSubnav />
        <PageHeading title="Curriculum" description={`Plan and publish ${adapter.ownerLabel} teaching days.`} />
        <PageError
          description="The academic years, themes, or teaching days could not be loaded."
          onRetry={() => {
            void yearsQuery.refetch();
            void themesQuery.refetch();
            void lessonsQuery.refetch();
          }}
        />
      </SchoolAdminPage>
    );
  }

  return (
    <SchoolAdminPage>
      <SectionSubnav />
      <PageHeading
        eyebrow="Curriculum workspace"
        title={`${monthLabel(month)} Curriculum`}
        description={`${metrics.slots} planned slots · ${metrics.created} days created · ${metrics.ready} ready · ${metrics.published} published · ${metrics.needsAttention} need attention`}
        actions={(
          <>
            <Button variant="outline" onClick={() => setPreviewScope("month")}><Eye className="h-4 w-4" /> Preview</Button>
            <Button onClick={() => router.push(reviewHref)}>Review &amp; Publish</Button>
          </>
        )}
      />

      <div className="sticky top-14 z-20 -mx-4 border-y border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur lg:top-0 lg:mx-0 lg:rounded-2xl lg:border lg:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
            <label className="relative">
              <span className="sr-only">Academic year</span>
              <select value={yearId} onChange={(event) => updateContext({ year: event.target.value, day: null })} className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-semibold text-slate-900">
                {yearsQuery.data.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
              </select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
            </label>
            <label className="relative">
              <span className="sr-only">Level or class</span>
              <select value={level} onChange={(event) => updateContext({ level: event.target.value, day: null })} className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-semibold text-slate-900">
                {SCHOOL_LEVELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
            </label>
            <label className="relative">
              <span className="sr-only">Month</span>
              <select value={month} onChange={(event) => updateContext({ month: Number(event.target.value), day: null })} className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-semibold text-slate-900">
                {SCHOOL_MONTHS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
            </label>
          </div>
          <Button variant="outline" className="border-violet-200 text-violet-700 hover:bg-violet-50" onClick={() => openAI("fill_month", "Complete this month with AI")}><Sparkles className="h-4 w-4" /> Complete with AI</Button>
        </div>
      </div>

      {!monthLessons.length ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <h2 className="text-xl font-semibold text-slate-950">No curriculum planned for {monthLabel(month)} yet</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Start with a teaching day, or use curriculum AI to prepare the month while preserving this scope.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => openCreateDay(1, 1)}>Create first day</Button>
            <Button onClick={() => openAI("create_month", "Create this month with AI")}><Sparkles className="h-4 w-4" /> Create with AI</Button>
          </div>
        </section>
      ) : (
        <div className="space-y-8">
          {WEEKS.map((week) => (
            <section key={week} aria-labelledby={`week-${week}-heading`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 id={`week-${week}-heading`} className="text-base font-semibold text-slate-950">Week {week}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">{DAYS.filter((day) => slotFor(week, day)).length} of {DAYS.length} days planned</p>
                </div>
                <details className="relative">
                  <summary className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-xl text-slate-500 hover:bg-white" aria-label={`Week ${week} actions`}><MoreHorizontal className="h-5 w-5" /></summary>
                  <div className="absolute right-0 z-10 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    <button type="button" onClick={() => openAI("fill_week", `Fill week ${week} with AI`, week)} className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-slate-50">Fill week with AI</button>
                    <button type="button" onClick={() => setPreviewScope(week)} className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-slate-50">Preview week</button>
                  </div>
                </details>
              </div>
              {/* One column per teaching day. Tailwind cannot see a computed
                  class name, so the track count is an inline style — which also
                  keeps six columns fitting the same row rather than scrolling. */}
              <div
                className="hidden gap-3 xl:grid"
                style={{ gridTemplateColumns: `repeat(${DAYS.length}, minmax(0, 1fr))` }}
              >
                {DAYS.map((day) => {
                  const slot = slotFor(week, day);
                  const highlighted = Boolean(slot && (
                    (issueFilter === "resources" && blockingIssues(slot.current).some((issue) => issue.key.startsWith("step_resource")))
                    || (issueFilter === "drafts" && slot.current.scope === scope && slot.current.status === "draft")
                  ));
                  return <CurriculumDayCard key={day} day={day} slot={slot} highlighted={highlighted} onOpen={(item) => updateContext({ day: item.id })} onCreate={() => openCreateDay(week, day)} />;
                })}
              </div>
              <div className="space-y-2 xl:hidden">
                {DAYS.map((day) => {
                  const slot = slotFor(week, day);
                  const lesson = slot?.current;
                  const dayName = weekdayName(day);
                  const issues = slot ? blockingIssues(slot.current).length : 0;
                  return (
                    <button key={day} type="button" onClick={() => lesson ? updateContext({ day: lesson.id }) : openCreateDay(week, day)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">{weekdayAbbr(day)}</span>
                      <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-slate-500">{dayName}</span><span className="block truncate text-sm font-semibold text-slate-950">{lesson?.title || lesson?.daily_focus || "Not planned"}</span></span>
                      <span className="text-xs font-bold text-blue-700">{slot ? (issues ? `${issues} ${issues === 1 ? "issue" : "issues"}` : DAY_STATUS_LABELS[slot.status]) : "+ Create"}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {previewScope !== null ? (
        <CurriculumPreview
          month={month}
          level={level}
          week={previewScope === "month" ? null : previewScope}
          weeks={WEEKS}
          days={DAYS}
          lessons={monthLessons}
          onClose={() => setPreviewScope(null)}
          onOpenDay={(lessonId) => {
            setPreviewScope(null);
            updateContext({ day: lessonId });
          }}
        />
      ) : null}
      {createSlot ? (
        <CreateDayDialog
          open
          week={createSlot.week}
          day={createSlot.day}
          month={month}
          level={level}
          themes={themesQuery.data ?? []}
          monthLessons={monthLessons}
          busy={creating}
          onCancel={() => setCreateSlot(null)}
          onCreate={(request) => void createDay(request)}
        />
      ) : null}
      <AIProposalDialog
        scope={scope}
        open={Boolean(aiRequest)}
        onOpenChange={(open) => { if (!open) setAIRequest(null); }}
        request={aiRequest}
        title={aiTitle}
        onApplied={async () => {
          await queryClient.invalidateQueries({ queryKey: [adapter.queryRoot, "lessons", yearId, level] });
          toast({ title: "AI changes applied to drafts", description: "Published curriculum remains unchanged until review and publish." });
        }}
      />
    </SchoolAdminPage>
  );
}

function CurriculumPreview({ month, level, week, weeks, days, lessons, onClose, onOpenDay }: {
  month: number;
  level: string;
  week: number | null;
  weeks: number[];
  days: number[];
  lessons: PrimaryCurriculumLesson[];
  onClose: () => void;
  onOpenDay: (lessonId: string) => void;
}) {
  const visibleWeeks = week ? [week] : weeks;
  const planned = lessons.filter((lesson) => week === null || lesson.week === week).length;
  const total = visibleWeeks.length * days.length;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="curriculum-preview-title">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">Curriculum preview</p>
            <h2 id="curriculum-preview-title" className="mt-1 text-xl font-semibold text-slate-950">{week ? `${monthLabel(month)} · Week ${week}` : `${monthLabel(month)} curriculum`}</h2>
            <p className="mt-2 text-sm text-slate-600">{levelLabel(level)} · {planned} of {total} teaching days planned</p>
          </div>
          <button type="button" aria-label="Close curriculum preview" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-6 space-y-6">
          {visibleWeeks.map((weekNumber) => (
            <section key={weekNumber} aria-labelledby={`preview-week-${weekNumber}`}>
              <h3 id={`preview-week-${weekNumber}`} className="mb-3 text-sm font-semibold text-slate-950">Week {weekNumber}</h3>
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
              >
                {days.map((day) => {
                  const lesson = slotOccupant(lessons, weekNumber, day);
                  const dayName = weekdayName(day);
                  return lesson ? (
                    <button key={day} type="button" onClick={() => onOpenDay(lesson.id)} className="rounded-2xl border border-slate-200 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/40">
                      <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">{dayName}</span>
                      <span className="mt-2 line-clamp-2 block text-sm font-semibold text-slate-950">{lesson.title || lesson.daily_focus || "Untitled teaching day"}</span>
                      <span className="mt-2 block text-xs text-slate-500">{lesson.steps?.length ?? 0} blocks</span>
                      <span className="mt-3 block"><StatusBadge status={dayStatus(lesson)} compact /></span>
                    </button>
                  ) : (
                    <div key={day} className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-3">
                      <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">{dayName}</span>
                      <span className="mt-2 block text-sm font-medium text-slate-400">Not planned</span>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        <Button variant="outline" className="mt-7 w-full" onClick={onClose}>Close preview</Button>
      </div>
    </div>
  );
}
