"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { backendApi } from "@/lib/api";
import { lessonIssues, SCHOOL_LEVELS } from "@/lib/school-admin-curriculum";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState, StatusPill } from "@/components/admin/admin-ui";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/errors";

export function MasterReview() {
  const [level, setLevel] = useState("nursery");
  const [busy, setBusy] = useState<string | null>(null);
  const client = useQueryClient();
  const { toast } = useToast();
  const years = useQuery({ queryKey: ["master", "years"], queryFn: backendApi.adminPrimaryAcademicYears });
  const yearId = years.data?.find((year) => year.is_active)?.id || years.data?.[0]?.id || "";
  const lessons = useQuery({ queryKey: ["master", "review", yearId, level], queryFn: () => backendApi.adminPrimaryLessons({ academic_year_id: yearId, level }), enabled: Boolean(yearId) });
  const rows = useMemo(() => (lessons.data ?? []).map((lesson) => ({ lesson, blockers: lessonIssues(lesson) })), [lessons.data]);
  const drafts = rows.filter((row) => row.lesson.status === "draft");
  async function publish(id: string) { setBusy(id); try { await backendApi.adminPublishPrimaryLesson(id); await client.invalidateQueries({ queryKey: ["master"] }); toast({ title: "Master teaching day published", description: "Schools can now adopt this version.", variant: "success" }); } catch (error) { toast({ title: "Could not publish", description: getErrorMessage(error, "Resolve the blockers and try again."), variant: "error" }); } finally { setBusy(null); } }
  if (years.isLoading || lessons.isLoading) return <LoadingState label="Calculating curriculum readiness" />;
  if (years.isError || lessons.isError) return <EmptyState title="Readiness could not be calculated" description="Refresh and try again." />;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"><div><h2 className="text-xl font-black text-slate-950">Review &amp; Publish</h2><p className="mt-1 text-sm text-slate-500">Publishing is explicit. Invalid drafts remain private to TeachPad.</p></div><select aria-label="Level" value={level} onChange={(event) => setLevel(event.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold">{SCHOOL_LEVELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
    <div className="grid gap-3 sm:grid-cols-3"><Summary label="Drafts" value={drafts.length} /><Summary label="Blocked" value={drafts.filter((row) => row.blockers.length).length} warning /><Summary label="Ready" value={drafts.filter((row) => !row.blockers.length).length} /></div>
    <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">{drafts.map(({ lesson, blockers }) => <article key={lesson.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><b className="truncate text-sm text-slate-950">{lesson.title || lesson.daily_focus || "Untitled teaching day"}</b><StatusPill status={blockers.length ? "warning" : "success"}>{blockers.length ? "Blocked" : "Ready"}</StatusPill></span><span className="mt-1 block text-xs text-slate-500">Month {lesson.month} · Week {lesson.week} · Day {lesson.day} · v{lesson.version}</span>{blockers.length ? <span className="mt-2 flex items-start gap-1.5 text-xs text-amber-700"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{blockers.join(" · ")}</span> : <span className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />All required teaching content is present.</span>}</span><Button disabled={Boolean(blockers.length) || busy === lesson.id} onClick={() => void publish(lesson.id)}>{busy === lesson.id ? "Publishing…" : "Publish"}</Button></article>)}{!drafts.length && <div className="p-8"><EmptyState title="No drafts waiting for review" description="Create or duplicate a teaching day in Design Curriculum." /></div>}</div>
  </div>;
}
function Summary({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) { return <div className={`rounded-2xl border p-4 ${warning ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value}</p></div>; }
