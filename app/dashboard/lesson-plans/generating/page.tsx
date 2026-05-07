"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { backendApi, LessonPlan, LessonPlanGeneratePayload } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

const PENDING_LESSON_PLAN_KEY = "teacher_ai_pending_lesson_plan";

export default function GeneratingLessonPlanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const rawPayload = window.sessionStorage.getItem(PENDING_LESSON_PLAN_KEY);
    if (!rawPayload) {
      router.replace("/dashboard/lesson-plans/new");
      return;
    }

    let payload: LessonPlanGeneratePayload;
    try {
      payload = JSON.parse(rawPayload) as LessonPlanGeneratePayload;
    } catch {
      window.sessionStorage.removeItem(PENDING_LESSON_PLAN_KEY);
      router.replace("/dashboard/lesson-plans/new");
      return;
    }

    async function runGeneration() {
      try {
        let completed: LessonPlan | null = null;
        try {
          await backendApi.streamLessonPlan(payload, (event) => {
            if (event.type === "complete") completed = event.lesson_plan;
            if (event.type === "error") {
              throw Object.assign(new Error(event.message), { status: event.message === "Method Not Allowed" ? 405 : undefined });
            }
          });
        } catch (streamErr) {
          if (!isStreamRouteUnavailable(streamErr)) throw streamErr;
          completed = await backendApi.createLessonPlan(payload);
        }

        if (!completed) throw new Error("Generation finished without a saved lesson plan.");
        window.sessionStorage.removeItem(PENDING_LESSON_PLAN_KEY);
        router.replace(`/dashboard/lesson-plans/${completed.id}`);
      } catch (err) {
        toast({ title: "Generation failed", description: err instanceof Error ? err.message : "Try again" });
        window.sessionStorage.removeItem(PENDING_LESSON_PLAN_KEY);
        router.replace("/dashboard/lesson-plans/new");
      }
    }

    void runGeneration();
  }, [router, toast]);

  return <LessonPlanOutputSkeleton />;
}

function isStreamRouteUnavailable(error: unknown) {
  const status = typeof error === "object" && error && "status" in error ? (error as { status?: number }).status : undefined;
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return status === 404 || status === 405 || message.includes("method not allowed");
}

function LessonPlanOutputSkeleton() {
  return (
    <div className="mx-auto max-w-[1180px] 2xl:max-w-[1440px]">
      <Card className="overflow-hidden border-[#ebe7f4] bg-white shadow-[0_18px_50px_rgba(39,30,91,0.08)]">
        <CardContent className="p-0">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#fbf6ff] to-white px-4 py-6 sm:px-8 sm:py-8">
            <LoadingBlock className="h-9 w-28" />
            <div className="mt-7 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <LoadingBlock className="h-6 w-44" />
                  <LoadingBlock className="h-7 w-28" />
                </div>
                <LoadingBlock className="mt-5 h-10 w-full max-w-3xl" />
                <LoadingBlock className="mt-3 h-10 w-full max-w-2xl" />
                <div className="mt-6 flex flex-wrap gap-3">
                  <LoadingBlock className="h-9 w-28" />
                  <LoadingBlock className="h-9 w-32" />
                  <LoadingBlock className="h-9 w-24" />
                  <LoadingBlock className="h-9 w-40" />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <LoadingBlock className="h-9 w-24" />
                <LoadingBlock className="h-9 w-28" />
                <LoadingBlock className="h-9 w-24" />
              </div>
            </div>
          </div>

          <div className="grid gap-5 px-4 pb-5 pt-5 sm:px-6 sm:pb-6 2xl:gap-6 2xl:px-8 2xl:pb-8 2xl:pt-6">
            <SkeletonSection />
            <SkeletonSection />
            <div className="grid gap-5 lg:grid-cols-2">
              <SkeletonSection compact />
              <SkeletonSection compact />
            </div>
            <SkeletonSection />
            <div className="rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-6">
              <LoadingBlock className="h-6 w-40" />
              <LoadingBlock className="mt-5 h-4 w-full" />
              <LoadingBlock className="mt-3 h-4 w-5/6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SkeletonSection({ compact = false }: { compact?: boolean }) {
  return (
    <section className="rounded-[18px] border border-[#ebe7f4] bg-white p-5 shadow-[0_12px_30px_rgba(39,30,91,0.04)] 2xl:p-6">
      <div className="mb-5 flex items-center gap-3">
        <LoadingBlock className="h-10 w-10 rounded-full" />
        <LoadingBlock className="h-6 w-56 max-w-[70%]" />
      </div>
      <div className="grid gap-3">
        <LoadingBlock className={compact ? "h-4 w-full" : "h-5 w-full"} />
        <LoadingBlock className={compact ? "h-4 w-4/5" : "h-5 w-11/12"} />
        {!compact ? <LoadingBlock className="h-5 w-2/3" /> : null}
      </div>
    </section>
  );
}

function LoadingBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-[14px] bg-[#f1edff] ${className}`} />;
}
