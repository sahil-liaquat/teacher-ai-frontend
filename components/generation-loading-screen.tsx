"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type GenerationKind = "lesson-plan" | "worksheet";
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
      ? ["Searching textbook content...", "Finding relevant chapter points...", "Building your worksheet...", "Preparing editable output..."]
      : ["Searching textbook content...", "Finding relevant chapter points...", "Building your lesson plan...", "Preparing editable output..."],
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
    <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-[1180px] items-center px-3 py-6 sm:px-5 lg:px-8">
      <section className="relative w-full overflow-hidden rounded-[24px] border border-[#dfe8f7] bg-white shadow-[0_24px_70px_rgba(39,30,91,0.10)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(141,87,246,0.13),transparent_24rem),radial-gradient(circle_at_85%_18%,rgba(13,185,134,0.12),transparent_22rem),radial-gradient(circle_at_55%_95%,rgba(245,158,11,0.10),transparent_22rem)]" />
        <AIParticles />

        {state === "error" ? (
          <div className="relative flex min-h-[420px] flex-col items-center justify-center gap-5 px-5 py-10 text-center">
            <div className="generation-book-wrap relative h-[210px] w-[330px] max-w-[86%] sm:h-[250px] sm:w-[420px]">
              <GenerationBook />
            </div>
            <p className="max-w-[520px] text-base font-semibold leading-7 text-[#5f5a73]">
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
          <div className="relative mx-auto min-h-[430px] max-w-[760px] px-5 py-8 sm:px-8 sm:py-10">
            <div className="relative min-h-[360px] overflow-hidden rounded-[22px] border border-[#e7edf8] bg-[#fbfcff] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:p-7">
            <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
              <SkeletonBar className="h-3 w-24" />
              <div className="flex gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#8d57f6]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#0db986]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
              </div>
            </div>

            <div className="generation-book-wrap absolute left-1/2 top-[48%] h-[210px] w-[330px] max-w-[86%] -translate-x-1/2 -translate-y-1/2 sm:h-[250px] sm:w-[420px]">
              <GenerationBook />
            </div>

            <div className="absolute bottom-5 left-5 right-5 grid gap-3">
              <p className="mb-1 text-center text-sm font-black text-[#3a3455] sm:text-base">{loadingMessage}</p>
              <SkeletonBar className="h-5 w-8/12" />
              <SkeletonBar className="h-4 w-full" />
              <SkeletonBar className="h-4 w-11/12" />
              <SkeletonBar className="h-4 w-7/12" />
            </div>
          </div>
          </div>
        )}
      </section>
    </main>
  );
}

function AIParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 16 }).map((_, index) => (
        <span
          key={index}
          className="generation-particle"
          style={{
            left: `${8 + ((index * 29) % 86)}%`,
            top: `${10 + ((index * 17) % 78)}%`,
            animationDelay: `${index * 0.28}s`,
            animationDuration: `${4.6 + (index % 5) * 0.7}s`
          }}
        />
      ))}
    </div>
  );
}

function SkeletonBar({ className }: { className: string }) {
  return <div className={`generation-skeleton rounded-full ${className}`} />;
}

function SkeletonInk({ className }: { className: string }) {
  return <span className={`generation-ink absolute left-7 h-2 rounded-full ${className}`} />;
}

function GenerationBook() {
  return (
    <>
      <div className="generation-book">
        <div className="generation-page generation-page-left">
          <SkeletonInk className="top-9 w-28" />
          <SkeletonInk className="top-16 w-36" />
          <SkeletonInk className="top-24 w-24" />
          <SkeletonInk className="top-36 w-32" />
          <SkeletonInk className="top-44 w-20" />
        </div>
        <div className="generation-page generation-page-right">
          <SkeletonInk className="top-9 w-24" />
          <SkeletonInk className="top-16 w-40" />
          <SkeletonInk className="top-24 w-28" />
          <SkeletonInk className="top-36 w-36" />
          <SkeletonInk className="top-44 w-24" />
        </div>
        <div className="generation-book-spine" />
      </div>
      <div className="generation-magnifier" aria-hidden="true">
        <div className="generation-lens" />
        <div className="generation-handle" />
      </div>
    </>
  );
}
