"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { backendApi, getRateLimitNotice, isPaymentRequiredError, LessonPlan, LessonPlanGeneratePayload, type LessonPlanDashboardSummary } from "@/lib/api";
import { GenerationLoadingScreen } from "@/components/generation-loading-screen";
import { useToast } from "@/components/ui/toast";
import { clearPendingLessonPlan, readPendingLessonPlan } from "@/lib/pending-lesson-plan";
import { useUpgradeModal } from "@/components/billing/upgrade-modal";

export default function GeneratingLessonPlanPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { openUpgrade } = useUpgradeModal();
  const started = useRef(false);
  const [status, setStatus] = useState("Finding textbook content...");
  const [payload, setPayload] = useState<LessonPlanGeneratePayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const pending = readPendingLessonPlan();
    if (!pending.ok) {
      const descriptions = {
        missing: "The lesson plan request was not found. Please review the form and start generation again.",
        expired: "The saved lesson plan request expired. Please review the form and start generation again.",
        invalid: "The saved lesson plan request could not be read. Please review the form and start generation again."
      };
      toast({
        title: "Generation could not resume",
        description: descriptions[pending.reason]
      });
      router.replace("/dashboard/lesson-plans/new");
      return;
    }

    const payload = pending.payload;
    setPayload(payload);
    void runGeneration(payload);
  }, [router, toast]);

  async function runGeneration(nextPayload = payload) {
    if (!nextPayload) return;
    setError("");
    setStatus("Reading the textbook...");
    const t1 = window.setTimeout(() => setStatus("Reading the textbook..."), 0);
    const t2 = window.setTimeout(() => setStatus("Finding key concepts..."), 3000);
    const t3 = window.setTimeout(() => setStatus("Drafting lesson structure..."), 10000);
    const t4 = window.setTimeout(() => setStatus("Writing activities and assessments..."), 20000);
    const t5 = window.setTimeout(() => setStatus("Almost ready..."), 35000);
    try {
      const completed: LessonPlan = await backendApi.createLessonPlan(nextPayload);
      if (!completed) throw new Error("Generation finished without a saved lesson plan.");
      setStatus("Formatting output...");
      clearPendingLessonPlan();
      queryClient.setQueryData<LessonPlanDashboardSummary>(["lesson-plans-summary"], (current) => {
        if (!current) return current;
        const recent = [completed, ...current.recent.filter((item) => item.id !== completed.id)].slice(0, 5);
        return {
          ...current,
          recent,
          total: current.total + (current.recent.some((item) => item.id === completed.id) ? 0 : 1),
          monthly_total: current.monthly_total + (current.recent.some((item) => item.id === completed.id) ? 0 : 1),
        };
      });
      queryClient.invalidateQueries({ queryKey: ["lesson-plans-summary"] });
      queryClient.invalidateQueries({ queryKey: ["resources-lesson-plans"] });
      router.replace(`/dashboard/lesson-plans/${completed.id}`);
    } catch (err) {
      if (isPaymentRequiredError(err)) {
        openUpgrade("Lesson plan generation requires a Pro plan.");
        return;
      }
      const rateLimit = getRateLimitNotice(err);
      if (rateLimit) {
        setError(rateLimit.description);
        toast(rateLimit);
      } else {
        setError(err instanceof Error ? err.message : "Could not generate the lesson plan.");
      }
    } finally {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
      window.clearTimeout(t5);
    }
  }

  function goBack() {
    clearPendingLessonPlan();
    router.replace("/dashboard/lesson-plans/new");
  }

  return (
    <GenerationLoadingScreen
      type="lesson-plan"
      state={error ? "error" : "loading"}
      status={error ? undefined : status}
      errorMessage={error}
      onRetry={() => runGeneration()}
      onBack={goBack}
    />
  );
}
