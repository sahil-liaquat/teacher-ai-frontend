"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, BookOpen, FileClock, FileText, Plus } from "lucide-react";
import { backendApi, type PrimaryAcademicYear, type PrimaryAIProposalRequest, type PrimaryCurriculumLesson, type PrimaryLevel } from "@/lib/api";
import {
  curriculumHref,
  lessonIssues,
  lessonsForMonth,
  lessonStatus,
  levelLabel,
  monthLabel,
  resourceCount,
  SCHOOL_LEVELS,
  SCHOOL_MONTHS,
} from "@/lib/school-admin-curriculum";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AIAction, PageError, PageHeading, SchoolAdminPage, SectionHeading } from "@/components/school-admin/shared/page-primitives";
import { StatusBadge } from "@/components/school-admin/shared/status-badge";
import { AIProposalDialog } from "@/components/school-admin/ai/ai-proposal-dialog";

const DEFAULT_MONTH = new Date().getMonth() + 1;

export function SchoolAdminOverview() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [yearId, setYearId] = useState("");
  const [level, setLevel] = useState("nursery");
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [aiRequest, setAIRequest] = useState<PrimaryAIProposalRequest | null>(null);
  const [aiTitle, setAITitle] = useState("AI curriculum proposal");

  const yearsQuery = useQuery<PrimaryAcademicYear[]>({
    queryKey: ["school-admin", "academic-years"],
    queryFn: () => backendApi.schoolAdminAcademicYears(),
  });

  useEffect(() => {
    if (!yearId && yearsQuery.data?.length) {
      setYearId(yearsQuery.data.find((year) => year.is_active)?.id ?? yearsQuery.data[0].id);
    }
  }, [yearId, yearsQuery.data]);

  const lessonsQuery = useQuery<PrimaryCurriculumLesson[]>({
    queryKey: ["school-admin", "lessons", yearId, level],
    queryFn: () => backendApi.schoolAdminCurriculum({ academic_year_id: yearId, level }),
    enabled: Boolean(yearId),
  });

  const year = yearsQuery.data?.find((item) => item.id === yearId);
  const monthLessons = useMemo(() => lessonsForMonth(lessonsQuery.data ?? [], month), [lessonsQuery.data, month]);
  const published = monthLessons.filter((lesson) => lesson.status === "published").length;
  const drafts = monthLessons.filter((lesson) => lesson.scope === "school" && lesson.status === "draft");
  const attention = monthLessons.filter((lesson) => lessonIssues(lesson).length > 0);
  const missingResourceLessons = monthLessons.filter((lesson) => lessonIssues(lesson).some((issue) => issue.includes("resource")));
  const readySlots = monthLessons.filter((lesson) => ["ready", "published"].includes(lessonStatus(lesson))).length;
  const readiness = Math.round((readySlots / 25) * 100);
  const curriculumUrl = curriculumHref({ year: yearId, level, month });

  function openAI(operation: PrimaryAIProposalRequest["operation"], title: string) {
    if (!yearId) return;
    setAITitle(title);
    setAIRequest({ operation, academic_year_id: yearId, level: level as PrimaryLevel, month });
  }

  if (yearsQuery.isLoading) {
    return <OverviewSkeleton />;
  }

  if (yearsQuery.isError) {
    return (
      <SchoolAdminPage>
        <PageHeading title="Primary Curriculum" description="We could not load your school curriculum." />
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          Refresh the page to try again. If this continues, check that your school has access to curriculum administration.
        </div>
      </SchoolAdminPage>
    );
  }

  if (!yearsQuery.data?.length) {
    return (
      <SchoolAdminPage>
        <PageHeading title="Primary Curriculum" description="Start by setting up the academic year your school will teach." />
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-blue-600" />
          <h2 className="mt-4 text-xl font-semibold text-slate-950">No academic year is set up yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Create your school year before reviewing or customizing TeachPad curriculum.</p>
          <Link href="/school-admin/academic-years" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white">Set up academic year <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </SchoolAdminPage>
    );
  }

  if (lessonsQuery.isError) {
    return (
      <SchoolAdminPage>
        <PageHeading title="Primary Curriculum" description={`${year?.name ?? "Academic year"} · ${levelLabel(level)} · ${monthLabel(month)}`} />
        <PageError description="The curriculum summary could not be loaded." onRetry={() => void lessonsQuery.refetch()} />
      </SchoolAdminPage>
    );
  }

  return (
    <SchoolAdminPage>
      <PageHeading
        eyebrow="School programme"
        title="Primary Curriculum"
        description={`${year?.name ?? "Academic year"} · ${levelLabel(level)} · ${monthLabel(month)}`}
        actions={(
          <div className="flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="overview-year">Academic year</label>
            <select id="overview-year" value={yearId} onChange={(event) => setYearId(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">
              {yearsQuery.data.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <label className="sr-only" htmlFor="overview-level">Level</label>
            <select id="overview-level" value={level} onChange={(event) => setLevel(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">
              {SCHOOL_LEVELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <label className="sr-only" htmlFor="overview-month">Month</label>
            <select id="overview-month" value={month} onChange={(event) => setMonth(Number(event.target.value))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">
              {SCHOOL_MONTHS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
        )}
      />

      <section aria-labelledby="ai-actions-heading">
        <SectionHeading title="Build and improve with AI" description="AI actions use the curriculum context selected above." />
        <h2 id="ai-actions-heading" className="sr-only">AI curriculum actions</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <AIAction title="Create curriculum with AI" description="Prepare a structured programme for this class and academic year." onClick={() => openAI("create_month", "Create curriculum with AI")} />
          <AIAction title="Fill this month with AI" description={`Complete unplanned teaching days in ${monthLabel(month)} while preserving existing work.`} onClick={() => openAI("fill_month", "Fill this month with AI")} muted />
          <AIAction title="Fix missing content" description="Find incomplete objectives, instructions, activities, and resources." onClick={() => openAI("fix_missing", "Fix missing curriculum content")} muted />
        </div>
      </section>

      <section className="rounded-3xl bg-slate-950 px-5 py-6 text-white sm:px-7" aria-labelledby="readiness-heading">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-blue-200">{monthLabel(month)} readiness</p>
            <div className="mt-2 flex items-baseline gap-3">
              <h2 id="readiness-heading" className="text-3xl font-semibold tracking-tight">{readiness}% ready</h2>
              <span className="text-sm text-slate-300">{readySlots} of 25 teaching days</span>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15" aria-label={`${readiness}% curriculum ready`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={readiness}>
              <div className="h-full rounded-full bg-blue-400" style={{ width: `${readiness}%` }} />
            </div>
            <p className="mt-3 text-sm text-slate-300">{attention.length ? `${attention.length} ${attention.length === 1 ? "day needs" : "days need"} attention` : "No incomplete days in this month."}</p>
          </div>
          <Link href={curriculumUrl} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-slate-950">Open curriculum <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      {lessonsQuery.isLoading ? <Skeleton className="h-64 w-full" /> : (
        <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr]">
          <section>
            <SectionHeading title="Needs attention" description="Open an item at the exact teaching day that needs work." />
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {attention.slice(0, 5).map((lesson) => (
                <Link key={lesson.id} href={curriculumHref({ year: yearId, level, month, day: lesson.id })} className="group flex items-start gap-3 py-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-950">{lesson.title || lesson.daily_focus || `Week ${lesson.week}, day ${lesson.day}`}</span>
                    <span className="mt-1 block text-xs text-slate-500">{lessonIssues(lesson)[0]} · Week {lesson.week}, {lesson.day ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][lesson.day - 1] : "Day"}</span>
                  </span>
                  <ArrowRight className="mt-1 h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700" />
                </Link>
              ))}
              {!attention.length ? <p className="py-8 text-sm text-slate-500">Nothing needs attention in {monthLabel(month)}.</p> : null}
            </div>
          </section>

          <section>
            <SectionHeading title="Recent curriculum" description="Continue with school drafts and recently published days." />
            <div className="space-y-3">
              {monthLessons.slice(0, 4).map((lesson) => (
                <div key={lesson.id} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><FileText className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-950">{lesson.title || lesson.daily_focus || "Untitled teaching day"}</p>
                    <p className="mt-0.5 text-xs text-slate-500">Week {lesson.week} · {lesson.steps?.length ?? 0} blocks · {resourceCount(lesson)} resources</p>
                  </div>
                  <StatusBadge status={lessonStatus(lesson)} compact />
                </div>
              ))}
              {!monthLessons.length ? <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">No teaching days planned for this month yet.</p> : null}
            </div>
          </section>
        </div>
      )}
      <AIProposalDialog
        open={Boolean(aiRequest)}
        onOpenChange={(open) => { if (!open) setAIRequest(null); }}
        request={aiRequest}
        title={aiTitle}
        onApplied={async () => {
          await queryClient.invalidateQueries({ queryKey: ["school-admin", "lessons", yearId, level] });
          toast({ title: "AI changes applied to school drafts", description: "Teachers will not see them until you publish." });
        }}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-3">
            <FileClock className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <h2 className="font-semibold text-slate-950">Drafts waiting</h2>
              <p className="mt-1 text-sm text-slate-600">{drafts.length ? `${drafts.length} changed ${drafts.length === 1 ? "day is" : "days are"} waiting for review.` : "No school drafts are waiting."}</p>
              {drafts.length ? <Link href={`${curriculumUrl}&issue=drafts`} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700">Review changes <ArrowRight className="h-4 w-4" /></Link> : null}
            </div>
          </div>
        </section>
        {missingResourceLessons.length ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-rose-600" />
              <div className="flex-1">
                <h2 className="font-semibold text-slate-950">Missing resources</h2>
                <p className="mt-1 text-sm text-slate-600">{missingResourceLessons.length} curriculum {missingResourceLessons.length === 1 ? "day has" : "days have"} blocks that need resources.</p>
                <Link href={`${curriculumUrl}&issue=resources`} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700">Review missing resources <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-950">Quick actions</h2>
            <div className="mt-3 flex flex-wrap gap-3 text-sm font-bold text-blue-700">
              <Link href={curriculumUrl} className="inline-flex items-center gap-1"><Plus className="h-4 w-4" /> Add teaching day</Link>
              <Link href="/school-admin/themes" className="inline-flex items-center gap-1"><Plus className="h-4 w-4" /> Create theme</Link>
              <Link href="/school-admin/resources" className="inline-flex items-center gap-1"><Plus className="h-4 w-4" /> Add resource</Link>
            </div>
          </section>
        )}
      </div>
    </SchoolAdminPage>
  );
}

function OverviewSkeleton() {
  return (
    <SchoolAdminPage>
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-3 md:grid-cols-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
      <Skeleton className="h-48 w-full" />
      <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-56" /><Skeleton className="h-56" /></div>
    </SchoolAdminPage>
  );
}
