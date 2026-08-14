"use client";

import { AlertTriangle, CheckCircle2, FileText, Plus, Radio } from "lucide-react";
import type { PrimaryCurriculumLesson } from "@/lib/api";
import {
  DAY_STATUS_LABELS,
  advisoryNotes,
  blockingIssues,
  type CurriculumSlot,
} from "@/lib/curriculum-readiness";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

/**
 * One cell of the month grid.
 *
 * ⚠ Takes a SLOT, not a lesson. A slot commonly holds two rows — the published
 * version teachers are being served and the draft the author is editing — and
 * the card has to show both facts: which day is live, and whether there are
 * unpublished changes. A lesson prop could only ever say one of them.
 *
 * Every state is distinguishable at a glance without reading the label, because
 * the label is the thing that gets skimmed past: empty is dashed, published is
 * green, needs-attention is amber with a count, ready is blue.
 */
export function CurriculumDayCard({
  day,
  slot,
  highlighted,
  onOpen,
  onCreate,
}: {
  day: number;
  slot?: CurriculumSlot;
  highlighted?: boolean;
  onOpen: (lesson: PrimaryCurriculumLesson) => void;
  onCreate: () => void;
}) {
  const dayName = DAY_NAMES[day - 1] ?? `Day ${day}`;

  if (!slot) {
    return (
      <button
        type="button"
        onClick={onCreate}
        className="flex min-h-[9.5rem] flex-col items-start rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-3 text-left transition hover:border-blue-400 hover:bg-blue-50/40"
      >
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{dayName}</span>
        <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700">
          <Plus className="h-4 w-4" /> Add Day
        </span>
      </button>
    );
  }

  const lesson = slot.current;
  const issues = blockingIssues(lesson);
  const notes = advisoryNotes(lesson);
  const attached = (lesson.steps ?? []).reduce(
    (total, step) => total + (step.resource_ids?.length ?? 0) + (step.required_resource_ids?.length ?? 0),
    0,
  );

  return (
    <button
      type="button"
      onClick={() => onOpen(lesson)}
      className={cn(
        "flex min-h-[9.5rem] flex-col items-start gap-1 rounded-2xl border bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md",
        highlighted ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200",
      )}
    >
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{dayName}</span>
      <span className="line-clamp-2 text-sm font-semibold text-slate-950">
        {lesson.title || lesson.daily_focus || "Untitled teaching day"}
      </span>
      {lesson.topic?.name ? (
        <span className="line-clamp-1 text-xs text-slate-500">{lesson.topic.name}</span>
      ) : null}

      <span className="mt-auto flex w-full flex-wrap items-center gap-x-2 gap-y-1 pt-2">
        <StatusChip status={slot.status} issueCount={issues.length} />
        {slot.hasUnpublishedEdits ? (
          // The distinction that matters most on this screen: teachers are being
          // served something, AND the author has changes not yet shipped.
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700">
            <Radio className="h-3 w-3" /> live + edits
          </span>
        ) : null}
        {attached ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
            <FileText className="h-3 w-3" /> {attached}
          </span>
        ) : null}
        {!issues.length && notes.length ? (
          <span className="text-[11px] font-medium text-slate-400">
            {notes.length} auto-matched
          </span>
        ) : null}
      </span>
    </button>
  );
}

function StatusChip({ status, issueCount }: { status: CurriculumSlot["status"]; issueCount: number }) {
  if (status === "needs_attention") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
        <AlertTriangle className="h-3 w-3" />
        {issueCount} {issueCount === 1 ? "issue" : "issues"}
      </span>
    );
  }
  if (status === "published") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
        <CheckCircle2 className="h-3 w-3" /> Published
      </span>
    );
  }
  if (status === "ready") {
    return (
      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-800">Ready</span>
    );
  }
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
      {DAY_STATUS_LABELS[status]}
    </span>
  );
}
