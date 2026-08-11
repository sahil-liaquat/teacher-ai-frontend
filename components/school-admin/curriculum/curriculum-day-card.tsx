import { ArrowRight, Plus } from "lucide-react";
import type { PrimaryCurriculumLesson } from "@/lib/api";
import { lessonIssues, lessonStatus } from "@/lib/school-admin-curriculum";
import { StatusBadge } from "@/components/school-admin/shared/status-badge";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function CurriculumDayCard({
  day,
  lesson,
  highlighted,
  onOpen,
  onCreate,
}: {
  day: number;
  lesson?: PrimaryCurriculumLesson;
  highlighted?: boolean;
  onOpen: (lesson: PrimaryCurriculumLesson) => void;
  onCreate: () => void;
}) {
  if (!lesson) {
    return (
      <button
        type="button"
        onClick={onCreate}
        className="group min-h-40 rounded-2xl border border-dashed border-slate-300 bg-white/45 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40 focus-visible:ring-2 focus-visible:ring-blue-600"
        aria-label={`Create curriculum for ${DAY_NAMES[day - 1]}`}
      >
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{DAY_NAMES[day - 1]}</span>
        <span className="mt-7 flex items-center gap-2 text-sm font-semibold text-slate-600 group-hover:text-blue-700"><Plus className="h-4 w-4" /> Create day</span>
      </button>
    );
  }

  const issues = lessonIssues(lesson);
  const status = lessonStatus(lesson);
  return (
    <button
      type="button"
      onClick={() => onOpen(lesson)}
      className={cn(
        "group flex min-h-40 flex-col rounded-2xl border bg-white p-4 text-left shadow-[0_8px_26px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_12px_34px_rgba(15,23,42,0.08)] focus-visible:ring-2 focus-visible:ring-blue-600",
        highlighted ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200",
      )}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{DAY_NAMES[day - 1]}</span>
        <span className="text-[11px] font-medium text-slate-400">{lesson.scope === "platform" ? "TeachPad curriculum" : "Your school"}</span>
      </span>
      <span className="mt-4 line-clamp-2 text-sm font-semibold leading-5 text-slate-950">{lesson.title || lesson.daily_focus || "Untitled teaching day"}</span>
      <span className="mt-2 text-xs text-slate-500">{lesson.steps?.length ?? 0} blocks{status !== "published" ? ` · ${issues.length ? `${issues.length} to fix` : "ready to review"}` : ""}</span>
      <span className="mt-auto flex w-full items-end justify-between gap-2 pt-4">
        <StatusBadge status={status} compact />
        <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-700" />
      </span>
      {issues[0] ? <span className="mt-2 line-clamp-1 text-[11px] font-medium text-rose-600">{issues[0]}</span> : null}
    </button>
  );
}
