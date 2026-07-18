import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  FileText,
  Globe2,
  GraduationCap,
  MessageSquareText,
  MonitorPlay,
  Sparkles,
  StickyNote,
  TrendingUp,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { WorkspaceHomeTopic, WorkspaceResourceType } from "@/lib/api";
import { cn } from "@/lib/utils";
import { resourceLabels, relativeTime } from "@/lib/workspace/formatters";
import { getMissionProgress, missionResourceOrder } from "@/lib/workspace/mission-control";
import { topicWorkspaceRoute } from "@/lib/workspace/routes";

const resourceIcons: Record<WorkspaceResourceType, { icon: LucideIcon; shell: string; iconColor: string }> = {
  lesson_plan: { icon: FileText, shell: "bg-emerald-50", iconColor: "text-emerald-600" },
  worksheet: { icon: MessageSquareText, shell: "bg-orange-50", iconColor: "text-orange-500" },
  presentation: { icon: MonitorPlay, shell: "bg-emerald-50", iconColor: "text-emerald-600" },
  notes: { icon: StickyNote, shell: "bg-violet-50", iconColor: "text-violet-500" },
  activity: { icon: UsersRound, shell: "bg-blue-50", iconColor: "text-blue-600" },
};

export function ContinuePreparingCard({ item }: { item: WorkspaceHomeTopic }) {
  const progress = getMissionProgress(item.topic.resources);
  const workspaceHref = topicWorkspaceRoute(item.workspace_id, item.topic.id);
  const statusLabel = progress.status === "ready" ? "Ready" : progress.status === "not_started" ? "Not Started" : "In Progress";
  const resourceNoun = progress.createdCount === 1 ? "resource" : "resources";

  return (
    <section
      aria-labelledby="continue-preparing-title"
      className="overflow-hidden rounded-[24px] border border-[#e8edf5] bg-white px-4 pb-4 pt-4 shadow-[0_16px_42px_rgba(54,83,150,0.10)] sm:px-5 sm:pb-5 sm:pt-5"
    >
      <div className="flex items-center justify-between gap-4 px-1 sm:px-0">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700 shadow-[inset_0_0_0_4px_rgba(255,255,255,0.45)] sm:h-[52px] sm:w-[52px]">
            <BookOpen className="h-6 w-6" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <h2 id="continue-preparing-title" className="text-lg font-black tracking-[-0.035em] text-[#0b1430] sm:text-xl">
              Continue Preparing
            </h2>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500 sm:text-xs">Pick up where you left off and finish strong.</p>
          </div>
        </div>
        <Link
          href="#recent-chapters"
          className="hidden h-10 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-emerald-900 shadow-[0_5px_14px_rgba(30,52,95,0.07)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 sm:inline-flex"
        >
          View all <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
        </Link>
      </div>

      <div className="mt-5 grid items-stretch xl:grid-cols-[minmax(0,1fr)_18%]">
        <div className="relative z-10 grid overflow-hidden rounded-[20px] border border-slate-200/80 bg-white shadow-[0_10px_24px_rgba(22,42,79,0.08)] md:grid-cols-[1.08fr_0.92fr] xl:h-[clamp(390px,27.8vw,420px)] xl:grid-cols-[40%_27%_33%]">
          <div className="relative isolate flex min-h-[380px] flex-col overflow-hidden p-6 xl:min-h-0">
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[38%] bg-[radial-gradient(circle_at_78%_100%,rgba(209,250,229,0.95),transparent_56%),linear-gradient(to_top,rgba(240,253,250,0.9),transparent)]" />
            <span
              className={cn(
                "inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black",
                progress.status === "ready"
                  ? "bg-emerald-50 text-emerald-800"
                  : progress.status === "not_started"
                    ? "bg-slate-100 text-slate-600"
                    : "bg-emerald-50 text-emerald-800",
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", progress.status === "not_started" ? "bg-slate-400" : "bg-emerald-500")} />
              {statusLabel}
            </span>

            <h3 className="mt-5 text-[24px] font-black leading-[1.12] tracking-[-0.04em] text-[#09132f] sm:text-[26px]">{item.chapter_title}</h3>

            <div className="mt-5 flex flex-nowrap items-center gap-x-2 text-[11px] font-medium text-slate-500">
              <span className="inline-flex shrink-0 items-center gap-1.5"><GraduationCap className="h-[18px] w-[18px]" />{item.class_name}</span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex min-w-0 items-center gap-1.5"><Globe2 className="h-[18px] w-[18px] shrink-0" /><span className="truncate">{item.subject}</span></span>
              <span className="text-slate-300">•</span>
              <span className="shrink-0">{item.board_code.toUpperCase()}</span>
            </div>

            <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs font-black text-emerald-800">
              <BookOpen className="h-[18px] w-[18px]" strokeWidth={2} /> Chapter {item.chapter_number}
            </span>

            <p className="mt-5 flex items-center gap-2 text-[11px] font-medium text-slate-500">
              <Clock3 className="h-[18px] w-[18px] shrink-0" />
              <span>Last opened <strong className="font-black text-slate-600">{relativeTime(item.last_opened_at)}</strong></span>
            </p>

            <Link
              href={workspaceHref}
              className="group mt-auto inline-flex h-[50px] w-full max-w-[285px] items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 text-sm font-black text-white shadow-[0_11px_24px_rgba(16,185,129,0.25)] transition hover:-translate-y-0.5 hover:from-emerald-700 hover:to-emerald-600"
            >
              Continue Preparing
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/55 text-emerald-800 transition group-hover:translate-x-0.5">
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </span>
            </Link>
          </div>

          <div className="grid min-h-[330px] place-items-center border-t border-slate-200/80 px-4 py-6 md:border-l md:border-t-0 xl:min-h-0">
            <div className="flex h-full w-full flex-col items-center justify-center">
              <p className="mb-6 text-center text-xs font-black text-[#101936]">Preparation Progress</p>
              <div
                role="progressbar"
                aria-label="Preparation progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress.percentage}
                className="mx-auto grid aspect-square w-full max-w-[168px] place-items-center rounded-full p-[clamp(15px,1.4vw,20px)]"
                style={{ background: `conic-gradient(#27b66d 0 ${progress.percentage * 0.72}%, #2c78e8 ${progress.percentage * 0.72}% ${progress.percentage}%, #edf0f6 ${progress.percentage}% 100%)` }}
              >
                <div className="grid h-full w-full place-items-center rounded-full bg-white text-center shadow-[inset_0_0_0_1px_rgba(230,234,242,0.8)]">
                  <div>
                    <p className="text-[28px] font-black tracking-[-0.04em] text-[#0b1430]">{progress.createdCount}/5</p>
                    <p className="mt-1 text-[10px] font-bold leading-4 text-slate-500">resources<br />ready</p>
                  </div>
                </div>
              </div>
              <div className="mt-auto hidden w-full items-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-slate-50 px-3 py-3 text-slate-500 xl:flex">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-100/80 text-emerald-700"><TrendingUp className="h-5 w-5" /></span>
                <p className="text-[10px] font-medium leading-[14px]"><strong className="block font-black text-slate-600">Keep going!</strong>You&apos;re making great progress.</p>
              </div>
            </div>
          </div>

          <div className="flex min-h-[360px] flex-col border-t border-slate-200/80 px-5 md:col-span-2 xl:col-span-1 xl:min-h-0 xl:border-l xl:border-t-0">
            {missionResourceOrder.map((type, index) => {
              const resource = item.topic.resources.find((entry) => entry.type === type);
              const created = resource?.status === "ready";
              const generating = resource?.status === "generating";
              const visual = resourceIcons[type];
              const Icon = visual.icon;

              return (
                <div key={type} className={cn("flex min-h-[68px] flex-1 items-center gap-3", index < missionResourceOrder.length - 1 && "border-b border-slate-200/80")}>
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", visual.shell, visual.iconColor)}>
                    <Icon className="h-5 w-5" strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black leading-4 text-[#0d1631]">{resourceLabels[type]}</p>
                    <p className={cn("mt-0.5 text-[10px] font-bold", created ? "text-emerald-600" : generating ? "text-blue-600" : "text-orange-600")}>
                      {created ? "Created" : generating ? "Generating" : "Not created"}
                    </p>
                  </div>
                  {created ? (
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check className="h-4 w-4" strokeWidth={2.7} /></span>
                  ) : generating ? (
                    <span className="h-6 w-6 shrink-0 animate-pulse rounded-full border-2 border-blue-300 bg-blue-50" />
                  ) : (
                    <span className="h-6 w-6 shrink-0 rounded-full border-2 border-dashed border-slate-300" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div aria-hidden="true" className="relative hidden min-h-[390px] items-end justify-center xl:flex">
          <img
            src="/assets/workspace/continue-preparing-illustration.png"
            alt=""
            className="pointer-events-none absolute -bottom-[2%] -left-[2%] h-[106%] w-[119%] max-w-none object-contain object-bottom"
          />
        </div>
      </div>

      <div className="mt-5 flex min-h-[58px] items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-slate-50 to-emerald-50/60 px-4 py-3 sm:px-5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_6px_14px_rgba(16,185,129,0.20)]"><Sparkles className="h-4 w-4" fill="currentColor" /></span>
        <strong className="shrink-0 text-xs font-black text-emerald-900 sm:text-sm">Tip for you</strong>
        <p className="hidden text-xs font-medium text-slate-500 sm:block">
          {progress.createdCount === 5
            ? "Your full preparation set is ready for class."
            : `You've created ${progress.createdCount} ${resourceNoun}! Try creating the next one to stay consistent.`}
        </p>
      </div>
    </section>
  );
}
