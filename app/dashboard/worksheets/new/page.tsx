"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, ClipboardList, Sparkles } from "lucide-react";
import { backendApi, Board, Book, Chapter, ClassItem, getRateLimitNotice, isPaymentRequiredError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { GenerationLoadingScreen } from "@/components/generation-loading-screen";
import { readToolDraft, saveToolDraft } from "@/lib/form-draft-storage";
import { saveWorksheetGeneration } from "@/lib/worksheet-storage";
import { useUpgradeModal } from "@/components/billing/upgrade-modal";
import { filteredBooksForSubject, findMatchingBoard, findMatchingChapter, findMatchingClass, findMatchingSubject, getCompanionPrefillContext, hasCompanionPrefill } from "@/lib/companion-prefill";

const difficultyPresets = [
  { key: "easy", label: "Easy", values: { easy: 60, medium: 30, hard: 10 } },
  { key: "balanced", label: "Balanced", values: { easy: 40, medium: 40, hard: 20 } },
  { key: "hard", label: "Hard", values: { easy: 20, medium: 40, hard: 40 } }
] as const;

type DifficultyDistribution = { easy: number; medium: number; hard: number };

const questionTypeOptions = [
  "MCQ",
  "True/False",
  "Fill in the Blanks",
  "One Word Answer",
  "Short Answer",
  "Long Answer",
  "Match the Following",
  "Application Based Questions"
];

const defaultQuestionTypes = [
  "MCQ",
  "True/False",
  "Fill in the Blanks",
  "One Word Answer",
  "Short Answer"
];
const WORKSHEET_DRAFT_KEY = "worksheet";

type WorksheetFormDraft = {
  boardId: string;
  classId: string;
  subject: string;
  bookId: string;
  chapterNames: string[];
  questionCountInput: string;
  language: string;
  difficulty: DifficultyDistribution;
  questionTypes: string[];
};

export default function NewWorksheetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { openUpgrade } = useUpgradeModal();
  const companionContext = useMemo(() => getCompanionPrefillContext(searchParams), [searchParams]);
  const companionApplied = useRef({ board: false, class: false, subject: false, book: false, chapter: false });
  const [boards, setBoards] = useState<Board[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [boardId, setBoardId] = useState("");
  const [classId, setClassId] = useState("");
  const [subject, setSubject] = useState("");
  const [bookId, setBookId] = useState("");
  const [chapterNames, setChapterNames] = useState<string[]>([]);
  const [questionCountInput, setQuestionCountInput] = useState("16");
  const [language, setLanguage] = useState("English");
  const [difficulty, setDifficulty] = useState<DifficultyDistribution>(difficultyPresets[1].values);
  const [questionTypes, setQuestionTypes] = useState(defaultQuestionTypes);
  const [fetching, setFetching] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [classesError, setClassesError] = useState("");
  const [subjectsError, setSubjectsError] = useState("");
  const [booksError, setBooksError] = useState("");
  const [chaptersError, setChaptersError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    const draft = readToolDraft<WorksheetFormDraft>(WORKSHEET_DRAFT_KEY);
    if (draft) {
      setBoardId(draft.boardId || "");
      setClassId(draft.classId || "");
      setSubject(draft.subject || "");
      setBookId(draft.bookId || "");
      setChapterNames(draft.chapterNames || []);
      setQuestionCountInput(draft.questionCountInput || "16");
      setLanguage(draft.language || "English");
      setDifficulty(draft.difficulty || difficultyPresets[1].values);
      setQuestionTypes(draft.questionTypes?.length ? draft.questionTypes : defaultQuestionTypes);
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    saveToolDraft<WorksheetFormDraft>(WORKSHEET_DRAFT_KEY, {
      boardId,
      classId,
      subject,
      bookId,
      chapterNames,
      questionCountInput,
      language,
      difficulty,
      questionTypes
    });
  }, [draftReady, boardId, chapterNames, classId, bookId, difficulty, language, questionCountInput, questionTypes, subject]);

  useEffect(() => {
    setFetching(true);
    backendApi.boards(0, 100)
      .then((res) => setBoards(res.items.filter((board) => board.is_active !== false)))
      .catch((err) => toast({ title: "Could not load boards", description: err.message }))
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
      .catch((err) => {
        if (!cancelled) setClassesError(err instanceof Error ? err.message : "Could not load classes.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingClasses(false);
      });
    return () => {
      cancelled = true;
    };
  }, [boardId, toast]);

  useEffect(() => {
    if (!classId) {
      setIsLoadingSubjects(false);
      setIsLoadingBooks(false);
      return;
    }
    let cancelled = false;
    setSubjectsError("");
    setBooksError("");
    setIsLoadingSubjects(true);
    setIsLoadingBooks(true);
    backendApi.booksByClass(classId, 0, 100)
      .then((res) => {
        if (!cancelled) setBooks(res.items.filter((book) => book.is_active !== false && book.is_ingested !== false));
      })
      .catch((err) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Could not load books.";
          setSubjectsError(message);
          setBooksError(message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingSubjects(false);
          setIsLoadingBooks(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [classId, toast]);

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
      .catch((err) => {
        if (!cancelled) setChaptersError(err instanceof Error ? err.message : "Could not load chapters.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingChapters(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookId, toast]);

  const selectedBook = useMemo(() => books.find((book) => book.id === bookId), [books, bookId]);
  const subjectOptions = useMemo(() => Array.from(new Set(books.map((book) => book.subject).filter(Boolean))).sort(), [books]);
  const filteredBooks = useMemo(() => books.filter((book) => !subject || book.subject === subject), [books, subject]);
  const questionCount = Number(questionCountInput);
  const isLoadingOptions = fetching || isLoadingClasses || isLoadingSubjects || isLoadingBooks || isLoadingChapters;
  const canGenerate = Boolean(bookId && chapterNames.length && Number.isFinite(questionCount) && questionCount >= 1 && questionTypes.length);

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
    setClasses([]);
    setBooks([]);
    setChapters([]);
    setClassId("");
    setSubject("");
    setBookId("");
    setChapterNames([]);
    setClassesError("");
    setSubjectsError("");
    setBooksError("");
    setChaptersError("");
    setIsLoadingClasses(Boolean(value));
    setIsLoadingSubjects(false);
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
    setSubjectsError("");
    setBooksError("");
    setChaptersError("");
    setIsLoadingSubjects(Boolean(value));
    setIsLoadingBooks(Boolean(value));
    setIsLoadingChapters(false);
  }

  function chooseSubject(value: string) {
    setSubject(value);
    setBookId("");
    setChapters([]);
    setChapterNames([]);
    setBooksError("");
    setChaptersError("");
    setIsLoadingBooks(Boolean(value));
    window.requestAnimationFrame(() => setIsLoadingBooks(false));
  }

  function chooseBook(value: string) {
    setBookId(value);
    setChapters([]);
    setChapterNames([]);
    setChaptersError("");
    setIsLoadingChapters(Boolean(value));
  }

  function toggleQuestionType(type: string) {
    setQuestionTypes((items) => items.includes(type) ? items.filter((item) => item !== type) : [...items, type]);
  }

  function chooseChapter(value: string) {
    setChapterNames(value ? [value] : []);
  }

  function updateQuestionCount(value: string) {
    if (/^\d{0,2}$/.test(value)) setQuestionCountInput(value);
  }

  function normalizeQuestionCount() {
    const next = Math.min(60, Math.max(1, Number(questionCountInput || 1)));
    setQuestionCountInput(String(next));
  }

  async function generate() {
    if (!canGenerate) {
      toast({ title: "Complete required details", description: "Select textbook, at least one chapter, and at least one question type." });
      return;
    }
    setGenerating(true);
    setGenerationError("");
    setGenerationStatus("Reading the textbook...");
    const t1 = window.setTimeout(() => setGenerationStatus("Reading the textbook..."), 0);
    const t2 = window.setTimeout(() => setGenerationStatus("Finding key concepts..."), 3000);
    const t3 = window.setTimeout(() => setGenerationStatus("Writing questions..."), 10000);
    const t4 = window.setTimeout(() => setGenerationStatus("Building answer key..."), 20000);
    const t5 = window.setTimeout(() => setGenerationStatus("Almost ready..."), 35000);
    try {
      const generation = await backendApi.createWorksheet({
        book_id: bookId,
        chapter_names: chapterNames,
        question_count: questionCount,
        question_types: questionTypes,
        language,
        difficulty_distribution: difficulty,
        include_answer_key: true,
        include_marking_scheme: true,
        include_hints: false,
        include_diagrams_images: false
      });
      setGenerationStatus("Formatting output...");
      saveWorksheetGeneration(generation);
      toast({ title: "Worksheet generated", description: "Opening printable worksheet." });
      router.push(`/dashboard/worksheets/${generation.id}`);
    } catch (error) {
      if (isPaymentRequiredError(error)) {
        setGenerating(false);
        setGenerationStatus("");
        openUpgrade("Worksheet generation requires a Pro plan.");
        return;
      }
      const rateLimit = getRateLimitNotice(error);
      const message = rateLimit ? rateLimit.description : (error instanceof Error ? error.message : "Could not generate worksheet.");
      setGenerationError(message);
      toast(rateLimit ?? { title: "Generation failed", description: message });
      setGenerating(false);
      setGenerationStatus("");
    } finally {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
      window.clearTimeout(t5);
    }
  }

  if (generating || generationError) {
    return (
      <GenerationLoadingScreen
        type="worksheet"
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
    <div className="mx-auto w-full max-w-[1240px]">
      <div className="overflow-hidden rounded-[18px] border border-[#d8f1e5] bg-white shadow-[0_14px_34px_rgba(39,30,91,0.07)]">
        <div className="relative min-h-[178px] border-b border-[#d8f1e5] bg-gradient-to-br from-[#ecfff7] to-[#def8ef] px-5 py-6 sm:px-6">
          <div className="relative z-10 max-w-[620px]">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-xs font-black text-[#159565] shadow-sm">
              <Sparkles className="h-4 w-4" /> Printable practice
            </div>
            <h1 className="flex items-center gap-2.5 text-[28px] font-black tracking-tight text-[#25262b] sm:text-[34px]">
              Create Worksheet
            </h1>
            <p className="mt-2.5 max-w-[560px] text-sm font-medium leading-6 text-[#55516e]">
              Generate clean A4 worksheets from selected textbook chapters with only the question types you choose.
            </p>
            <Button type="button" variant="outline" className="mt-4 border-[#bdebd7] bg-white/90 px-4 text-[#159565]">
              <BookOpen className="h-4 w-4" /> Textbook grounded
            </Button>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] overflow-hidden lg:block">
            <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#e7fbf2] to-transparent" />
            <img
              src="/assets/illustrations/create-worksheet-header.png"
              alt=""
              aria-hidden="true"
              className="absolute -bottom-5 -right-8 w-[390px] select-none object-contain drop-shadow-[0_18px_18px_rgba(14,116,79,0.18)] xl:-right-5 xl:w-[470px]"
            />
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:p-5">
          <NumericSection number="1" title="Worksheet Setup" subtitle="Select the textbook source and chapters for this worksheet.">
            <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] 2xl:grid-cols-[repeat(3,minmax(0,1fr))]">
              <FieldBox label="Board / Curriculum" required>
                <Select value={boardId} onChange={(e) => chooseBoard(e.target.value)}>
                  <option value="">Select Board / Curriculum</option>
                  {boards.map((board) => <option key={board.id} value={board.id}>{board.name} ({board.code})</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Class / Grade" required error={classesError}>
                <Select value={classId} onChange={(e) => chooseClass(e.target.value)} disabled={!boardId || isLoadingClasses} isLoading={isLoadingClasses} loadingLabel="Loading classes...">
                  <option value="">Select Class / Grade</option>
                  {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Subject" required error={subjectsError}>
                <Select value={subject} onChange={(e) => chooseSubject(e.target.value)} disabled={!classId || !books.length || isLoadingSubjects} isLoading={isLoadingSubjects} loadingLabel="Loading subjects...">
                  <option value="">Select Subject</option>
                  {subjectOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Book / Textbook" required error={booksError}>
                <Select value={bookId} onChange={(e) => chooseBook(e.target.value)} disabled={!classId || !subject || isLoadingBooks} isLoading={isLoadingBooks} loadingLabel="Loading books...">
                  <option value="">Select Book / Textbook</option>
                  {filteredBooks.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Number of Questions" required>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={1}
                  max={60}
                  value={questionCountInput}
                  onChange={(e) => updateQuestionCount(e.target.value)}
                  onBlur={normalizeQuestionCount}
                />
              </FieldBox>
              <FieldBox label="Language" required>
                <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Urdu</option>
                </Select>
              </FieldBox>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] 2xl:grid-cols-[repeat(3,minmax(0,1fr))]">
              <FieldBox label="Chapter / Unit" required error={chaptersError}>
                <Select value={chapterNames[0] || ""} onChange={(event) => chooseChapter(event.target.value)} disabled={!bookId || isLoadingChapters} isLoading={isLoadingChapters} loadingLabel="Loading chapters...">
                  <option value="">Select Chapter / Unit</option>
                  {chapters.map((chapter) => <option key={chapter.id} value={chapter.chapter_title || chapter.title || ""}>{chapter.chapter_number ? `${chapter.chapter_number}. ` : ""}{chapter.chapter_title || chapter.title}</option>)}
                </Select>
              </FieldBox>
            </div>
          </NumericSection>

          <NumericSection number="2" title="Choose Question Types" subtitle="Only selected sections will appear in the worksheet.">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {questionTypeOptions.map((type) => {
                const active = questionTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleQuestionType(type)}
                    aria-pressed={active}
                    className={`premium-hover-sm flex min-h-[60px] items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 ${active ? "border-emerald-300 bg-[#ecfff7] text-[#0b7f53] shadow-[0_10px_22px_rgba(22,163,99,0.10)]" : "border-[#dffafa] bg-white text-[#4f4b68] hover:border-emerald-200"}`}
                  >
                    <span className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-full border-2 text-xs font-black ${active ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent"}`}>✓</span>
                    <span className="text-sm font-black">{type}</span>
                  </button>
                );
              })}
            </div>
            {!questionTypes.length ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Select at least one question type.</p> : null}
          </NumericSection>

          <NumericSection number="3" title="Difficulty Distribution" subtitle="Choose the balance for easy, medium, and hard questions.">
            <div className="grid gap-4">
              <div className="flex rounded-xl border border-[#dffafa] bg-[#f8ffff] p-1">
                {difficultyPresets.map((preset) => {
                  const active = difficulty.easy === preset.values.easy && difficulty.medium === preset.values.medium && difficulty.hard === preset.values.hard;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => setDifficulty(preset.values)}
                      className={`h-10 flex-1 rounded-lg text-sm font-black transition-all duration-200 ${active ? "bg-white text-[#25262b] shadow-sm" : "text-[#6d6f78] hover:text-emerald-700"}`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <div className="overflow-hidden rounded-xl border border-[#dffafa] bg-white">
                <div className="flex h-4">
                  <div className="bg-emerald-400 transition-all duration-500" style={{ width: `${difficulty.easy}%` }} />
                  <div className="bg-blue-500 transition-all duration-500" style={{ width: `${difficulty.medium}%` }} />
                  <div className="bg-orange-400 transition-all duration-500" style={{ width: `${difficulty.hard}%` }} />
                </div>
                <div className="grid gap-3 p-3 text-sm font-black text-[#25262b] md:grid-cols-3">
                  <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-400" /> Easy {difficulty.easy}%</span>
                  <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-500" /> Medium {difficulty.medium}%</span>
                  <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-orange-400" /> Hard {difficulty.hard}%</span>
                </div>
              </div>
            </div>
          </NumericSection>

          <div className="flex flex-col gap-3 rounded-xl border border-[#bdebd7] bg-[#f8fffb] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-[14px] bg-[#e5ffc6] text-[#8ec63f]">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-black text-[#25262b]">Generate printable worksheet</p>
                <p className="mt-1 text-sm font-medium text-[#6d6f78]">
                  {generating && generationStatus ? generationStatus : isLoadingOptions ? "Loading options..." : selectedBook ? `Using ${selectedBook.title} • ${chapterNames.length || 0} chapter${chapterNames.length === 1 ? "" : "s"}` : "Select a subject, textbook, and chapters."}
                </p>
              </div>
            </div>
            <Button type="button" disabled={!canGenerate || generating} onClick={generate} className="bg-gradient-to-r from-[#1fbc79] to-[#069462] sm:min-w-[220px]">
              <Sparkles className="h-5 w-5" />
              {generating ? "Generating..." : "Generate Worksheet"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NumericSection({ number, title, subtitle, children }: { number: string; title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[16px] border border-[#dffafa] bg-white shadow-[0_10px_24px_rgba(39,30,91,0.04)]">
      <div className="flex items-start gap-3 p-4">
        <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#22c977] to-[#079765] text-base font-black text-white">{number}</div>
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
