"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, BookOpen, Library, Palette, Sparkles } from "lucide-react";
import { backendApi, type PrimaryCurriculumLesson } from "@/lib/api";
import { lessonsForMonth, monthLabel, SCHOOL_LEVELS, SCHOOL_MONTHS } from "@/lib/school-admin-curriculum";
import { blockingIssues, curriculumSlots, monthMetrics } from "@/lib/curriculum-readiness";
import { EmptyState, LoadingState, MetricCard } from "@/components/admin/admin-ui";

const ROOT = "/admin/organizations/master-curriculum";

export function MasterOverview() {
  const [level, setLevel] = useState("nursery");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const years = useQuery({ queryKey: ["master", "years"], queryFn: backendApi.adminPrimaryAcademicYears });
  const yearId = years.data?.find((year) => year.is_active)?.id || years.data?.[0]?.id || "";
  const themes = useQuery({ queryKey: ["master", "themes", level], queryFn: () => backendApi.adminPrimaryThemes(level) });
  const lessons = useQuery({ queryKey: ["master", "lessons", yearId, level], queryFn: () => backendApi.adminPrimaryLessons({ academic_year_id: yearId, level }), enabled: Boolean(yearId) });
  const resources = useQuery({ queryKey: ["master", "resources", level], queryFn: () => backendApi.adminResources({ level, page_size: 100 }) });
  const visible = useMemo(() => lessonsForMonth(lessons.data ?? [], month), [lessons.data, month]);
  // ⚠ Slot-based, from the server's verdict. This counted lesson ROWS against a
  // frontend-only rule and divided by a hardcoded 25 with no clamp, so a month
  // where published days had been duplicated into drafts could report over 100%.
  const metrics = useMemo(() => monthMetrics(visible), [visible]);
  const slots = useMemo(() => curriculumSlots(visible), [visible]);
  const issues = slots.flatMap((slot) => blockingIssues(slot.current).map((issue) => ({ lesson: slot.current, issue })));
  const mapped = slots.reduce((count, slot) => count + (slot.current.steps ?? []).filter((step) => (step.resource_ids?.length ?? 0) > 0).length, 0);
  const blocks = slots.reduce((count, slot) => count + (slot.current.steps?.length ?? 0), 0);
  const readiness = metrics.completionPct;
  const loading = years.isLoading || themes.isLoading || lessons.isLoading || resources.isLoading;
  if (loading) return <LoadingState label="Building Master Curriculum overview" />;
  if (years.isError || themes.isError || lessons.isError || resources.isError) return <EmptyState title="Master Curriculum could not be loaded" description="Refresh and try again." />;
  return <div className="space-y-6">
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
      <select aria-label="Academic year" value={yearId} disabled className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold">{years.data?.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}</select>
      <select aria-label="Level" value={level} onChange={(event) => setLevel(event.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold">{SCHOOL_LEVELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
      <select aria-label="Month" value={month} onChange={(event) => setMonth(Number(event.target.value))} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold">{SCHOOL_MONTHS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
      <span className="sm:ml-auto text-sm font-semibold text-slate-500">{monthLabel(month)} readiness</span>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <MetricCard label="Themes" value={themes.data?.length ?? 0} icon={<Palette className="h-4 w-4" />} />
      <MetricCard label="Topics" value={(themes.data ?? []).reduce((sum, theme) => sum + theme.topics.length, 0)} icon={<Palette className="h-4 w-4" />} />
      <MetricCard label="Teaching days" value={`${metrics.created}/${metrics.slots}`} icon={<BookOpen className="h-4 w-4" />} />
      <MetricCard label="Resources" value={resources.data?.total ?? 0} icon={<Library className="h-4 w-4" />} />
      <MetricCard label="Mapped blocks" value={`${mapped}/${blocks}`} icon={<Library className="h-4 w-4" />} />
      <MetricCard label="Readiness" value={`${readiness}%`} icon={<Sparkles className="h-4 w-4" />} tone={readiness >= 80 ? "green" : "amber"} />
    </div>
    <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between"><div><h2 className="font-black text-slate-950">What needs completion?</h2><p className="mt-1 text-sm text-slate-500">Blockers before this curriculum is ready for schools.</p></div><Link href={`${ROOT}/review`} className="text-sm font-bold text-blue-600">Review all</Link></div>
        <div className="mt-4 space-y-2">{issues.slice(0, 8).map(({ lesson, issue }, index) => <Link key={`${lesson.id}-${issue.key}-${index}`} href={`${ROOT}/design?year=${yearId}&level=${level}&month=${month}&day=${lesson.id}`} className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3"><AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" /><span className="min-w-0 flex-1"><b className="block truncate text-sm text-slate-900">{lesson.title || "Untitled teaching day"}</b><span className="text-xs text-amber-800">{issue.detail ?? issue.label}</span></span><ArrowRight className="h-4 w-4" /></Link>)}{!issues.length && <p className="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">No readiness blockers in this month.</p>}</div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black text-slate-950">Quick actions</h2><div className="mt-4 grid gap-2"><Quick href={`${ROOT}/design?level=${level}&month=${month}&ai=create_month`} label="Create Curriculum with AI" /><Quick href={`${ROOT}/design?level=${level}&month=${month}&ai=fill_month`} label="Fill Month with AI" /><Quick href={`${ROOT}/review?level=${level}&month=${month}`} label="Fix Missing Content" /><Quick href={`${ROOT}/themes`} label="Create Theme" /><Quick href={`${ROOT}/resources`} label="Add Resource" /></div></section>
    </div>
    <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black text-slate-950">Drafts awaiting review</h2><div className="mt-4 grid gap-3 md:grid-cols-3">{slots.map((slot) => slot.draft).filter((draft): draft is PrimaryCurriculumLesson => Boolean(draft)).slice(0, 6).map((lesson: PrimaryCurriculumLesson) => <Link key={lesson.id} href={`${ROOT}/design?year=${yearId}&level=${level}&month=${lesson.month}&day=${lesson.id}`} className="rounded-xl border border-slate-200 p-3"><span className="text-xs font-bold uppercase text-slate-400">{lesson.status}</span><b className="mt-1 block truncate text-sm">{lesson.title || lesson.daily_focus || "Untitled teaching day"}</b></Link>)}</div></section>
  </div>;
}

function Quick({ href, label }: { href: string; label: string }) { return <Link href={href} className="inline-flex h-10 items-center justify-start gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"><Sparkles className="h-4 w-4 text-violet-600" />{label}</Link>; }
