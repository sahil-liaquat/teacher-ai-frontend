"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { backendApi, normalizeLessonPlanForOutput } from "@/lib/api";
import { LessonPlanOutput } from "@/components/generation-output";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { downloadLessonPlanPdf, formatLessonPlanForClipboard } from "@/lib/lesson-plan-export";

export default function LessonPlanDetailPage() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const lesson = useQuery({ queryKey: ["lesson-plan", params.id], queryFn: () => backendApi.lessonPlan(params.id) });
  const output = lesson.data ? normalizeLessonPlanForOutput(lesson.data) : null;

  async function copy() {
    await navigator.clipboard.writeText(formatLessonPlanForClipboard(output));
    toast({ title: "Copied" });
  }
  async function exportPdf() {
    try {
      await downloadLessonPlanPdf(output);
      toast({ title: "PDF downloaded", description: "Exported as a clean text lesson plan." });
    } catch (err) {
      toast({ title: "Download failed", description: err instanceof Error ? err.message : "Try again" });
    }
  }

  if (lesson.isLoading) return <LessonPlanLoadingState />;
  if (lesson.error) return <Card><CardContent className="p-7"><h1 className="text-2xl font-black text-red-700">Could not open lesson plan</h1><p className="mt-2 text-sm text-[#52617d]">{lesson.error instanceof Error ? lesson.error.message : "Request failed"}</p></CardContent></Card>;

  return (
    <div className="print-shell">
      <LessonPlanOutput output={output} streamKey={`lesson-plan-${params.id}`} streamSpeed="fast" onCopy={copy} onExport={exportPdf} />
    </div>
  );
}

function LessonPlanLoadingState() {
  return (
    <div className="mx-auto max-w-[1180px] 2xl:max-w-[1440px]">
      <Card className="overflow-hidden border-[#ebe7f4] shadow-[0_18px_50px_rgba(39,30,91,0.08)]">
        <CardContent className="grid gap-5 p-5 sm:p-7 2xl:p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f1edff]">
              <span className="h-3 w-3 animate-ping rounded-full bg-[#6d38f2]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="h-7 w-64 max-w-full animate-pulse rounded-[12px] bg-[#f1edff]" />
              <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded-[10px] bg-[#f7f4ff]" />
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
  return <div className={`animate-pulse rounded-[18px] border border-[#ebe7f4] bg-[#fbfaff] ${className}`} />;
}
