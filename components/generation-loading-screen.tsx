"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type GenerationKind = "lesson-plan" | "worksheet" | "presentation" | "notes" | "activity" | "live-quiz";
type GenerationState = "loading" | "error";

export function GenerationLoadingScreen({
  type,
  state = "loading",
  status,
  errorMessage,
  onRetry,
  onBack
}: {
  type: GenerationKind;
  state?: GenerationState;
  status?: string;
  errorMessage?: string;
  onRetry?: () => void;
  onBack?: () => void;
}) {
  const fallbackMessages = useMemo(
    () => type === "worksheet"
      ? ["Reading your textbook...", "Finding key concepts...", "Building your worksheet...", "Preparing teacher-ready content..."]
      : type === "presentation"
        ? ["Reading your textbook...", "Planning the slide flow...", "Writing clear classroom slides...", "Preparing teacher-ready content..."]
        : type === "notes"
          ? ["Reading your textbook...", "Finding key explanations...", "Writing classroom notes...", "Preparing revision sections..."]
        : type === "activity"
          ? ["Reading your textbook...", "Designing classroom steps...", "Adding teacher and student actions...", "Preparing activity prompts..."]
        : type === "live-quiz"
          ? ["Reading your textbook...", "Preparing quiz questions...", "Adding marks and answers...", "Getting your live quiz ready..."]
          : ["Reading your textbook...", "Finding key concepts...", "Building your lesson plan...", "Preparing teacher-ready content..."],
    [type]
  );
  const [messageIndex, setMessageIndex] = useState(0);
  const loadingMessage = status || fallbackMessages[messageIndex % fallbackMessages.length];

  useEffect(() => {
    if (state !== "loading" || status) return;
    const timer = window.setInterval(() => {
      setMessageIndex((index) => index + 1);
    }, 1600);
    return () => window.clearInterval(timer);
  }, [state, status]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-full items-center justify-center bg-[#ffffff] px-4 py-6 text-slate-900 [color-scheme:light] sm:px-5 lg:px-8">
      <section className="relative w-full overflow-hidden bg-[#ffffff]">

        {state === "error" ? (
          <div className="relative flex min-h-[420px] flex-col items-center justify-center gap-5 px-5 py-10 text-center">
            <div className="relative h-[260px] w-[340px] sm:h-[320px] sm:w-[420px]">
              <BookLoadingLoader />
            </div>
            <p className="max-w-[520px] text-base font-semibold leading-7 text-slate-600">
              {errorMessage || "Something interrupted the request. You can retry with the same inputs or go back and adjust them."}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {onRetry ? (
                <Button type="button" onClick={onRetry} className="sm:min-w-[150px]">
                  <RefreshCw className="h-4 w-4" /> Retry
                </Button>
              ) : null}
              {onBack ? (
                <Button type="button" variant="outline" onClick={onBack} className="sm:min-w-[150px]">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="relative mx-auto min-h-[480px] max-w-[800px] px-5 py-8 sm:px-8 sm:py-10">
            <div className="relative flex flex-col items-center justify-center">
              <div className="relative h-[220px] w-full max-w-[340px] sm:h-[280px] sm:max-w-[420px]">
                <BookLoadingLoader />
              </div>

              <div className="mt-8 text-center">
                <AnimatedDotsText text={loadingMessage} />
                <p className="mt-3 text-sm font-medium text-slate-500 sm:text-base">
                  Finding key concepts and preparing teacher-ready content
                </p>
              </div>

              <div className="mt-8 flex items-center justify-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: "0.2s" }} />
                <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function AnimatedDotsText({ text }: { text: string }) {
  return (
    <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">
      {text}
    </h2>
  );
}

function BookLoadingLoader() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let animation: { destroy: () => void } | null = null;
    let cancelled = false;

    async function loadAnimation() {
      const lottie = (await import("lottie-web")).default;
      if (!containerRef.current || cancelled) return;

      animation = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/assets/illustrations/loading-animation-bored-hand.json"
      });
    }

    loadAnimation();

    return () => {
      cancelled = true;
      animation?.destroy();
    };
  }, []);

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#ffffff] [color-scheme:light]">
      <div
        ref={containerRef}
        aria-hidden="true"
        className="relative h-full w-full select-none"
      />
    </div>
  );
}
