"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type GenerationKind = "lesson-plan" | "worksheet" | "presentation";
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
    <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-full items-center px-4 py-6 sm:px-5 lg:px-8">
      <section className="relative w-full overflow-hidden rounded-[24px] border border-white/70 bg-white/95 shadow-[0_24px_70px_rgba(39,30,91,0.10)] backdrop-blur-sm">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-50/50 via-white/80 to-blue-50/50" />

        {state === "error" ? (
          <div className="relative flex min-h-[420px] flex-col items-center justify-center gap-5 px-5 py-10 text-center">
            <div className="relative h-[200px] w-[280px] sm:h-[240px] sm:w-[340px]">
              <FlippingTextbookLoader />
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
              <div className="relative h-[220px] w-full max-w-[320px] sm:h-[260px] sm:max-w-[380px]">
                <FlippingTextbookLoader />
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
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDots((d) => (d + 1) % 4);
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">
      {text}
      <span className="inline-block w-6">
        {".".repeat(dots)}
        {" ".repeat(3 - dots)}
      </span>
    </h2>
  );
}

function FlippingTextbookLoader() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <SparklesRing />

      <div className="flip-book relative h-[180px] w-[240px] sm:h-[220px] sm:w-[300px]">
        <div className="book-spine absolute left-1/2 top-0 z-10 h-full w-3 -translate-x-1/2 bg-gradient-to-r from-slate-200 via-white to-slate-200 shadow-md" />

        <div className="book-left-page absolute left-0 top-2 h-[calc(100%-16px)] w-[calc(50%-6px)] origin-right rounded-l-lg bg-gradient-to-br from-slate-100 to-white shadow-lg">
          <div className="p-3 sm:p-4">
            <div className="mb-2 h-2 w-16 rounded-full bg-blue-200/60" />
            <div className="mb-1.5 h-1.5 w-24 rounded-full bg-slate-300/60" />
            <div className="mb-1.5 h-1.5 w-20 rounded-full bg-slate-200/60" />
            <div className="mb-3 h-1.5 w-28 rounded-full bg-slate-300/60" />
            <div className="mb-1.5 h-1.5 w-16 rounded-full bg-slate-200/60" />
            <div className="mb-1.5 h-1.5 w-24 rounded-full bg-slate-300/60" />
            <div className="mb-1.5 h-1.5 w-20 rounded-full bg-slate-200/60" />
            <div className="h-1.5 w-12 rounded-full bg-slate-300/60" />
          </div>
        </div>

        <div className="book-right-page absolute right-0 top-2 h-[calc(100%-16px)] w-[calc(50%-6px)] origin-left rounded-r-lg bg-gradient-to-bl from-slate-50 to-white shadow-lg">
          <div className="p-3 sm:p-4">
            <div className="mb-2 h-2 w-12 rounded-full bg-emerald-200/60" />
            <div className="mb-1.5 h-1.5 w-28 rounded-full bg-slate-300/60" />
            <div className="mb-1.5 h-1.5 w-20 rounded-full bg-slate-200/60" />
            <div className="mb-3 h-1.5 w-24 rounded-full bg-slate-300/60" />
            <div className="mb-1.5 h-1.5 w-16 rounded-full bg-slate-200/60" />
            <div className="mb-1.5 h-1.5 w-28 rounded-full bg-slate-300/60" />
            <div className="mb-1.5 h-1.5 w-20 rounded-full bg-slate-200/60" />
            <div className="h-1.5 w-16 rounded-full bg-slate-300/60" />
          </div>
        </div>

        <div className="flipping-page absolute right-1 top-2 h-[calc(100%-16px)] w-[calc(50%-8px)] origin-left rounded-r-lg bg-gradient-to-bl from-slate-100 via-white to-slate-50 shadow-md animate-flip-page" />
      </div>

      <div className="book-glow absolute inset-0 rounded-full bg-gradient-to-r from-blue-200/30 via-transparent to-emerald-200/30 blur-2xl animate-pulse" />
    </div>
  );
}

function SparklesRing() {
  const sparkles = useMemo(() => [
    { top: "5%", left: "15%", delay: "0s", color: "blue" },
    { top: "12%", left: "85%", delay: "0.3s", color: "emerald" },
    { top: "30%", left: "5%", delay: "0.6s", color: "amber" },
    { top: "30%", left: "92%", delay: "0.9s", color: "blue" },
    { top: "55%", left: "8%", delay: "1.2s", color: "emerald" },
    { top: "55%", left: "88%", delay: "0.2s", color: "amber" },
    { top: "80%", left: "18%", delay: "0.5s", color: "blue" },
    { top: "85%", left: "80%", delay: "0.8s", color: "emerald" },
    { top: "15%", left: "50%", delay: "1s", color: "amber" },
    { top: "75%", left: "48%", delay: "0.4s", color: "blue" },
  ], []);

  return (
    <div className="pointer-events-none absolute inset-0">
      {sparkles.map((s, i) => (
        <div
          key={i}
          className={`absolute h-2 w-2 rounded-full animate-sparkle-${
            s.color === "blue" ? "blue" : s.color === "emerald" ? "emerald" : "amber"
          }`}
          style={{
            top: s.top,
            left: s.left,
            animationDelay: s.delay,
            animationDuration: "2s",
          }}
        />
      ))}
    </div>
  );
}
