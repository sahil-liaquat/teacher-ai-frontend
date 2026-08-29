"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck } from "lucide-react";

import { cn } from "@/lib/utils";

const WORKSHEET_HREF = "/dashboard/worksheets/new";

export function FirstRunEmpty({ boardPreference }: { boardPreference?: string | null }) {
  const href =
    boardPreference && boardPreference !== "other"
      ? `${WORKSHEET_HREF}?board=${encodeURIComponent(boardPreference)}`
      : WORKSHEET_HREF;

  return (
    <section className="mx-auto w-full max-w-[1240px] px-4">
      <div
        className={cn(
          "clickable-card group relative mx-auto flex w-full max-w-[640px] flex-col items-center overflow-hidden rounded-[20px] border border-white/60 bg-gradient-to-br from-emerald-50 via-green-50 to-white p-8 text-center shadow-[0_14px_34px_rgba(15,23,42,0.07)] sm:p-10"
        )}
      >
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute -left-8 bottom-4 h-16 w-16 rounded-full bg-emerald-200/30 blur-2xl" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-[22px] bg-[#ecfff6] text-[#24b77a] ring-1 ring-emerald-100 shadow-[0_14px_30px_rgba(36,183,122,0.23),inset_0_1px_0_rgba(255,255,255,0.92)]">
            <ClipboardCheck className="h-7 w-7 stroke-[2.3]" />
          </div>
          <h2 className="mt-5 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            Create your first worksheet
          </h2>
          <p className="mt-2 max-w-[440px] text-sm font-medium leading-relaxed text-slate-600">
            Pick a chapter and TeachPad builds a textbook-grounded worksheet, answer key, and marking scheme in minutes.
          </p>
          <Link
            href={href}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:from-emerald-600 hover:to-green-700 hover:shadow-xl"
          >
            Create a Worksheet
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
