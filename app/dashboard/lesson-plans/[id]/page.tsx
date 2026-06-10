"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backendApi, normalizeLessonPlanForOutput } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { CompanionResourcesPanel } from "@/components/companion-resources-panel";
import { LessonPlanOutput } from "@/components/generation-output";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { downloadLessonPlanPdf, formatLessonPlanForClipboard, shareLessonPlan } from "@/lib/lesson-plan-export";

export default function LessonPlanDetailPage() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editedOutput, setEditedOutput] = useState<any>(null);
  const [autoSaveFailed, setAutoSaveFailed] = useState(false);
  const lesson = useQuery({ queryKey: ["lesson-plan", params.id], queryFn: () => backendApi.lessonPlan(params.id) });
  const output = editedOutput || (lesson.data ? normalizeLessonPlanForOutput(lesson.data) : null);

  useEffect(() => {
    if (!editedOutput) return;
    const timeout = window.setTimeout(() => {
      saveEditedOutput(editedOutput, { silent: true })
        .then(() => setAutoSaveFailed(false))
        .catch(() => setAutoSaveFailed(true));
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [editedOutput]);

  async function saveEditedOutput(currentOutput = output, options: { silent?: boolean } = {}) {
    if (!currentOutput) return;
    const saved = await backendApi.updateLessonPlan(params.id, { plan: currentOutput });
    queryClient.setQueryData(["lesson-plan", params.id], saved);
    if (!options.silent) {
      toast({ title: "Changes saved", description: "Your edits are saved in this lesson plan.", variant: "success" });
    }
  }

  async function copy(currentOutput = output) {
    await navigator.clipboard.writeText(formatLessonPlanForClipboard(currentOutput));
    toast({ title: "Copied" });
  }
  async function exportPdf(currentOutput = output) {
    try {
      await downloadLessonPlanPdf(currentOutput);
      toast({ title: "PDF downloaded", description: "Exported as a styled lesson plan PDF." });
    } catch (err) {
      toast({ title: "Download failed", description: getErrorMessage(err, "Try again"), variant: "error" });
    }
  }
  async function share(currentOutput = output) {
    try {
      const result = await shareLessonPlan(currentOutput);
      if (result === "copied") toast({ title: "Copied", description: "Sharing is not available, so the lesson plan was copied." });
      if (result === "shared") toast({ title: "Shared" });
    } catch (err) {
      toast({ title: "Share failed", description: getErrorMessage(err, "Try again"), variant: "error" });
    }
  }
  async function editsSaved(currentOutput = output) {
    try {
      await saveEditedOutput(currentOutput);
    } catch (err) {
      toast({ title: "Save failed", description: getErrorMessage(err, "Try again"), variant: "error" });
    }
  }

  if (lesson.isLoading) return <LessonPlanLoadingState />;
  if (lesson.error) return <Card><CardContent className="p-7"><h1 className="text-2xl font-black text-red-700">Could not open lesson plan</h1><p className="mt-2 text-sm text-[#6d6f78]">{getErrorMessage(lesson.error, "Couldn't open this lesson plan.")}</p></CardContent></Card>;

  return (
    <div className="print-shell mx-auto w-full max-w-[1480px] xl:h-[calc(100vh-40px)] xl:overflow-hidden">
      <div className="min-w-0 xl:h-full xl:overflow-y-auto xl:pr-[384px] 2xl:pr-[408px]">
        {autoSaveFailed ? (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            <span>Changes not saved — we'll keep retrying as you edit.</span>
            <button
              type="button"
              className="font-black underline"
              onClick={() =>
                void saveEditedOutput()
                  .then(() => setAutoSaveFailed(false))
                  .catch(() => setAutoSaveFailed(true))
              }
            >
              Retry now
            </button>
          </div>
        ) : null}
        <LessonPlanOutput
          output={output}
          streamKey={`lesson-plan-${params.id}`}
          streamSpeed="fast"
          onCopy={copy}
          onExport={exportPdf}
          onShare={share}
          onSave={editsSaved}
          onChange={setEditedOutput}
        />
      </div>
      <CompanionResourcesPanel
        className="mt-6 xl:fixed xl:right-[max(1.5rem,calc((100vw-1480px)/2+1.5rem))] xl:top-5 xl:mt-0 xl:w-[360px] 2xl:w-[380px]"
        topic={output?.metadata?.topic || lesson.data?.topic}
        classLabel={output?.metadata?.class || lesson.data?.class_name}
        subject={output?.metadata?.subject || lesson.data?.subject}
        board={output?.metadata?.board}
        chapter={output?.metadata?.chapter || lesson.data?.chapter_name}
        lessonPlanId={params.id}
      />
    </div>
  );
}

function LessonPlanLoadingState() {
  return (
    <div className="mx-auto max-w-[1180px] 2xl:max-w-[1440px]">
      <Card className="overflow-hidden border-[#dffafa] shadow-[0_18px_50px_rgba(39,30,91,0.08)]">
        <CardContent className="grid gap-5 p-5 sm:p-7 2xl:p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#dffafa]">
              <span className="h-3 w-3 animate-ping rounded-full bg-[#1677ff]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="h-7 w-64 max-w-full animate-pulse rounded-[12px] bg-[#dffafa]" />
              <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded-[10px] bg-[#f8ffff]" />
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <LoadingBlock className="h-32" />
            <LoadingBlock className="h-32" />
          </div>
          <LoadingBlock className="h-44" />
          <div className="grid gap-4 md:grid-cols-3">
            <LoadingBlock className="h-28" />
            <LoadingBlock className="h-28" />
            <LoadingBlock className="h-28" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-[18px] border border-[#dffafa] bg-[#f8ffff] ${className}`} />;
}
