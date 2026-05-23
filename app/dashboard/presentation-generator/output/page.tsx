"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FocusEvent } from "react";
import { ArrowLeft, ArrowRight, Download, FileText, ImageIcon, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { backendApi } from "@/lib/api";
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

  function exportPdf() {
    const currentDeck = deck;
    if (!currentDeck) return;
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      toast({ title: "Popup blocked", description: "Allow popups to export the PDF." });
      return;
    }
    printWindow.document.write(buildPptHtml(currentDeck));
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 250);
  }

  function exportPpt() {
    const currentDeck = deck;
    if (!currentDeck) return;
    downloadTextFile(`${slugify(currentDeck.topic)}.ppt`, buildPptHtml(currentDeck), "application/vnd.ms-powerpoint;charset=utf-8");
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
          <section className="grid min-h-0 min-w-0 flex-1 gap-2 lg:grid-cols-[minmax(0,1fr)_180px] lg:gap-3">
            <div className="flex min-w-0 flex-col gap-2 rounded-[18px] border border-white/70 bg-white/55 p-2 shadow-[0_14px_34px_rgba(39,30,91,0.06)] sm:gap-3 sm:rounded-[22px] sm:p-5">
              <div className="grid min-w-0 flex-1 place-items-center">
                <EditableSlide slide={active} onChange={updateActiveSlide} />
              </div>
              <SlideControls
                activeSlide={activeSlide}
                slideCount={slideCount}
                onPrevious={() => goToSlide(activeSlide - 1)}
                onNext={() => goToSlide(activeSlide + 1)}
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
        <div className={cn("fixed inset-0 z-[100] grid grid-rows-[auto_minmax(0,1fr)_auto] p-2 sm:p-6", slideTheme.page)}>
          <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3 sm:gap-3">
            <p className={cn("min-w-0 truncate text-xs font-black sm:text-sm", slideTheme.text)}>{deck.topic}</p>
            <button type="button" onClick={exitPresentMode} className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl border bg-white/80 sm:h-10 sm:w-10", slideTheme.border, slideTheme.text)} aria-label="Back from present view">
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
          <div className="grid min-h-0 place-items-center">
            <div className="w-full max-w-[1180px] min-w-0 overflow-hidden">
              <EditableSlide slide={active} onChange={updateActiveSlide} large />
            </div>
          </div>
          <SlideControls
            activeSlide={activeSlide}
            slideCount={slideCount}
            onPrevious={() => goToSlide(activeSlide - 1)}
            onNext={() => goToSlide(activeSlide + 1)}
            className="mt-3"
          />
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
    <aside className="min-h-0 min-w-0 rounded-[16px] border border-white/70 bg-white/80 p-1.5 shadow-[0_14px_34px_rgba(39,30,91,0.06)] sm:rounded-[18px] sm:p-2">
      <div className="flex max-h-[120px] gap-2 overflow-x-auto lg:max-h-[calc(100vh-210px)] lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => onSelect(index)}
            className={cn(
              "w-[118px] shrink-0 rounded-xl border bg-white p-1 text-left transition sm:w-[150px] sm:p-1.5 lg:w-full",
              activeSlide === index ? "border-[#25262b] shadow-sm" : "border-[#e7e7ea] opacity-75 hover:opacity-100"
            )}
            aria-label={`Open slide ${index + 1}`}
          >
            <div className="aspect-video overflow-hidden rounded-lg bg-white">
              <div className="grid h-full grid-cols-[0.9fr_1.1fr]">
                <div className="min-w-0 p-2">
                  <p className="line-clamp-3 text-[9px] font-black leading-tight text-[#171717] sm:text-[10px]">{slide.title}</p>
                  <p className="mt-1 line-clamp-2 text-[7px] font-semibold leading-tight text-[#5f6368] sm:text-[8px]">{slide.points[0] || slide.subtitle || ""}</p>
                </div>
                <div className="grid place-items-center overflow-hidden p-1">
                  {selectedSlideImage(slide) ? (
                    <img src={selectedSlideImage(slide)} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-[#8a8f98] sm:h-5 sm:w-5" />
                  )}
                </div>
              </div>
            </div>
            <p className="mt-1 px-1 text-[9px] font-black text-[#55516e] sm:text-[10px]">{index + 1}</p>
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
        <Link href="/dashboard/presentation-generator" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#55516e] hover:text-[#25262b] sm:gap-2 sm:text-sm">
          <ArrowLeft className="h-4 w-4" />
          Edit inputs
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

function EditableSlide({
  slide,
  onChange,
  large = false
}: {
  slide: PresentationSlide;
  onChange: (patch: Partial<PresentationSlide>) => void;
  large?: boolean;
}) {
  const [titleDraft, setTitleDraft] = useState("");
  const [contentDraft, setContentDraft] = useState("");
  const [editingContent, setEditingContent] = useState(false);
  const imageIndex = clampImageIndex(slide.selectedImageIndex, slide.imageUrls.length);
  const currentImage = slide.imageUrls[imageIndex];
  const contentText = useMemo(() => formatBulletText([slide.subtitle || "", ...slide.points].filter(Boolean)), [slide.id, slide.points, slide.subtitle]);
  const displayBullets = useMemo(() => slideBullets(slide), [slide.id, slide.points, slide.subtitle]);
  const hasMultipleImages = slide.imageUrls.length > 1;

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
        "aspect-[16/9] w-full max-w-full overflow-hidden rounded-[12px] border shadow-sm sm:rounded-[16px]",
        slideTheme.slide,
        slideTheme.border,
        large ? "sm:max-h-[calc(100vh-150px)]" : "sm:max-h-[calc(100vh-250px)]"
      )}
    >
      <div className="grid h-full min-w-0 grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className={cn("flex min-w-0 flex-col", large ? "p-2 pr-1 sm:p-12 sm:pr-6" : "p-2 pr-1 sm:p-8 sm:pr-5")}>
          <textarea
            value={titleDraft}
            onChange={(event) => updateTitle(event.target.value)}
            onInput={(event) => autoSize(event.currentTarget)}
            onFocus={handleFocus}
            rows={2}
            spellCheck={false}
            placeholder="Slide heading"
            className={cn(
              "w-full resize-none overflow-hidden rounded-lg border border-transparent bg-transparent p-1.5 font-black leading-[1.08] outline-none transition placeholder:text-current/25 focus:border-[#d9d9de] focus:bg-black/[0.02] sm:rounded-xl sm:p-3",
              slideTheme.text,
              large ? "text-[clamp(0.78rem,4.2vw,4.2rem)] sm:text-[clamp(2rem,3.8vw,4.2rem)]" : "text-[clamp(0.72rem,4vw,3rem)] sm:text-[clamp(1.55rem,2.9vw,3rem)]"
            )}
            aria-label="Slide heading"
          />
          {editingContent ? (
            <textarea
              value={contentDraft}
              onChange={(event) => updateContent(event.target.value)}
              onBlur={() => setEditingContent(false)}
              autoFocus
              placeholder={"Slide content\nAdd one idea per line"}
              className={cn(
                "mt-1 min-h-0 flex-1 resize-none rounded-lg border border-transparent bg-transparent p-1 font-semibold leading-4 outline-none transition placeholder:text-current/25 focus:border-[#d9d9de] focus:bg-black/[0.02] sm:mt-4 sm:rounded-xl sm:p-3 sm:leading-7",
                slideTheme.muted,
                large ? "text-[clamp(0.5rem,2.6vw,1.75rem)] sm:text-[clamp(1.1rem,1.8vw,1.75rem)]" : "text-[clamp(0.48rem,2.45vw,1.25rem)] sm:text-[clamp(0.95rem,1.25vw,1.25rem)]"
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
                {displayBullets.map((point) => (
                  <li key={point} className={cn("grid grid-cols-[0.58em_minmax(0,1fr)] items-start sm:grid-cols-[0.72em_minmax(0,1fr)]", large ? "gap-1.5 sm:gap-3" : "gap-1.5 sm:gap-2.5")}>
                    <span className={cn("mt-[0.62em] rounded-full bg-current", large ? "h-1.5 w-1.5 sm:h-2.5 sm:w-2.5" : "h-1.5 w-1.5 sm:h-2 sm:w-2")} />
                    <span className={cn(
                      "font-bold leading-snug text-[#5f6368]",
                      large ? "text-[clamp(0.44rem,2.15vw,1.55rem)] sm:text-[clamp(1.05rem,1.55vw,1.55rem)]" : "text-[clamp(0.42rem,2.05vw,1.08rem)] sm:text-[clamp(0.9rem,1.08vw,1.08rem)]"
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
          {hasMultipleImages && !large ? (
            <div className="grid shrink-0 grid-cols-4 gap-1 sm:grid-cols-5 sm:gap-2">
              {slide.imageUrls.map((url, index) => (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  onClick={() => onChange({ selectedImageIndex: index })}
                  className={cn(
                    "aspect-video overflow-hidden rounded-lg bg-white/70 p-0.5 shadow-sm outline-none transition focus:ring-2 focus:ring-[#55516e]",
                    imageIndex === index ? "ring-2 ring-[#25262b]" : "opacity-75 hover:opacity-100"
                  )}
                  aria-label={`Use image ${index + 1}`}
                >
                  <img src={url} alt="" className="h-full w-full rounded-md object-cover" />
                </button>
              ))}
            </div>
          ) : null}
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
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #171717; background: #f7f7f8; }
    .slide { page-break-after: always; width: 13.333in; height: 7.5in; box-sizing: border-box; display: grid; grid-template-columns: .9fr 1.1fr; gap: .2in; padding: .55in; background: #fff; }
    h1 { margin: 0 0 .28in; font-size: 38pt; line-height: 1.08; }
    .subtitle { margin: 0 0 .18in; font-size: 18pt; font-weight: 700; color: #555; }
    ul { margin: .2in 0 0; padding-left: .28in; font-size: 18pt; line-height: 1.4; color: #555; }
    li { margin: 0 0 .12in; }
    .visual { display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .visual img { max-width: 100%; max-height: 100%; object-fit: contain; }
  </style>
</head>
<body>${slides}</body>
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
