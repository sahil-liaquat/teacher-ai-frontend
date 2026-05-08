"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { backendApi, LessonPlan, LessonPlanGeneratePayload } from "@/lib/api";
import { GenerationLoadingScreen } from "@/components/generation-loading-screen";

const PENDING_LESSON_PLAN_KEY = "teacher_ai_pending_lesson_plan";

export default function GeneratingLessonPlanPage() {
  const router = useRouter();
  const started = useRef(false);
  const [status, setStatus] = useState("Finding textbook content...");
  const [payload, setPayload] = useState<LessonPlanGeneratePayload | null>(null);
  const [error, setError] = useState("");

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

    setPayload(payload);
    void runGeneration(payload);
  }, [router]);

  async function runGeneration(nextPayload = payload) {
    if (!nextPayload) return;
    setError("");
    setStatus("Reading the textbook...");
    const conceptTimer = window.setTimeout(() => setStatus("Finding key concepts..."), 900);
    const creatingTimer = window.setTimeout(() => setStatus("Preparing your lesson plan..."), 1900);
    try {
      const completed: LessonPlan = await backendApi.createLessonPlan(nextPayload);
      if (!completed) throw new Error("Generation finished without a saved lesson plan.");
      setStatus("Formatting output...");
      window.sessionStorage.removeItem(PENDING_LESSON_PLAN_KEY);
      router.replace(`/dashboard/lesson-plans/${completed.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate the lesson plan.");
    } finally {
      window.clearTimeout(conceptTimer);
      window.clearTimeout(creatingTimer);
    }
  }

  function goBack() {
    window.sessionStorage.removeItem(PENDING_LESSON_PLAN_KEY);
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
