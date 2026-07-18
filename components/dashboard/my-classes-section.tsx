"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Clock3, MoreVertical } from "lucide-react";
import { useWorkspaceHome } from "@/hooks/use-workspace-home";
import { topicWorkspaceRoute, workspaceHomeRoute } from "@/lib/workspace/routes.ts";
import { relativeTime } from "@/lib/workspace/formatters";
import { getSubjectThumbnail } from "@/lib/workspace/subject-images";
import { getMissionProgress } from "@/lib/workspace/mission-control";
import { cn } from "@/lib/utils";

export function DashboardMyClasses() {
  const home = useWorkspaceHome();

  return (
    <section aria-labelledby="dashboard-my-classes-title" className="mx-auto w-full max-w-[1240px] px-4">
      <div className="rounded-[20px] border border-white/70 bg-white/80 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 id="dashboard-my-classes-title" className="text-base font-bold text-slate-900">My Classes</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">Continue preparing the classes in your Workspace.</p>
          </div>
          <Link href={workspaceHomeRoute()} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-blue-700 hover:shadow-md">
            View Workspace<ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {home.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-[340px] animate-pulse rounded-2xl border border-slate-100 bg-slate-50/70" />
            ))}
          </div>
        ) : home.isError || !home.data ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-6 text-center">
            <p className="text-sm font-semibold text-rose-700">Classes could not be loaded.</p>
            <button type="button" onClick={() => void home.refetch()} className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-bold text-rose-700 shadow-sm">Try again</button>
          </div>
        ) : home.data.classes.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {home.data.classes.slice(0, 3).map((item) => {
              const primarySubject = item.subjects[0] || "Education";
              const thumbnail = getSubjectThumbnail(primarySubject);
              const progress = item.current_topic ? getMissionProgress(item.current_topic.topic.resources) : null;
              const progressStatus = progress ? progress.status : "not_started";
              const href = item.current_topic ? topicWorkspaceRoute(item.current_topic.workspace_id, item.current_topic.topic.id) : workspaceHomeRoute();

              return (
                <Link key={item.class_id} href={href} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(30,50,80,0.04)] transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_15px_34px_rgba(37,99,235,0.09)]">
                  <div className="h-[140px] w-full overflow-hidden rounded-[15px] border border-slate-200/70 bg-slate-50">
                    <img src={thumbnail.src640} srcSet={`${thumbnail.src320} 320w, ${thumbnail.src640} 640w`} sizes="(min-width: 1280px) 360px, (min-width: 768px) 50vw, calc(100vw - 48px)" width={640} height={360} loading="lazy" decoding="async" alt={thumbnail.alt} className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.02]" />
                  </div>
                  <span className={cn("mt-4 inline-flex rounded-full px-2.5 py-1 text-[9px] font-black", progressStatus === "ready" ? "bg-emerald-50 text-emerald-700" : progressStatus === "not_started" ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-700")}>{progressStatus === "ready" ? "Completed" : progressStatus === "not_started" ? "Not Started" : "In Progress"}</span>
                  <h3 className="mt-3 truncate text-base font-black text-[#151d3a]">{item.class_name}</h3>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">{item.subjects.join(" · ") || "No subjects added"}</p>
                  <p className="mt-5 text-[10px] font-semibold text-slate-500">{progress ? progress.createdCount : 0} of 5 resources ready</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${progress ? progress.percentage : 0}%` }} />
                  </div>
                  <div className="mt-5 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />Last opened {relativeTime(item.last_activity_at)}</span>
                    <span className="grid h-8 w-8 place-items-center rounded-xl border border-indigo-50 bg-white text-blue-600 transition group-hover:border-blue-200 group-hover:bg-blue-600 group-hover:text-white"><ArrowRight className="h-3.5 w-3.5" /></span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/30 px-5 py-6 text-center sm:flex-row sm:text-left">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm"><BookOpen className="h-5 w-5" /></span>
              <div>
                <p className="text-sm font-bold text-slate-800">No classes in your Workspace yet</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Start with a textbook chapter to create your first class.</p>
              </div>
            </div>
            <Link href="/dashboard/textbooks" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700"><BookOpen className="h-4 w-4" />Choose a Chapter</Link>
          </div>
        )}
      </div>
    </section>
  );
}
