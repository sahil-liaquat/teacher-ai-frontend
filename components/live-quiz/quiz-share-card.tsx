"use client";

import Link from "next/link";
import { Copy, ExternalLink, MessageCircle, QrCode, RadioTower } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { quizSummary } from "./quiz-data";

export function QuizShareCard() {
  const { toast } = useToast();

  async function copyQuizLink() {
    await navigator.clipboard?.writeText(quizSummary.link).catch(() => undefined);
    toast({ title: "Quiz link copied", description: "Share it with your students." });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-[22px] border border-[#ffe1d2] bg-gradient-to-br from-[#fffaf0] to-white p-5 shadow-[0_14px_34px_var(--teachpad-shadowCard)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#ffe1d2] bg-white/85 px-3 py-1.5 text-xs font-black text-[#e57820]">
          <RadioTower className="h-4 w-4" /> Published
        </div>
        <h1 className="mt-4 text-2xl font-black text-teachpad-ink sm:text-3xl">Your live quiz is ready</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-teachpad-muted">Share this link with your students.</p>
        <div className="mt-5 rounded-2xl border border-teachpad-cardBorder bg-white px-4 py-3 text-sm font-black text-teachpad-ink shadow-sm">
          {quizSummary.link}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" onClick={copyQuizLink} className="bg-gradient-to-r from-[#ff8a3d] to-[#eb3b5a]">
            <Copy className="h-4 w-4" /> Copy Link
          </Button>
          <Button type="button" variant="outline" className="border-[#ffe1d2] text-[#e57820]">
            <MessageCircle className="h-4 w-4" /> Share on WhatsApp
          </Button>
          <Link href="/quiz/abc123">
            <Button type="button" variant="outline">
              <ExternalLink className="h-4 w-4" /> Open Student View
            </Button>
          </Link>
          <Link href="/dashboard/live-quiz/results/abc123">
            <Button type="button" variant="outline">
              View Live Results
            </Button>
          </Link>
        </div>
      </section>
      <aside className="rounded-[22px] border border-[#dffafa] bg-white p-5 text-center shadow-[0_14px_34px_var(--teachpad-shadowCard)]">
        <div className="mx-auto grid aspect-square max-w-[220px] place-items-center rounded-[20px] border border-teachpad-cardBorder bg-[linear-gradient(45deg,#25262b_25%,transparent_25%),linear-gradient(-45deg,#25262b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#25262b_75%),linear-gradient(-45deg,transparent_75%,#25262b_75%)] bg-[length:22px_22px] bg-[position:0_0,0_11px,11px_-11px,-11px_0]">
          <span className="grid h-20 w-20 place-items-center rounded-2xl bg-white text-teachpad-blue">
            <QrCode className="h-10 w-10" />
          </span>
        </div>
        <h2 className="mt-4 text-lg font-black text-teachpad-ink">QR Code</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-teachpad-muted">Students can scan this QR code to join the quiz.</p>
      </aside>
    </div>
  );
}
