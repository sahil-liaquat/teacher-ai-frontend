"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FocusEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Download, FileText, ImageIcon, Maximize2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { backendApi, isPaymentRequiredError } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { isResourceSaved, saveResourceId } from "@/lib/saved-resources";
import { useUpgradeModal } from "@/components/billing/upgrade-modal";
import {
  loadLatestPresentationId,
  presentationGenerationToDeck,
  type PresentationDeck,
  type PresentationSlide
} from "@/lib/presentation-generator";
import { downloadPptx } from "@/lib/presentation-export";
import { cn } from "@/lib/utils";

const slideTheme = {
  page: "bg-[#f7f7f8]",
  slide: "bg-white",
  text: "text-[#171717]",
  muted: "text-[#5f6368]",
  border: "border-[#e7e7ea]"
};

export default function PresentationOutputPage() {
  const { toast } = useToast();
  const { openUpgrade } = useUpgradeModal();
  const [deck, setDeck] = useState<PresentationDeck | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentPresentationId, setCurrentPresentationId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveToLibrary = async () => {
    if (currentPresentationId) {
      try {
        const nextSaved = !isSaved;
        setIsSaved(nextSaved);
        await backendApi.updateResourceSavedState("presentation", currentPresentationId, nextSaved);
        toast({
          title: nextSaved ? "Saved to Library" : "Removed from Library",
          description: nextSaved ? "You can find this in your Saved Resources." : "Removed from your library."
        });
      } catch {
        setIsSaved(isSaved);
        toast({ title: "Error updating library", variant: "error" });
      }
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id") || loadLatestPresentationId();
    if (!id) {
      setErrorMessage("Generate a presentation first.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setErrorMessage("");
    backendApi.presentation(id)
      .then((generation) => {
        if (cancelled) return;
        const nextDeck = presentationGenerationToDeck(generation);
        if (!nextDeck.slides.length) {
          setErrorMessage("This presentation does not have any slides yet.");
          return;
        }
        setDeck(nextDeck);
        setCurrentPresentationId(id);
        setIsSaved(generation.is_saved ?? false);
        setActiveSlide(0);
      })
      .catch((error) => {
        if (!cancelled) {
          const message = getErrorMessage(error, "Could not load presentation.");
          setErrorMessage(message);
          toast({ title: "Could not load presentation", description: message });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [toast]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") void exitPresentMode();
      if (event.key === "ArrowRight" || event.key === " ") setActiveSlide((index) => Math.min((deck?.slides.length || 1) - 1, index + 1));
      if (event.key === "ArrowLeft") setActiveSlide((index) => Math.max(0, index - 1));
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [deck?.slides.length]);

  useEffect(() => {
    function handleFullscreenChange() {
      if (!document.fullscreenElement) setPresenting(false);
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const active = deck?.slides[activeSlide] || deck?.slides[0];
  const slideCount = deck?.slides.length || 0;

  function updateActiveSlide(patch: Partial<PresentationSlide>) {
    setDeck((current) => {
      if (!current) return current;
      return {
        ...current,
        slides: current.slides.map((slide, index) => index === activeSlide ? { ...slide, ...patch } : slide)
      };
    });
  }

  function goToSlide(index: number) {
    setActiveSlide(Math.max(0, Math.min(slideCount - 1, index)));
  }

  async function enterPresentMode() {
    setPresenting(true);
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Some browsers block fullscreen requests; the fixed presenter view still fills the viewport.
    }
  }

  async function exitPresentMode() {
    setPresenting(false);
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen exit errors so the close button always returns to edit mode.
    }
  }

  function handleFullscreenClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("button") || target.closest("textarea") || target.closest("input")) {
      return;
    }
    const clientX = event.clientX;
    const halfWidth = window.innerWidth / 2;
    if (clientX > halfWidth) {
      setActiveSlide((index) => Math.min((deck?.slides.length || 1) - 1, index + 1));
    } else {
      setActiveSlide((index) => Math.max(0, index - 1));
    }
  }

  async function exportPdf() {
    const currentDeck = deck;
    if (!currentDeck) return;
    if (currentDeck.pdfFileUrl) {
      downloadFromUrl(currentDeck.pdfFileUrl, `${slugify(currentDeck.topic)}.pdf`);
      return;
    }
    try {
      await downloadPdf(currentDeck);
      toast({ title: "PDF downloaded", description: "Exported as a slide-perfect PDF." });
    } catch (error) {
      if (isPaymentRequiredError(error)) {
        openUpgrade("PDF export requires a Pro plan.");
        return;
      }
      const message = getErrorMessage(error, "Could not export PDF.");
      toast({ title: "PDF export failed", description: message });
    }
  }

  async function exportPpt() {
    const currentDeck = deck;
    if (!currentDeck) return;
    if (currentDeck.pptxFileUrl) {
      downloadFromUrl(currentDeck.pptxFileUrl, `${slugify(currentDeck.topic)}.pptx`);
      return;
    }
    try {
      await downloadPptx(currentDeck);
      toast({ title: "PPT downloaded", description: "Exported as a proper .pptx deck." });
    } catch (error) {
      if (isPaymentRequiredError(error)) {
        openUpgrade("PPTX export requires a Pro plan.");
        return;
      }
      const message = getErrorMessage(error, "Could not export PPT.");
      toast({ title: "PPT export failed", description: message });
    }
  }

  if (loading) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-[860px] place-items-center rounded-[20px] border border-white/70 bg-white/90 p-8 shadow-[0_14px_34px_rgba(39,30,91,0.07)]">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#e8e8ec] border-t-[#242424]" />
          <p className="mt-4 text-sm font-bold text-[#6d6f78]">Loading presentation...</p>
        </div>
      </div>
    );
  }

  if (!deck || !active) {
    return (
      <div className="mx-auto max-w-[860px] rounded-[20px] border border-white/70 bg-white/90 p-8 text-center shadow-[0_14px_34px_rgba(39,30,91,0.07)]">
        <h1 className="text-xl font-black text-[#25262b]">Presentation not found</h1>
        <p className="mt-2 text-sm font-medium text-[#6d6f78]">{errorMessage || "Generate a presentation again to open the output."}</p>
        <Link href="/dashboard/presentation-generator" className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[#25262b] px-4 text-sm font-bold text-white">
          Create presentation
        </Link>
      </div>
    );
  }

  return (
    <>
      <main className={cn("min-h-[calc(100vh-80px)] overflow-x-hidden rounded-[20px] p-2 sm:min-h-[calc(100vh-96px)] sm:rounded-[32px] sm:p-4 md:p-6 bg-slate-50/50 shadow-inner")}>
        <div className="mx-auto flex min-h-[calc(100vh-104px)] w-full max-w-[1280px] min-w-0 flex-col gap-3 sm:min-h-[calc(100vh-128px)] sm:gap-5">
          <Toolbar
            deck={deck}
            onPresent={enterPresentMode}
            onExportPdf={exportPdf}
            onExportPpt={exportPpt}
            isSaved={isSaved}
            onSaveToLibrary={handleSaveToLibrary}
          />
          <section className="grid min-h-0 min-w-0 flex-1 gap-4 md:grid-cols-[minmax(0,1fr)_240px] lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-5">
            <div className="flex min-w-0 flex-col gap-3 rounded-[20px] border border-white/80 bg-white/40 p-3 shadow-[0_20px_50px_rgba(15,23,42,0.04)] backdrop-blur-md sm:gap-5 sm:rounded-[32px] sm:p-6">
              <div className="relative flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden">
                <EditableSlide slide={active} onChange={updateActiveSlide} deckInstructions={deck.instructions} deckId={deck.id} slideIndex={activeSlide} />
              </div>
              <SlideImageSelector
                slide={active}
                onSelect={(index) => updateActiveSlide({ selectedImageIndex: index })}
              />
            </div>
            <SlidePreviewStrip
              slides={deck.slides}
              activeSlide={activeSlide}
              onSelect={goToSlide}
            />
          </section>
        </div>
      </main>

      {presenting ? (
        <div 
          onClick={handleFullscreenClick} 
          className="fixed inset-0 z-[100] bg-white cursor-pointer"
        >
          <EditableSlide slide={active} onChange={updateActiveSlide} fullBleed deckInstructions={deck.instructions} deckId={deck.id} slideIndex={activeSlide} />
          <button type="button" onClick={exitPresentMode} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white/75 text-slate-700 shadow-sm backdrop-blur-sm cursor-default" aria-label="Back from present view">
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : null}
    </>
  );
}

function SlidePreviewStrip({
  slides,
  activeSlide,
  onSelect
}: {
  slides: PresentationSlide[];
  activeSlide: number;
  onSelect: (index: number) => void;
}) {
  return (
    <aside
      className="min-h-0 min-w-0 rounded-[28px] border border-white/80 bg-white/70 p-4 font-sans text-slate-700 antialiased shadow-[0_16px_40px_rgba(15,23,42,0.04)] backdrop-blur-md"
      style={{ fontFeatureSettings: "\"cv02\", \"cv03\", \"cv04\", \"cv11\"" }}
    >
      <div className="mb-4 flex items-center justify-between gap-3 px-1">
        <p className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Slides</p>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold tabular-nums text-slate-500">{slides.length}</span>
      </div>
      <div className="flex max-h-[130px] gap-2 overflow-x-auto pr-1 sm:gap-3 md:max-h-[calc(100vh-230px)] md:flex-col md:overflow-x-hidden md:overflow-y-auto">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => onSelect(index)}
            className={cn(
              "grid w-[160px] shrink-0 grid-cols-[48px_minmax(0,1fr)] gap-2.5 rounded-[16px] border p-2.5 text-left transition-all duration-300 sm:w-[200px] sm:grid-cols-[56px_minmax(0,1fr)] sm:gap-3.5 sm:rounded-[20px] sm:p-3 md:w-full border-slate-100 bg-white/70 shadow-[0_4px_12px_rgba(0,0,0,0.015)]",
              activeSlide === index
                ? "border-blue-300 bg-blue-50/70 shadow-[0_12px_32px_rgba(37,99,235,0.12),inset_0_1px_1px_rgba(255,255,255,0.6)]"
                : "hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_12px_24px_rgba(59,86,128,0.08)]"
            )}
            aria-label={`Open slide ${index + 1}`}
          >
            <div className="relative aspect-square overflow-hidden rounded-[14px] bg-slate-100 border border-slate-200/50 shadow-inner">
              {selectedSlideImage(slide) ? (
                <img src={selectedSlideImage(slide)} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center bg-gradient-to-br from-blue-50 to-amber-50">
                  <ImageIcon className="h-5 w-5 text-slate-400" />
                </div>
              )}
            </div>
            <div className="min-w-0 self-center">
              <p className="line-clamp-2 text-[12.5px] font-bold leading-snug text-slate-800">{slide.title}</p>
              <p className="mt-1 line-clamp-1 text-[10.5px] font-semibold leading-none text-slate-400">{slide.points[0] || slide.subtitle || "Presentation slide"}</p>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}

function Toolbar({
  deck,
  onPresent,
  onExportPdf,
  onExportPpt,
  isSaved,
  onSaveToLibrary
}: {
  deck: any;
  onPresent: () => void;
  onExportPdf: () => void;
  onExportPpt: () => void;
  isSaved?: boolean;
  onSaveToLibrary?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "true";

  return (
    <header className="rounded-[24px] border border-white/80 bg-white/70 p-3.5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] backdrop-blur-md flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
      <div className="min-w-0">
        {isNew ? (
          <Link href="/dashboard/presentation-generator" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-blue-500 hover:text-blue-600 transition-colors duration-200">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Inputs
          </Link>
        ) : (
          <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-blue-500 hover:text-blue-600 transition-colors duration-200">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        )}
        <h1 className="mt-1.5 truncate text-base font-extrabold text-slate-900 sm:text-xl tracking-tight leading-none">{deck.topic}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {onSaveToLibrary && (
          isSaved ? (
            <Button type="button" variant="outline" disabled className="h-10 bg-emerald-50 text-emerald-700 border-emerald-200 cursor-not-allowed rounded-xl px-4 text-xs font-bold flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              Saved to Library
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={onSaveToLibrary} className="h-10 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl px-4 text-xs font-bold text-slate-700 shadow-sm active:scale-95 transition-all duration-200 flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save to Library
            </Button>
          )
        )}
        <Button type="button" onClick={onPresent} className="h-10 bg-slate-900 hover:bg-slate-800 rounded-xl px-4 text-xs font-bold text-white shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-95 transition-all duration-200 flex items-center gap-2">
          <Maximize2 className="h-4 w-4" />
          Present
        </Button>
        <Button type="button" variant="outline" onClick={onExportPpt} className="h-10 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl px-4 text-xs font-bold text-slate-700 shadow-sm active:scale-95 transition-all duration-200 flex items-center gap-2">
          <Download className="h-4 w-4" />
          PPT
        </Button>
        <Button type="button" variant="outline" onClick={onExportPdf} className="h-10 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl px-4 text-xs font-bold text-slate-700 shadow-sm active:scale-95 transition-all duration-200 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          PDF
        </Button>
      </div>
    </header>
  );
}

function SlideControls({
  activeSlide,
  slideCount,
  onPrevious,
  onNext,
  className
}: {
  activeSlide: number;
  slideCount: number;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3", className)}>
      <Button type="button" variant="outline" disabled={activeSlide === 0} onClick={onPrevious} aria-label="Previous slide" className="h-9 justify-center px-2 text-xs sm:h-10 sm:px-4 sm:text-sm">
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </Button>
      <p className={cn("text-sm font-black", slideTheme.muted)}>{activeSlide + 1} / {slideCount}</p>
      <Button type="button" variant="outline" disabled={activeSlide === slideCount - 1} onClick={onNext} aria-label="Next slide" className="h-9 justify-center px-2 text-xs sm:h-10 sm:px-4 sm:text-sm">
        <span className="hidden sm:inline">Next</span>
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function SlideImageSelector({
  slide,
  onSelect
}: {
  slide: PresentationSlide;
  onSelect: (index: number) => void;
}) {
  if (slide.imageUrls.length <= 1) return <div className="h-10" />;

  const imageIndex = clampImageIndex(slide.selectedImageIndex, slide.imageUrls.length);

  return (
    <div className="mx-auto mt-2 flex min-h-14 items-center justify-center gap-3 rounded-[20px] border border-white/80 bg-white/50 px-4 py-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur-md">
      {slide.imageUrls.slice(0, 3).map((url, index) => (
        <button
          key={`${url}-${index}`}
          type="button"
          onClick={() => onSelect(index)}
          className={cn(
            "aspect-video w-20 sm:w-28 overflow-hidden rounded-xl bg-white p-0.5 shadow-sm outline-none transition-all duration-300",
            imageIndex === index ? "ring-2 ring-slate-800 scale-105" : "opacity-60 hover:opacity-100 hover:scale-[1.02]"
          )}
          aria-label={`Use image ${index + 1}`}
        >
          <img src={url} alt="" className="h-full w-full rounded-[10px] object-cover" />
        </button>
      ))}
    </div>
  );
}

const themesMap: Record<string, {
  bgClass: string;
  textClass: string;
  mutedClass: string;
  dividerClass: string;
  bulletColor?: string;
  renderBackground: (slideIndex: number) => React.ReactNode;
}> = {
  Light: {
    bgClass: "bg-[#fcfcfd]/90",
    textClass: "text-slate-900",
    mutedClass: "text-slate-600/75",
    dividerClass: "bg-gradient-to-r from-sky-400 via-pink-300 to-amber-300",
    renderBackground: (slideIndex) => {
      const mode = slideIndex % 3;
      return (
        <>
          {/* Layered glowing ambient light blobs */}
          <div className="absolute top-[-10%] left-[-10%] w-[50cqw] h-[50cqw] rounded-full bg-blue-400/8 blur-[50px] pointer-events-none animate-[float-blob-1_25s_ease-in-out_infinite]" />
          <div className="absolute bottom-[-10%] right-[30%] w-[45cqw] h-[45cqw] rounded-full bg-pink-400/6 blur-[45px] pointer-events-none animate-[float-blob-2_30s_ease-in-out_infinite]" />
          <div className="absolute top-[20%] right-[-10%] w-[40cqw] h-[40cqw] rounded-full bg-purple-400/6 blur-[40px] pointer-events-none animate-[float-blob-3_28s_ease-in-out_infinite]" />
          
          <div className="absolute top-[4cqw] right-[4cqw] text-[6cqw] select-none opacity-38 animate-[pulse_3s_ease-in-out_infinite]">✨</div>
          {mode === 0 && (
            <>
              <div className="absolute bottom-[4cqw] left-[3cqw] text-[8cqw] select-none opacity-40">🌿</div>
              <div className="absolute top-[28cqw] left-[35cqw] text-[6.5cqw] select-none opacity-35">🌸</div>
            </>
          )}
          {mode === 1 && (
            <>
              <div className="absolute bottom-[4cqw] left-[3cqw] text-[8cqw] select-none opacity-40">🌸</div>
              <div className="absolute top-[28cqw] left-[35cqw] text-[7.5cqw] select-none opacity-35">🦋</div>
            </>
          )}
          {mode === 2 && (
            <>
              <div className="absolute bottom-[4cqw] left-[3cqw] text-[8cqw] select-none opacity-40">🍀</div>
              <div className="absolute top-[28cqw] left-[35cqw] text-[7cqw] select-none opacity-38">🐝</div>
            </>
          )}
        </>
      );
    }
  },
  Plains: {
    bgClass: "bg-[#fdfbf7]/95",
    textClass: "text-[#2e3c4e]",
    mutedClass: "text-[#4b5563]/75",
    dividerClass: "bg-[#8b5a2b]",
    bulletColor: "bg-[#8b5a2b] text-white",
    renderBackground: (slideIndex) => {
      const mode = slideIndex % 3;
      return (
        <>
          <div className="absolute top-[-15cqw] right-[-15cqw] w-[50cqw] h-[50cqw] rounded-full bg-amber-400/12 blur-[60px] pointer-events-none" />
          <div className="absolute top-[4cqw] right-[4cqw] text-[7cqw] select-none opacity-35">☀️</div>
          <div className="absolute bottom-0 left-0 right-0 h-[6cqw] bg-[#8b5a2b]/3 opacity-[0.04] rounded-t-[10cqw]" />

          {mode === 0 && (
            <>
              <div className="absolute bottom-[2.5cqw] left-[3cqw] text-[9cqw] select-none opacity-42 transition-transform hover:scale-110 duration-300">🦒</div>
              <div className="absolute bottom-[2.5cqw] right-[3cqw] text-[8.5cqw] select-none opacity-42 transition-transform hover:scale-110 duration-300">🦁</div>
              <div className="absolute bottom-[2.5cqw] right-[25%] text-[8cqw] select-none opacity-38">🌳</div>
              <div className="absolute top-[18cqw] left-[2cqw] text-[6cqw] select-none opacity-[0.35]">🦅</div>
            </>
          )}
          {mode === 1 && (
            <>
              <div className="absolute bottom-[2.5cqw] left-[3cqw] text-[9cqw] select-none opacity-42">🐘</div>
              <div className="absolute bottom-[2.5cqw] right-[3cqw] text-[8.5cqw] select-none opacity-42">🦓</div>
              <div className="absolute bottom-[2.5cqw] right-[25%] text-[8cqw] select-none opacity-38">🐆</div>
            </>
          )}
          {mode === 2 && (
            <>
              <div className="absolute bottom-[2.5cqw] left-[3cqw] text-[8.5cqw] select-none opacity-42">🐫</div>
              <div className="absolute bottom-[2.5cqw] right-[3cqw] text-[8.5cqw] select-none opacity-42">🐒</div>
              <div className="absolute bottom-[2.5cqw] right-[25%] text-[8cqw] select-none opacity-38">🌳</div>
            </>
          )}
        </>
      );
    }
  },
  Science: {
    bgClass: "bg-[#f5faff]/95",
    textClass: "text-slate-900",
    mutedClass: "text-[#3b5266]/75",
    dividerClass: "bg-[#0284c7]",
    bulletColor: "bg-[#0284c7] text-white",
    renderBackground: (slideIndex) => {
      const mode = slideIndex % 3;
      return (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-[45cqw] h-[45cqw] rounded-full bg-sky-400/10 blur-[40px] pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.025] bg-[linear-gradient(to_right,#0284c7_1px,transparent_1px),linear-gradient(to_bottom,#0284c7_1px,transparent_1px)] bg-[size:3cqw_3cqw] pointer-events-none" />
          
          {mode === 0 && (
            <>
              <div className="absolute top-[3.5cqw] left-[3cqw] text-[8.5cqw] select-none opacity-[0.42] rotate-12 transition-all hover:rotate-45 duration-500">🧬</div>
              <div className="absolute bottom-[3cqw] right-[3cqw] text-[8.5cqw] select-none opacity-[0.42]">🔬</div>
              <div className="absolute top-[4cqw] right-[35cqw] text-[6.5cqw] select-none opacity-[0.35]">⚛️</div>
            </>
          )}
          {mode === 1 && (
            <>
              <div className="absolute top-[3.5cqw] left-[3cqw] text-[8.5cqw] select-none opacity-[0.42] rotate-6">🪐</div>
              <div className="absolute bottom-[3cqw] right-[3cqw] text-[9cqw] select-none opacity-[0.42]">🚀</div>
              <div className="absolute top-[4cqw] right-[35cqw] text-[7cqw] select-none opacity-[0.35]">🔭</div>
            </>
          )}
          {mode === 2 && (
            <>
              <div className="absolute top-[3.5cqw] left-[3cqw] text-[8.5cqw] select-none opacity-[0.42] -rotate-12">🧪</div>
              <div className="absolute bottom-[3cqw] right-[3cqw] text-[8.5cqw] select-none opacity-[0.42]">💡</div>
              <div className="absolute top-[4cqw] right-[35cqw] text-[6.8cqw] select-none opacity-[0.35]">🔋</div>
            </>
          )}
        </>
      );
    }
  },
  Maths: {
    bgClass: "bg-[#fffdf5]/95",
    textClass: "text-slate-900",
    mutedClass: "text-[#5c5440]/75",
    dividerClass: "bg-[#0284c7]",
    bulletColor: "bg-[#0284c7] text-white",
    renderBackground: (slideIndex) => {
      const mode = slideIndex % 3;
      return (
        <>
          <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:2cqw_2cqw] pointer-events-none" />
          
          {mode === 0 && (
            <>
              <div className="absolute top-[3.5cqw] left-[35%] text-[6cqw] font-mono select-none opacity-[0.35] font-bold">π</div>
              <div className="absolute bottom-[2.5cqw] left-[3cqw] text-[8cqw] select-none opacity-42">✏️</div>
              <div className="absolute bottom-[2.5cqw] right-[20%] text-[8cqw] select-none opacity-42">📐</div>
              <div className="absolute bottom-[2.5cqw] right-[3cqw] text-[8cqw] select-none opacity-42">🧮</div>
            </>
          )}
          {mode === 1 && (
            <>
              <div className="absolute top-[3.5cqw] left-[35%] text-[6cqw] font-mono select-none opacity-[0.35] font-bold">∞</div>
              <div className="absolute bottom-[12cqw] left-[3cqw] text-[6cqw] font-mono select-none opacity-[0.35] font-bold">x² + y² = z²</div>
              <div className="absolute bottom-[2.5cqw] right-[20%] text-[8cqw] select-none opacity-38">📏</div>
              <div className="absolute bottom-[2.5cqw] right-[3cqw] text-[6.5cqw] font-mono select-none opacity-[0.35] font-bold">½</div>
            </>
          )}
          {mode === 2 && (
            <>
              <div className="absolute top-[3.5cqw] left-[35%] text-[6.5cqw] font-mono select-none opacity-[0.35] font-bold">∑</div>
              <div className="absolute bottom-[2.5cqw] left-[3cqw] text-[8cqw] select-none opacity-42">🧭</div>
              <div className="absolute bottom-[2.5cqw] right-[20%] text-[8cqw] select-none opacity-42">📈</div>
              <div className="absolute bottom-[2.5cqw] right-[3cqw] text-[8cqw] select-none opacity-42">⏰</div>
            </>
          )}
        </>
      );
    }
  },
  Simple: {
    bgClass: "bg-[#fafafa]/95",
    textClass: "text-slate-900",
    mutedClass: "text-slate-500",
    dividerClass: "bg-slate-300",
    bulletColor: "bg-slate-700 text-white",
    renderBackground: (slideIndex) => {
      const mode = slideIndex % 3;
      return (
        <>
          {/* Minimal dot matrix pattern */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:2.5cqw_2.5cqw] pointer-events-none" />
          
          {/* Thin elegant architectural border framing the left text side */}
          <div className="absolute top-[3cqw] bottom-[3cqw] left-[3cqw] w-[35cqw] border border-slate-900/[0.03] rounded-[1.2cqw] pointer-events-none" />
          
          {mode === 0 && (
            <div className="absolute bottom-[3.5cqw] left-[4cqw] text-[8cqw] select-none opacity-[0.35]">📏</div>
          )}
          {mode === 1 && (
            <div className="absolute bottom-[3.5cqw] left-[4cqw] text-[8cqw] select-none opacity-[0.35]">🧭</div>
          )}
          {mode === 2 && (
            <div className="absolute bottom-[3.5cqw] left-[4cqw] text-[8cqw] select-none opacity-[0.35]">📝</div>
          )}
        </>
      );
    }
  },
  Deep: {
    bgClass: "bg-[#0b1426]/95",
    textClass: "text-white",
    mutedClass: "text-blue-200/75",
    dividerClass: "bg-gradient-to-r from-sky-400 to-teal-400",
    bulletColor: "bg-sky-400 text-blue-900",
    renderBackground: (slideIndex) => {
      const mode = slideIndex % 3;
      return (
        <>
          {/* Deep blue ocean light glows */}
          <div className="absolute top-[-10%] left-[-10%] w-[50cqw] h-[50cqw] rounded-full bg-blue-500/15 blur-[55px] pointer-events-none animate-[float-blob-1_25s_ease-in-out_infinite]" />
          <div className="absolute bottom-[-10%] right-[30%] w-[45cqw] h-[45cqw] rounded-full bg-teal-500/10 blur-[50px] pointer-events-none animate-[float-blob-2_30s_ease-in-out_infinite]" />
          
          {/* Marine Bubble animations */}
          <div className="absolute bottom-[5cqw] left-[8cqw] w-[1cqw] h-[1cqw] rounded-full bg-white/20 animate-pulse" />
          <div className="absolute bottom-[15cqw] left-[9cqw] w-[0.6cqw] h-[0.6cqw] rounded-full bg-white/10 animate-ping" />
          <div className="absolute bottom-[25cqw] right-[32cqw] w-[0.8cqw] h-[0.8cqw] rounded-full bg-white/20" />

          {mode === 0 && (
            <>
              <div className="absolute bottom-[2.5cqw] right-[5cqw] text-[9.5cqw] select-none opacity-[0.42] -scale-x-100 transition-transform duration-[4000ms] hover:translate-x-[-10cqw]">🐋</div>
              <div className="absolute top-[3.5cqw] left-[4cqw] text-[6.5cqw] select-none opacity-35">🐠</div>
              <div className="absolute bottom-[10cqw] left-[2cqw] text-[6.8cqw] select-none opacity-35">🪸</div>
            </>
          )}
          {mode === 1 && (
            <>
              <div className="absolute bottom-[2.5cqw] right-[5cqw] text-[9cqw] select-none opacity-[0.42]">🐬</div>
              <div className="absolute top-[3.5cqw] left-[4cqw] text-[6.5cqw] select-none opacity-35">🐢</div>
              <div className="absolute bottom-[10cqw] left-[2cqw] text-[7cqw] select-none opacity-35">⭐</div>
            </>
          )}
          {mode === 2 && (
            <>
              <div className="absolute bottom-[2.5cqw] right-[5cqw] text-[9cqw] select-none opacity-[0.42] -scale-x-100">🦈</div>
              <div className="absolute top-[3.5cqw] left-[4cqw] text-[6.5cqw] select-none opacity-35">🐙</div>
              <div className="absolute bottom-[10cqw] left-[2cqw] text-[6.8cqw] select-none opacity-35">🪸</div>
            </>
          )}
        </>
      );
    }
  },
  Classic: {
    bgClass: "bg-[#fcfcfd]/90",
    textClass: "text-slate-900",
    mutedClass: "text-slate-600/75",
    dividerClass: "bg-[#eb3b5a]",
    bulletColor: "bg-[#eb3b5a] text-white",
    renderBackground: () => (
      <>
        <div className="absolute top-[-10%] right-[-10%] w-24 h-24 rounded-full bg-[#fca5a5]/10 blur-md pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-20 h-20 rounded-full bg-[#cbd5e1]/15 blur-md pointer-events-none" />
      </>
    )
  },
  Mono: {
    bgClass: "bg-white",
    textClass: "text-black font-mono",
    mutedClass: "text-slate-700 font-mono",
    dividerClass: "bg-black",
    bulletColor: "bg-black text-white",
    renderBackground: () => null
  },
  Gradient: {
    bgClass: "bg-gradient-to-br from-orange-100/90 to-rose-100/90",
    textClass: "text-slate-900",
    mutedClass: "text-slate-700/75",
    dividerClass: "bg-[#0d9488]",
    bulletColor: "bg-[#0d9488] text-white",
    renderBackground: () => null
  },
  "Gradient II": {
    bgClass: "bg-gradient-to-br from-sky-100/90 to-teal-50/90",
    textClass: "text-slate-900",
    mutedClass: "text-slate-700/75",
    dividerClass: "bg-[#db2777]",
    bulletColor: "bg-[#db2777] text-white",
    renderBackground: () => null
  },
  Dark: {
    bgClass: "bg-[#090d16]/95",
    textClass: "text-white",
    mutedClass: "text-slate-400",
    dividerClass: "bg-[#38bdf8]",
    bulletColor: "bg-[#38bdf8] text-slate-950",
    renderBackground: () => (
      <>
        <div className="absolute top-2 right-4 text-[4cqw] select-none opacity-20">🌙</div>
        <div className="absolute bottom-2 left-4 text-[3cqw] select-none opacity-20">💫</div>
      </>
    )
  },
  Bold: {
    bgClass: "bg-[#d97706]/95",
    textClass: "text-white",
    mutedClass: "text-amber-100/80",
    dividerClass: "bg-white",
    bulletColor: "bg-white text-amber-900",
    renderBackground: () => null
  },
  Bright: {
    bgClass: "bg-[#5cbeb3]/95",
    textClass: "text-slate-950",
    mutedClass: "text-slate-800/80",
    dividerClass: "bg-white",
    bulletColor: "bg-white text-[#48a89d]",
    renderBackground: () => null
  },
  Pink: {
    bgClass: "bg-[#f472b6]/95",
    textClass: "text-white",
    mutedClass: "text-pink-100/80",
    dividerClass: "bg-white",
    bulletColor: "bg-white text-pink-700",
    renderBackground: () => null
  },
  Rust: {
    bgClass: "bg-[#b45309]/95",
    textClass: "text-white",
    mutedClass: "text-amber-100/80",
    dividerClass: "bg-white",
    bulletColor: "bg-white text-amber-950",
    renderBackground: () => null
  }
};

function EditableSlide({
  slide,
  onChange,
  large = false,
  fullBleed = false,
  deckInstructions = null,
  deckId = "",
  slideIndex = 0
}: {
  slide: PresentationSlide;
  onChange: (patch: Partial<PresentationSlide>) => void;
  large?: boolean;
  fullBleed?: boolean;
  deckInstructions?: string | null;
  deckId?: string;
  slideIndex?: number;
}) {
  const [titleDraft, setTitleDraft] = useState("");
  const [contentDraft, setContentDraft] = useState("");
  const [editingContent, setEditingContent] = useState(false);
  const imageIndex = clampImageIndex(slide.selectedImageIndex, slide.imageUrls.length);
  const currentImage = slide.imageUrls[imageIndex];
  const contentText = useMemo(() => formatBulletText([slide.subtitle || "", ...slide.points].filter(Boolean)), [slide.id, slide.points, slide.subtitle]);
  const displayBullets = useMemo(() => slideBullets(slide), [slide.id, slide.points, slide.subtitle]);
  
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const selectedTheme = useMemo(() => {
    const local = (typeof window !== "undefined" && deckId) ? localStorage.getItem(`presentation_theme_${deckId}`) : null;
    if (local) return local;
    if (!deckInstructions) return "Light";
    const match = deckInstructions.match(/\[Theme:\s*([^\]]+)\]/);
    return match ? match[1].trim() : "Light";
  }, [deckId, deckInstructions]);

  const themeStyle = useMemo(() => themesMap[selectedTheme] || themesMap.Light, [selectedTheme]);

  useEffect(() => {
    setTitleDraft(slide.title);
    setContentDraft(contentText);
    setEditingContent(false);
    
    // Trigger autoSize on title textarea once rendered to avoid vertical clipping on initial load
    setTimeout(() => {
      if (titleRef.current) {
        autoSize(titleRef.current);
      }
    }, 50);
  }, [slide.id]);

  function autoSize(element: HTMLTextAreaElement) {
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }

  function handleFocus(event: FocusEvent<HTMLTextAreaElement>) {
    autoSize(event.currentTarget);
  }

  function updateTitle(value: string) {
    setTitleDraft(value);
    onChange({ title: value.trim() || "Untitled slide" });
  }

  function updateContent(value: string) {
    setContentDraft(value);
    onChange({ subtitle: null, points: parseBulletText(value) });
  }

  return (
    <div
      className={cn(
        "relative aspect-[16/9] w-full overflow-hidden rounded-[24px] border border-white/25 shadow-[0_24px_60px_rgba(15,23,42,0.10),inset_0_1px_1px_rgba(255,255,255,0.7)] backdrop-blur-[24px] font-sans antialiased @container slide-loading-animate hover:-translate-y-0.5 hover:shadow-[0_32px_72px_rgba(15,23,42,0.14)] transition-all duration-500 ease-out",
        themeStyle.bgClass,
        fullBleed && "w-screen h-screen max-h-none max-w-none rounded-none border-0 shadow-none sm:max-h-none sm:rounded-none hover:translate-y-0 hover:shadow-none"
      )}
      style={{ 
        fontFeatureSettings: "\"cv02\", \"cv03\", \"cv04\", \"cv11\"",
        containerType: "inline-size"
      }}
    >
      <style>{`
        @keyframes slide-appear {
          from {
            opacity: 0;
            transform: scale(0.99) translateY(3px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes float-blob-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(2%, 3%) scale(1.03); }
          66% { transform: translate(-1%, 1%) scale(0.97); }
        }
        @keyframes float-blob-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-3%, -2%) scale(1.05); }
        }
        @keyframes float-blob-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(1%, -3%) scale(0.95); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .slide-loading-animate {
          animation: slide-appear 500ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      {/* Premium Background Blurs */}
      {themeStyle.renderBackground(slideIndex)}

      <div className="relative grid h-full min-w-0 grid-cols-[minmax(0,40%)_minmax(0,60%)] bg-transparent">
        <div className="pointer-events-none absolute left-[38%] top-0 h-full w-[10%] bg-gradient-to-r from-[#fcfcfd]/70 to-transparent" />
        
        <div className={cn(
          "relative z-10 flex min-w-0 flex-col justify-between p-[3.5cqw] pr-[2cqw]"
        )}>
          <div className="flex flex-col gap-[1cqw]">
            <textarea
              ref={titleRef}
              value={titleDraft}
              onChange={(event) => updateTitle(event.target.value)}
              onInput={(event) => autoSize(event.currentTarget)}
              onFocus={handleFocus}
              readOnly={fullBleed}
              rows={2}
              spellCheck={false}
              placeholder="Slide heading"
              className={cn(
                "w-full resize-none overflow-hidden rounded-xl border border-transparent bg-transparent p-[0.4cqw] font-extrabold leading-[1.12] outline-none transition placeholder:text-slate-400/60 break-words break-normal",
                !fullBleed && "focus:border-slate-200/80 focus:bg-white/40",
                themeStyle.textClass,
                fullBleed ? "text-[3.2cqw]" : "text-[2.2cqw]"
              )}
              aria-label="Slide heading"
            />
            <div className={cn("h-[0.3cqw] w-[8cqw] rounded-full ml-[0.5cqw]", themeStyle.dividerClass)} />
          </div>

          {!fullBleed && editingContent ? (
            <textarea
              value={contentDraft}
              onChange={(event) => updateContent(event.target.value)}
              onBlur={() => setEditingContent(false)}
              autoFocus
              placeholder={"Slide content\nAdd one idea per line"}
              className={cn(
                "mt-[2cqw] min-h-0 flex-1 resize-none rounded-[1.2cqw] border border-slate-200/80 bg-white/60 p-[1.2cqw] font-medium leading-relaxed outline-none transition placeholder:text-slate-400/60 focus:border-blue-400/50 focus:bg-white/95 text-[1.35cqw] break-words break-normal",
                themeStyle.textClass
              )}
              aria-label="Slide content"
            />
          ) : (
            <div
              onClick={() => {
                if (!fullBleed) setEditingContent(true);
              }}
              className={cn(
                "mt-[2cqw] flex min-h-0 flex-1 flex-col justify-center rounded-[20px] p-[0.4cqw] text-left outline-none",
                !fullBleed && "cursor-pointer border border-transparent transition hover:bg-black/[0.01]"
              )}
              role={!fullBleed ? "button" : undefined}
              aria-label={!fullBleed ? "Edit slide content" : undefined}
            >
              <div className="flex flex-col gap-[1cqw] w-full">
                {displayBullets.map((point, index) => {
                  const colors = [
                    "bg-[#e0f2fe] text-[#0284c7]",
                    "bg-[#fce7f3] text-[#db2777]",
                    "bg-[#fef3c7] text-[#d97706]",
                    "bg-[#ede9fe] text-[#7c3aed]"
                  ];
                  const colorClass = colors[index % colors.length];
                  const bulletColorClass = themeStyle.bulletColor || colorClass;
                  return (
                    <div 
                      key={point} 
                      className={cn(
                        "group/bullet flex items-start gap-[1cqw] rounded-[1.2cqw] border border-white/50 bg-white/40 p-[1cqw] px-[1.2cqw] shadow-[0_4px_12px_rgba(0,0,0,0.01)] backdrop-blur-[6px] transition-all duration-300",
                        !fullBleed && "hover:translate-x-1 hover:bg-white/60 hover:shadow-[0_8px_20px_rgba(0,0,0,0.02)]"
                      )}
                      style={{ 
                        animation: 'slide-appear 500ms cubic-bezier(0.16, 1, 0.3, 1) both', 
                        animationDelay: `${index * 80}ms` 
                      }}
                    >
                      <span className={cn(
                        "rounded-full flex items-center justify-center shrink-0 h-[2.2cqw] w-[2.2cqw]",
                        bulletColorClass
                      )}>
                        <span className="h-[0.7cqw] w-[0.7cqw] rounded-full bg-current" />
                      </span>
                      <span className={cn("font-semibold leading-relaxed text-[1.35cqw] transition-colors duration-200", !fullBleed && "group-hover/bullet:text-[#1a1a1a]", themeStyle.textClass)}>
                        {point}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="relative flex items-center justify-center p-[2.5cqw] min-h-0 min-w-0 bg-gradient-to-r from-transparent via-white/90 to-white w-full h-full z-10">
          {/* Subtle glow behind image */}
          <div className="absolute inset-0 bg-gradient-to-tr from-sky-200/5 via-pink-200/5 to-purple-200/5 rounded-[3cqw] blur-[24px] scale-90 pointer-events-none" />
          
          {currentImage ? (
            <img
              src={currentImage}
              alt={slide.title}
              className="max-h-[92%] max-w-[92%] object-contain rounded-[1.8cqw] transition-all duration-500 hover:scale-[1.01]"
              onError={() => onChange({ selectedImageIndex: Math.min(imageIndex + 1, slide.imageUrls.length - 1) })}
            />
          ) : (
            <div className={cn("grid place-items-center gap-[1.2cqw] text-center bg-white/30 border border-white/40 backdrop-blur-[6px] w-[92%] h-[92%] justify-center rounded-[1.8cqw]", slideTheme.muted)}>
              <ImageIcon className="h-[4.5cqw] w-[4.5cqw]" />
              <span className="px-[1.2cqw] text-[1.2cqw] font-bold uppercase tracking-wider">{slide.visual || "Visual"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function clampImageIndex(value: number | undefined, imageCount: number) {
  if (!imageCount) return 0;
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(imageCount - 1, value));
}

function selectedSlideImage(slide: PresentationSlide) {
  return slide.imageUrls[clampImageIndex(slide.selectedImageIndex, slide.imageUrls.length)] || "";
}

function formatBulletText(items: string[]) {
  return items.slice(0, 4).map((item) => `• ${cleanBullet(item)}`).join("\n");
}

function parseBulletText(value: string) {
  return value.split("\n").map(cleanBullet).filter(Boolean).slice(0, 4);
}

function cleanBullet(value: string) {
  return value.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim();
}

function slideBullets(slide: PresentationSlide) {
  return [slide.subtitle || "", ...slide.points].map(cleanBullet).filter(Boolean).slice(0, 4);
}

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function slugify(value: string) {
  return (value || "presentation").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "presentation";
}



async function downloadPdf(deck: PresentationDeck) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "in",
    format: [13.333, 7.5],
    compress: true
  });

  for (let index = 0; index < deck.slides.length; index += 1) {
    const slide = deck.slides[index];
    if (index > 0) pdf.addPage([13.333, 7.5], "landscape");

    const selectedImage = selectedSlideImage(slide);
    const imageData = selectedImage ? await imageUrlToDataUri(selectedImage) : "";
    const bullets = slideBullets(slide);

    pdf.setFillColor("#FFFFFF");
    pdf.rect(0, 0, 13.333, 7.5, "F");
    pdf.setFillColor("#F8FBFF");
    pdf.rect(0, 0, 5.35, 7.5, "F");
    pdf.setFillColor("#FFFFFF");
    pdf.rect(5.0, 0, 0.45, 7.5, "F");
    pdf.setFillColor("#7DD3FC");
    pdf.circle(0.48, 0.52, 0.055, "F");
    pdf.setFillColor("#F9A8D4");
    pdf.circle(4.23, 6.42, 0.075, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor("#171717");
    pdf.setFontSize(34);
    const titleLines = pdf.splitTextToSize(slide.title || "Untitled slide", 4.15).slice(0, 3);
    pdf.text(titleLines, 0.58, 1.08, { lineHeightFactor: 1.08 });

    pdf.setFillColor("#38BDF8");
    pdf.roundedRect(0.66, 2.5, 1.05, 0.05, 0.025, 0.025, "F");

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(18);
    pdf.setTextColor("#5F6368");
    let y = 3.18;
    for (let bulletIndex = 0; bulletIndex < bullets.length; bulletIndex += 1) {
      const point = bullets[bulletIndex];
      const lines = pdf.splitTextToSize(point, 3.55).slice(0, 2);
      pdf.setFillColor(bulletIndex % 3 === 0 ? "#38BDF8" : bulletIndex % 3 === 1 ? "#F9A8D4" : "#FCD34D");
      pdf.circle(0.82, y - 0.07, 0.045, "F");
      pdf.setTextColor("#5F6368");
      pdf.text(lines, 1.02, y, { lineHeightFactor: 1.25 });
      y += 0.36 * lines.length + 0.16;
      if (y > 6.35) break;
    }

    if (imageData) {
      const props = pdf.getImageProperties(imageData);
      const box = containRect(5.55, 0.38, 7.35, 6.74, props.width, props.height);
      pdf.addImage(imageData, props.fileType, box.x, box.y, box.w, box.h);
    } else {
      pdf.setDrawColor("#E7E7EA");
      pdf.setFillColor("#F8FAFC");
      pdf.roundedRect(5.65, 0.55, 7.1, 6.4, 0.08, 0.08, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.setTextColor("#8A8F98");
      pdf.text(slide.visual || "Classroom visual", 9.2, 3.6, { align: "center", maxWidth: 6.4 });
    }
  }

  pdf.save(`${slugify(deck.topic)}.pdf`);
}

async function imageUrlToDataUri(url: string) {
  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) return "";
    const blob = await response.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

function containImage(x: number, y: number, w: number, h: number) {
  return { x, y, w, h, sizing: { type: "contain" as const, x, y, w, h } };
}

function containRect(x: number, y: number, w: number, h: number, imageWidth: number, imageHeight: number) {
  const imageRatio = imageWidth / imageHeight;
  const boxRatio = w / h;
  if (imageRatio > boxRatio) {
    const nextH = w / imageRatio;
    return { x, y: y + (h - nextH) / 2, w, h: nextH };
  }
  const nextW = h * imageRatio;
  return { x: x + (w - nextW) / 2, y, w: nextW, h };
}

function downloadFromUrl(url: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function buildPptHtml(deck: PresentationDeck) {
  const slides = deck.slides.map((slide) => {
    const selectedImage = selectedSlideImage(slide);
    const image = selectedImage ? `<img src="${escapeHtml(selectedImage)}" alt="">` : "";
    const points = slideBullets(slide).map((point) => `<li>${escapeHtml(point)}</li>`).join("");
    return `
      <section class="slide">
        <div class="copy">
          <h1>${escapeHtml(slide.title)}</h1>
          ${slide.subtitle ? `<p class="subtitle">${escapeHtml(slide.subtitle)}</p>` : ""}
          <ul>${points}</ul>
        </div>
        <div class="visual">${image}</div>
      </section>
    `;
  }).join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(deck.topic)}</title>
  <style>
    @page { size: 13.333in 7.5in; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Aptos, Arial, Helvetica, sans-serif; color: #171717; background: #ffffff; }
    .slide {
      page-break-after: always;
      width: 13.333in;
      height: 7.5in;
      display: grid;
      grid-template-columns: 40% 60%;
      overflow: hidden;
      background: #fff;
    }
    .copy {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: .62in .28in .62in .62in;
      background:
        radial-gradient(circle at 18% 14%, rgba(219,234,254,.72) 0, transparent 34%),
        radial-gradient(circle at 86% 18%, rgba(252,231,243,.58) 0, transparent 32%),
        linear-gradient(135deg,#fff 0%,#fbfdff 58%,#fff9fb 100%);
    }
    .copy::after {
      content: "";
      position: absolute;
      inset: 0 0 0 auto;
      width: 24%;
      background: linear-gradient(90deg, transparent, #fff);
      pointer-events: none;
    }
    h1 { position: relative; z-index: 1; margin: 0; font-size: 34pt; line-height: 1.08; font-weight: 700; letter-spacing: 0; }
    h1::after { content: ""; display: block; width: 1.05in; height: .05in; margin-top: .22in; border-radius: 999px; background: linear-gradient(90deg,#38bdf8,#f9a8d4,#fcd34d); }
    .subtitle { position: relative; z-index: 1; margin: .22in 0 0; font-size: 16pt; font-weight: 600; color: #5f6368; }
    ul { position: relative; z-index: 1; margin: .34in 0 0; padding-left: .28in; font-size: 17pt; line-height: 1.35; color: #5f6368; font-weight: 500; }
    li { margin: 0 0 .12in; }
    li::marker { color: #38bdf8; }
    .visual { display: flex; align-items: center; justify-content: center; overflow: hidden; padding: .38in; }
    .visual img { max-width: 100%; max-height: 100%; object-fit: contain; }
    @media screen { body { display: grid; place-items: start center; background: #f7f7f8; } .slide { margin: 24px 0; box-shadow: 0 18px 42px rgba(39,30,91,.12); } }
  </style>
</head>
<body>${slides}
<script>
  async function printWhenReady() {
    const images = Array.from(document.images);
    await Promise.all(images.map((image) => image.complete ? Promise.resolve() : new Promise((resolve) => {
      image.onload = resolve;
      image.onerror = resolve;
    })));
    setTimeout(() => window.print(), 120);
  }
  printWhenReady();
</script>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char] || char));
}
