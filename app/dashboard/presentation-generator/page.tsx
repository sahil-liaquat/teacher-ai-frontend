"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, Presentation, Sparkles } from "lucide-react";
import { backendApi, Board, Book, Chapter, ClassItem, getRateLimitNotice, isPaymentRequiredError, type PresentationGeneratePayload } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { GenerationLoadingScreen } from "@/components/generation-loading-screen";
import { readToolDraft, saveToolDraft } from "@/lib/form-draft-storage";
import { saveLatestPresentationId } from "@/lib/presentation-generator";
import { useUpgradeModal } from "@/components/billing/upgrade-modal";
import { filteredBooksForSubject, findMatchingBoard, findMatchingChapter, findMatchingClass, findMatchingSubject, getCompanionPrefillContext, hasCompanionPrefill } from "@/lib/companion-prefill";

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
  slideCount: (typeof slideCountOptions)[number];
  language: (typeof languageOptions)[number];
  style: (typeof styleOptions)[number];
  tone: (typeof toneOptions)[number];
  detailLevel: (typeof detailOptions)[number];
  visualDensity: (typeof visualOptions)[number];
  instructions: string;
};

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
  const [detailLevel, setDetailLevel] = useState<(typeof detailOptions)[number]>("Balanced");
  const [visualDensity, setVisualDensity] = useState<(typeof visualOptions)[number]>("Balanced visuals");
  const [instructions, setInstructions] = useState("");
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

  useEffect(() => {
    const draft = readToolDraft<PresentationFormDraft>(PRESENTATION_DRAFT_KEY);
    if (draft) {
      setBoardId(draft.boardId || "");
      setClassId(draft.classId || "");
      setSubject(draft.subject || "");
      setBookId(draft.bookId || "");
      setChapterNames(draft.chapterNames || []);
      setTopic(draft.topic || "");
      setSlideCount(draft.slideCount || 8);
      setLanguage(draft.language || "English");
      setStyle(draft.style || "Clean classroom");
      setTone(draft.tone || "Simple");
      setDetailLevel(draft.detailLevel || "Balanced");
      setVisualDensity(draft.visualDensity || "Balanced visuals");
      setInstructions(draft.instructions || "");
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
      topic,
      slideCount,
      language,
      style,
      tone,
      detailLevel,
      visualDensity,
      instructions
    });
  }, [draftReady, boardId, chapterNames, classId, bookId, detailLevel, instructions, language, slideCount, subject, style, tone, topic, visualDensity]);

  useEffect(() => {
    setFetching(true);
    backendApi.boards(0, 100)
      .then((res) => setBoards(res.items.filter((board) => board.is_active !== false)))
      .catch((error) => toast({ title: "Could not load boards", description: error instanceof Error ? error.message : "Please try again." }))
      .finally(() => setFetching(false));
  }, [toast]);

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
        if (!cancelled) setClassesError(error instanceof Error ? error.message : "Could not load classes.");
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
        if (!cancelled) setBooksError(error instanceof Error ? error.message : "Could not load books.");
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
        if (!cancelled) setChaptersError(error instanceof Error ? error.message : "Could not load chapters.");
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
    setClassId("");
    setSubject("");
    setBookId("");
    setChapterNames([]);
    setClasses([]);
    setBooks([]);
    setChapters([]);
    setClassesError("");
    setBooksError("");
    setChaptersError("");
    setIsLoadingClasses(Boolean(value));
    setIsLoadingBooks(false);
    setIsLoadingChapters(false);
  }

  function chooseClass(value: string) {
    setClassId(value);
    setSubject("");
    setBookId("");
    setChapterNames([]);
    setBooks([]);
    setChapters([]);
    setBooksError("");
    setChaptersError("");
    setIsLoadingBooks(Boolean(value));
    setIsLoadingChapters(false);
  }

  function chooseSubject(value: string) {
    setSubject(value);
    setBookId("");
    setChapterNames([]);
    setChapters([]);
    setChaptersError("");
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
        detail_level: detailLevel,
        visual_density: visualDensity,
        instructions: instructions.trim() || null,
        include_speaker_notes: true,
        include_activities: true,
        include_quiz: true,
        include_images: true,
        source: {
          board_id: boardId,
          class_id: classId,
          book_id: bookId,
          chapter_names: chapterNames
        }
      };
      const generation = await backendApi.createPresentation(payload);
      saveLatestPresentationId(generation.id);
      toast({ title: "Presentation generated", description: "Opening the output page." });
      router.push(`/dashboard/presentation-generator/output?id=${generation.id}`);
    } catch (error) {
      if (isPaymentRequiredError(error)) {
        setGenerating(false);
        setGenerationStatus("");
        openUpgrade("Presentation generation requires a Pro plan.");
        return;
      }
      const rateLimit = getRateLimitNotice(error);
      const message = rateLimit ? rateLimit.description : (error instanceof Error ? error.message : "Could not generate presentation.");
      setGenerationError(message);
      toast(rateLimit ?? { title: "Generation failed", description: message });
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
    <div className="mx-auto w-full max-w-[1240px] space-y-3">
      <Link href="/dashboard/classroom-tools" className="inline-flex items-center gap-1.5 text-sm font-black text-[#eb3b5a] transition hover:text-[#be123c]">
        <ArrowLeft className="h-4 w-4" />
        Back to tools
      </Link>
      <div className="overflow-hidden rounded-[18px] border border-[#ffd9de] bg-white shadow-[0_14px_34px_rgba(39,30,91,0.07)]">
        <div className="relative min-h-[178px] border-b border-[#ffd9de] bg-gradient-to-br from-[#fff7f8] via-white to-[#ffe5e9] px-5 py-6 sm:px-6">
          <div className="relative z-10 max-w-[650px]">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-black text-[#eb3b5a] shadow-sm">
              <Presentation className="h-4 w-4" />
              Presentation Generator
            </div>
            <h1 className="text-[28px] font-black tracking-tight text-[#25262b] sm:text-[34px]">Create presentation</h1>
            <p className="mt-2.5 max-w-[580px] text-sm font-medium leading-6 text-[#55516e]">
              Select a textbook source, choose chapters, and generate a clean classroom deck from the backend.
            </p>
            <Button type="button" variant="outline" className="mt-4 border-[#ffd9de] bg-white/90 px-4 text-[#eb3b5a]">
              <BookOpen className="h-4 w-4" />
              Textbook grounded
            </Button>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] overflow-hidden lg:block">
            <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-white/80 to-transparent" />
            <img
              src="/assets/illustrations/create-presentation-header.png"
              alt=""
              aria-hidden="true"
              className="absolute -bottom-5 -right-8 w-[360px] select-none object-contain drop-shadow-[0_18px_18px_rgba(235,59,90,0.18)] xl:-right-4 xl:w-[440px]"
            />
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:p-5">
          <NumericSection number="1" title="Presentation Setup" subtitle="Select the textbook source and chapters for this deck.">
            <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] 2xl:grid-cols-[repeat(3,minmax(0,1fr))]">
              <FieldBox label="Board / Curriculum" required>
                <Select value={boardId} onChange={(event) => chooseBoard(event.target.value)} disabled={fetching} isLoading={fetching} loadingLabel="Loading boards...">
                  <option value="">Select Board / Curriculum</option>
                  {boards.map((board) => <option key={board.id} value={board.id}>{board.name} ({board.code})</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Class / Grade" required error={classesError}>
                <Select value={classId} onChange={(event) => chooseClass(event.target.value)} disabled={!boardId || isLoadingClasses} isLoading={isLoadingClasses} loadingLabel="Loading classes...">
                  <option value="">Select Class / Grade</option>
                  {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Subject" required>
                <Select value={subject} onChange={(event) => chooseSubject(event.target.value)} disabled={!classId || !books.length || isLoadingBooks} isLoading={isLoadingBooks} loadingLabel="Loading subjects...">
                  <option value="">Select Subject</option>
                  {subjectOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Book / Textbook" required error={booksError}>
                <Select value={bookId} onChange={(event) => chooseBook(event.target.value)} disabled={!classId || !subject || isLoadingBooks} isLoading={isLoadingBooks} loadingLabel="Loading books...">
                  <option value="">Select Book / Textbook</option>
                  {filteredBooks.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Chapter / Unit" required error={chaptersError}>
                <Select value={chapterNames[0] || ""} onChange={(event) => chooseChapter(event.target.value)} disabled={!bookId || isLoadingChapters} isLoading={isLoadingChapters} loadingLabel="Loading chapters...">
                  <option value="">Select Chapter / Unit</option>
                  {chapters.map((chapter) => {
                    const name = chapter.chapter_title || chapter.title || "";
                    return <option key={chapter.id} value={name}>{chapter.chapter_number ? `${chapter.chapter_number}. ` : ""}{name}</option>;
                  })}
                </Select>
              </FieldBox>
              <FieldBox label="Topic" required>
                <Input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="e.g. Photosynthesis equation" maxLength={150} />
              </FieldBox>
              <FieldBox label="Slides" required>
                <Select value={String(slideCount)} onChange={(event) => setSlideCount(Number(event.target.value) as typeof slideCount)}>
                  {slideCountOptions.map((item) => <option key={item} value={item}>{item} slides</option>)}
                </Select>
              </FieldBox>
            </div>

            {!bookId ? <p className="mt-3 text-sm font-semibold text-[#6d6f78]">Select a textbook to load chapters.</p> : null}
          </NumericSection>

          <NumericSection number="2" title="Deck Style" subtitle="Keep the deck simple and classroom-ready.">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] 2xl:grid-cols-[repeat(3,minmax(0,1fr))]">
              <FieldBox label="Language">
                <Select value={language} onChange={(event) => setLanguage(event.target.value as typeof language)}>
                  {languageOptions.map((item) => <option key={item}>{item}</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Style">
                <Select value={style} onChange={(event) => setStyle(event.target.value as typeof style)}>
                  {styleOptions.map((item) => <option key={item}>{item}</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Tone">
                <Select value={tone} onChange={(event) => setTone(event.target.value as typeof tone)}>
                  {toneOptions.map((item) => <option key={item}>{item}</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Detail">
                <Select value={detailLevel} onChange={(event) => setDetailLevel(event.target.value as typeof detailLevel)}>
                  {detailOptions.map((item) => <option key={item}>{item}</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Visuals">
                <Select value={visualDensity} onChange={(event) => setVisualDensity(event.target.value as typeof visualDensity)}>
                  {visualOptions.map((item) => <option key={item}>{item}</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Instructions">
                <Textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="Optional focus, examples, or classroom constraints." rows={3} maxLength={500} />
              </FieldBox>
            </div>
          </NumericSection>

          <div className="flex flex-col gap-3 rounded-xl border border-[#ffd9de] bg-[#fff7f8] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-[14px] bg-white text-[#eb3b5a]">
                <Presentation className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-black text-[#25262b]">Generate presentation</p>
                <p className="mt-1 text-sm font-medium text-[#6d6f78]">
                  {selectedBook ? `Using ${selectedBook.title} • ${chapterNames.length || 0} chapter${chapterNames.length === 1 ? "" : "s"}` : "Select a subject, textbook, and chapters."}
                </p>
              </div>
            </div>
            <Button type="button" disabled={!canGenerate || generating} onClick={generate} className="bg-gradient-to-r from-[#eb3b5a] to-[#ff6f86] sm:min-w-[220px]">
              <Sparkles className="h-5 w-5" />
              {generating ? "Generating..." : "Generate Presentation"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function audienceFromClass(className: string): PresentationGeneratePayload["audience"] {
  const match = className.match(/\b(6|7|8|9|10|11|12)\b/);
  return match ? `Class ${match[1]}` as PresentationGeneratePayload["audience"] : "Class 8";
}

function NumericSection({ number, title, subtitle, children }: { number: string; title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[16px] border border-[#ffd9de] bg-white shadow-[0_10px_24px_rgba(39,30,91,0.04)]">
      <div className="flex items-start gap-3 p-4">
        <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#eb3b5a] to-[#ff6f86] text-base font-black text-white">{number}</div>
        <div>
          <h2 className="text-base font-black text-[#25262b]">{title}</h2>
          <p className="text-sm text-[#6d6f78]">{subtitle}</p>
        </div>
      </div>
      <div className="px-4 pb-4">{children}</div>
    </section>
  );
}

function FieldBox({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <label className="grid w-full min-w-0 max-w-full gap-2 self-stretch">
      <span className="truncate text-sm font-black text-[#4f4b68]">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {error ? <span className="text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}
