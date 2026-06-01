"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FocusEvent } from "react";
import { ArrowLeft, ArrowRight, Download, FileText, ImageIcon, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { backendApi, isPaymentRequiredError } from "@/lib/api";
import { useUpgradeModal } from "@/components/billing/upgrade-modal";
import {
  loadLatestPresentationId,
  presentationGenerationToDeck,
  type PresentationDeck,
  type PresentationSlide
} from "@/lib/presentation-generator";
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
        setActiveSlide(0);
      })
      .catch((error) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Could not load presentation.";
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
      const message = error instanceof Error ? error.message : "Could not export PDF.";
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
      const message = error instanceof Error ? error.message : "Could not export PPT.";
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
      <main className={cn("min-h-[calc(100vh-80px)] overflow-x-hidden rounded-[18px] p-2 sm:min-h-[calc(100vh-96px)] sm:rounded-[24px] sm:p-4", slideTheme.page)}>
        <div className="mx-auto flex min-h-[calc(100vh-104px)] w-full max-w-[1280px] min-w-0 flex-col gap-2 sm:min-h-[calc(100vh-128px)] sm:gap-3">
          <Toolbar
            deck={deck}
            onPresent={enterPresentMode}
            onExportPdf={exportPdf}
            onExportPpt={exportPpt}
          />
          <section className="grid min-h-0 min-w-0 flex-1 gap-2 md:grid-cols-[minmax(0,1fr)_240px] lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-3">
            <div className="flex min-w-0 flex-col gap-2 rounded-[18px] border border-white/70 bg-white/55 p-2 shadow-[0_14px_34px_rgba(39,30,91,0.06)] sm:gap-3 sm:rounded-[22px] sm:p-5">
              <div className="grid min-w-0 flex-1 place-items-center">
                <EditableSlide slide={active} onChange={updateActiveSlide} />
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
        <div className="fixed inset-0 z-[100] bg-white">
          <EditableSlide slide={active} onChange={updateActiveSlide} fullBleed />
          <button type="button" onClick={exitPresentMode} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white/75 text-slate-700 shadow-sm backdrop-blur-sm" aria-label="Back from present view">
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
      className="min-h-0 min-w-0 rounded-[22px] border border-white/80 bg-white/85 p-3 font-sans text-slate-700 antialiased shadow-[0_18px_42px_rgba(59,86,128,0.1)] backdrop-blur-sm"
      style={{ fontFeatureSettings: "\"cv02\", \"cv03\", \"cv04\", \"cv11\"" }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold leading-none text-slate-700">Slides</p>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-500">{slides.length}</span>
      </div>
      <div className="flex max-h-[140px] gap-2 overflow-x-auto pr-1 md:max-h-[calc(100vh-230px)] md:flex-col md:overflow-x-hidden md:overflow-y-auto">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => onSelect(index)}
            className={cn(
              "grid w-[200px] shrink-0 grid-cols-[52px_minmax(0,1fr)] gap-3 rounded-[18px] border p-2.5 text-left transition md:w-full",
              activeSlide === index
                ? "border-blue-300 bg-blue-50/90 shadow-[0_14px_28px_rgba(37,99,235,0.14)]"
                : "border-slate-200/80 bg-white shadow-sm hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_12px_24px_rgba(59,86,128,0.12)]"
            )}
            aria-label={`Open slide ${index + 1}`}
          >
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
              {selectedSlideImage(slide) ? (
                <img src={selectedSlideImage(slide)} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center bg-gradient-to-br from-blue-50 to-amber-50">
                  <ImageIcon className="h-5 w-5 text-slate-400" />
                </div>
              )}
            </div>
            <div className="min-w-0 self-center">
              <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-800">{slide.title}</p>
              <p className="mt-1 line-clamp-1 text-[11px] font-medium leading-snug text-slate-500">{slide.points[0] || slide.subtitle || "Presentation slide"}</p>
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
  onExportPpt
}: {
  deck: PresentationDeck;
  onPresent: () => void;
  onExportPdf: () => void;
  onExportPpt: () => void;
}) {
  return (
    <header className="flex flex-col gap-2 rounded-[16px] border border-white/70 bg-white/90 p-2.5 shadow-[0_14px_34px_rgba(39,30,91,0.06)] sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:rounded-[18px] sm:p-3">
      <div className="min-w-0">
        <Link href="/dashboard/presentation-generator" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.08em] text-[#2563eb] transition hover:text-[#1d4ed8]">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Inputs
        </Link>
        <h1 className="mt-1 truncate text-base font-black text-[#25262b] sm:text-lg">{deck.topic}</h1>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <Button type="button" onClick={onPresent} className="h-9 bg-[#25262b] px-2 text-xs text-white hover:bg-[#171717] sm:h-10 sm:px-4 sm:text-sm">
          <Maximize2 className="h-4 w-4" />
          Present
        </Button>
        <Button type="button" variant="outline" onClick={onExportPpt} className="h-9 px-2 text-xs sm:h-10 sm:px-4 sm:text-sm">
          <Download className="h-4 w-4" />
          PPT
        </Button>
        <Button type="button" variant="outline" onClick={onExportPdf} className="h-9 px-2 text-xs sm:h-10 sm:px-4 sm:text-sm">
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
    <div className="flex min-h-14 items-center justify-center gap-2 rounded-[16px] border border-white/70 bg-white/70 px-3 py-2 shadow-sm">
      {slide.imageUrls.slice(0, 3).map((url, index) => (
        <button
          key={`${url}-${index}`}
          type="button"
          onClick={() => onSelect(index)}
          className={cn(
            "aspect-video w-24 overflow-hidden rounded-xl bg-white/85 p-0.5 shadow-sm outline-none transition focus:ring-2 focus:ring-[#55516e] sm:w-32",
            imageIndex === index ? "ring-2 ring-[#25262b]" : "opacity-75 hover:opacity-100"
          )}
          aria-label={`Use image ${index + 1}`}
        >
          <img src={url} alt="" className="h-full w-full rounded-lg object-cover" />
        </button>
      ))}
    </div>
  );
}

function EditableSlide({
  slide,
  onChange,
  large = false,
  fullBleed = false
}: {
  slide: PresentationSlide;
  onChange: (patch: Partial<PresentationSlide>) => void;
  large?: boolean;
  fullBleed?: boolean;
}) {
  const [titleDraft, setTitleDraft] = useState("");
  const [contentDraft, setContentDraft] = useState("");
  const [editingContent, setEditingContent] = useState(false);
  const imageIndex = clampImageIndex(slide.selectedImageIndex, slide.imageUrls.length);
  const currentImage = slide.imageUrls[imageIndex];
  const contentText = useMemo(() => formatBulletText([slide.subtitle || "", ...slide.points].filter(Boolean)), [slide.id, slide.points, slide.subtitle]);
  const displayBullets = useMemo(() => slideBullets(slide), [slide.id, slide.points, slide.subtitle]);

  useEffect(() => {
    setTitleDraft(slide.title);
    setContentDraft(contentText);
    setEditingContent(false);
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
        "aspect-[16/9] w-full max-w-full overflow-hidden rounded-[12px] border font-sans antialiased shadow-sm sm:rounded-[16px]",
        slideTheme.slide,
        slideTheme.border,
        large ? "sm:max-h-[calc(100vh-150px)]" : "sm:max-h-[calc(100vh-250px)]",
        fullBleed && "h-screen max-h-none rounded-none border-0 shadow-none sm:max-h-none sm:rounded-none"
      )}
      style={{ fontFeatureSettings: "\"cv02\", \"cv03\", \"cv04\", \"cv11\"" }}
    >
      <div className="relative grid h-full min-w-0 grid-cols-[minmax(0,40%)_minmax(0,60%)] bg-white">
        <div className="pointer-events-none absolute left-[5%] top-[12%] h-2 w-2 rounded-full bg-sky-300/70 sm:h-3 sm:w-3" />
        <div className="pointer-events-none absolute bottom-[14%] left-[32%] h-3 w-3 rounded-full bg-pink-300/60 sm:h-4 sm:w-4" />
        <div className="pointer-events-none absolute left-[44%] top-0 h-full w-[10%] bg-gradient-to-r from-white/70 to-transparent" />
        <div className={cn(
          "relative z-10 flex min-w-0 flex-col bg-[radial-gradient(circle_at_18%_14%,rgba(219,234,254,0.72)_0,transparent_34%),radial-gradient(circle_at_86%_18%,rgba(252,231,243,0.58)_0,transparent_32%),linear-gradient(135deg,#ffffff_0%,#fbfdff_58%,#fff9fb_100%)]",
          large ? "p-2 pr-1 sm:p-12 sm:pr-6" : "p-2 pr-1 sm:p-8 sm:pr-5"
        )}>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-[22%] bg-gradient-to-r from-transparent to-white" />
          <textarea
            value={titleDraft}
            onChange={(event) => updateTitle(event.target.value)}
            onInput={(event) => autoSize(event.currentTarget)}
            onFocus={handleFocus}
            rows={2}
            spellCheck={false}
            placeholder="Slide heading"
            className={cn(
              "w-full resize-none overflow-hidden rounded-lg border border-transparent bg-transparent p-1.5 font-semibold leading-[1.08] outline-none transition placeholder:text-current/25 focus:border-[#d9d9de] focus:bg-black/[0.02] sm:rounded-xl sm:p-3",
              slideTheme.text,
              large ? "text-[clamp(0.78rem,4.2vw,4.2rem)] sm:text-[clamp(2rem,3.8vw,4.2rem)]" : "text-[clamp(0.72rem,4vw,3rem)] sm:text-[clamp(1.55rem,2.9vw,3rem)]"
            )}
            aria-label="Slide heading"
          />
          <div className={cn("ml-1.5 mt-1 h-1 w-14 rounded-full bg-gradient-to-r from-sky-400 via-pink-300 to-amber-300 sm:ml-3", large ? "sm:mt-3 sm:h-2 sm:w-28" : "sm:mt-2 sm:w-24")} />
          {editingContent ? (
            <textarea
              value={contentDraft}
              onChange={(event) => updateContent(event.target.value)}
              onBlur={() => setEditingContent(false)}
              autoFocus
              placeholder={"Slide content\nAdd one idea per line"}
              className={cn(
                "mt-1 min-h-0 flex-1 resize-none rounded-lg border border-transparent bg-transparent p-1 font-medium leading-4 outline-none transition placeholder:text-current/25 focus:border-[#d9d9de] focus:bg-black/[0.02] sm:mt-4 sm:rounded-xl sm:p-3 sm:leading-7",
                slideTheme.muted,
                fullBleed
                  ? "text-[clamp(0.9rem,2.2vw,2.2rem)]"
                  : large
                    ? "text-[clamp(0.5rem,2.6vw,1.75rem)] sm:text-[clamp(1.1rem,1.8vw,1.75rem)]"
                    : "text-[clamp(0.48rem,2.45vw,1.25rem)] sm:text-[clamp(0.95rem,1.25vw,1.25rem)]"
              )}
              aria-label="Slide content"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingContent(true)}
              className={cn(
                "mt-1 flex min-h-0 flex-1 flex-col justify-center rounded-lg border border-transparent p-1 text-left outline-none transition hover:bg-black/[0.02] focus:border-[#d9d9de] focus:bg-black/[0.02] sm:mt-5 sm:rounded-xl sm:p-3",
                slideTheme.muted
              )}
              aria-label="Edit slide content"
            >
              <ul className={cn("grid w-full list-none", large ? "gap-1 sm:gap-4" : "gap-0.5 sm:gap-2.5")}>
                {displayBullets.map((point, index) => (
                  <li key={point} className={cn("grid grid-cols-[0.58em_minmax(0,1fr)] items-start sm:grid-cols-[0.72em_minmax(0,1fr)]", large ? "gap-1.5 sm:gap-3" : "gap-1.5 sm:gap-2.5")}>
                    <span className={cn(
                      "mt-[0.62em] rounded-full",
                      index % 3 === 0 ? "bg-sky-400" : index % 3 === 1 ? "bg-pink-300" : "bg-amber-300",
                      large ? "h-1.5 w-1.5 sm:h-2.5 sm:w-2.5" : "h-1.5 w-1.5 sm:h-2 sm:w-2"
                    )} />
                    <span className={cn(
                      "font-medium leading-snug text-[#5f6368]",
                      fullBleed
                        ? "text-[clamp(0.85rem,1.8vw,1.8rem)]"
                        : large
                          ? "text-[clamp(0.44rem,2.15vw,1.55rem)] sm:text-[clamp(1.05rem,1.55vw,1.55rem)]"
                          : "text-[clamp(0.42rem,2.05vw,1.08rem)] sm:text-[clamp(0.9rem,1.08vw,1.08rem)]"
                    )}>
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </button>
          )}
        </div>
        <div className="relative m-1 ml-0 flex min-h-0 min-w-0 flex-col gap-1 overflow-hidden rounded-[8px] bg-transparent sm:m-4 sm:ml-0 sm:gap-3 sm:rounded-[10px]">
          <div className="grid min-h-0 flex-1 place-items-center overflow-hidden">
            {currentImage ? (
              <img
                src={currentImage}
                alt={slide.title}
                className="h-full w-full object-contain"
                onError={() => onChange({ selectedImageIndex: Math.min(imageIndex + 1, slide.imageUrls.length - 1) })}
              />
            ) : (
              <div className={cn("grid place-items-center gap-3 text-center", slideTheme.muted)}>
                <ImageIcon className={large ? "h-10 w-10 sm:h-20 sm:w-20" : "h-8 w-8 sm:h-14 sm:w-14"} />
                <span className="px-2 text-[8px] font-black uppercase tracking-[0.08em] sm:px-4 sm:text-xs sm:tracking-[0.12em]">{slide.visual || "Visual"}</span>
              </div>
            )}
          </div>
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

async function downloadPptx(deck: PresentationDeck) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "TeachPad";
  pptx.company = "TeachPad";
  pptx.subject = deck.topic;
  pptx.title = deck.topic;
  pptx.theme = {
    headFontFace: "Aptos Display",
    bodyFontFace: "Aptos"
  };
  pptx.defineLayout({ name: "TEACHPAD_WIDE", width: 13.333, height: 7.5 });
  pptx.layout = "TEACHPAD_WIDE";

  for (const slide of deck.slides) {
    const pptSlide = pptx.addSlide();
    const selectedImage = selectedSlideImage(slide);
    const imageData = selectedImage ? await imageUrlToDataUri(selectedImage) : "";
    const bullets = slideBullets(slide);

    pptSlide.background = { color: "FFFFFF" };
    pptSlide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 5.35,
      h: 7.5,
      line: { color: "FFFFFF", transparency: 100 },
      fill: { color: "F8FBFF" }
    });
    pptSlide.addShape(pptx.ShapeType.rect, {
      x: 5.0,
      y: 0,
      w: 0.45,
      h: 7.5,
      line: { color: "FFFFFF", transparency: 100 },
      fill: { color: "FFFFFF", transparency: 18 }
    });
    pptSlide.addShape(pptx.ShapeType.ellipse, {
      x: 0.42,
      y: 0.45,
      w: 0.12,
      h: 0.12,
      line: { color: "7DD3FC", transparency: 100 },
      fill: { color: "7DD3FC", transparency: 25 }
    });
    pptSlide.addShape(pptx.ShapeType.ellipse, {
      x: 4.15,
      y: 6.35,
      w: 0.16,
      h: 0.16,
      line: { color: "F9A8D4", transparency: 100 },
      fill: { color: "F9A8D4", transparency: 30 }
    });

    pptSlide.addText(slide.title || "Untitled slide", {
      x: 0.58,
      y: 0.82,
      w: 4.18,
      h: 1.62,
      margin: 0,
      breakLine: false,
      fit: "shrink",
      fontFace: "Aptos Display",
      fontSize: 34,
      bold: true,
      color: "171717",
      valign: "top"
    });
    pptSlide.addShape(pptx.ShapeType.rect, {
      x: 0.66,
      y: 2.5,
      w: 1.05,
      h: 0.05,
      line: { color: "38BDF8", transparency: 100 },
      fill: { color: "38BDF8" }
    });

    if (bullets.length) {
      pptSlide.addText(bullets.join("\n"), {
        x: 0.78,
        y: 3.05,
        w: 3.9,
        h: 2.65,
        margin: 0,
        fit: "shrink",
        fontFace: "Aptos",
        fontSize: 18,
        color: "5F6368",
        breakLine: false,
        valign: "middle",
        bullet: { type: "bullet" },
        paraSpaceAfter: 10
      });
    }

    if (imageData) {
      pptSlide.addImage({
        data: imageData,
        ...containImage(5.55, 0.38, 7.35, 6.74)
      });
    } else {
      pptSlide.addShape(pptx.ShapeType.roundRect, {
        x: 5.65,
        y: 0.55,
        w: 7.1,
        h: 6.4,
        rectRadius: 0.08,
        line: { color: "E7E7EA", transparency: 0 },
        fill: { color: "F8FAFC" }
      });
      pptSlide.addText(slide.visual || "Classroom visual", {
        x: 6.0,
        y: 3.35,
        w: 6.4,
        h: 0.45,
        align: "center",
        fontSize: 13,
        bold: true,
        color: "8A8F98",
        margin: 0
      });
    }
  }

  await pptx.writeFile({ fileName: `${slugify(deck.topic)}.pptx` });
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
