"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, Boxes, Check, ClipboardCheck, FileText, FlaskConical, Globe, GraduationCap, Lightbulb, MessageCircle, Monitor, Presentation, Sparkles, Users } from "lucide-react";
import { backendApi, Board, Book, Chapter, ClassItem, getRateLimitNotice, isPaymentRequiredError, type PresentationGeneratePayload } from "@/lib/api";
import { getErrorCode, getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { GenerationLoadingScreen } from "@/components/generation-loading-screen";
import { readToolDraft, saveToolDraft } from "@/lib/form-draft-storage";
import { saveLatestPresentationId } from "@/lib/presentation-generator";
import { useUpgradeModal } from "@/components/billing/upgrade-modal";
import { TrialGatePill } from "@/components/billing/trial-gate-pill";
import { filteredBooksForSubject, findMatchingBoard, findMatchingChapter, findMatchingClass, findMatchingSubject, getCompanionPrefillContext, hasCompanionPrefill } from "@/lib/companion-prefill";
import { cn } from "@/lib/utils";
import { HistoryBackButton } from "@/components/history-back-button";
import { appendWorkspaceContext } from "@/lib/workspace/routes.ts";

const slideCountOptions = [6, 8, 10, 12] as const;
const languageOptions = ["English", "Hindi", "Urdu"] as const;
const styleOptions = ["Clean classroom", "Visual story", "Activity based", "Exam revision"] as const;
const toneOptions = ["Simple", "Conversational", "Academic", "Revision focused"] as const;
const detailOptions = ["Brief", "Balanced", "Detailed"] as const;
const visualOptions = ["Light visuals", "Balanced visuals", "Image rich"] as const;
const PRESENTATION_DRAFT_KEY = "presentation";

type PresentationFormDraft = {
  boardId: string;
  classId: string;
  subject: string;
  bookId: string;
  chapterNames: string[];
  topic: string;
  slideCount: number;
  language: string;
  style: string;
  tone: string;
  detailLevel: string;
  visualDensity: string;
  instructions: string;
  includeSpeakerNotes: boolean;
  includeActivities: boolean;
  includeQuiz: boolean;
  includeImages: boolean;
  theme?: string;
};

const themeOptions = [
  { id: "Light", label: "Light", desc: "A light touch", bg: "bg-white border-[#ffd9de] text-[#25262b]", descColor: "text-[#55516e]/85", titleColor: "text-pink-600 font-black" },
  { id: "Plains", label: "Plains", desc: "Roarrrr", bg: "bg-[#eef2f7] border-[#d1dbe5] text-slate-800", descColor: "text-slate-500", titleColor: "text-[#2e3c4e] font-black" },
  { id: "Science", label: "Science", desc: "For curious minds", bg: "bg-[#f0f7ff] border-[#bfdbfe] text-slate-800", descColor: "text-[#3b5266]/85", titleColor: "text-orange-600 font-black" },
  { id: "Maths", label: "Maths", desc: "Numbers are fun", bg: "bg-[#fffbeb] border-[#fef3c7] text-slate-800", descColor: "text-[#5c5440]/85", titleColor: "text-sky-600 font-black" },
  { id: "Simple", label: "Simple", desc: "Less is more", bg: "bg-[#fcfcfd] border-[#e4e4e7] text-slate-900", descColor: "text-slate-400", titleColor: "text-amber-800 font-black" },
  { id: "Deep", label: "Deep", desc: "Into the blue", bg: "bg-[#1e3a8a] border-blue-900 text-white", descColor: "text-blue-200/70", titleColor: "text-white font-black" }
];

export default function PresentationGeneratorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { openUpgrade } = useUpgradeModal();
  const companionContext = useMemo(() => getCompanionPrefillContext(searchParams), [searchParams]);
  const companionApplied = useRef({ board: false, class: false, subject: false, book: false, chapter: false, topic: false });
  const [boards, setBoards] = useState<Board[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [boardId, setBoardId] = useState("");
  const [classId, setClassId] = useState("");
  const [subject, setSubject] = useState("");
  const [bookId, setBookId] = useState("");
  const [chapterNames, setChapterNames] = useState<string[]>([]);
  const [topic, setTopic] = useState("");
  const [slideCount, setSlideCount] = useState<(typeof slideCountOptions)[number]>(8);
  const [language, setLanguage] = useState<(typeof languageOptions)[number]>("English");
  const [style, setStyle] = useState<(typeof styleOptions)[number]>("Clean classroom");
  const [tone, setTone] = useState<(typeof toneOptions)[number]>("Simple");
  const [detailLevel, setDetailLevel] = useState("Balanced");
  const [visualDensity, setVisualDensity] = useState("Balanced visuals");
  const [instructions, setInstructions] = useState("");
  const [includeSpeakerNotes, setIncludeSpeakerNotes] = useState(true);
  const [includeActivities, setIncludeActivities] = useState(true);
  const [includeQuiz, setIncludeQuiz] = useState(true);
  const [includeImages, setIncludeImages] = useState(true);
  const [theme, setTheme] = useState<string>("Light");
  const [step, setStep] = useState(1);
  const [fetching, setFetching] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [classesError, setClassesError] = useState("");
  const [booksError, setBooksError] = useState("");
  const [chaptersError, setChaptersError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [draftReady, setDraftReady] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
    document.body.scrollTo({ top: 0, behavior: "smooth" });
    try {
      document.querySelectorAll(".overflow-y-auto, main").forEach((el) => {
        el.scrollTo({ top: 0, behavior: "smooth" });
      });
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    const draft = readToolDraft<PresentationFormDraft>(PRESENTATION_DRAFT_KEY);
    if (draft) {
      setBoardId(draft.boardId || "");
      setClassId(draft.classId || "");
      setSubject(draft.subject || "");
      setBookId(draft.bookId || "");
      setChapterNames(draft.chapterNames || []);
      setTopic("");
      setSlideCount((draft.slideCount || 8) as (typeof slideCountOptions)[number]);
      setLanguage((draft.language || "English") as (typeof languageOptions)[number]);
      setStyle((draft.style || "Clean classroom") as (typeof styleOptions)[number]);
      setTone((draft.tone || "Simple") as (typeof toneOptions)[number]);
      setDetailLevel(draft.detailLevel || "Balanced");
      setVisualDensity(draft.visualDensity || "Balanced visuals");
      setInstructions("");
      setIncludeSpeakerNotes(draft.includeSpeakerNotes ?? true);
      setIncludeActivities(draft.includeActivities ?? true);
      setIncludeQuiz(draft.includeQuiz ?? true);
      setIncludeImages(draft.includeImages ?? true);
      setTheme(draft.theme || "Light");
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    saveToolDraft<PresentationFormDraft>(PRESENTATION_DRAFT_KEY, {
      boardId,
      classId,
      subject,
      bookId,
      chapterNames,
      topic: "",
      slideCount,
      language,
      style,
      tone,
      detailLevel,
      visualDensity,
      instructions: "",
      includeSpeakerNotes,
      includeActivities,
      includeQuiz,
      includeImages,
      theme
    });
  }, [draftReady, boardId, chapterNames, classId, bookId, detailLevel, includeActivities, includeImages, includeQuiz, includeSpeakerNotes, language, slideCount, style, subject, tone, visualDensity, theme]);

  useEffect(() => {
    setFetching(true);
    backendApi.boards(0, 100)
      .then((res) => {
        const filtered = res.items.filter((board) => board.is_active !== false);
        setBoards(filtered);
        const defaultBoardId = localStorage.getItem("teachpad_default_board_id");
        if (defaultBoardId && !boardId) {
          const match = filtered.find((b) => b.id === defaultBoardId);
          if (match) {
            chooseBoard(match.id);
          }
        }
      })
      .catch((error) => toast({ title: "Could not load boards", description: getErrorMessage(error, "Please try again."), variant: "error" }))
      .finally(() => setFetching(false));
  }, [toast, boardId]);

  useEffect(() => {
    if (!boardId) {
      setIsLoadingClasses(false);
      return;
    }
    let cancelled = false;
    setClassesError("");
    setIsLoadingClasses(true);
    backendApi.classesByBoard(boardId, 0, 100)
      .then((res) => {
        if (!cancelled) setClasses(res.items.filter((item) => item.is_active !== false));
      })
      .catch((error) => {
        if (!cancelled) setClassesError(getErrorMessage(error, "Could not load classes."));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingClasses(false);
      });
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  useEffect(() => {
    if (!classId) {
      setIsLoadingBooks(false);
      return;
    }
    let cancelled = false;
    setBooksError("");
    setIsLoadingBooks(true);
    backendApi.booksByClass(classId, 0, 100)
      .then((res) => {
        if (!cancelled) setBooks(res.items.filter((book) => book.is_active !== false && book.is_ingested !== false));
      })
      .catch((error) => {
        if (!cancelled) setBooksError(getErrorMessage(error, "Could not load books."));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBooks(false);
      });
    return () => {
      cancelled = true;
    };
  }, [classId]);

  useEffect(() => {
    if (!bookId) {
      setIsLoadingChapters(false);
      return;
    }
    let cancelled = false;
    setChaptersError("");
    setIsLoadingChapters(true);
    backendApi.chaptersByBook(bookId)
      .then((items) => {
        if (!cancelled) setChapters(items);
      })
      .catch((error) => {
        if (!cancelled) setChaptersError(getErrorMessage(error, "Could not load chapters."));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingChapters(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  const selectedClass = useMemo(() => classes.find((item) => item.id === classId), [classes, classId]);
  const selectedBook = useMemo(() => books.find((book) => book.id === bookId), [books, bookId]);
  const subjectOptions = useMemo(() => Array.from(new Set(books.map((book) => book.subject).filter(Boolean))).sort(), [books]);
  const filteredBooks = useMemo(() => books.filter((book) => !subject || book.subject === subject), [books, subject]);
  const presentationTopic = topic.trim() || chapterNames[0] || companionContext.chapter;
  const canGenerate = Boolean(boardId && classId && bookId && chapterNames.length && presentationTopic.trim().length > 2);
  const canGoNext = Boolean(boardId && classId && subject && bookId && chapterNames.length > 0);

  useEffect(() => {
    if (!hasCompanionPrefill(companionContext) || companionApplied.current.topic || !companionContext.topic) return;
    companionApplied.current.topic = true;
    setTopic(companionContext.topic);
  }, [companionContext]);

  useEffect(() => {
    if (!hasCompanionPrefill(companionContext) || companionApplied.current.board || !boards.length || !companionContext.board) return;
    const match = findMatchingBoard(boards, companionContext.board);
    if (!match) return;
    companionApplied.current.board = true;
    chooseBoard(match.id);
  }, [boards, companionContext]);

  useEffect(() => {
    if (!hasCompanionPrefill(companionContext) || companionApplied.current.class || !classes.length || !companionContext.classLabel) return;
    const match = findMatchingClass(classes, companionContext.classLabel);
    if (!match) return;
    companionApplied.current.class = true;
    chooseClass(match.id);
  }, [classes, companionContext]);

  useEffect(() => {
    if (!hasCompanionPrefill(companionContext) || companionApplied.current.subject || !subjectOptions.length || !companionContext.subject) return;
    const match = findMatchingSubject(subjectOptions, companionContext.subject);
    if (!match) return;
    companionApplied.current.subject = true;
    chooseSubject(match);
  }, [companionContext, subjectOptions]);

  useEffect(() => {
    if (!hasCompanionPrefill(companionContext) || companionApplied.current.book || !books.length) return;
    const candidates = filteredBooksForSubject(books, companionContext.subject || subject);
    if (!companionContext.chapter && candidates.length === 1) {
      companionApplied.current.book = true;
      chooseBook(candidates[0].id);
      return;
    }
    if (!companionContext.chapter || !candidates.length) return;
    let cancelled = false;
    Promise.all(candidates.map(async (book) => ({ book, chapters: await backendApi.chaptersByBook(book.id) })))
      .then((results) => {
        if (cancelled || companionApplied.current.book) return;
        const found = results.find((result) => findMatchingChapter(result.chapters, companionContext.chapter));
        if (!found) return;
        const chapter = findMatchingChapter(found.chapters, companionContext.chapter);
        companionApplied.current.book = true;
        companionApplied.current.chapter = true;
        setBookId(found.book.id);
        setChapters(found.chapters);
        setChapterNames(chapter ? [chapter.chapter_title || chapter.title || companionContext.chapter] : [companionContext.chapter]);
      })
      // Intentionally silent: companion auto-selection is a convenience — on failure the teacher just picks book/chapter manually.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [books, companionContext, subject]);

  useEffect(() => {
    if (!hasCompanionPrefill(companionContext) || companionApplied.current.chapter || !chapters.length || !companionContext.chapter) return;
    const match = findMatchingChapter(chapters, companionContext.chapter);
    if (!match) return;
    companionApplied.current.chapter = true;
    setChapterNames([match.chapter_title || match.title || companionContext.chapter]);
  }, [chapters, companionContext]);

  function chooseBoard(value: string) {
    setBoardId(value);
    setClasses([]);
    setBooks([]);
    setChapters([]);
    setClassId("");
    setSubject("");
    setBookId("");
    setChapterNames([]);
    setClassesError("");
    setBooksError("");
    setChaptersError("");
    setIsLoadingClasses(Boolean(value));
    setIsLoadingBooks(false);
    setIsLoadingChapters(false);
  }

  function chooseClass(value: string) {
    setClassId(value);
    setBooks([]);
    setChapters([]);
    setSubject("");
    setBookId("");
    setChapterNames([]);
    setBooksError("");
    setChaptersError("");
    setIsLoadingBooks(Boolean(value));
    setIsLoadingChapters(false);
  }

  function chooseSubject(value: string) {
    const matchingBook = books.find((book) => book.subject === value);
    setSubject(value);
    setBookId(matchingBook?.id || "");
    setChapterNames([]);
    setChapters([]);
    setChaptersError("");
    setIsLoadingChapters(Boolean(matchingBook));
  }

  function chooseBook(value: string) {
    setBookId(value);
    setChapterNames([]);
    setChapters([]);
    setChaptersError("");
    setIsLoadingChapters(Boolean(value));
  }

  function chooseChapter(value: string) {
    setChapterNames(value ? [value] : []);
  }

  function audienceFromClass(className: string): PresentationGeneratePayload["audience"] {
    const match = className.match(/\b(6|7|8|9|10|11|12)\b/);
    return match ? `Class ${match[1]}` as PresentationGeneratePayload["audience"] : "Class 8";
  }

  async function generate() {
    if (!canGenerate || !selectedClass) {
      toast({ title: "Complete required details", description: "Select the textbook source, choose chapters, and add a topic." });
      return;
    }
    setGenerating(true);
    setGenerationError("");
    setGenerationStatus("Reading the selected textbook...");
    const timers = [
      window.setTimeout(() => setGenerationStatus("Finding the strongest slide flow..."), 3500),
      window.setTimeout(() => setGenerationStatus("Writing simple classroom slides..."), 11000),
      window.setTimeout(() => setGenerationStatus("Adding visuals and teacher support..."), 22000),
      window.setTimeout(() => setGenerationStatus("Almost ready..."), 36000)
    ];
    try {
      const payload: PresentationGeneratePayload = {
        topic: presentationTopic.trim(),
        audience: audienceFromClass(selectedClass.name),
        slide_count: slideCount,
        language,
        style,
        tone,
        detail_level: detailLevel as PresentationGeneratePayload["detail_level"],
        visual_density: visualDensity as PresentationGeneratePayload["visual_density"],
        instructions: [
          instructions.trim(),
          `[Theme: ${theme}]`
        ].filter(Boolean).join("\n") || null,
        include_speaker_notes: includeSpeakerNotes,
        include_activities: includeActivities,
        include_quiz: includeQuiz,
        include_images: includeImages,
        source: {
          board_id: boardId,
          class_id: classId,
          book_id: bookId,
          chapter_names: chapterNames
        }
      };
      const generation = await backendApi.createPresentation(payload);
      saveLatestPresentationId(generation.id);
      if (typeof window !== "undefined") {
        localStorage.setItem(`presentation_theme_${generation.id}`, theme);
      }
      toast({ title: "Presentation generated", description: "Opening the output page." });
      router.push(appendWorkspaceContext(`/dashboard/presentation-generator/output?id=${generation.id}&new=true`, searchParams));
    } catch (error) {
      if (getErrorCode(error) === "TRIAL_MANDATE_REQUIRED") {
        setGenerating(false);
        setGenerationStatus("");
        openUpgrade(
          "You've used your free presentation. Add a payment method to make more — " +
          "or try your other tools free."
        );
        return;
      }
      if (isPaymentRequiredError(error)) {
        setGenerating(false);
        setGenerationStatus("");
        openUpgrade("Presentation generation requires a Pro plan.");
        return;
      }
      const rateLimit = getRateLimitNotice(error);
      const message = rateLimit ? rateLimit.description : getErrorMessage(error, "Could not generate presentation.");
      setGenerationError(message);
      toast(rateLimit ?? { title: "Generation failed", description: message, variant: "error" });
      setGenerating(false);
      setGenerationStatus("");
    } finally {
      timers.forEach(window.clearTimeout);
    }
  }

  if (generating || generationError) {
    return (
      <GenerationLoadingScreen
        type="presentation"
        state={generationError ? "error" : "loading"}
        status={generating ? generationStatus : undefined}
        errorMessage={generationError}
        onRetry={generate}
        onBack={() => {
          setGenerationError("");
          setGenerating(false);
          setGenerationStatus("");
        }}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-4">
      <HistoryBackButton className="inline-flex items-center gap-1.5 text-sm font-black text-[#eb3b5a] transition hover:text-[#be123c]">
        <ArrowLeft className="h-4 w-4" />
        Back
      </HistoryBackButton>

      <div className="overflow-visible rounded-[18px] border border-[#ffd9de] bg-white/86 shadow-[0_14px_34px_rgba(39,30,91,0.07)] backdrop-blur-sm">
        {/* Header */}
        <div className="relative min-h-[100px] overflow-hidden rounded-t-[18px] border-b border-[#ffd9de] bg-gradient-to-br from-[#fff7f8] via-white to-[#ffe5e9] px-4 py-4 sm:min-h-[130px] sm:px-6 sm:py-5">
          {step === 1 ? (
            <div className="relative z-10 max-w-[560px]">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-xs font-black text-[#eb3b5a] shadow-sm">
                <Presentation className="h-4 w-4" /> Create presentation
              </div>
              <h1 className="text-[28px] font-black tracking-tight text-[#25262b] sm:text-[34px]">Presentation Generator</h1>
              <p className="mt-2.5 max-w-[520px] text-sm font-medium leading-6 text-[#55516e]">Generate textbook-grounded classroom presentations with visuals, speaker notes, and activities.</p>
            </div>
          ) : step === 2 ? (
            <div className="relative z-10 max-w-[560px]">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#ffd9de] bg-white px-3 py-1.5 text-xs font-semibold text-[#55516e] shadow-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-[#eb3b5a] to-[#ff6f86] text-[10px] font-bold text-white">2</span>
                Step 2 of 3
              </div>
              <h1 className="text-[28px] font-black tracking-tight text-[#25262b] sm:text-[34px]">Customize Your Presentation</h1>
              <p className="mt-2.5 max-w-[520px] text-sm font-medium leading-6 text-[#55516e]">Fine-tune your presentation by choosing the style, tone, detail level, and sections to include.</p>
            </div>
          ) : (
            <div className="relative z-10 max-w-[560px]">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#ffd9de] bg-white px-3 py-1.5 text-xs font-semibold text-[#55516e] shadow-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-[#eb3b5a] to-[#ff6f86] text-[10px] font-bold text-white">3</span>
                Step 3 of 3
              </div>
              <h1 className="text-[28px] font-black tracking-tight text-[#25262b] sm:text-[34px]">Choose Visual Theme</h1>
              <p className="mt-2.5 max-w-[520px] text-sm font-medium leading-6 text-[#55516e]">Select a premium theme for your presentation slides. Emojis, background gradients, and elements will adapt dynamically.</p>
            </div>
          )}
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] overflow-hidden lg:block">
            <img
              src="/assets/illustrations/create-presentation-header.png"
              alt=""
              aria-hidden="true"
              className="absolute bottom-0 right-0 max-h-full w-[390px] select-none object-contain object-bottom drop-shadow-[0_18px_18px_rgba(235,59,90,0.18)] xl:right-2 xl:w-[470px]"
            />
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-5 pt-5 sm:px-6">
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
            step === 1 ? "bg-gradient-to-r from-[#eb3b5a] to-[#ff6f86] text-white shadow-[0_4px_10px_rgba(235,59,90,0.3)]" : "bg-[#fff1f2] text-[#eb3b5a]"
          )}>
            {step > 1 ? <Check className="h-3.5 w-3.5" /> : 1}
          </div>
          <div className={cn("h-0.5 w-10 rounded transition-colors", step > 1 ? "bg-[#fecdd3]" : "bg-[#eceef3]")} />
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
            step === 2 ? "bg-gradient-to-r from-[#eb3b5a] to-[#ff6f86] text-white shadow-[0_4px_10px_rgba(235,59,90,0.3)]" : "bg-[#fff1f2] text-[#eb3b5a]"
          )}>
            {step > 2 ? <Check className="h-3.5 w-3.5" /> : 2}
          </div>
          <div className={cn("h-0.5 w-10 rounded transition-colors", step > 2 ? "bg-[#fecdd3]" : "bg-[#eceef3]")} />
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
            step === 3 ? "bg-gradient-to-r from-[#eb3b5a] to-[#ff6f86] text-white shadow-[0_4px_10px_rgba(235,59,90,0.3)]" : "bg-[#fff1f2] text-[#9CA0AA]"
          )}>
            3
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {step === 1 && (
            <div key="step-1" className="animate-slide-in-left space-y-5">
              {/* Section 1: What are you teaching? */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fff1f2] text-xs font-bold text-[#eb3b5a]">1</span>
                  <h3 className="text-base font-bold text-[#25262b]">What are you teaching?</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <FieldCard icon={GraduationCap} label="Board / Curriculum" required color="blue">
                    <Select value={boardId} onChange={(e) => chooseBoard(e.target.value)} disabled={fetching} isLoading={fetching} loadingLabel="Loading boards...">
                      <option value="">Select Board / Curriculum</option>
                      {boards.map((board) => <option key={board.id} value={board.id}>{board.name} ({board.code})</option>)}
                    </Select>
                  </FieldCard>
                  <FieldCard icon={Users} label="Class / Grade" required color="purple">
                    {!boardId ? (
                      <Placeholder>Select a board first</Placeholder>
                    ) : isLoadingClasses ? (
                      <Placeholder>Loading classes...</Placeholder>
                    ) : classes.filter(c => c.grade_number != null).length > 0 ? (
                      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 sm:gap-2">
                        {classes
                          .filter(c => c.grade_number != null)
                          .sort((a, b) => (a.grade_number || 0) - (b.grade_number || 0))
                          .map((c) => (
                            <button key={c.id} type="button" onClick={() => chooseClass(c.id)}
                              className={cn(
                                "flex h-11 w-full items-center justify-center rounded-xl text-sm font-bold transition-all duration-200 sm:text-base",
                                classId === c.id
                                  ? "bg-gradient-to-r from-[#eb3b5a] to-[#ff6f86] text-white shadow-[0_4px_12px_rgba(235,59,90,0.25)]"
                                  : "border border-[#ffd9de] bg-white text-[#25262b] hover:border-[#ffd9de] hover:bg-[#fff1f2]"
                              )}
                            >{c.grade_number}</button>
                          ))}
                      </div>
                    ) : (
                      <Select value={classId} onChange={(e) => chooseClass(e.target.value)} disabled={!boardId || isLoadingClasses} isLoading={isLoadingClasses} loadingLabel="Loading classes...">
                        <option value="">Select Class / Grade</option>
                        {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </Select>
                    )}
                    {classesError && <span className="mt-1 text-xs font-semibold text-red-500">{classesError}</span>}
                  </FieldCard>
                  <FieldCard icon={FlaskConical} label="Subject" required color="orange">
                    {!classId ? (
                      <Placeholder>Select a class first</Placeholder>
                    ) : (
                      <Select value={subject} onChange={(e) => chooseSubject(e.target.value)} disabled={!classId || !books.length} isLoading={isLoadingBooks} loadingLabel="Loading subjects...">
                        <option value="">Select Subject</option>
                        {subjectOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                      </Select>
                    )}
                    {booksError && <span className="mt-1 text-xs font-semibold text-red-500">{booksError}</span>}
                  </FieldCard>
                </div>
              </div>

              {/* Section 2: What are we learning? */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fff1f2] text-xs font-bold text-[#eb3b5a]">2</span>
                  <h3 className="text-base font-bold text-[#25262b]">What are we learning?</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <FieldCard icon={BookOpen} label="Book / Textbook" required color="green">
                    {!classId || !subject ? (
                      <Placeholder>{!classId ? "Select a class first" : "Select a subject first"}</Placeholder>
                    ) : isLoadingBooks ? (
                      <Placeholder>Loading books...</Placeholder>
                    ) : (
                      <Select value={bookId} onChange={(e) => chooseBook(e.target.value)} disabled={!filteredBooks.length} isLoading={isLoadingBooks} loadingLabel="Loading books...">
                        <option value="">Select Book / Textbook</option>
                        {filteredBooks.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}
                      </Select>
                    )}
                    {booksError && <span className="mt-1 text-xs font-semibold text-red-500">{booksError}</span>}
                  </FieldCard>
                  <FieldCard icon={FileText} label="Chapter / Unit" required color="teal">
                    {!bookId ? (
                      <Placeholder>Select a book first</Placeholder>
                    ) : isLoadingChapters ? (
                      <Placeholder>Loading chapters...</Placeholder>
                    ) : (
                      <Select value={chapterNames[0] || ""} onChange={(e) => chooseChapter(e.target.value)} disabled={!chapters.length} isLoading={isLoadingChapters} loadingLabel="Loading chapters...">
                        <option value="">Select Chapter / Unit</option>
                        {chapters.map((chapter) => <option key={chapter.id} value={chapter.chapter_title || chapter.title || ""}>{chapter.chapter_number ? `${chapter.chapter_number}. ` : ""}{chapter.chapter_title || chapter.title}</option>)}
                      </Select>
                    )}
                    {chaptersError && <span className="mt-1 text-xs font-semibold text-red-500">{chaptersError}</span>}
                  </FieldCard>
                  <FieldCard icon={Sparkles} label="Topic / Focus" color="amber">
                    <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Optional: Type a specific topic" maxLength={150} />
                    {chapterNames[0] && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {chapterNames[0].split(/[,;&]+/).map(s => s.trim()).filter(Boolean).slice(0, 6).map((suggestion) => (
                          <button key={suggestion} type="button" onClick={() => setTopic(suggestion)}
                            className="inline-flex items-center gap-1 rounded-full border border-[#ffd9de] bg-[#fff1f2] px-2.5 py-1 text-xs font-medium text-[#eb3b5a] transition-colors hover:bg-[#ffe5e9]"
                          >
                            <Sparkles className="h-3 w-3 text-[#ff6f86]" />{suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </FieldCard>
                </div>
              </div>

              {/* Step 1 Navigation */}
              <div className="flex items-center justify-between border-t border-[#ffd9de] pt-6">
                <HistoryBackButton className="text-sm font-semibold text-[#55516e] transition-colors hover:text-[#eb3b5a]">
                  Cancel
                </HistoryBackButton>
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#eb3b5a] to-[#ff6f86]" />
                  <span className="flex h-2.5 w-2.5 rounded-full bg-[#eceef3]" />
                </div>
                <button
                  type="button"
                  disabled={!canGoNext}
                  onClick={() => { setStep(2); scrollToTop(); }}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#eb3b5a] to-[#ff6f86] px-5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(235,59,90,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(235,59,90,0.3)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 max-sm:h-10 max-sm:px-4 max-sm:text-xs"
                >
                  Next
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div key="step-2" className="animate-slide-in-right space-y-6">
              {/* Presentation Setup */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fff1f2] text-xs font-bold text-[#eb3b5a]">1</span>
                  <h3 className="text-base font-bold text-[#25262b]">Presentation Setup</h3>
                </div>
                <p className="mb-4 text-sm text-[#55516e]">Choose the slide count, language, style, tone, and level of detail for your deck.</p>
                <div className="grid gap-4 md:grid-cols-3">
                  <FieldCard icon={Presentation} label="Slides" required color="blue">
                    <div className="flex flex-wrap gap-2">
                      {slideCountOptions.map((n) => (
                        <button key={n} type="button" onClick={() => setSlideCount(n)}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all duration-200",
                            slideCount === n
                              ? "border-[#fecdd3] bg-gradient-to-r from-[#eb3b5a] to-[#ff6f86] text-white shadow-sm"
                              : "border-[#ffd9de] bg-white text-[#55516e] hover:border-[#ffd9de] hover:bg-[#fff1f2]"
                          )}
                        >{n} slides</button>
                      ))}
                    </div>
                  </FieldCard>
                  <FieldCard icon={Globe} label="Language" color="cyan">
                    <div className="flex flex-wrap gap-2">
                      {languageOptions.map((lang) => (
                        <button key={lang} type="button" onClick={() => setLanguage(lang)}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all duration-200",
                            language === lang
                              ? "border-[#fecdd3] bg-gradient-to-r from-[#eb3b5a] to-[#ff6f86] text-white shadow-sm"
                              : "border-[#ffd9de] bg-white text-[#55516e] hover:border-[#ffd9de] hover:bg-[#fff1f2]"
                          )}
                        >{lang}</button>
                      ))}
                    </div>
                  </FieldCard>
                  <FieldCard icon={Lightbulb} label="Style" color="amber">
                    <div className="flex flex-wrap gap-2">
                      {styleOptions.map((s) => (
                        <button key={s} type="button" onClick={() => setStyle(s)}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all duration-200",
                            style === s
                              ? "border-[#fecdd3] bg-gradient-to-r from-[#eb3b5a] to-[#ff6f86] text-white shadow-sm"
                              : "border-[#ffd9de] bg-white text-[#55516e] hover:border-[#ffd9de] hover:bg-[#fff1f2]"
                          )}
                        >{s}</button>
                      ))}
                    </div>
                  </FieldCard>
                  <FieldCard icon={MessageCircle} label="Tone" color="purple">
                    <div className="flex flex-wrap gap-2">
                      {toneOptions.map((t) => (
                        <button key={t} type="button" onClick={() => setTone(t)}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all duration-200",
                            tone === t
                              ? "border-[#fecdd3] bg-gradient-to-r from-[#eb3b5a] to-[#ff6f86] text-white shadow-sm"
                              : "border-[#ffd9de] bg-white text-[#55516e] hover:border-[#ffd9de] hover:bg-[#fff1f2]"
                          )}
                        >{t}</button>
                      ))}
                    </div>
                  </FieldCard>
                  <FieldCard icon={ClipboardCheck} label="Detail Level" color="indigo">
                    <div className="flex flex-wrap gap-2">
                      {detailOptions.map((level) => (
                        <button key={level} type="button" onClick={() => setDetailLevel(level)}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all duration-200",
                            detailLevel === level
                              ? "border-[#fecdd3] bg-gradient-to-r from-[#eb3b5a] to-[#ff6f86] text-white shadow-sm"
                              : "border-[#ffd9de] bg-white text-[#55516e] hover:border-[#ffd9de] hover:bg-[#fff1f2]"
                          )}
                        >{level}</button>
                      ))}
                    </div>
                  </FieldCard>
                  <FieldCard icon={Monitor} label="Visual Density" color="green">
                    <div className="flex flex-wrap gap-2">
                      {visualOptions.map((v) => (
                        <button key={v} type="button" onClick={() => setVisualDensity(v)}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all duration-200",
                            visualDensity === v
                              ? "border-[#fecdd3] bg-gradient-to-r from-[#eb3b5a] to-[#ff6f86] text-white shadow-sm"
                              : "border-[#ffd9de] bg-white text-[#55516e] hover:border-[#ffd9de] hover:bg-[#fff1f2]"
                          )}
                        >{v}</button>
                      ))}
                    </div>
                  </FieldCard>
                  <FieldCard icon={FileText} label="Instructions" color="sky">
                    <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Optional focus, examples, or classroom constraints." rows={3} maxLength={500}
                      className="w-full rounded-xl border border-[#ffd9de] bg-[#fff7f8] px-3.5 py-2.5 text-sm font-medium text-[#25262b] outline-none transition-colors duration-200 placeholder:text-[#9CA0AA] focus:border-[#eb3b5a] focus:bg-white focus:ring-4 focus:ring-[#fecdd3]/60"
                    />
                  </FieldCard>
                </div>
              </div>

              {/* What to Include */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fff1f2] text-xs font-bold text-[#eb3b5a]">2</span>
                  <h3 className="text-base font-bold text-[#25262b]">What to Include</h3>
                </div>
                <p className="mb-4 text-sm text-[#55516e]">Select the sections you want in your presentation.</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { key: "includeSpeakerNotes" as const, label: "Speaker Notes", desc: "Teacher talking points for each slide", icon: FileText, color: "teal" },
                    { key: "includeActivities" as const, label: "Activities", desc: "Classroom activities embedded in slides", icon: Users, color: "amber" },
                    { key: "includeQuiz" as const, label: "Quiz Questions", desc: "Quick check-ins throughout the deck", icon: ClipboardCheck, color: "purple" },
                    { key: "includeImages" as const, label: "Images", desc: "Visuals to support each slide", icon: Monitor, color: "sky" },
                  ].map((item) => {
                    const CompIcon = item.icon;
                    const active = item.key === "includeSpeakerNotes" ? includeSpeakerNotes
                      : item.key === "includeActivities" ? includeActivities
                      : item.key === "includeQuiz" ? includeQuiz
                      : includeImages;
                    const toneMap: Record<string, { bg: string; text: string; border: string }> = {
                      teal: { bg: "bg-[#f0fdfa]", text: "text-[#0d9488]", border: "border-[#5eead4]" },
                      amber: { bg: "bg-[#fffbeb]", text: "text-[#d97706]", border: "border-[#fcd34d]" },
                      purple: { bg: "bg-[#f6f1ff]", text: "text-[#8b5cf6]", border: "border-[#c4b5fd]" },
                      sky: { bg: "bg-[#f0fdff]", text: "text-[#0ea5e9]", border: "border-[#7dd3fc]" },
                    };
                    const ct = toneMap[item.color] || toneMap.teal;
                    return (
                      <div key={item.key}
                        onClick={() => {
                          const setter = item.key === "includeSpeakerNotes" ? setIncludeSpeakerNotes
                            : item.key === "includeActivities" ? setIncludeActivities
                            : item.key === "includeQuiz" ? setIncludeQuiz
                            : setIncludeImages;
                          setter(!active);
                        }}
                        className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-all duration-200 ${
                          active
                            ? `${ct.border} ${ct.bg}`
                            : "border-[#ffd9de] bg-white hover:border-[#ffd9de] hover:bg-[#fff8fa]"
                        }`}
                      >
                        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${ct.bg} ${ct.text}`}>
                          <CompIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${active ? ct.text : "text-[#25262b]"}`}>
                              {item.label}
                            </span>
                            {active && <Check className={`h-3.5 w-3.5 flex-shrink-0 ${ct.text}`} strokeWidth={3} />}
                          </div>
                          <p className="mt-0.5 text-xs text-[#9CA0AA]">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>



              {/* Step 2 Navigation */}
              <div className="flex items-center justify-between border-t border-[#ffd9de] pt-6">
                <button type="button" onClick={() => { setStep(1); scrollToTop(); }}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#ffd9de] bg-white px-5 text-sm font-semibold text-[#55516e] shadow-sm transition-all duration-200 hover:border-[#eb3b5a] hover:text-[#eb3b5a] max-sm:h-10 max-sm:px-3 max-sm:text-xs"
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" /> Back
                </button>
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-[#eceef3]" />
                  <span className="flex h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#eb3b5a] to-[#ff6f86]" />
                  <span className="flex h-2.5 w-2.5 rounded-full bg-[#eceef3]" />
                </div>
                <button type="button" onClick={() => { setStep(3); scrollToTop(); }}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#eb3b5a] to-[#ff6f86] px-5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(235,59,90,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(235,59,90,0.3)] max-sm:h-10 max-sm:px-4 max-sm:text-xs"
                >
                  Next
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div key="step-3" className="animate-slide-in-right space-y-6">
              {/* Choose Theme Grid */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fff1f2] text-xs font-bold text-[#eb3b5a]">1</span>
                  <h3 className="text-base font-bold text-[#25262b]">Choose Visual Theme</h3>
                </div>
                <p className="mb-4 text-sm text-[#55516e]">Select one of our premium presentation visual themes below.</p>
                
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {themeOptions.map((item) => {
                    const active = theme === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTheme(item.id)}
                        className={cn(
                          "relative aspect-[16/10] overflow-hidden rounded-[20px] border p-5 text-center flex flex-col justify-center items-center transition-all duration-300",
                          item.bg,
                          active
                            ? "ring-4 ring-[#eb3b5a]/45 border-[#eb3b5a] shadow-[0_12px_28px_rgba(235,59,90,0.12)] scale-[1.02] z-10"
                            : "border-[#ffd9de]/80 hover:border-[#eb3b5a]/50 hover:shadow-[0_8px_20px_rgba(0,0,0,0.03)]"
                        )}
                      >
                        {/* Custom Theme Preview Ornaments */}
                        {item.id === "Light" && (
                          <>
                            <div className="absolute top-[-10%] left-[-10%] w-14 h-14 rounded-full bg-blue-300/25 blur-md" />
                            <div className="absolute bottom-[-10%] right-[-10%] w-14 h-14 rounded-full bg-pink-300/25 blur-md" />
                            <div className="absolute bottom-1.5 left-3 text-3xl text-emerald-600/70 select-none">🌿</div>
                          </>
                        )}
                        {item.id === "Plains" && (
                          <>
                            <div className="absolute bottom-1.5 left-3 text-4xl select-none">🦒</div>
                            <div className="absolute bottom-1.5 right-3 text-3xl select-none">🦁</div>
                            <div className="absolute bottom-1.5 right-11 text-3xl select-none">🌳</div>
                          </>
                        )}
                        {item.id === "Science" && (
                          <>
                            <div className="absolute top-2 left-3 text-xl select-none">🧬</div>
                            <div className="absolute bottom-2 right-3 text-3xl select-none">🧪</div>
                            <div className="absolute bottom-2 right-12 text-2xl select-none">🔬</div>
                          </>
                        )}
                        {item.id === "Maths" && (
                          <>
                            <div className="absolute bottom-2 left-3 text-2xl select-none">✏️</div>
                            <div className="absolute bottom-2 right-3 text-3xl select-none">🧮</div>
                            <div className="absolute bottom-2 right-12 text-2xl select-none">📐</div>
                          </>
                        )}
                        {item.id === "Deep" && (
                          <>
                            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#172554]/50 to-transparent" />
                            <div className="absolute bottom-2 right-3 text-4xl select-none">🐋</div>
                            <div className="absolute top-3 left-3 text-lg select-none">🐟</div>
                            <div className="absolute top-4 right-10 text-lg select-none">🐟</div>
                          </>
                        )}
                        {item.id === "Classic" && (
                          <>
                            <div className="absolute top-[-10%] right-[-10%] w-16 h-16 rounded-full bg-[#fca5a5]/18 blur-md" />
                            <div className="absolute bottom-[-10%] left-[-10%] w-14 h-14 rounded-full bg-[#cbd5e1]/25 blur-md" />
                            <div className="absolute bottom-1 left-2 text-xs select-none">🎨</div>
                          </>
                        )}
                        {item.id === "Dark" && (
                          <>
                            <div className="absolute top-2 right-3 text-sm select-none">🌙</div>
                            <div className="absolute bottom-2 left-2 text-xs select-none">💫</div>
                          </>
                        )}
                        {item.id === "Bold" && (
                          <>
                            <div className="absolute top-2 left-2 w-10 h-10 rounded-full bg-amber-400/20 blur-sm" />
                            <div className="absolute bottom-2 right-2 w-12 h-12 rounded-full bg-orange-400/20 blur-sm" />
                          </>
                        )}
                        {item.id === "Bright" && (
                          <>
                            <div className="absolute bottom-1 right-2 text-sm select-none">✨</div>
                            <div className="absolute top-2 left-2 text-sm select-none">☀️</div>
                          </>
                        )}
                        {item.id === "Pink" && (
                          <>
                            <div className="absolute top-1 left-2 text-sm select-none">🌸</div>
                            <div className="absolute bottom-2 right-2 text-sm select-none">💖</div>
                          </>
                        )}
                        
                        <div className="relative z-10 flex flex-col items-center">
                          <span className={cn("text-lg font-black tracking-tight", item.titleColor)}>
                            {item.label}
                          </span>
                          <span className={cn("mt-1 text-xs font-semibold", item.descColor)}>
                            {item.desc}
                          </span>
                        </div>

                        {/* Selected Indicator */}
                        {active && (
                          <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-[#eb3b5a] to-[#ff6f86] text-white shadow-md animate-[slide-appear_0.2s_ease-out]">
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>


              {/* Success Card */}
              <div className="rounded-2xl border border-[#ffd9de] bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm mb-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                    <Check className="h-5 w-5 text-emerald-600" strokeWidth={3} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-emerald-800">Great! You&apos;re all set.</h4>
                    <p className="mt-1 text-sm text-emerald-600">Click Generate Presentation and let AI do the magic!</p>
                  </div>
                  <div className="hidden flex-shrink-0 lg:block">
                    <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-emerald-100/50">
                      <Sparkles className="h-6 w-6 text-emerald-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 Navigation */}
              <div className="flex items-center justify-between border-t border-[#ffd9de] pt-6">
                <button type="button" onClick={() => { setStep(2); scrollToTop(); }}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#ffd9de] bg-white px-5 text-sm font-semibold text-[#55516e] shadow-sm transition-all duration-200 hover:border-[#eb3b5a] hover:text-[#eb3b5a] max-sm:h-10 max-sm:px-3 max-sm:text-xs"
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" /> Back
                </button>
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-[#eceef3]" />
                  <span className="flex h-2.5 w-2.5 rounded-full bg-[#eceef3]" />
                  <span className="flex h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#eb3b5a] to-[#ff6f86]" />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <TrialGatePill kind="presentation" />
                  <button type="button" disabled={!canGenerate || generating} onClick={generate}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#eb3b5a] to-[#ff6f86] px-6 text-sm font-bold text-white shadow-[0_10px_22px_rgba(235,59,90,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(235,59,90,0.3)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 max-sm:h-10 max-sm:px-4 max-sm:text-xs"
                  >
                    <Sparkles className="h-5 w-5 max-sm:h-4 max-sm:w-4" /> Generate Presentation
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldCard({ icon: Icon, label, required, color = "blue", children }: { icon: React.ComponentType<{ className?: string }>; label: string; required?: boolean; color?: string; children: ReactNode }) {
  const toneMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: "bg-[#eef6ff]", text: "text-[#3b82f6]" },
    green: { bg: "bg-[#ecfff6]", text: "text-[#24b77a]" },
    orange: { bg: "bg-[#fff6df]", text: "text-[#f0a22f]" },
    purple: { bg: "bg-[#f6f1ff]", text: "text-[#8b5cf6]" },
    amber: { bg: "bg-[#fffbeb]", text: "text-[#d97706]" },
    teal: { bg: "bg-[#f0fdfa]", text: "text-[#0d9488]" },
    sky: { bg: "bg-[#f0fdff]", text: "text-[#0ea5e9]" },
    indigo: { bg: "bg-[#eef2ff]", text: "text-[#6366f1]" },
    cyan: { bg: "bg-[#f0fdff]", text: "text-[#16a9b6]" },
  };
  const tone = toneMap[color] || toneMap.blue;
  return (
    <div className="min-w-0 rounded-2xl border border-[#ffd9de] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center gap-2.5 sm:gap-3 sm:mb-4">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 ${tone.bg} ${tone.text}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <span className="text-xs font-medium text-[#55516e] sm:text-sm">{label} {required && <span className="text-red-500">*</span>}</span>
      </div>
      {children}
    </div>
  );
}

function Placeholder({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-10 items-center rounded-xl border border-[#ffd9de] bg-[#fff7f8] px-3.5 text-sm text-[#9CA0AA]">
      {children}
    </div>
  );
}
