"use client";

import { ArrowLeft, RadioTower, Sparkles } from "lucide-react";
import { HistoryBackButton } from "@/components/history-back-button";

export default function CreateLiveQuizPage() {
  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-4">
      <HistoryBackButton className="inline-flex items-center gap-1.5 text-sm font-black text-[#b97800] transition hover:text-[#8a5c00]">
        <ArrowLeft className="h-4 w-4" />
        Back
      </HistoryBackButton>

      <div className="overflow-hidden rounded-[18px] border border-[#ffe9a8] bg-white shadow-[0_14px_34px_rgba(39,30,91,0.07)]">
        {/* Header */}
        <div className="relative min-h-[130px] overflow-hidden rounded-t-[18px] border-b border-[#ffe9a8] bg-gradient-to-br from-[#fff9df] via-white to-[#fff0bf] px-5 py-6 sm:px-6">
          <div className="relative z-10 max-w-[620px]">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#ffe9a8] bg-white/80 px-3 py-1.5 text-xs font-black text-[#b97800] shadow-sm">
              <RadioTower className="h-4 w-4" /> Live classroom quiz
            </div>
            <h1 className="text-[28px] font-black tracking-tight text-[#25262b] sm:text-[34px]">Live Quiz Generator</h1>
            <p className="mt-2.5 max-w-[560px] text-sm font-semibold leading-6 text-[#55516e]">
              Create textbook-based quizzes and share them with students instantly.
            </p>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] overflow-hidden lg:block">
            <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-white/80 to-transparent" />
            <img
              src="/assets/illustrations/live-quiz-header.png"
              alt=""
              aria-hidden="true"
              className="absolute -bottom-3 right-4 w-[300px] select-none object-contain drop-shadow-[0_18px_18px_rgba(185,120,0,0.16)] xl:right-6 xl:w-[360px]"
            />
          </div>
        </div>

        {/* Coming Soon */}
        <div className="flex flex-col items-center justify-center px-5 py-20 sm:px-6 sm:py-28">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#fff9df] shadow-[0_10px_28px_rgba(185,120,0,0.12)]">
            <Sparkles className="h-9 w-9 text-[#b97800]" strokeWidth={2.3} />
          </div>
          <h2 className="text-2xl font-black text-[#25262b]">Coming Soon</h2>
          <p className="mt-3 max-w-[440px] text-center text-sm font-medium leading-6 text-[#55516e]">
            The Live Quiz Generator is being rebuilt with a new design and improved experience. Check back soon!
          </p>
          <HistoryBackButton
            className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl border border-[#ffe9a8] bg-white px-5 text-sm font-semibold text-[#55516e] shadow-sm transition-all duration-200 hover:border-[#f0a22f] hover:text-[#b97800]"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" /> Back
          </HistoryBackButton>
        </div>
      </div>
    </div>
  );
}
