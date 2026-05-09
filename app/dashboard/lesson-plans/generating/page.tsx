"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { backendApi, LessonPlan, LessonPlanGeneratePayload } from "@/lib/api";
import { GenerationLoadingScreen } from "@/components/generation-loading-screen";
import { useToast } from "@/components/ui/toast";
import { clearPendingLessonPlan, readPendingLessonPlan } from "@/lib/pending-lesson-plan";

export default function GeneratingLessonPlanPage() {
  const router = useRouter();
  const { toast } = useToast();
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
      router.replace(`/dashboard/lesson-plans/${completed.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate the lesson plan.");
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
