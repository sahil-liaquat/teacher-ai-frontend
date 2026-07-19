"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, ClipboardCheck, Clock3, MoreVertical, Presentation, Sparkles, StickyNote, ArrowRight, type LucideIcon } from "lucide-react";
import { DashboardBannerHeader } from "@/components/dashboard-banner-header";
import { useWorkspaceHome } from "@/hooks/use-workspace-home";
import { type WorkspaceHomeTopic, type WorkspaceResource, type WorkspaceResourceType } from "@/lib/api";
import { cn } from "@/lib/utils";
import { resourceLabels, relativeTime } from "@/lib/workspace/formatters";
import { getMissionProgress } from "@/lib/workspace/mission-control";
import { ensureWorkspaceGeneratorContext, topicWorkspaceRoute } from "@/lib/workspace/routes";
import { getSubjectThumbnail } from "@/lib/workspace/subject-images";
import { ContinuePreparingCard } from "./continue-preparing-card";
import { WorkspaceEmpty, WorkspaceError, WorkspaceMissionSkeleton } from "./workspace-states";

type ChapterFilter = "all" | "in_progress" | "not_started" | "completed";

const tools: Array<{ type: WorkspaceResourceType; icon: LucideIcon; href: string; tone: string }> = [
  { type: "lesson_plan", icon: BookOpen, href: "/dashboard/lesson-plans/new", tone: "bg-blue-50 text-blue-600" },
  { type: "worksheet", icon: ClipboardCheck, href: "/dashboard/worksheets/new", tone: "bg-emerald-50 text-emerald-600" },
  { type: "presentation", icon: Presentation, href: "/dashboard/presentation-generator", tone: "bg-orange-50 text-orange-600" },
  { type: "notes", icon: StickyNote, href: "/dashboard/notes-generator", tone: "bg-violet-50 text-violet-600" },
  { type: "activity", icon: Sparkles, href: "/dashboard/activity-generator", tone: "bg-amber-50 text-amber-600" },
];

function topicState(item: WorkspaceHomeTopic): Exclude<ChapterFilter, "all"> {
  if (item.topic.status === "completed") return "completed";
  return getMissionProgress(item.topic.resources).status === "not_started" ? "not_started" : "in_progress";
}

export function WorkspaceHomeView() {
  const home = useWorkspaceHome();
  const [filter, setFilter] = useState<ChapterFilter>("all");

  const recentTopics = useMemo(() => {
    return home.data?.recent_chapters?.slice(0, 5) || [];
  }, [home.data]);

  const visibleTopics = useMemo(() => {
    return recentTopics.filter((item) => {
      if (filter !== "all" && topicState(item) !== filter) return false;
      return true;
    });
  }, [filter, recentTopics]);

  const recentResources = useMemo(() => recentTopics.flatMap((item) => item.topic.resources
    .filter((resource) => resource.status === "ready")
    .map((resource) => ({ item, resource })))
    .sort((left, right) => new Date(right.resource.generated_at || right.item.last_opened_at).getTime() - new Date(left.resource.generated_at || left.item.last_opened_at).getTime())
    .slice(0, 4), [recentTopics]);

  if (home.isLoading) return <WorkspaceMissionSkeleton />;
  if (home.isError || !home.data) return <WorkspaceError onRetry={() => void home.refetch()} backHref="/dashboard" backLabel="Dashboard" />;

  if (!home.data.continue_preparing && !(home.data.recent_chapters?.length || 0)) {
    return <main className="workspace-reference-page mx-auto w-full max-w-[1240px] space-y-8 px-3 py-4 sm:px-6"><DashboardBannerHeader titleTop="My" titleHighlight="Workspace" imageSrc="/ai-tools/classroom-tools-header-illustration.png" /><WorkspaceEmpty title="Start planning your teaching" description="Choose a textbook chapter and TeachPad will organize every classroom resource in one place." /></main>;
  }

  return (
    <main className="workspace-reference-page mx-auto w-full max-w-[1240px] space-y-8 px-3 py-4 sm:px-6 lg:px-7">
      <DashboardBannerHeader titleTop="My" titleHighlight="Workspace" imageSrc="/ai-tools/classroom-tools-header-illustration.png" />

      {home.data.continue_preparing ? <ContinuePreparingCard item={home.data.continue_preparing} /> : <WorkspaceEmpty title="Choose what to prepare next" description="Open a recent class or start a chapter to choose your next teaching topic." />}

      <section id="recent-chapters" aria-labelledby="recent-chapters-title">
        <div className="flex items-center justify-between"><h2 id="recent-chapters-title" className="text-lg font-black text-[#111936]">Recent Chapters</h2><span className="text-xs font-semibold text-slate-400">Latest 5 generations</span></div>
        <div className="mt-4 flex gap-3 overflow-x-auto border-b border-slate-200 pb-0">{(["all", "in_progress", "not_started", "completed"] as ChapterFilter[]).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={cn("border-b-2 px-4 pb-3 text-[11px] font-bold transition", filter === value ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800")}>{value === "all" ? "All" : value === "in_progress" ? "In Progress" : value === "not_started" ? "Not Started" : "Completed"}</button>)}</div>
        {visibleTopics.length ? <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleTopics.map((item) => <RecentChapterCard key={`${item.workspace_id}:${item.topic.id}`} item={item} />)}</div> : <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center text-sm font-semibold text-slate-400">No chapters match this view.</div>}
      </section>

      <section aria-labelledby="recent-resources-title" className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_8px_28px_rgba(30,50,80,0.04)]">
        <div className="flex items-center justify-between"><h2 id="recent-resources-title" className="text-base font-black text-[#111936]">Recently Used Resources</h2><Link href="/dashboard/resources" className="text-xs font-bold text-blue-600">View all</Link></div>
        {recentResources.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{recentResources.map(({ item, resource }) => <RecentResourceCard key={`${item.workspace_id}:${resource.type}:${resource.generation_id}`} item={item} resource={resource} />)}</div> : <p className="mt-5 rounded-xl bg-slate-50 px-4 py-7 text-center text-xs font-semibold text-slate-400">Created resources will appear here.</p>}
      </section>
    </main>
  );
}

function RecentChapterCard({ item }: { item: WorkspaceHomeTopic }) {
  const progress = getMissionProgress(item.topic.resources);
  const state = topicState(item);
  const href = topicWorkspaceRoute(item.workspace_id, item.topic.id);
  const thumbnail = getSubjectThumbnail(item.subject);
  return <Link href={href} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(30,50,80,0.04)] transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_15px_34px_rgba(37,99,235,0.09)]"><div className="h-[140px] w-full overflow-hidden rounded-[15px] border border-slate-200/70 bg-slate-50"><img src={thumbnail.src640} srcSet={`${thumbnail.src320} 320w, ${thumbnail.src640} 640w`} sizes="(min-width: 1280px) 360px, (min-width: 768px) 50vw, calc(100vw - 48px)" width={640} height={360} loading="lazy" decoding="async" alt={thumbnail.alt} className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.02]" /></div><span className={cn("mt-4 inline-flex rounded-full px-2.5 py-1 text-[9px] font-black", state === "completed" ? "bg-emerald-50 text-emerald-700" : state === "not_started" ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-700")}>{state === "completed" ? "Completed" : state === "not_started" ? "Not Started" : "In Progress"}</span><h3 className="mt-3 truncate text-base font-black text-[#151d3a]">{item.chapter_title}</h3><p className="mt-1 text-[11px] font-semibold text-slate-500">{item.class_name} <span className="px-1.5 text-slate-300">•</span> {item.subject}</p><p className="mt-5 text-[10px] font-semibold text-slate-500">{progress.createdCount} of 5 resources ready</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${progress.percentage}%` }} /></div><div className="mt-5 flex items-center justify-between text-[10px] font-semibold text-slate-500"><span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />Last generated {relativeTime(item.last_generated_at || item.last_opened_at)}</span><span className="grid h-8 w-8 place-items-center rounded-xl border border-indigo-50 bg-white text-blue-600 transition group-hover:border-blue-200 group-hover:bg-blue-600 group-hover:text-white"><ArrowRight className="h-3.5 w-3.5" /></span></div></Link>;
}

function RecentResourceCard({ item, resource }: { item: WorkspaceHomeTopic; resource: WorkspaceResource }) {
  const tool = tools.find((entry) => entry.type === resource.type) || tools[0];
  const Icon = tool.icon;
  const href = ensureWorkspaceGeneratorContext(resource.href, item.workspace_id, item.topic.id);
  return <Link href={href} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-blue-200 hover:bg-blue-50/30"><span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tool.tone)}><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-black text-[#242c49]">{item.chapter_title}</span><span className="mt-0.5 block truncate text-[10px] font-semibold text-slate-600">{resourceLabels[resource.type]}</span><span className="mt-1.5 block text-[9px] font-medium text-slate-400">{relativeTime(resource.generated_at || item.last_opened_at)}</span></span><MoreVertical className="h-4 w-4 shrink-0 text-slate-400" /></Link>;
}
