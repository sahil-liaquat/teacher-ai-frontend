"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backendApi, normalizeLessonPlanForOutput } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { LessonPlanChatbotPanel } from "@/components/lesson-plan-chatbot-panel";
import { LessonPlanOutput } from "@/components/generation-output";
import { isResourceSaved, saveResourceId } from "@/lib/saved-resources";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { downloadLessonPlanPdf, formatLessonPlanForClipboard, shareLessonPlan } from "@/lib/lesson-plan-export";

export default function LessonPlanDetailPage() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editedOutput, setEditedOutput] = useState<any>(null);
  const [autoSaveFailed, setAutoSaveFailed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [highlightedSections, setHighlightedSections] = useState<string[]>([]);
  const lesson = useQuery({ queryKey: ["lesson-plan", params.id], queryFn: () => backendApi.lessonPlan(params.id) });

  useEffect(() => {
    if (lesson.data) {
      setIsSaved(lesson.data.is_saved ?? false);
    }
  }, [lesson.data]);

  useEffect(() => {
    if (!highlightedSections.length) return;

    const highlightedSection = document.querySelector<HTMLElement>(
      `[data-lesson-section="${highlightedSections[0]}"]`
    );
    highlightedSection?.scrollIntoView({ behavior: "smooth", block: "center" });

    const clearHighlight = () => setHighlightedSections([]);
    document.addEventListener("pointerdown", clearHighlight, { once: true });
    return () => document.removeEventListener("pointerdown", clearHighlight);
  }, [highlightedSections]);

  const handleSaveToLibrary = async () => {
    if (params.id) {
      try {
        const nextSaved = !isSaved;
        setIsSaved(nextSaved);
        await backendApi.updateResourceSavedState("lesson_plan", params.id, nextSaved);
        queryClient.invalidateQueries({ queryKey: ["lesson-plan", params.id] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
        toast({
          title: nextSaved ? "Saved to Library" : "Removed from Library",
          description: nextSaved ? "You can find this in your Saved Resources." : "Removed from your library."
        });
      } catch {
        setIsSaved(isSaved);
        toast({ title: "Error updating library", variant: "error" });
      }
    }
  };
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
    <div
      className={
        isChatbotOpen
          ? "print-shell mx-auto grid w-full max-w-[1480px] gap-0 transition-[grid-template-columns,gap,max-width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] print:block xl:h-[calc(100vh-40px)] xl:grid-cols-[minmax(0,1fr)_448px] xl:gap-5 xl:overflow-hidden 2xl:grid-cols-[minmax(0,1fr)_468px]"
          : "print-shell mx-auto grid w-full max-w-[1180px] gap-0 transition-[grid-template-columns,gap,max-width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] xl:grid-cols-[minmax(0,1fr)_0px] 2xl:max-w-[1440px]"
      }
    >
      <div
        className={
          isChatbotOpen
            ? "min-w-0 -translate-x-10 opacity-0 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none print:block print:translate-x-0 print:opacity-100 xl:h-full xl:translate-x-0 xl:overflow-y-auto xl:pr-1 xl:opacity-100 xl:pointer-events-auto"
            : "min-w-0 translate-x-0 opacity-100 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        }
      >
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
          highlightedSections={highlightedSections}
          onClearHighlights={() => setHighlightedSections([])}
          onCopy={copy}
          onExport={exportPdf}
          onShare={share}
          onSave={editsSaved}
          onChange={setEditedOutput}
          isSaved={isSaved}
          onSaveToLibrary={handleSaveToLibrary}
        />
      </div>
      <LessonPlanChatbotPanel
        lessonPlanId={params.id}
        currentPlan={output}
        onBeforeOpen={async () => {
          if (editedOutput) {
            await saveEditedOutput(editedOutput, { silent: true });
            setEditedOutput(null);
          }
        }}
        onOpenChange={setIsChatbotOpen}
        onApplyChanges={(_, changedSectionKeys) => setHighlightedSections(changedSectionKeys)}
        onTweakSuccess={() => setEditedOutput(null)}
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
