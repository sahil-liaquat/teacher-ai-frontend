"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ClipboardCheck,
  Clock3,
  Download,
  Grid2X2,
  List,
  Loader2,
  Presentation,
  Sparkles,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import { ResourceCard } from "@/components/workspace/resource-card";
import { WorkspaceError, WorkspaceSkeleton } from "@/components/workspace/workspace-states";
import { useTopicWorkspace } from "@/hooks/use-topic-workspace";
import type { TeachingWorkspace, WorkspaceResource, WorkspaceResourceType, WorkspaceTopic } from "@/lib/api";
import { cn } from "@/lib/utils";
import { resourceLabels, relativeTime, teachingDate } from "@/lib/workspace/formatters";
import { missionResourceOrder } from "@/lib/workspace/mission-control";
import { ensureWorkspaceGeneratorContext, workspaceHomeRoute } from "@/lib/workspace/routes";
import { getSubjectThumbnail } from "@/lib/workspace/subject-images";

const resourceIcons: Record<WorkspaceResourceType, { icon: LucideIcon; tone: string }> = {
  lesson_plan: { icon: BookOpen, tone: "bg-blue-50 text-blue-600" },
  worksheet: { icon: ClipboardCheck, tone: "bg-emerald-50 text-emerald-600" },
  presentation: { icon: Presentation, tone: "bg-violet-50 text-violet-600" },
  notes: { icon: StickyNote, tone: "bg-purple-50 text-purple-600" },
  activity: { icon: Sparkles, tone: "bg-amber-50 text-amber-600" },
};

const generatorRoutes: Record<WorkspaceResourceType, string> = {
  lesson_plan: "/dashboard/lesson-plans/new",
  worksheet: "/dashboard/worksheets/new",
  presentation: "/dashboard/presentation-generator",
  notes: "/dashboard/notes-generator",
  activity: "/dashboard/activity-generator",
};

function allResources(workspace: TeachingWorkspace, topic: WorkspaceTopic): WorkspaceResource[] {
  const query = new URLSearchParams({ board: workspace.board_code, class: workspace.class_name, subject: workspace.subject, chapter: workspace.chapter_title, topic: topic.title });
  return missionResourceOrder.map((type) => topic.resources.find((resource) => resource.type === type) || {
    type,
    status: "missing",
    generation_id: null,
    href: `${generatorRoutes[type]}?${query.toString()}`,
    generate_href: `${generatorRoutes[type]}?${query.toString()}`,
    generated_at: null,
    version_count: 0,
  });
}

export default function TopicWorkspacePage() {
  const params = useParams<{ workspaceId: string; topicId: string }>();
  const state = useTopicWorkspace(params.workspaceId, params.topicId);
  const [resourceView, setResourceView] = useState<"cards" | "timeline">("cards");

  if (state.query.isLoading) return <WorkspaceSkeleton rows={5} />;
  if (state.query.isError || !state.workspace) return <WorkspaceError title="This topic workspace could not be loaded" onRetry={() => void state.query.refetch()} />;
  if (!state.topic) return <WorkspaceError title="This topic is no longer in the workspace" onRetry={() => void state.query.refetch()} />;

  const { workspace, topic } = state;
  const resources = allResources(workspace, topic);
  const readyResources = resources.filter((resource) => resource.status === "ready");

  return (
    <main className="workspace-reference-page mx-auto w-full max-w-[1260px] space-y-4 px-3 pb-24 pt-2 sm:px-6 sm:pb-7 sm:pt-3">
      <Link
        href={workspaceHomeRoute()}
        className="inline-flex h-8 w-fit items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-black text-[#17203c] shadow-sm transition hover:border-blue-200 hover:text-blue-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Workspace
      </Link>

      <section className="grid overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_12px_36px_rgba(30,50,80,0.06)] md:grid-cols-2">
        <div className="h-[220px] overflow-hidden bg-slate-50 md:h-auto">
          <img
            src={getSubjectThumbnail(workspace.subject).src640}
            srcSet={`${getSubjectThumbnail(workspace.subject).src320} 320w, ${getSubjectThumbnail(workspace.subject).src640} 640w`}
            sizes="(min-width: 768px) 50vw, 100vw"
            alt={getSubjectThumbnail(workspace.subject).alt}
            className="h-full w-full object-cover object-center"
          />
        </div>
        <div className="flex flex-col justify-center px-6 py-6 sm:px-8 sm:py-8">
          <h1 className="text-3xl font-black tracking-[-0.045em] text-[#101936] sm:text-[36px]">{workspace.chapter_title}</h1>
          <p className="mt-3 text-sm font-bold text-slate-600">Chapter {workspace.chapter_number} <span className="px-2 text-slate-300">•</span> {workspace.class_name} <span className="px-2 text-slate-300">•</span> {workspace.subject} <span className="px-2 text-slate-300">•</span> {workspace.board_code.toUpperCase()}</p>
          <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">✦ Curiosity</span><span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">✦ Competency based</span><span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">✦ NEP Aligned</span></div>
          <div className="mt-5 flex flex-wrap gap-4 text-[11px] font-semibold text-slate-500"><span className="flex items-center gap-2"><Clock3 className="h-4 w-4" />Last opened {relativeTime(workspace.last_opened_at)}</span><span className="text-slate-300">|</span><span>⚑ Target: {topic.scheduled_at ? teachingDate(topic.scheduled_at) : "This week"}</span></div>
        </div>
      </section>

      {workspace.is_archived ? <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900"><span>This workspace is archived. Everything remains available.</span><button type="button" onClick={() => state.workspaceMutation.mutate({ is_archived: false })} className="underline">Restore workspace</button></div> : null}

      <section id="chapter-resources" aria-labelledby="resources-title" className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_10px_32px_rgba(30,50,80,0.04)] sm:p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap items-center gap-3"><h2 id="resources-title" className="text-lg font-black text-[#111936]">Chapter Resources</h2><span className="text-[10px] font-semibold text-slate-500">ⓘ Complete all resources for a ready-to-teach chapter</span></div><div className="flex w-fit rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => setResourceView("cards")} className={cn("inline-flex h-8 items-center gap-2 rounded-lg px-3 text-[10px] font-black", resourceView === "cards" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500")}><Grid2X2 className="h-3.5 w-3.5" />Cards</button><button type="button" onClick={() => setResourceView("timeline")} className={cn("inline-flex h-8 items-center gap-2 rounded-lg px-3 text-[10px] font-black", resourceView === "timeline" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500")}><List className="h-3.5 w-3.5" />Timeline</button></div></div>
        {resourceView === "cards" ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{resources.map((resource) => <ResourceCard key={resource.type} resource={resource} workspaceId={workspace.id} topicId={topic.id} />)}</div> : <div className="space-y-2">{resources.map((resource, index) => <CompactResourceRow key={resource.type} resource={resource} index={index} workspace={workspace} topic={topic} />)}</div>}
      </section>

      <section aria-labelledby="timeline-title"><h2 id="timeline-title" className="text-lg font-black text-[#111936]">Chapter Preparation Timeline</h2><div className="mt-5 overflow-x-auto pb-2"><ol className="flex min-w-[760px]">{resources.map((resource, index) => <TimelineStep key={resource.type} resource={resource} index={index} total={resources.length} />)}</ol></div></section>

      <section aria-labelledby="recent-generations-title"><div className="flex items-center justify-between"><h2 id="recent-generations-title" className="text-sm font-black text-[#111936]">Recent Generations for this Chapter</h2><Link href="/dashboard/recent-generations" className="text-[11px] font-bold text-blue-600">View all →</Link></div>{readyResources.length ? <div className="mt-3 grid gap-3 md:grid-cols-3">{readyResources.slice(0, 3).map((resource) => <RecentGeneration key={resource.type} workspace={workspace} topic={topic} resource={resource} />)}</div> : <p className="mt-3 rounded-xl border border-dashed border-slate-200 px-4 py-7 text-center text-xs font-semibold text-slate-400">Generated chapter resources will appear here.</p>}</section>

      <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-5 py-4"><span className="mr-3 text-xs font-black text-[#111936]">More Actions</span><button type="button" onClick={() => window.print()} className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[10px] font-black text-slate-700"><Download className="h-3.5 w-3.5" />Export All</button><Link href="/dashboard/textbooks" className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[10px] font-black text-slate-700"><span className="text-base text-blue-600">+</span>Create New Chapter</Link></section>

    </main>
  );
}

function CompactResourceRow({ resource, index, workspace, topic }: { resource: WorkspaceResource; index: number; workspace: TeachingWorkspace; topic: WorkspaceTopic }) {
  const visual = resourceIcons[resource.type]; const Icon = visual.icon; const href = ensureWorkspaceGeneratorContext(resource.status === "ready" ? resource.href : resource.generate_href || resource.href, workspace.id, topic.id);
  return <Link href={href} className="flex items-center gap-4 rounded-xl border border-slate-200 px-4 py-3 hover:border-blue-200 hover:bg-blue-50/30"><span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[10px] font-black text-slate-500">{index + 1}</span><span className={cn("grid h-9 w-9 place-items-center rounded-xl", visual.tone)}><Icon className="h-4 w-4" /></span><span className="flex-1 text-xs font-black text-slate-800">{resourceLabels[resource.type]}</span><span className={cn("text-[10px] font-bold", resource.status === "ready" ? "text-emerald-600" : resource.status === "generating" ? "text-blue-600" : "text-slate-400")}>{resource.status === "ready" ? "Created" : resource.status === "generating" ? "Generating" : "Pending"}</span><ArrowRight className="h-4 w-4 text-slate-400" /></Link>;
}

function TimelineStep({ resource, index, total }: { resource: WorkspaceResource; index: number; total: number }) {
  const visual = resourceIcons[resource.type]; const Icon = visual.icon; const ready = resource.status === "ready"; const generating = resource.status === "generating";
  return <li className="relative flex flex-1 flex-col items-center text-center">{index < total - 1 ? <span className={cn("absolute left-1/2 right-[-50%] top-4 h-0.5", ready ? "bg-emerald-400" : generating ? "bg-blue-500" : "bg-slate-300")} /> : null}<span className={cn("relative z-10 grid h-9 w-9 place-items-center rounded-full border-2 bg-white shadow-sm", ready ? "border-emerald-300 bg-emerald-600 text-white" : generating ? "border-blue-300 text-blue-600" : "border-slate-200 text-slate-500")}>{ready ? <Check className="h-4 w-4" /> : generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}</span><p className={cn("mt-3 text-[10px] font-black", generating ? "text-blue-600" : "text-slate-800")}>{resourceLabels[resource.type]}</p><p className="mt-1 text-[9px] font-semibold text-slate-500">{ready ? resource.generated_at ? relativeTime(resource.generated_at) : "Created" : generating ? "Generating…" : "Pending"}</p></li>;
}

function RecentGeneration({ workspace, topic, resource }: { workspace: TeachingWorkspace; topic: WorkspaceTopic; resource: WorkspaceResource }) {
  const visual = resourceIcons[resource.type]; const Icon = visual.icon; const href = ensureWorkspaceGeneratorContext(resource.href, workspace.id, topic.id);
  return <Link href={href} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-blue-200"><span className={cn("grid h-10 w-10 place-items-center rounded-xl", visual.tone)}><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-black text-slate-800">{workspace.chapter_title}</span><span className="mt-0.5 block text-[10px] font-bold text-slate-600">{resourceLabels[resource.type]}</span><span className="mt-1 block text-[9px] text-slate-400">{resource.generated_at ? relativeTime(resource.generated_at) : "Created"}</span></span><ArrowRight className="h-4 w-4 text-slate-400" /></Link>;
}
