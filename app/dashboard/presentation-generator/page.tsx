"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, LoaderCircle, Presentation, Sparkles } from "lucide-react";
import { backendApi, Board, Book, Chapter, ClassItem, type PresentationGeneratePayload } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { GenerationLoadingScreen } from "@/components/generation-loading-screen";
import { saveLatestPresentationId } from "@/lib/presentation-generator";

const slideCountOptions = [6, 8, 10, 12] as const;
const languageOptions = ["English", "Hindi", "Urdu"] as const;
const styleOptions = ["Clean classroom", "Visual story", "Activity based", "Exam revision"] as const;
const toneOptions = ["Simple", "Conversational", "Academic", "Revision focused"] as const;
const detailOptions = ["Brief", "Balanced", "Detailed"] as const;
const visualOptions = ["Light visuals", "Balanced visuals", "Image rich"] as const;

export default function PresentationGeneratorPage() {
  const router = useRouter();
  const { toast } = useToast();
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
  const canGenerate = Boolean(boardId && classId && bookId && chapterNames.length && topic.trim().length > 2);

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

  function toggleChapter(name: string) {
    setChapterNames((items) => items.includes(name) ? items.filter((item) => item !== name) : [...items, name]);
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
        topic: topic.trim(),
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
      const message = error instanceof Error ? error.message : "Could not generate presentation.";
      setGenerationError(message);
      toast({ title: "Generation failed", description: message });
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
    <div className="mx-auto max-w-[1120px]">
      <div className="overflow-hidden rounded-[18px] border border-[#ffd9de] bg-white shadow-[0_14px_34px_rgba(39,30,91,0.07)]">
        <div className="relative border-b border-[#ffd9de] bg-gradient-to-br from-[#fff7f8] via-white to-[#ffe5e9] px-5 py-6 sm:px-6">
          <div className="max-w-[650px]">
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
        </div>

        <div className="grid gap-4 p-4 sm:p-5">
          <NumericSection number="1" title="Presentation Setup" subtitle="Select the textbook source and chapters for this deck.">
            <div className="grid min-w-0 gap-4 md:grid-cols-2 2xl:grid-cols-3">
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
              <FieldBox label="Topic" required>
                <Input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="e.g. Photosynthesis equation" maxLength={150} />
              </FieldBox>
              <FieldBox label="Slides" required>
                <Select value={String(slideCount)} onChange={(event) => setSlideCount(Number(event.target.value) as typeof slideCount)}>
                  {slideCountOptions.map((item) => <option key={item} value={item}>{item} slides</option>)}
                </Select>
              </FieldBox>
            </div>

            <div className="mt-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-[#4f4b68]">Chapters / Units <span className="text-red-500">*</span></p>
                <span className="rounded-full bg-[#fff7f8] px-3 py-1 text-xs font-black text-[#eb3b5a]">{chapterNames.length} selected</span>
              </div>
              {isLoadingChapters ? (
                <div className="flex min-h-[64px] items-center justify-between gap-3 rounded-xl border border-[#ffd9de] bg-[#fffafb] px-4 text-sm font-bold text-[#6d6f78]">
                  <span>Loading chapters...</span>
                  <LoaderCircle className="h-5 w-5 animate-spin text-[#eb3b5a]" />
                </div>
              ) : chaptersError ? (
                <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{chaptersError}</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {chapters.map((chapter) => {
                    const name = chapter.chapter_title || chapter.title || "";
                    const active = chapterNames.includes(name);
                    return (
                      <button
                        key={chapter.id}
                        type="button"
                        disabled={!bookId}
                        onClick={() => toggleChapter(name)}
                        aria-pressed={active}
                        className={`premium-hover-sm flex min-h-[60px] items-start gap-3 rounded-xl border p-3 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${active ? "border-[#ffb8c3] bg-[#fff7f8] text-[#c92d49] shadow-[0_10px_22px_rgba(235,59,90,0.10)]" : "border-[#ffd9de] bg-white text-[#4f4b68] hover:border-[#ffb8c3]"}`}
                      >
                        <span className={`mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-full border-2 text-xs font-black ${active ? "border-[#eb3b5a] bg-[#eb3b5a] text-white" : "border-slate-300 text-transparent"}`}>✓</span>
                        <span className="min-w-0 text-sm font-black leading-5">
                          {chapter.chapter_number ? `${chapter.chapter_number}. ` : ""}{name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {!bookId ? <p className="mt-3 text-sm font-semibold text-[#6d6f78]">Select a textbook to load chapters.</p> : null}
            </div>
          </NumericSection>

          <NumericSection number="2" title="Deck Style" subtitle="Keep the deck simple and classroom-ready.">
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
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
    <label className="grid min-w-0 gap-2">
      <span className="truncate text-sm font-black text-[#4f4b68]">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {error ? <span className="text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}
