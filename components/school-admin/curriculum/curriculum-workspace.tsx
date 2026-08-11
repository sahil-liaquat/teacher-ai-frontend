"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, Eye, MoreHorizontal, Sparkles, X } from "lucide-react";
import { backendApi, type PrimaryAcademicYear, type PrimaryCurriculumLesson, type PrimaryCurriculumTheme } from "@/lib/api";
import {
  findLessonForSlot,
  lessonIssues,
  lessonsForMonth,
  lessonStatus,
  levelLabel,
  monthLabel,
  SCHOOL_LEVELS,
  SCHOOL_MONTHS,
} from "@/lib/school-admin-curriculum";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { PageHeading, SchoolAdminPage } from "@/components/school-admin/shared/page-primitives";
import { CurriculumDayCard } from "@/components/school-admin/curriculum/curriculum-day-card";
import { SchoolDayEditor } from "@/components/school-admin/day-editor/school-day-editor";

const WEEKS = [1, 2, 3, 4, 5];
const DAYS = [1, 2, 3, 4, 5];

export function CurriculumWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [reviewOpen, setReviewOpen] = useState(false);

  const requestedYear = searchParams.get("year") ?? "";
  const level = searchParams.get("level") ?? "nursery";
  const rawMonth = Number(searchParams.get("month") ?? 9);
  const month = SCHOOL_MONTHS.some((item) => item.value === rawMonth) ? rawMonth : 9;
  const selectedDayId = searchParams.get("day");
  const selectedBlockId = searchParams.get("block");
  const issueFilter = searchParams.get("issue");

  const yearsQuery = useQuery<PrimaryAcademicYear[]>({
    queryKey: ["school-admin", "academic-years"],
    queryFn: () => backendApi.adminPrimaryAcademicYears(),
  });
  const yearId = requestedYear || yearsQuery.data?.find((year) => year.is_active)?.id || yearsQuery.data?.[0]?.id || "";

  useEffect(() => {
    if (!requestedYear && yearId) updateContext({ year: yearId });
    // updateContext is intentionally URL-only and stable for this initialization.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedYear, yearId]);

  const themesQuery = useQuery<PrimaryCurriculumTheme[]>({
    queryKey: ["school-admin", "themes", level],
    queryFn: () => backendApi.adminPrimaryThemes(level),
  });
  const lessonsQuery = useQuery<PrimaryCurriculumLesson[]>({
    queryKey: ["school-admin", "lessons", yearId, level],
    queryFn: () => backendApi.adminPrimaryLessons({ academic_year_id: yearId, level }),
    enabled: Boolean(yearId),
  });

  const monthLessons = useMemo(() => lessonsForMonth(lessonsQuery.data ?? [], month), [lessonsQuery.data, month]);
  const publishedCount = monthLessons.filter((lesson) => lesson.status === "published").length;
  const draftCount = monthLessons.filter((lesson) => lesson.scope === "school" && lesson.status === "draft").length;
  const attentionCount = monthLessons.filter((lesson) => lessonIssues(lesson).length).length;
  const readyCount = monthLessons.filter((lesson) => ["ready", "published"].includes(lessonStatus(lesson))).length;

  function updateContext(changes: Record<string, string | number | null>) {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "") next.delete(key);
      else next.set(key, String(value));
    });
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  function aiUnavailable(action: string, week?: number) {
    toast({
      title: `${action} needs the curriculum AI endpoint`,
      description: `${levelLabel(level)} · ${monthLabel(month)}${week ? ` · Week ${week}` : ""}. Existing curriculum was left unchanged.`,
    });
  }

  async function createDay(week: number, day: number) {
    const theme = themesQuery.data?.find((item) => item.is_active) ?? themesQuery.data?.[0];
    if (!theme || !yearId) {
      toast({ title: "A theme and academic year are required", description: "Set up the school year and at least one curriculum theme first.", variant: "error" });
      return;
    }
    try {
      const lesson = await backendApi.adminCreatePrimaryLesson({
        academic_year_id: yearId,
        theme_id: theme.id,
        level,
        month,
        week,
        day,
        title: "New teaching day",
        daily_focus: null,
        objectives: [],
        vocabulary: [],
        assessment_questions: [],
        steps: [],
      });
      await queryClient.invalidateQueries({ queryKey: ["school-admin", "lessons", yearId, level] });
      updateContext({ day: lesson.id });
    } catch (error: any) {
      toast({ title: "Could not create the teaching day", description: error?.message, variant: "error" });
    }
  }

  if (selectedDayId) {
    return (
      <SchoolDayEditor
        lessonId={selectedDayId}
        academicYearId={yearId}
        themes={themesQuery.data ?? []}
        initialBlockId={selectedBlockId}
        onBack={() => updateContext({ day: null, block: null })}
        onLessonChanged={(lessonId) => updateContext({ day: lessonId, block: null })}
      />
    );
  }

  if (yearsQuery.isLoading || lessonsQuery.isLoading) {
    return <SchoolAdminPage><Skeleton className="h-24" /><Skeleton className="h-16" /><Skeleton className="h-[540px]" /></SchoolAdminPage>;
  }

  if (!yearsQuery.data?.length) {
    return (
      <SchoolAdminPage>
        <PageHeading title="Curriculum" description="Set up an academic year before planning teaching days." />
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <h2 className="text-xl font-semibold text-slate-950">Your curriculum needs a school year</h2>
          <p className="mt-2 text-sm text-slate-600">Academic years keep drafts and published curriculum in the correct school context.</p>
          <Button className="mt-6" onClick={() => router.push("/school-admin/academic-years")}>Set up academic year</Button>
        </div>
      </SchoolAdminPage>
    );
  }

  return (
    <SchoolAdminPage>
      <PageHeading
        eyebrow="Curriculum workspace"
        title={`${monthLabel(month)} Curriculum`}
        description={`${readyCount} of 25 days ready · ${draftCount} draft changes · ${publishedCount} published · ${attentionCount} need attention`}
        actions={(
          <>
            <Button variant="outline" onClick={() => toast({ title: "Month preview", description: "Open a teaching day to preview its complete classroom flow." })}><Eye className="h-4 w-4" /> Preview</Button>
            <Button onClick={() => setReviewOpen(true)}>Review &amp; Publish</Button>
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
          <Button variant="outline" className="border-violet-200 text-violet-700 hover:bg-violet-50" onClick={() => aiUnavailable("Complete with AI")}><Sparkles className="h-4 w-4" /> Complete with AI</Button>
        </div>
      </div>

      {lessonsQuery.isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">Curriculum could not be loaded. Refresh the page to try again.</div>
      ) : null}

      {!monthLessons.length ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <h2 className="text-xl font-semibold text-slate-950">No curriculum planned for {monthLabel(month)} yet</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Start with a teaching day, or connect curriculum AI to prepare the month while preserving your school context.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => void createDay(1, 1)}>Create first day</Button>
            <Button onClick={() => aiUnavailable("Create month with AI")}><Sparkles className="h-4 w-4" /> Create with AI</Button>
          </div>
        </section>
      ) : (
        <div className="space-y-8">
          {WEEKS.map((week) => (
            <section key={week} aria-labelledby={`week-${week}-heading`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 id={`week-${week}-heading`} className="text-base font-semibold text-slate-950">Week {week}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">{DAYS.filter((day) => findLessonForSlot(monthLessons, week, day)).length} of 5 days planned</p>
                </div>
                <details className="relative">
                  <summary className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-xl text-slate-500 hover:bg-white" aria-label={`Week ${week} actions`}><MoreHorizontal className="h-5 w-5" /></summary>
                  <div className="absolute right-0 z-10 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    <button type="button" onClick={() => aiUnavailable("Fill week with AI", week)} className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-slate-50">Fill week with AI</button>
                    <button type="button" onClick={() => toast({ title: "Week preview", description: "Open any day to preview its classroom flow." })} className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-slate-50">Preview week</button>
                  </div>
                </details>
              </div>
              <div className="hidden grid-cols-5 gap-3 xl:grid">
                {DAYS.map((day) => {
                  const lesson = findLessonForSlot(monthLessons, week, day);
                  const highlighted = Boolean(lesson && ((issueFilter === "resources" && lessonIssues(lesson).some((issue) => issue.includes("resource"))) || (issueFilter === "drafts" && lesson.scope === "school" && lesson.status === "draft")));
                  return <CurriculumDayCard key={day} day={day} lesson={lesson} highlighted={highlighted} onOpen={(item) => updateContext({ day: item.id })} onCreate={() => void createDay(week, day)} />;
                })}
              </div>
              <div className="space-y-2 xl:hidden">
                {DAYS.map((day) => {
                  const lesson = findLessonForSlot(monthLessons, week, day);
                  const dayName = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][day - 1];
                  return (
                    <button key={day} type="button" onClick={() => lesson ? updateContext({ day: lesson.id }) : void createDay(week, day)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">{dayName.slice(0, 3).toUpperCase()}</span>
                      <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-slate-500">{dayName}</span><span className="block truncate text-sm font-semibold text-slate-950">{lesson?.title || lesson?.daily_focus || "Not planned"}</span></span>
                      <span className="text-xs font-bold text-blue-700">{lesson ? lessonStatus(lesson).replace("_", " ") : "+ Create"}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {reviewOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="month-review-title">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">Safe publishing</p><h2 id="month-review-title" className="mt-1 text-xl font-semibold text-slate-950">Review {monthLabel(month)} changes</h2><p className="mt-2 text-sm text-slate-600">Open each draft to review its classroom flow before publishing to teachers.</p></div>
              <button type="button" aria-label="Close review" onClick={() => setReviewOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
              {monthLessons.filter((lesson) => lesson.scope === "school" && lesson.status === "draft").map((lesson) => (
                <button key={lesson.id} type="button" onClick={() => { setReviewOpen(false); updateContext({ day: lesson.id }); }} className="flex w-full items-center gap-3 py-4 text-left">
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-950">{lesson.title || lesson.daily_focus || "Untitled teaching day"}</span><span className="mt-1 block text-xs text-slate-500">Week {lesson.week}, day {lesson.day} · {lessonIssues(lesson).length ? lessonIssues(lesson)[0] : "Ready to review"}</span></span>
                  <span className="text-xs font-bold text-blue-700">Review</span>
                </button>
              ))}
              {!draftCount ? <p className="py-8 text-center text-sm text-slate-500">There are no school drafts waiting to publish.</p> : null}
            </div>
            <Button variant="outline" className="mt-6 w-full" onClick={() => setReviewOpen(false)}><ArrowLeft className="h-4 w-4" /> Return to curriculum</Button>
          </div>
        </div>
      ) : null}
    </SchoolAdminPage>
  );
}
