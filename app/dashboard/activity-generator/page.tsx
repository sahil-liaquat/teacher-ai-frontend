"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Activity, ArrowLeft, BookOpen, Boxes, Brain, Check, ClipboardCheck, ClipboardCopy, Download, FileText, FlaskConical, Globe, GraduationCap, Lightbulb, NotebookPen, Save, Share2, Sparkles, Users } from "lucide-react";
import { backendApi, Board, Book, Chapter, ClassItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { GenerationLoadingScreen } from "@/components/generation-loading-screen";
import { OutputMetadataFooter } from "@/components/output-metadata-footer";
import { readToolDraft, saveToolDraft } from "@/lib/form-draft-storage";
import { downloadGeneratedTextPdf } from "@/lib/generated-text-pdf";
import { filteredBooksForSubject, findMatchingBoard, findMatchingChapter, findMatchingClass, findMatchingSubject, getCompanionPrefillContext, hasCompanionPrefill } from "@/lib/companion-prefill";
import { cn } from "@/lib/utils";

const activityTypes = ["Group activity", "Hands-on activity", "Discussion activity", "Quick recap", "Project task"];
const groupSizes = ["Whole class", "Pairs", "Small groups", "Individual"];
const difficultyOptions = ["Easy", "Balanced", "Challenging"];
const ACTIVITY_DRAFT_KEY = "activity";

type ActivityFormDraft = {
  boardId: string;
  classId: string;
  subject: string;
  bookId: string;
  chapterNames: string[];
  topic: string;
  language: string;
  activityType: string;
  durationMinutes: number;
  groupSize: string;
  difficulty: string;
  includeAssessment: boolean;
  includeMaterials: boolean;
  includeDifferentiation: boolean;
};

export default function ActivityGeneratorPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const generationId = searchParams.get("id");
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
  const [language, setLanguage] = useState("English");
  const [activityType, setActivityType] = useState(activityTypes[0]);
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [groupSize, setGroupSize] = useState(groupSizes[2]);
  const [difficulty, setDifficulty] = useState(difficultyOptions[1]);
  const [includeAssessment, setIncludeAssessment] = useState(true);
  const [includeMaterials, setIncludeMaterials] = useState(true);
  const [includeDifferentiation, setIncludeDifferentiation] = useState(true);
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
  const [savedGenerationLoading, setSavedGenerationLoading] = useState(false);
  const [savedGenerationError, setSavedGenerationError] = useState("");
  const [activity, setActivity] = useState<any>(null);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    if (!generationId) {
      setSavedGenerationError("");
      setSavedGenerationLoading(false);
      return;
    }
    let cancelled = false;
    setSavedGenerationLoading(true);
    setSavedGenerationError("");
    backendApi.activity(generationId)
      .then((generation) => {
        if (!cancelled) setActivity(generation.output_json);
      })
      .catch((error) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Could not load saved activity.";
          setSavedGenerationError(message);
          toast({ title: "Could not load activity", description: message });
        }
      })
      .finally(() => {
        if (!cancelled) setSavedGenerationLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [generationId, toast]);

  useEffect(() => {
    const draft = readToolDraft<ActivityFormDraft>(ACTIVITY_DRAFT_KEY);
    if (draft) {
      setBoardId(draft.boardId || "");
      setClassId(draft.classId || "");
      setSubject(draft.subject || "");
      setBookId(draft.bookId || "");
      setChapterNames(draft.chapterNames || []);
      setTopic(draft.topic || "");
      setLanguage(draft.language || "English");
      setActivityType(draft.activityType || activityTypes[0]);
      setDurationMinutes(draft.durationMinutes || 20);
      setGroupSize(draft.groupSize || groupSizes[2]);
      setDifficulty(draft.difficulty || difficultyOptions[1]);
      setIncludeAssessment(draft.includeAssessment ?? true);
      setIncludeMaterials(draft.includeMaterials ?? true);
      setIncludeDifferentiation(draft.includeDifferentiation ?? true);
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    saveToolDraft<ActivityFormDraft>(ACTIVITY_DRAFT_KEY, {
      boardId,
      classId,
      subject,
      bookId,
      chapterNames,
      topic,
      language,
      activityType,
      durationMinutes,
      groupSize,
      difficulty,
      includeAssessment,
      includeMaterials,
      includeDifferentiation
    });
  }, [draftReady, activityType, boardId, chapterNames, classId, bookId, difficulty, durationMinutes, groupSize, includeAssessment, includeDifferentiation, includeMaterials, language, subject, topic]);

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
        if (!cancelled) setChaptersError(err instanceof Error ? err.message : "Could not load chapters.");
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
  const canGenerate = Boolean(bookId && chapterNames.length && durationMinutes >= 5);
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
    setSubject(match);
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
    setActivity(null);
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
    setActivity(null);
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
    setActivity(null);
    setBooksError("");
    setChaptersError("");
    setIsLoadingBooks(Boolean(value));
    window.requestAnimationFrame(() => setIsLoadingBooks(false));
  }

  function chooseBook(value: string) {
    setBookId(value);
    setChapters([]);
    setChapterNames([]);
    setActivity(null);
    setChaptersError("");
    setIsLoadingChapters(Boolean(value));
  }

  function chooseChapter(value: string) {
    setChapterNames(value ? [value] : []);
  }

  async function generate() {
    if (!canGenerate) {
      toast({ title: "Complete required details", description: "Select a textbook, chapter, and valid duration." });
      return;
    }
    setGenerating(true);
    setGenerationError("");
    setGenerationStatus("Reading textbook context...");
    const t1 = window.setTimeout(() => setGenerationStatus("Designing classroom steps..."), 3000);
    const t2 = window.setTimeout(() => setGenerationStatus("Adding teacher and student actions..."), 10000);
    const t3 = window.setTimeout(() => setGenerationStatus("Preparing assessment prompts..."), 20000);
    try {
      const generation = await backendApi.createActivity({
        book_id: bookId,
        chapter_names: chapterNames,
        topic: topic.trim() || undefined,
        language,
        activity_type: activityType,
        duration_minutes: durationMinutes,
        group_size: groupSize,
        difficulty,
        include_assessment: includeAssessment,
        include_materials: includeMaterials,
        include_differentiation: includeDifferentiation
      });
      setActivity(generation.output_json);
      toast({ title: "Activity generated", description: "Your classroom activity is ready." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not generate activity.";
      setGenerationError(message);
      toast({ title: "Generation failed", description: message });
    } finally {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      setGenerating(false);
      setGenerationStatus("");
    }
  }

  function activityText() {
    if (!activity) return "";
    return [
      activity.title,
      activity.overview,
      listText("Learning Objectives", activity.learning_objectives),
      listText("Materials", activity.materials),
      listText("Setup", activity.setup),
      "Activity Steps",
      ...(activity.activity_steps || []).map((step: any) => `${step.time} - ${step.phase}\nTeacher: ${step.teacher_action}\nStudents: ${step.student_action}`),
      activity.grouping_plan ? `Grouping Plan\n${activity.grouping_plan}` : "",
      listText("Discussion Prompts", activity.discussion_prompts),
      listText("Assessment", activity.assessment),
      activity.differentiation ? `Differentiation\nSupport: ${activity.differentiation.support || ""}\nChallenge: ${activity.differentiation.challenge || ""}` : "",
      listText("Exit Ticket", activity.exit_ticket),
      activity.teacher_notes ? `Teacher Notes\n${activity.teacher_notes}` : ""
    ].filter(Boolean).join("\n\n");
  }

  function copyActivity() {
    navigator.clipboard?.writeText(activityText()).then(() => {
      toast({ title: "Activity copied", description: "The generated activity is on your clipboard." });
    }).catch(() => toast({ title: "Copy failed", description: "Your browser blocked clipboard access." }));
  }

  function downloadActivity() {
    const blob = new Blob([activityText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${activity?.title || "classroom-activity"}.txt`.replace(/[^\w.-]+/g, "-");
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function downloadActivityPdf() {
    try {
      await downloadGeneratedTextPdf({
        title: activity?.title || "Classroom Activity",
        subtitle: activity?.metadata?.chapter || "Textbook grounded activity",
        text: activityText(),
        filenamePrefix: "classroom-activity"
      });
      toast({ title: "PDF downloaded", description: "Your activity was exported as a PDF." });
    } catch (error) {
      toast({ title: "PDF export failed", description: error instanceof Error ? error.message : "Could not export activity PDF." });
    }
  }

  async function shareActivity() {
    const text = activityText();
    try {
      if (navigator.share) {
        await navigator.share({ title: activity?.title || "Classroom Activity", text });
        toast({ title: "Shared" });
      } else {
        await navigator.clipboard.writeText(text);
        toast({ title: "Share text copied", description: "Paste it wherever you want to share." });
      }
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") {
        toast({ title: "Share failed", description: "Could not share this activity." });
      }
    }
  }

  if (generating || generationError || savedGenerationLoading || savedGenerationError) {
    return (
      <GenerationLoadingScreen
        type="activity"
        state={generationError || savedGenerationError ? "error" : "loading"}
        status={generating ? generationStatus : "Loading saved activity..."}
        errorMessage={generationError || savedGenerationError}
        onRetry={generationError ? generate : () => {
          if (!generationId) return;
          setSavedGenerationError("");
          setSavedGenerationLoading(true);
          backendApi.activity(generationId)
            .then((generation) => setActivity(generation.output_json))
            .catch((error) => setSavedGenerationError(error instanceof Error ? error.message : "Could not load saved activity."))
            .finally(() => setSavedGenerationLoading(false));
        }}
        onBack={() => {
          setGenerationError("");
          setSavedGenerationError("");
          setGenerating(false);
          setGenerationStatus("");
        }}
      />
    );
  }

  if (activity) {
    return (
      <div className="mx-auto w-full max-w-[1240px]">
        <ActivityOutput activity={activity} onCopy={copyActivity} onPdf={downloadActivityPdf} onShare={shareActivity} onSave={downloadActivity} onBack={() => setActivity(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-4">
      <Link href="/dashboard/classroom-tools" className="inline-flex items-center gap-1.5 text-sm font-black text-[#087c86] transition hover:text-[#16a9b6]">
        <ArrowLeft className="h-4 w-4" />
        Back to tools
      </Link>

      <div className="overflow-visible rounded-[18px] border border-[#c9f7fb] bg-white/86 shadow-[0_14px_34px_rgba(39,30,91,0.07)] backdrop-blur-sm">
        {/* Header */}
        <div className="relative min-h-[100px] overflow-hidden rounded-t-[18px] border-b border-[#c9f7fb] bg-gradient-to-br from-[#f0fdff] to-white px-4 py-4 sm:min-h-[130px] sm:px-6 sm:py-5">
          {step === 1 ? (
            <div className="relative z-10 max-w-[560px]">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-xs font-black text-[#16a9b6] shadow-sm">
                <Activity className="h-4 w-4" /> Classroom activity
              </div>
              <h1 className="text-[28px] font-black tracking-tight text-[#25262b] sm:text-[34px]">Activity Generator</h1>
              <p className="mt-2.5 max-w-[520px] text-sm font-medium leading-6 text-[#55516e]">Generate textbook-grounded classroom activities with timing, materials, teacher actions, and assessment prompts.</p>
            </div>
          ) : (
            <div className="relative z-10 max-w-[560px]">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#c9f7fb] bg-white px-3 py-1.5 text-xs font-semibold text-[#55516e] shadow-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-[#20c4cf] to-[#16a9b6] text-[10px] font-bold text-white">2</span>
                Step 2 of 2
              </div>
              <h1 className="text-[28px] font-black tracking-tight text-[#25262b] sm:text-[34px]">Customize Your Activity</h1>
              <p className="mt-2.5 max-w-[520px] text-sm font-medium leading-6 text-[#55516e]">Fine-tune your activity by choosing the type, duration, group size, and sections to include.</p>
            </div>
          )}
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] overflow-hidden lg:block">
            <img
              src="/assets/illustrations/create-activity-header.png"
              alt=""
              aria-hidden="true"
              className="absolute bottom-0 right-0 max-h-full w-[390px] select-none object-contain object-bottom drop-shadow-[0_18px_18px_rgba(22,169,182,0.18)] xl:right-2 xl:w-[470px]"
            />
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-5 pt-5 sm:px-6">
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
            step === 1 ? "bg-gradient-to-r from-[#20c4cf] to-[#16a9b6] text-white shadow-[0_4px_10px_rgba(22,169,182,0.3)]" : "bg-[#f0fdff] text-[#16a9b6]"
          )}>
            {step > 1 ? <Check className="h-3.5 w-3.5" /> : 1}
          </div>
          <div className={cn("h-0.5 w-10 rounded transition-colors", step > 1 ? "bg-[#b2ebf2]" : "bg-[#eceef3]")} />
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
            step === 2 ? "bg-gradient-to-r from-[#20c4cf] to-[#16a9b6] text-white shadow-[0_4px_10px_rgba(22,169,182,0.3)]" : "bg-[#f0fdff] text-[#9CA0AA]"
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
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f0fdff] text-xs font-bold text-[#16a9b6]">1</span>
                  <h3 className="text-base font-bold text-[#25262b]">What are you teaching?</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <FieldCard icon={GraduationCap} label="Board / Curriculum" required color="purple">
                    <Select value={boardId} onChange={(e) => chooseBoard(e.target.value)} disabled={fetching}>
                      <option value="">Select Board / Curriculum</option>
                      {boards.map((board) => <option key={board.id} value={board.id}>{board.name} ({board.code})</option>)}
                    </Select>
                  </FieldCard>
                  <FieldCard icon={Users} label="Class / Grade" required color="sky">
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
                                  ? "bg-gradient-to-r from-[#20c4cf] to-[#16a9b6] text-white shadow-[0_4px_12px_rgba(22,169,182,0.25)]"
                                  : "border border-[#c9f7fb] bg-white text-[#25262b] hover:border-[#c9f7fb] hover:bg-[#f0fdff]"
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
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f0fdff] text-xs font-bold text-[#16a9b6]">2</span>
                  <h3 className="text-base font-bold text-[#25262b]">What are we learning?</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <FieldCard icon={BookOpen} label="Book / Textbook" required color="teal">
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
                  <FieldCard icon={FileText} label="Chapter / Unit" required color="indigo">
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
                    <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Optional: Type a specific topic" maxLength={150}
                      className="h-10 w-full rounded-xl border border-[#c9f7fb] bg-[#f8feff] px-3.5 text-sm font-medium text-[#25262b] outline-none transition-colors duration-200 placeholder:text-[#9CA0AA] focus:border-[#16a9b6] focus:bg-white focus:ring-4 focus:ring-[#b2ebf2]/60"
                    />
                    {chapterNames[0] && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {chapterNames[0].split(/[,;&]+/).map(s => s.trim()).filter(Boolean).slice(0, 6).map((suggestion) => (
                          <button key={suggestion} type="button" onClick={() => setTopic(suggestion)}
                            className="inline-flex items-center gap-1 rounded-full border border-[#c9f7fb] bg-[#f0fdff] px-2.5 py-1 text-xs font-medium text-[#087c86] transition-colors hover:bg-[#e0fafc]"
                          >
                            <Sparkles className="h-3 w-3 text-[#16a9b6]" />{suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </FieldCard>
                </div>
              </div>

              {/* Step 1 Navigation */}
              <div className="flex items-center justify-between border-t border-[#c9f7fb] pt-6">
                <Link href="/dashboard/classroom-tools" className="text-sm font-semibold text-[#55516e] transition-colors hover:text-[#16a9b6]">
                  Cancel
                </Link>
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#20c4cf] to-[#16a9b6]" />
                  <span className="flex h-2.5 w-2.5 rounded-full bg-[#eceef3]" />
                </div>
                <button
                  type="button"
                  disabled={!canGoNext}
                  onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#20c4cf] to-[#16a9b6] px-5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(22,169,182,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(22,169,182,0.3)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 max-sm:h-10 max-sm:px-4 max-sm:text-xs"
                >
                  Next
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div key="step-2" className="animate-slide-in-right space-y-6">
              {/* Activity Setup */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f0fdff] text-xs font-bold text-[#16a9b6]">2</span>
                  <h3 className="text-base font-bold text-[#25262b]">Activity Setup</h3>
                </div>
                <p className="mb-4 text-sm text-[#55516e]">Choose the type, duration, group size, and difficulty for your activity.</p>
                <div className="grid gap-4 md:grid-cols-3">
                  <FieldCard icon={Lightbulb} label="Activity Type" color="amber">
                    <div className="flex flex-wrap gap-2">
                      {activityTypes.map((type) => (
                        <button key={type} type="button" onClick={() => setActivityType(type)}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all duration-200",
                            activityType === type
                              ? "border-[#b2ebf2] bg-gradient-to-r from-[#20c4cf] to-[#16a9b6] text-white shadow-sm"
                              : "border-[#c9f7fb] bg-white text-[#55516e] hover:border-[#c9f7fb] hover:bg-[#f0fdff]"
                          )}
                        >{type}</button>
                      ))}
                    </div>
                  </FieldCard>
                  <FieldCard icon={NotebookPen} label="Duration (min)" required color="blue">
                    <div className="flex flex-wrap gap-2">
                      {[5, 10, 15, 20, 30, 45].map((d) => (
                        <button key={d} type="button" onClick={() => setDurationMinutes(d)}
                          className={cn(
                            "inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all duration-200",
                            durationMinutes === d
                              ? "border-[#b2ebf2] bg-gradient-to-r from-[#20c4cf] to-[#16a9b6] text-white shadow-sm"
                              : "border-[#c9f7fb] bg-white text-[#55516e] hover:border-[#c9f7fb] hover:bg-[#f0fdff]"
                          )}
                        >{d} min</button>
                      ))}
                    </div>
                  </FieldCard>
                  <FieldCard icon={Users} label="Group Size" color="purple">
                    <div className="flex flex-wrap gap-2">
                      {groupSizes.map((size) => (
                        <button key={size} type="button" onClick={() => setGroupSize(size)}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all duration-200",
                            groupSize === size
                              ? "border-[#b2ebf2] bg-gradient-to-r from-[#20c4cf] to-[#16a9b6] text-white shadow-sm"
                              : "border-[#c9f7fb] bg-white text-[#55516e] hover:border-[#c9f7fb] hover:bg-[#f0fdff]"
                          )}
                        >{size}</button>
                      ))}
                    </div>
                  </FieldCard>
                  <FieldCard icon={Globe} label="Language" color="sky">
                    <div className="flex flex-wrap gap-2">
                      {["English", "Hindi", "Urdu"].map((lang) => (
                        <button key={lang} type="button" onClick={() => setLanguage(lang)}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all duration-200",
                            language === lang
                              ? "border-[#b2ebf2] bg-gradient-to-r from-[#20c4cf] to-[#16a9b6] text-white shadow-sm"
                              : "border-[#c9f7fb] bg-white text-[#55516e] hover:border-[#c9f7fb] hover:bg-[#f0fdff]"
                          )}
                        >{lang}</button>
                      ))}
                    </div>
                  </FieldCard>
                  <FieldCard icon={ClipboardCheck} label="Difficulty" color="green">
                    <div className="flex flex-wrap gap-2">
                      {difficultyOptions.map((level) => (
                        <button key={level} type="button" onClick={() => setDifficulty(level)}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all duration-200",
                            difficulty === level
                              ? "border-[#b2ebf2] bg-gradient-to-r from-[#20c4cf] to-[#16a9b6] text-white shadow-sm"
                              : "border-[#c9f7fb] bg-white text-[#55516e] hover:border-[#c9f7fb] hover:bg-[#f0fdff]"
                          )}
                        >{level}</button>
                      ))}
                    </div>
                  </FieldCard>
                </div>
              </div>

              {/* What to Include */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f0fdff] text-xs font-bold text-[#16a9b6]">3</span>
                  <h3 className="text-base font-bold text-[#25262b]">What to Include</h3>
                </div>
                <p className="mb-4 text-sm text-[#55516e]">Select the sections you want in your activity.</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { key: "includeMaterials" as const, label: "Materials", desc: "Resources required for the activity", icon: Boxes, color: "teal" },
                    { key: "includeAssessment" as const, label: "Assessment", desc: "Check understanding with exit tickets", icon: ClipboardCheck, color: "indigo" },
                    { key: "includeDifferentiation" as const, label: "Differentiation", desc: "Support for diverse learner needs", icon: Brain, color: "purple" },
                  ].map((item) => {
                    const CompIcon = item.icon;
                    const active = item.key === "includeMaterials" ? includeMaterials
                      : item.key === "includeAssessment" ? includeAssessment
                      : includeDifferentiation;
                    const toneMap: Record<string, { bg: string; text: string; border: string }> = {
                      teal: { bg: "bg-[#f0fdfa]", text: "text-[#0d9488]", border: "border-[#5eead4]" },
                      indigo: { bg: "bg-[#eef2ff]", text: "text-[#6366f1]", border: "border-[#a5b4fc]" },
                      purple: { bg: "bg-[#f6f1ff]", text: "text-[#8b5cf6]", border: "border-[#c4b5fd]" },
                    };
                    const ct = toneMap[item.color] || toneMap.teal;
                    return (
                      <div key={item.key}
                        onClick={() => {
                          const setter = item.key === "includeMaterials" ? setIncludeMaterials
                            : item.key === "includeAssessment" ? setIncludeAssessment
                            : setIncludeDifferentiation;
                          setter(!active);
                        }}
                        className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-all duration-200 ${
                          active
                            ? `${ct.border} ${ct.bg}`
                            : "border-[#c9f7fb] bg-white hover:border-[#c9f7fb] hover:bg-[#f8feff]"
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
              <div className="rounded-2xl border border-[#c9f7fb] bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                    <Check className="h-5 w-5 text-emerald-600" strokeWidth={3} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-emerald-800">Great! You&apos;re all set.</h4>
                    <p className="mt-1 text-sm text-emerald-600">Click Generate Activity and let AI do the magic!</p>
                  </div>
                  <div className="hidden flex-shrink-0 lg:block">
                    <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-emerald-100/50">
                      <Sparkles className="h-6 w-6 text-emerald-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 Navigation */}
              <div className="flex items-center justify-between border-t border-[#c9f7fb] pt-6">
                <button type="button" onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#c9f7fb] bg-white px-5 text-sm font-semibold text-[#55516e] shadow-sm transition-all duration-200 hover:border-[#16a9b6] hover:text-[#16a9b6] max-sm:h-10 max-sm:px-3 max-sm:text-xs"
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" /> Back
                </button>
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-[#eceef3]" />
                  <span className="flex h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#20c4cf] to-[#16a9b6]" />
                </div>
                <button type="button" disabled={!canGenerate || generating} onClick={generate}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#20c4cf] to-[#16a9b6] px-6 text-sm font-bold text-white shadow-[0_10px_22px_rgba(22,169,182,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(22,169,182,0.3)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 max-sm:h-10 max-sm:px-4 max-sm:text-xs"
                >
                  <Sparkles className="h-5 w-5 max-sm:h-4 max-sm:w-4" /> Generate Activity
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityOutput({ activity, onCopy, onPdf, onShare, onSave, onBack }: { activity: any; onCopy: () => void; onPdf: () => void; onShare: () => void; onSave: () => void; onBack: () => void }) {
  const metadata = activity.metadata || {};

  return (
    <aside className="rounded-[18px] border border-[#c9f7fb] bg-white shadow-[0_14px_34px_rgba(39,30,91,0.07)]">
      <div className="flex flex-col gap-3 border-b border-[#c9f7fb] bg-gradient-to-br from-[#f0fdff] to-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.08em] text-[#087c86] transition hover:text-[#16a9b6]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Inputs
          </button>
          <h2 className="mt-2 break-words text-xl font-black text-[#25262b]">{activity.title || "Generated Activity"}</h2>
          <p className="mt-1 text-sm font-semibold text-[#55516e]">{activity.metadata?.chapter || "Textbook grounded activity"}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCopy}><ClipboardCopy className="h-4 w-4" /> Copy</Button>
          <Button type="button" variant="outline" size="sm" onClick={onPdf}><Download className="h-4 w-4" /> PDF</Button>
          <Button type="button" variant="outline" size="sm" onClick={onShare}><Share2 className="h-4 w-4" /> Share</Button>
          <Button type="button" variant="outline" size="sm" onClick={onSave}><Save className="h-4 w-4" /> Save</Button>
        </div>
      </div>
      <div className="p-5">
        <TextBlock title="Overview" body={activity.overview} />
        <ListBlock title="Learning Objectives" items={activity.learning_objectives} />
        <ListBlock title="Materials" items={activity.materials} />
        <ListBlock title="Setup" items={activity.setup} />
        {(activity.activity_steps || []).map((step: any, index: number) => (
          <section key={`${step.phase}-${index}`} className="mt-5 rounded-[14px] border border-[#c9f7fb] bg-[#f8feff] p-4">
            <h3 className="text-base font-black text-[#25262b]">{step.time} - {step.phase}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#55516e]"><span className="text-[#087c86]">Teacher:</span> {step.teacher_action}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#55516e]"><span className="text-[#087c86]">Students:</span> {step.student_action}</p>
          </section>
        ))}
        <TextBlock title="Grouping Plan" body={activity.grouping_plan} />
        <ListBlock title="Discussion Prompts" items={activity.discussion_prompts} />
        <ListBlock title="Assessment" items={activity.assessment} />
        {activity.differentiation ? (
          <section className="mt-5 rounded-[14px] border border-[#c9f7fb] bg-white p-4">
            <h3 className="text-base font-black text-[#25262b]">Differentiation</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-[#55516e]"><span className="font-black text-[#087c86]">Support:</span> {activity.differentiation.support}</p>
            <p className="mt-2 text-sm font-medium leading-6 text-[#55516e]"><span className="font-black text-[#087c86]">Challenge:</span> {activity.differentiation.challenge}</p>
          </section>
        ) : null}
        <ListBlock title="Exit Ticket" items={activity.exit_ticket} />
        <TextBlock title="Teacher Notes" body={activity.teacher_notes} />
        <OutputMetadataFooter
          subject={metadata.subject}
          grade={metadata.grade || metadata.class}
          chapter={metadata.chapter || metadata.topic || activity.title}
          source={metadata.book || metadata.textbook || activity.textbook_source}
        />
      </div>
    </aside>
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
    <div className="min-w-0 rounded-2xl border border-[#c9f7fb] bg-white p-4 shadow-sm sm:p-5">
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
    <div className="flex h-10 items-center rounded-xl border border-[#c9f7fb] bg-[#f8feff] px-3.5 text-sm text-[#9CA0AA]">
      {children}
    </div>
  );
}

function TextBlock({ title, body }: { title: string; body?: string }) {
  if (!body) return null;
  return (
    <section className="mt-5">
      <h3 className="text-base font-black text-[#25262b]">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-[#55516e]">{body}</p>
    </section>
  );
}

function ListBlock({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <section className="mt-5">
      <h3 className="text-base font-black text-[#25262b]">{title}</h3>
      <ul className="mt-2 grid gap-2 text-sm font-medium leading-6 text-[#55516e]">
        {items.map((item, index) => <li key={`${item}-${index}`} className="rounded-lg bg-white px-3 py-2 shadow-sm">{item}</li>)}
      </ul>
    </section>
  );
}

function listText(title: string, items?: string[]) {
  if (!items?.length) return "";
  return `${title}\n${items.map((item) => `- ${item}`).join("\n")}`;
}
