"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  Expand,
  FileText,
  Images,
  LayoutTemplate,
  Maximize2,
  Palette,
  Presentation,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildDummyPresentationDeck, loadPresentationDeck, type PresentationDeck, type PresentationSlide } from "@/lib/presentation-generator";
import { cn } from "@/lib/utils";

const fallbackDeck = buildDummyPresentationDeck({
  topic: "Photosynthesis",
  audience: "Class 8",
  slideCount: "8",
  language: "English",
  style: "Clean classroom",
  tone: "Simple",
  detailLevel: "Balanced",
  visualDensity: "Balanced visuals",
  notes: "",
  includeSpeakerNotes: true,
  includeActivities: true,
  includeQuiz: true,
  includeImages: false
});

export default function PresentationOutputPage() {
  const [deck, setDeck] = useState<PresentationDeck | null>(null);
  const [fullView, setFullView] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    setDeck(loadPresentationDeck() || fallbackDeck);
  }, []);

  useEffect(() => {
    if (!fullView) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setFullView(false);
      if (event.key === "ArrowRight") setActiveSlide((index) => Math.min((deck?.slides.length || 1) - 1, index + 1));
      if (event.key === "ArrowLeft") setActiveSlide((index) => Math.max(0, index - 1));
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [deck?.slides.length, fullView]);

  const active = deck?.slides[activeSlide] || deck?.slides[0];

  if (!deck || !active) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <p className="text-sm font-bold text-teachpad-muted">Loading presentation...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-[1280px]">
        <div className="overflow-hidden rounded-[18px] border border-[#ffd9de] bg-white shadow-[0_14px_34px_rgba(30,80,90,0.08)]">
          <header className="border-b border-[#ffd9de] bg-gradient-to-br from-[#fff7f8] via-white to-[#ffd9de]/60 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <Link href="/dashboard/presentation-generator" className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#ffd9de] bg-white/85 px-3 py-1.5 text-xs font-black text-[#eb3b5a] shadow-sm transition hover:bg-white">
                  <ArrowLeft className="h-4 w-4" /> Edit inputs
                </Link>
                <h1 className="text-[28px] font-black tracking-tight text-teachpad-ink sm:text-[34px]">{deck.topic}</h1>
                <p className="mt-2 text-sm font-semibold leading-6 text-teachpad-muted">
                  {deck.audience} - {deck.language} - {deck.style} - {deck.tone}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" className="border-[#ffd9de] text-[#eb3b5a] hover:border-[#eb3b5a] hover:text-[#eb3b5a]" onClick={() => setFullView(true)}>
                  <Expand className="h-4 w-4" /> Full View
                </Button>
                <Button type="button" variant="outline" className="border-[#ffd9de] text-[#eb3b5a] hover:border-[#eb3b5a] hover:text-[#eb3b5a]">
                  <Download className="h-4 w-4" /> PPTX
                </Button>
                <Button type="button" variant="outline" className="border-[#ffd9de] text-[#eb3b5a] hover:border-[#eb3b5a] hover:text-[#eb3b5a]">
                  <FileText className="h-4 w-4" /> PDF
                </Button>
              </div>
            </div>
          </header>

          <div className="grid gap-4 p-4 sm:p-5">
            <div className="grid gap-3 md:grid-cols-4">
              <Metric icon={LayoutTemplate} label="Slides" value={String(deck.slides.length)} />
              <Metric icon={Clock3} label="Duration" value={`${Math.max(15, deck.slides.length * 3)} min`} />
              <Metric icon={Palette} label="Theme" value="Light red" />
              <Metric icon={Images} label="Visuals" value={deck.visualDensity} />
            </div>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.58fr)]">
              <div className="grid gap-3 md:grid-cols-2">
                {deck.slides.map((slide, index) => (
                  <button
                    key={slide.eyebrow}
                    type="button"
                    onClick={() => setActiveSlide(index)}
                    className={cn(
                      "rounded-[14px] border bg-white p-3 text-left shadow-[0_10px_20px_rgba(30,80,90,0.04)] transition hover:-translate-y-0.5",
                      activeSlide === index ? "border-[#eb3b5a] ring-4 ring-[#ffd9de]/60" : "border-[#ffd9de]"
                    )}
                  >
                    <SlideFrame slide={slide} compact />
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-black text-teachpad-ink">{slide.title}</p>
                      <span className="shrink-0 rounded-full bg-[#fff7f8] px-2 py-1 text-[11px] font-black text-[#eb3b5a]">{slide.eyebrow}</span>
                    </div>
                  </button>
                ))}
              </div>

              <aside className="self-start rounded-[16px] border border-[#ffd9de] bg-[#fffafb] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#eb3b5a]">Selected Slide</p>
                    <h2 className="mt-1 text-lg font-black text-teachpad-ink">{active.title}</h2>
                  </div>
                  <Button type="button" size="icon" variant="outline" className="border-[#ffd9de] text-[#eb3b5a]" onClick={() => setFullView(true)} aria-label="Open full view">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
                <SlideFrame slide={active} />
                <div className="mt-4 rounded-[14px] border border-[#ffd9de] bg-white p-4">
                  <h3 className="text-sm font-black text-teachpad-ink">Speaker Notes</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-teachpad-muted">
                    {deck.includeSpeakerNotes ? active.speakerNote : "Speaker notes are turned off for this deck."}
                  </p>
                  {deck.notes ? <p className="mt-2 text-sm font-semibold leading-6 text-teachpad-muted">Teacher instruction: {deck.notes}</p> : null}
                </div>
              </aside>
            </section>
          </div>
        </div>
      </div>

      {fullView ? (
        <div className="fixed inset-0 z-[100] bg-white p-4 text-teachpad-ink sm:p-6">
          <div className="mx-auto flex h-full max-w-[1180px] flex-col">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#eb3b5a]">Full View</p>
                <h2 className="truncate text-xl font-black">{deck.topic}</h2>
              </div>
              <button type="button" onClick={() => setFullView(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-[#ffd9de] bg-[#fff7f8] text-[#eb3b5a]" aria-label="Close full view">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid flex-1 place-items-center rounded-[18px] border border-[#ffd9de] bg-[#fffafb] p-3">
              <div className="w-full max-w-[980px]">
                <SlideFrame slide={active} large />
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-black text-teachpad-muted">{active.eyebrow} of {deck.slides.length}</p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" disabled={activeSlide === 0} onClick={() => setActiveSlide((index) => Math.max(0, index - 1))} className="border-[#ffd9de] text-[#eb3b5a]">
                  <ArrowLeft className="h-4 w-4" /> Previous
                </Button>
                <Button type="button" disabled={activeSlide === deck.slides.length - 1} onClick={() => setActiveSlide((index) => Math.min(deck.slides.length - 1, index + 1))} className="bg-gradient-to-r from-[#eb3b5a] to-[#ff6f86] shadow-[0_14px_28px_rgba(235,59,90,0.18)]">
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SlideFrame({ slide, compact = false, large = false }: { slide: PresentationSlide; compact?: boolean; large?: boolean }) {
  return (
    <div className={cn("aspect-[16/9] overflow-hidden rounded-[12px] border border-[#ffd9de] bg-white shadow-inner", large && "rounded-[18px]")}>
      <div className="flex h-full">
        <div className="w-[8%] bg-[#ffd9de]" />
        <div className={cn("flex flex-1 flex-col justify-between bg-gradient-to-br from-white via-[#fff7f8] to-[#ffd9de]/55", compact ? "p-3" : large ? "p-10" : "p-5")}>
          <div>
            <p className={cn("font-black uppercase tracking-[0.14em] text-[#eb3b5a]", compact ? "text-[10px]" : large ? "text-sm" : "text-xs")}>{slide.eyebrow}</p>
            <h3 className={cn("mt-3 font-black leading-tight text-teachpad-ink", compact ? "line-clamp-2 text-lg" : large ? "text-[clamp(2rem,5vw,4.5rem)]" : "text-2xl")}>{slide.title}</h3>
          </div>
          {!compact ? (
            <ul className={cn("grid gap-2", large ? "max-w-3xl text-2xl" : "text-sm")}>
              {slide.points.map((point) => (
                <li key={point} className="flex gap-2 font-semibold leading-6 text-teachpad-muted">
                  <CheckCircle2 className={cn("mt-1 shrink-0 text-[#eb3b5a]", large ? "h-6 w-6" : "h-4 w-4")} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <span className={cn("rounded-full bg-white px-3 py-1 font-black text-[#eb3b5a] shadow-sm", compact ? "text-[10px]" : "text-xs")}>{slide.visual}</span>
            <Presentation className={cn("text-[#eb3b5a]/55", compact ? "h-6 w-6" : large ? "h-14 w-14" : "h-8 w-8")} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-[#ffd9de] bg-white p-3">
      <div className="flex items-center gap-2 text-[#eb3b5a]">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-black uppercase tracking-[0.12em]">{label}</span>
      </div>
      <p className="mt-2 truncate text-lg font-black text-teachpad-ink">{value}</p>
    </div>
  );
}
