"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, Check, ChevronDown, ClipboardCheck, ClipboardList, FileText, FlaskConical, Globe, GraduationCap, Hash, Image, Lightbulb, LoaderCircle, Sparkles, Users } from "lucide-react";
import { backendApi, Board, Book, Chapter, ClassItem, getRateLimitNotice, isPaymentRequiredError } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { GenerationLoadingScreen } from "@/components/generation-loading-screen";
import { readToolDraft, saveToolDraft } from "@/lib/form-draft-storage";
import { saveWorksheetGeneration } from "@/lib/worksheet-storage";
import { useUpgradeModal } from "@/components/billing/upgrade-modal";
import { filteredBooksForSubject, findMatchingBoard, findMatchingChapter, findMatchingClass, findMatchingSubject, getCompanionPrefillContext, hasCompanionPrefill } from "@/lib/companion-prefill";
import { cn } from "@/lib/utils";

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

const defaultMarks: Record<string, number> = {
  "MCQ": 1,
  "True/False": 1,
  "Fill in the Blanks": 1,
  "One Word Answer": 1,
  "Short Answer": 3,
  "Long Answer": 5,
  "Match the Following": 1,
  "Application Based Questions": 4
};

const questionTypeIdMap: Record<string, string> = {
  "MCQ": "mcq",
  "True/False": "true_false",
  "Fill in the Blanks": "fill_in_the_blanks",
  "One Word Answer": "one_word",
  "Short Answer": "short_answer",
  "Long Answer": "long_answer",
  "Match the Following": "match_following",
  "Application Based Questions": "application_based"
};

const WORKSHEET_DRAFT_KEY = "worksheet";

type WorksheetFormDraft = {
  boardId: string;
  classId: string;
  subject: string;
  bookId: string;
  chapterNames: string[];
  topic: string;
  language: string;
  difficulty: DifficultyDistribution;
  questionTypes: string[];
  questionTypeCounts?: Record<string, number>;
  questionTypeMarks?: Record<string, number>;
  includeAnswerKey: boolean;
  includeMarkingScheme: boolean;
  includeHints: boolean;
  includeDiagramsImages: boolean;
};

export default function NewWorksheetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { openUpgrade } = useUpgradeModal();
  const companionContext = useMemo(() => getCompanionPrefillContext(searchParams), [searchParams]);
  const companionApplied = useRef({ board: false, class: false, subject: false, book: false, chapter: false, topic: false });
  const prevChaptersStr = useRef("");
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
  const [language, setLanguage] = useState("English");
  const [difficulty, setDifficulty] = useState<DifficultyDistribution>(difficultyPresets[1].values);
  const [questionTypes, setQuestionTypes] = useState<string[]>(defaultQuestionTypes);
  const [questionTypeCounts, setQuestionTypeCounts] = useState<Record<string, number>>(
    Object.fromEntries(questionTypeOptions.map(t => [t, 5]))
  );
  const [questionTypeMarks, setQuestionTypeMarks] = useState<Record<string, number>>(
    Object.fromEntries(questionTypeOptions.map(t => [t, defaultMarks[t]]))
  );
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  const [includeMarkingScheme, setIncludeMarkingScheme] = useState(true);
  const [includeHints, setIncludeHints] = useState(false);
  const [includeDiagramsImages, setIncludeDiagramsImages] = useState(false);
  const [step, setStep] = useState(1);
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
      setTopic(draft.topic || "");
      setLanguage(draft.language || "English");
      setDifficulty(draft.difficulty || difficultyPresets[1].values);
      setQuestionTypes(draft.questionTypes?.length ? draft.questionTypes : defaultQuestionTypes);
      if (draft.questionTypeCounts) setQuestionTypeCounts(draft.questionTypeCounts);
      if (draft.questionTypeMarks) setQuestionTypeMarks(draft.questionTypeMarks);
      setIncludeAnswerKey(draft.includeAnswerKey ?? true);
      setIncludeMarkingScheme(draft.includeMarkingScheme ?? true);
      setIncludeHints(draft.includeHints ?? false);
      setIncludeDiagramsImages(draft.includeDiagramsImages ?? false);
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
      topic,
      language,
      difficulty,
      questionTypes,
      questionTypeCounts,
      questionTypeMarks,
      includeAnswerKey,
      includeMarkingScheme,
      includeHints,
      includeDiagramsImages
    });
  }, [draftReady, boardId, classId, subject, bookId, chapterNames, topic, language, difficulty, questionTypes, questionTypeCounts, questionTypeMarks, includeAnswerKey, includeMarkingScheme, includeHints, includeDiagramsImages]);

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
      .catch((err) => toast({ title: "Could not load boards", description: getErrorMessage(err, "Could not load boards. Try again."), variant: "error" }))
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
      .catch((err) => {
        if (!cancelled) setClassesError(getErrorMessage(err, "Could not load classes."));
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
          const message = getErrorMessage(err, "Could not load books.");
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
      .catch((err) => {
        if (!cancelled) setChaptersError(getErrorMessage(err, "Could not load chapters."));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingChapters(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  const selectedBook = useMemo(() => books.find((book) => book.id === bookId), [books, bookId]);
  const subjectOptions = useMemo(() => Array.from(new Set(books.map((book) => book.subject).filter(Boolean))).sort(), [books]);
  const filteredBooks = useMemo(() => books.filter((book) => !subject || book.subject === subject), [books, subject]);
  const totalQuestions = questionTypes.reduce((sum, t) => sum + (questionTypeCounts[t] || 0), 0);
  const canGenerate = Boolean(bookId && chapterNames.length && questionTypes.length && totalQuestions >= 1 && totalQuestions <= 60);
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

  useEffect(() => {
    const chaptersStr = chapterNames.join(", ");
    if (!topic || topic === prevChaptersStr.current) {
      setTopic(chaptersStr);
    }
    prevChaptersStr.current = chaptersStr;
  }, [chapterNames, topic]);

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

  function chooseChapter(value: string) {
    setChapterNames(value ? [value] : []);
  }

  function toggleQuestionType(type: string) {
    setQuestionTypes((items) => items.includes(type) ? items.filter((item) => item !== type) : [...items, type]);
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
        topic: topic.trim() || undefined,
        question_type_counts: Object.fromEntries(
          questionTypes.map(t => [questionTypeIdMap[t], questionTypeCounts[t] || 5])
        ),
        question_type_marks: Object.fromEntries(
          questionTypes.map(t => [questionTypeIdMap[t], questionTypeMarks[t] || defaultMarks[t]])
        ),
        language,
        difficulty_distribution: difficulty,
        include_answer_key: includeAnswerKey,
        include_marking_scheme: includeMarkingScheme,
        include_hints: includeHints,
        include_diagrams_images: includeDiagramsImages
      });
      setGenerationStatus("Formatting output...");
      saveWorksheetGeneration(generation);
      toast({ title: "Worksheet generated", description: "Opening printable worksheet." });
      router.push(`/dashboard/worksheets/${generation.id}?new=true`);
    } catch (error) {
      if (isPaymentRequiredError(error)) {
        setGenerating(false);
        setGenerationStatus("");
        openUpgrade("Worksheet generation requires a Pro plan.");
        return;
      }
      const rateLimit = getRateLimitNotice(error);
      const message = rateLimit ? rateLimit.description : getErrorMessage(error, "Could not generate worksheet.");
      setGenerationError(message);
      toast(rateLimit ?? { title: "Generation failed", description: message, variant: "error" });
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
    <div className="mx-auto w-full max-w-[1240px] space-y-4">
      <Link href="/dashboard/classroom-tools" className="inline-flex items-center gap-1.5 text-sm font-black text-[#159565] transition hover:text-[#0f7a52]">
        <ArrowLeft className="h-4 w-4" />
        Back to tools
      </Link>

      <div className="overflow-visible rounded-[18px] border border-[#d8f1e5] bg-white/86 shadow-[0_14px_34px_rgba(39,30,91,0.07)] backdrop-blur-sm">
        {/* Header */}
        <div className="relative min-h-[100px] overflow-hidden rounded-t-[18px] border-b border-[#d8f1e5] bg-gradient-to-br from-[#ecfff7] to-white px-4 py-4 sm:min-h-[130px] sm:px-6 sm:py-5">
          {step === 1 ? (
            <div className="relative z-10 max-w-[560px]">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-xs font-black text-[#159565] shadow-sm">
                <Sparkles className="h-4 w-4" /> Printable practice
              </div>
              <h1 className="text-[28px] font-black tracking-tight text-[#25262b] sm:text-[34px]">Create Worksheet</h1>
              <p className="mt-2.5 max-w-[520px] text-sm font-medium leading-6 text-[#55516e]">Generate clean A4 worksheets from selected textbook chapters with only the question types you choose.</p>
            </div>
          ) : (
            <div className="relative z-10 max-w-[560px]">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#d8f1e5] bg-white px-3 py-1.5 text-xs font-semibold text-[#55516e] shadow-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-[#22c977] to-[#079765] text-[10px] font-bold text-white">2</span>
                Step 2 of 2
              </div>
              <h1 className="text-[28px] font-black tracking-tight text-[#25262b] sm:text-[34px]">Customize Your Worksheet</h1>
              <p className="mt-2.5 max-w-[520px] text-sm font-medium leading-6 text-[#55516e]">Choose question types, difficulty balance, and additional sections to include.</p>
            </div>
          )}
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] overflow-hidden lg:block">
            <img
              src="/assets/illustrations/create-worksheet-header.png"
              alt=""
              aria-hidden="true"
              className="absolute bottom-0 right-0 max-h-full w-[390px] select-none object-contain object-bottom drop-shadow-[0_18px_18px_rgba(14,116,79,0.18)] xl:right-2 xl:w-[470px]"
            />
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-5 pt-5 sm:px-6">
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
            step === 1 ? "bg-gradient-to-r from-[#22c977] to-[#079765] text-white shadow-[0_4px_10px_rgba(34,201,119,0.3)]" : "bg-[#ecfff7] text-[#159565]"
          )}>
            {step > 1 ? <Check className="h-3.5 w-3.5" /> : 1}
          </div>
          <div className={cn("h-0.5 w-10 rounded transition-colors", step > 1 ? "bg-[#6ee7b7]" : "bg-[#eceef3]")} />
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
            step === 2 ? "bg-gradient-to-r from-[#22c977] to-[#079765] text-white shadow-[0_4px_10px_rgba(34,201,119,0.3)]" : "bg-[#ecfff7] text-[#9CA0AA]"
          )}>
            2
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {step === 1 && (
            <div key="step-1" className="animate-slide-in-left space-y-5">
              {/* Section 1: What are you teaching? */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ecfff7] text-xs font-bold text-[#159565]">1</span>
                  <h3 className="text-base font-bold text-[#25262b]">What are you teaching?</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <FieldCard icon={GraduationCap} label="Board / Curriculum" required color="blue">
                    <Select value={boardId} onChange={(e) => chooseBoard(e.target.value)} disabled={fetching}>
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
                                  ? "bg-gradient-to-r from-[#22c977] to-[#079765] text-white shadow-[0_4px_12px_rgba(34,201,119,0.25)]"
                                  : "border border-[#d8f1e5] bg-white text-[#25262b] hover:border-[#d8f1e5] hover:bg-[#ecfff7]"
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
                    ) : isLoadingSubjects ? (
                      <Placeholder>Loading subjects...</Placeholder>
                    ) : (
                      <Select value={subject} onChange={(e) => chooseSubject(e.target.value)} disabled={!classId || (!books.length && !isLoadingSubjects)} isLoading={isLoadingSubjects} loadingLabel="Loading subjects...">
                        <option value="">Select Subject</option>
                        {subjectOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                      </Select>
                    )}
                    {subjectsError && <span className="mt-1 text-xs font-semibold text-red-500">{subjectsError}</span>}
                  </FieldCard>
                </div>
              </div>

              {/* Section 2: What are we learning? */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ecfff7] text-xs font-bold text-[#159565]">2</span>
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
                      <MultiSelect
                        options={chapters.map((chapter) => ({
                          value: chapter.chapter_title || chapter.title || "",
                          label: `${chapter.chapter_number ? `${chapter.chapter_number}. ` : ""}${chapter.chapter_title || chapter.title}`
                        }))}
                        selectedValues={chapterNames}
                        onChange={setChapterNames}
                        placeholder="Select Chapters"
                        disabled={!chapters.length}
                        isLoading={isLoadingChapters}
                        loadingLabel="Loading chapters..."
                      />
                    )}
                    {chaptersError && <span className="mt-1 text-xs font-semibold text-red-500">{chaptersError}</span>}
                  </FieldCard>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <FieldCard icon={Globe} label="Language" color="sky">
                    <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                      <option>English</option>
                      <option>Hindi</option>
                      <option>Urdu</option>
                    </Select>
                  </FieldCard>
                  <FieldCard icon={Sparkles} label="Topic / Focus" color="amber">
                    <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Optional: Type a specific topic" maxLength={150} />
                    {chapterNames.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {chapterNames.slice(0, 6).map((suggestion) => (
                          <button key={suggestion} type="button" onClick={() => setTopic(suggestion)}
                            className="inline-flex items-center gap-1 rounded-full border border-[#d8f1e5] bg-[#ecfff7] px-2.5 py-1 text-xs font-medium text-[#159565] transition-colors hover:bg-[#d8f1e5]"
                          >
                            <Sparkles className="h-3 w-3 text-[#159565]" />{suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </FieldCard>
                </div>
              </div>

              {/* Step 1 Navigation */}
              <div className="flex items-center justify-between border-t border-[#d8f1e5] pt-6">
                <Link href="/dashboard/classroom-tools" className="text-sm font-semibold text-[#55516e] transition-colors hover:text-[#159565]">
                  Cancel
                </Link>
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#22c977] to-[#079765]" />
                  <span className="flex h-2.5 w-2.5 rounded-full bg-[#eceef3]" />
                </div>
                <button
                  type="button"
                  disabled={!canGoNext}
                  onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#1fbc79] to-[#069462] px-5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(21,149,101,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(21,149,101,0.3)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 max-sm:h-10 max-sm:px-4 max-sm:text-xs"
                >
                  Next
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div key="step-2" className="animate-slide-in-right space-y-6">
              {/* Question Types */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ecfff7] text-xs font-bold text-[#159565]">1</span>
                  <h3 className="text-base font-bold text-[#25262b]">Question Types</h3>
                </div>
                <p className="mb-4 text-sm text-[#55516e]">Only selected sections will appear in the worksheet.</p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {questionTypeOptions.map((type) => {
                    const active = questionTypes.includes(type);
                    return active ? (
                      <div
                        key={type}
                        className="rounded-xl border p-3.5 transition-all duration-200 flex flex-col justify-between border-[#bdebd7] bg-[#ecfff7]/70 shadow-[0_10px_22px_rgba(22,163,99,0.06)] ring-2 ring-[#159565]/10"
                      >
                        <button
                          type="button"
                          onClick={() => toggleQuestionType(type)}
                          aria-pressed={active}
                          className="flex w-full items-center justify-between gap-3 text-left"
                        >
                          <span className="text-sm font-bold text-[#25262b]">{type}</span>
                          <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full border text-xs font-black transition-all border-[#159565] bg-[#159565] text-white">✓</span>
                        </button>
                        <div className="mt-3 pt-2.5 border-t border-[#d8f1e5] flex items-center gap-3">
                          <NumericStepper
                            label="Count"
                            value={questionTypeCounts[type] ?? 5}
                            min={1}
                            max={60}
                            onChange={(val) => setQuestionTypeCounts((prev) => ({ ...prev, [type]: val }))}
                          />
                          <NumericStepper
                            label="Marks"
                            value={questionTypeMarks[type] ?? defaultMarks[type]}
                            min={1}
                            max={20}
                            onChange={(val) => setQuestionTypeMarks((prev) => ({ ...prev, [type]: val }))}
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleQuestionType(type)}
                        aria-pressed={active}
                        className="rounded-xl border p-3.5 transition-all duration-200 flex items-center justify-between gap-3 text-left border-[#e3ebd6] bg-white hover:border-[#bdebd7] hover:bg-[#f8fffb] active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-[#159565]"
                      >
                        <span className="text-sm font-bold text-[#25262b]">{type}</span>
                        <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full border text-xs font-black transition-all border-slate-300 bg-white text-transparent hover:border-slate-400">✓</span>
                      </button>
                    );
                  })}
                </div>
                {!questionTypes.length ? (
                  <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Select at least one question type.</p>
                ) : null}
                {questionTypes.length > 0 && (
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#55516e]">
                      Total questions: <span className="text-[#25262b]">{totalQuestions}</span>
                    </span>
                    {totalQuestions > 60 && (
                      <span className="text-xs font-semibold text-red-500">
                        Maximum 60 questions allowed. Please reduce some counts.
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Difficulty Distribution */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ecfff7] text-xs font-bold text-[#159565]">2</span>
                  <h3 className="text-base font-bold text-[#25262b]">Difficulty Distribution</h3>
                </div>
                <p className="mb-4 text-sm text-[#55516e]">Choose the balance for easy, medium, and hard questions.</p>
                <div className="grid gap-4">
                  <div className="flex rounded-xl border border-[#dffafa] bg-[#f8ffff] p-1">
                    {difficultyPresets.map((preset) => {
                      const active = difficulty.easy === preset.values.easy && difficulty.medium === preset.values.medium && difficulty.hard === preset.values.hard;
                      return (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => setDifficulty(preset.values)}
                          className={cn(
                            "h-10 flex-1 rounded-lg text-sm font-black transition-all duration-200",
                            active ? "bg-white text-[#25262b] shadow-sm" : "text-[#6d6f78] hover:text-emerald-700"
                          )}
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
                      <div className="bg-red-500 transition-all duration-500" style={{ width: `${difficulty.hard}%` }} />
                    </div>
                    <div className="grid gap-3 p-3 text-sm font-black text-[#25262b] md:grid-cols-3">
                      <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-400" /> Easy {difficulty.easy}%</span>
                      <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-500" /> Medium {difficulty.medium}%</span>
                      <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-500" /> Hard {difficulty.hard}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* What to Include */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ecfff7] text-xs font-bold text-[#159565]">3</span>
                  <h3 className="text-base font-bold text-[#25262b]">What to Include</h3>
                </div>
                <p className="mb-4 text-sm text-[#55516e]">Select the additional sections for your worksheet.</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { key: "answerKey" as const, label: "Answer Key", desc: "Correct answers for all questions", icon: ClipboardCheck, color: "green" },
                    { key: "markingScheme" as const, label: "Marking Scheme", desc: "Mark allocation per question", icon: ClipboardList, color: "purple" },
                    { key: "hints" as const, label: "Hints", desc: "Helpful hints for difficult questions", icon: Lightbulb, color: "amber" },
                    { key: "diagrams" as const, label: "Diagrams / Images", desc: "Include visual elements in the worksheet", icon: Image, color: "sky" },
                  ].map((item) => {
                    const CompIcon = item.icon;
                    const active = item.key === "answerKey" ? includeAnswerKey
                      : item.key === "markingScheme" ? includeMarkingScheme
                      : item.key === "hints" ? includeHints
                      : includeDiagramsImages;
                    const toneMap: Record<string, { bg: string; text: string; border: string }> = {
                      green: { bg: "bg-[#ecfff7]", text: "text-[#159565]", border: "border-[#6ee7b7]" },
                      purple: { bg: "bg-[#f6f1ff]", text: "text-[#8b5cf6]", border: "border-[#c4b5fd]" },
                      amber: { bg: "bg-[#fffbeb]", text: "text-[#b45309]", border: "border-[#fcd34d]" },
                      sky: { bg: "bg-[#f0fdff]", text: "text-[#0ea5e9]", border: "border-[#7dd3fc]" },
                    };
                    const ct = toneMap[item.color] || toneMap.green;
                    return (
                      <div key={item.key}
                        onClick={() => {
                          const setter = item.key === "answerKey" ? setIncludeAnswerKey
                            : item.key === "markingScheme" ? setIncludeMarkingScheme
                            : item.key === "hints" ? setIncludeHints
                            : setIncludeDiagramsImages;
                          setter(!active);
                        }}
                        className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-all duration-200 ${
                          active
                            ? `${ct.border} ${ct.bg}`
                            : "border-[#d8f1e5] bg-white hover:border-[#d8f1e5] hover:bg-[#ecfff7]"
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

              {/* Success Card */}
              <div className="rounded-2xl border border-[#bdebd7] bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                    <Check className="h-5 w-5 text-emerald-600" strokeWidth={3} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-emerald-800">Great! You&apos;re all set.</h4>
                    <p className="mt-1 text-sm text-emerald-600">Click Generate Worksheet and let AI do the magic!</p>
                  </div>
                  <div className="hidden flex-shrink-0 lg:block">
                    <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-emerald-100/50">
                      <Sparkles className="h-6 w-6 text-emerald-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 Navigation */}
              <div className="flex items-center justify-between border-t border-[#d8f1e5] pt-6">
                <button type="button" onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#d8f1e5] bg-white px-5 text-sm font-semibold text-[#55516e] shadow-sm transition-all duration-200 hover:border-[#159565] hover:text-[#159565] max-sm:h-10 max-sm:px-3 max-sm:text-xs"
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" /> Back
                </button>
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-[#eceef3]" />
                  <span className="flex h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#22c977] to-[#079765]" />
                </div>
                <button type="button" disabled={!canGenerate || generating} onClick={generate}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#1fbc79] to-[#069462] px-6 text-sm font-bold text-white shadow-[0_10px_22px_rgba(21,149,101,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(21,149,101,0.3)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 max-sm:h-10 max-sm:px-4 max-sm:text-xs"
                >
                  <Sparkles className="h-5 w-5 max-sm:h-4 max-sm:w-4" /> Generate Worksheet
                </button>
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
    green: { bg: "bg-[#ecfff7]", text: "text-[#159565]" },
    orange: { bg: "bg-[#fff6df]", text: "text-[#f0a22f]" },
    purple: { bg: "bg-[#f6f1ff]", text: "text-[#8b5cf6]" },
    amber: { bg: "bg-[#fffbeb]", text: "text-[#d97706]" },
    teal: { bg: "bg-[#f0fdfa]", text: "text-[#0d9488]" },
    sky: { bg: "bg-[#f0fdff]", text: "text-[#0ea5e9]" },
    indigo: { bg: "bg-[#eef2ff]", text: "text-[#6366f1]" },
  };
  const tone = toneMap[color] || toneMap.blue;
  return (
    <div className="min-w-0 rounded-2xl border border-[#d8f1e5] bg-white p-4 shadow-sm sm:p-5">
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
    <div className="flex h-10 items-center rounded-xl border border-[#d8f1e5] bg-[#f8fffb] px-3.5 text-sm text-[#9CA0AA]">
      {children}
    </div>
  );
}

interface NumericStepperProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  label: string;
}

function NumericStepper({ value, onChange, min = 1, max = 100, label }: NumericStepperProps) {
  const [localVal, setLocalVal] = useState(value.toString());

  useEffect(() => {
    setLocalVal(value.toString());
  }, [value]);

  const handleBlur = () => {
    const num = Math.max(min, Math.min(max, Number(localVal) || min));
    onChange(num);
    setLocalVal(num.toString());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <span className="text-xs font-semibold text-[#55516e]">{label}</span>
      <div className="flex items-center justify-between gap-1 overflow-hidden rounded-xl border border-[#d8f1e5] bg-white p-1 shadow-sm">
        <button
          type="button"
          disabled={value <= min}
          onClick={() => {
            const newVal = Math.max(min, value - 1);
            onChange(newVal);
          }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-[#159565] transition hover:bg-[#ecfff7] active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          -
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={localVal}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "" || /^\d*$/.test(raw)) {
              setLocalVal(raw);
            }
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-8 bg-transparent text-center text-sm font-bold text-[#25262b] outline-none"
        />
        <button
          type="button"
          disabled={value >= max}
          onClick={() => {
            const newVal = Math.min(max, value + 1);
            onChange(newVal);
          }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-[#159565] transition hover:bg-[#ecfff7] active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          +
        </button>
      </div>
    </div>
  );
}


interface MultiSelectProps {
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
}

function MultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options",
  disabled = false,
  isLoading = false,
  loadingLabel = "Loading..."
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleToggle(value: string) {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  }

  function handleClear() {
    onChange([]);
  }

  const triggerLabel = useMemo(() => {
    if (isLoading) return loadingLabel;
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const option = options.find((o) => o.value === selectedValues[0]);
      return option ? option.label : selectedValues[0];
    }
    return `${selectedValues.length} chapters selected`;
  }, [selectedValues, options, isLoading, loadingLabel, placeholder]);

  return (
    <div ref={containerRef} className="relative block w-full min-w-0 max-w-full self-stretch">
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full min-w-0 max-w-full items-center justify-between gap-2.5 overflow-hidden rounded-xl border border-teachpad-cardBorder bg-[#f8fffb] px-3.5 text-left text-base font-semibold text-teachpad-ink shadow-sm outline-none transition-colors duration-200 hover:border-blue-200 focus:border-teachpad-blue focus:bg-white focus:ring-4 focus:ring-blue-100/60 disabled:cursor-not-allowed disabled:bg-[#f3faf7] disabled:text-[#9CA0AA] sm:text-sm",
          isOpen && "border-teachpad-blue bg-white ring-4 ring-blue-100/60"
        )}
      >
        <span className={cn("block truncate", (isLoading || selectedValues.length === 0) ? "text-[#9CA0AA]" : "text-[#25262b]")}>
          {triggerLabel}
        </span>
        {isLoading ? (
          <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-[#159565]" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-[#9CA0AA] transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} />
        )}
      </button>

      {isOpen && (
        <div className="absolute z-[100] mt-2 max-h-[300px] w-full min-w-[240px] overflow-hidden rounded-xl border border-[#d8f1e5] bg-white shadow-[0_20px_50px_-28px_rgba(21,149,101,0.15)] flex flex-col">
          <div className="flex items-center justify-end border-b border-[#d8f1e5] px-3 py-1.5 bg-[#f8fffb]">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-bold text-[#9CA0AA] hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5 max-h-[180px]">
            {options.length === 0 ? (
              <div className="px-2.5 py-4 text-center text-xs font-semibold text-[#9CA0AA]">
                No chapters found
              </div>
            ) : (
              options.map((option) => {
                const isChecked = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggle(option.value)}
                    className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-semibold text-[#25262b] outline-none hover:bg-[#f8fffb] transition"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#d8f1e5] text-[#159565] accent-[#159565]"
                    />
                    <span className="block min-w-0 whitespace-normal break-words leading-5">
                      {option.label}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
