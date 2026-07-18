"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Boxes, Brain, Check, ClipboardCheck, Clock, FileText, FlaskConical, Globe, GraduationCap, Lightbulb, MessageCircle, Monitor, Rocket, Sparkles, UserCheck, UserRound, Users } from "lucide-react";
import { backendApi, Board, Book, Chapter, ClassItem, LessonPlanGeneratePayload } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { readToolDraft, saveToolDraft } from "@/lib/form-draft-storage";
import { savePendingLessonPlan } from "@/lib/pending-lesson-plan";
import { TrialGatePill } from "@/components/billing/trial-gate-pill";
import { cn } from "@/lib/utils";
import { HistoryBackButton } from "@/components/history-back-button";

const lessonComponents = [
  { title: "Warm-up / Introduction", body: "Engaging start to capture attention", icon: Lightbulb, color: "amber" },
  { title: "Direct Instruction", body: "Detailed explanation from selected chapter", icon: BookOpen, color: "blue" },
  { title: "Classroom Activity", body: "Hands-on or group activity", icon: Users, color: "green" },
  { title: "Class Discussion", body: "Discussion to encourage thinking", icon: MessageCircle, color: "purple" },
  { title: "Assessment", body: "Questions to check understanding", icon: ClipboardCheck, color: "rose" },
  { title: "Materials Needed", body: "Resources required for class", icon: Boxes, color: "teal" },
  { title: "Differentiation", body: "Support for diverse learners", icon: Brain, color: "indigo" },
  { title: "Teacher Notes", body: "Extra guidance for teacher", icon: FileText, color: "pink" },
  { title: "Homework", body: "Practice after class", icon: GraduationCap, color: "sky" },
  { title: "Extension Activity", body: "Extra activity for advanced learners", icon: Rocket, color: "rose" }
];
const defaultLessonComponents = [
  "Warm-up / Introduction",
  "Direct Instruction",
  "Classroom Activity",
  "Assessment",
  "Homework"
];

const abilityProfileOptions = [
  {
    value: "needs_more_support",
    label: "Needs more support",
    body: "Smaller steps, scaffolds, and frequent checks",
    icon: Lightbulb,
    bg: "bg-[#fffbeb]",
    text: "text-[#d97706]",
    border: "border-[#fcd34d]",
    selectedBg: "bg-[#fffbeb]"
  },
  {
    value: "mixed_ability",
    label: "Mixed ability",
    body: "Balance support and challenge",
    icon: Users,
    bg: "bg-[#eef6ff]",
    text: "text-[#3b82f6]",
    border: "border-[#93c5fd]",
    selectedBg: "bg-[#eef6ff]"
  },
  {
    value: "at_expected_level",
    label: "At expected level",
    body: "Grade-appropriate and focused",
    icon: UserCheck,
    bg: "bg-[#ecfff6]",
    text: "text-[#24b77a]",
    border: "border-[#6ee7b7]",
    selectedBg: "bg-[#ecfff6]"
  },
  {
    value: "advanced",
    label: "Advanced",
    body: "Deeper reasoning and transfer tasks",
    icon: Rocket,
    bg: "bg-[#f6f1ff]",
    text: "text-[#8b5cf6]",
    border: "border-[#c4b5fd]",
    selectedBg: "bg-[#f6f1ff]"
  }
] as const;

const classSizeOptions = [
  {
    value: "small",
    label: "Small",
    body: "Fewer than 20 students",
    icon: UserRound,
    bg: "bg-[#f0fdfa]",
    text: "text-[#0d9488]",
    border: "border-[#5eead4]",
    selectedBg: "bg-[#f0fdfa]"
  },
  {
    value: "medium",
    label: "Medium",
    body: "20-40 students",
    icon: Users,
    bg: "bg-[#eef6ff]",
    text: "text-[#3b82f6]",
    border: "border-[#93c5fd]",
    selectedBg: "bg-[#eef6ff]"
  },
  {
    value: "large",
    label: "Large",
    body: "More than 40 students",
    icon: Boxes,
    bg: "bg-[#fff1f2]",
    text: "text-[#e11d48]",
    border: "border-[#fda4af]",
    selectedBg: "bg-[#fff1f2]"
  }
] as const;

type AbilityProfile = typeof abilityProfileOptions[number]["value"];
type ClassSize = typeof classSizeOptions[number]["value"];

const LESSON_PLAN_DRAFT_KEY = "lesson-plan";

type LessonPlanFormDraft = {
  boardId: string;
  classId: string;
  subject: string;
  bookId: string;
  chapterName: string;
  topic: string;
  duration: number;
  language: string;
  teachingStyle: string;
  learningObjective: string;
  selected: string[];
  abilityProfile?: AbilityProfile;
  classSize?: ClassSize;
  openSections: Record<string, boolean>;
};

export default function NewLessonPlanPage() {
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
  const [chapterName, setChapterName] = useState("");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(45);
  const [language, setLanguage] = useState("English");
  const [teachingStyle, setTeachingStyle] = useState("Interactive");
  const [learningObjective, setLearningObjective] = useState("");
  const [selected, setSelected] = useState(defaultLessonComponents);
  const [abilityProfile, setAbilityProfile] = useState<AbilityProfile>("mixed_ability");
  const [classSize, setClassSize] = useState<ClassSize>("medium");
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
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    const draft = readToolDraft<LessonPlanFormDraft>(LESSON_PLAN_DRAFT_KEY);
    if (draft) {
      setBoardId(draft.boardId || "");
      setClassId(draft.classId || "");
      setSubject(draft.subject || "");
      setBookId(draft.bookId || "");
      setChapterName(draft.chapterName || "");
      setTopic(draft.topic || "");
      setDuration(draft.duration || 45);
      setLanguage(draft.language || "English");
      setTeachingStyle(draft.teachingStyle || "Interactive");
      setLearningObjective(draft.learningObjective || "");
      setSelected(draft.selected?.length ? draft.selected : defaultLessonComponents);
      setAbilityProfile(draft.abilityProfile || "mixed_ability");
      setClassSize(draft.classSize || "medium");
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    saveToolDraft<LessonPlanFormDraft>(LESSON_PLAN_DRAFT_KEY, {
      boardId,
      classId,
      subject,
      bookId,
      chapterName,
      topic,
      duration,
      language,
      teachingStyle,
      learningObjective,
      selected,
      abilityProfile: abilityProfile || undefined,
      classSize: classSize || undefined,
      openSections: {}
    });
  }, [draftReady, abilityProfile, boardId, chapterName, classId, bookId, classSize, duration, language, learningObjective, selected, subject, teachingStyle, topic]);

  useEffect(() => {
    setFetching(true);
    backendApi.boards(0, 100)
      .then((res) => {
        const filtered = res.items.filter((b) => b.is_active !== false);
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
        if (!cancelled) setClasses(res.items.filter((c) => c.is_active !== false));
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
        if (!cancelled) setBooks(res.items.filter((b) => b.is_active !== false && b.is_ingested !== false));
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
        if (!cancelled) setChaptersError(getErrorMessage(err, "Could not load chapters."));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingChapters(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookId, toast]);

  const subjectOptions = useMemo(() => Array.from(new Set(books.map((book) => book.subject).filter(Boolean))).sort(), [books]);
  const filteredBooks = useMemo(() => books.filter((book) => !subject || book.subject === subject), [books, subject]);
  const canGoNext = Boolean(boardId && classId && subject && bookId && chapterName && topic.trim());
  const canGenerate = Boolean(canGoNext && duration >= 10 && selected.length && abilityProfile && classSize);

  function chooseBoard(value: string) {
    setBoardId(value);
    setClasses([]);
    setBooks([]);
    setChapters([]);
    setClassId("");
    setSubject("");
    setBookId("");
    setChapterName("");
    setTopic("");
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
    setChapterName("");
    setTopic("");
    setSubjectsError("");
    setBooksError("");
    setChaptersError("");
    setIsLoadingSubjects(Boolean(value));
    setIsLoadingBooks(Boolean(value));
    setIsLoadingChapters(false);
  }

  function chooseSubject(value: string) {
    const matchingBook = books.find((book) => book.subject === value);
    setSubject(value);
    setBookId(matchingBook?.id || "");
    setChapters([]);
    setChapterName("");
    setTopic("");
    setBooksError("");
    setChaptersError("");
    setIsLoadingBooks(false);
    setIsLoadingChapters(Boolean(matchingBook));
  }

  function chooseBook(value: string) {
    setBookId(value);
    setChapters([]);
    setChapterName("");
    setTopic("");
    setChaptersError("");
    setIsLoadingChapters(Boolean(value));
  }

  function toggleComponent(title: string) {
    setSelected((items) => items.includes(title) ? items.filter((item) => item !== title) : [...items, title]);
  }

  function suggestObjectives() {
    const chapter = chapterName || "the selected chapter";
    setLearningObjective(`Students will explain ${topic || chapter} using textbook evidence, identify key concepts, and apply them through a short classroom activity.`);
    toast({ title: "Objectives added", description: "You can edit them before generating." });
  }

  function generate() {
    if (!canGoNext || duration < 10 || !selected.length || !abilityProfile || !classSize) {
      toast({ title: "Complete required details", description: "Select board, class, book, chapter, topic, student ability profile and class size." });
      return;
    }
    const payload: LessonPlanGeneratePayload = {
      book_id: bookId,
      chapter_name: chapterName,
      topic: topic.trim(),
      duration_minutes: Number(duration),
      lesson_components: selected,
      learning_objectives_hint: learningObjective.trim() || undefined,
      student_ability_profile: abilityProfile,
      class_size: classSize,
      language,
      teaching_style: teachingStyle,
      use_school_format: false,
      format_type: "teachpad_standard"
    };
    savePendingLessonPlan(payload);
    router.push("/dashboard/lesson-plans/generating");
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-4">
      <HistoryBackButton className="inline-flex items-center gap-1.5 text-sm font-black text-teachpad-blue transition hover:text-teachpad-hoverBlue">
        <ArrowLeft className="h-4 w-4" />
        Back
      </HistoryBackButton>

      <div className="overflow-visible rounded-[18px] border border-teachpad-cardBorder bg-white/86 shadow-[0_14px_34px_var(--teachpad-shadowCard)] backdrop-blur-sm">
        {/* Header */}
        <div className="relative min-h-[100px] overflow-hidden rounded-t-[18px] border-b border-white/50 bg-gradient-to-br from-blue-50 via-blue-50 to-white px-4 py-4 sm:min-h-[130px] sm:px-6 sm:py-5">
          {step === 1 ? (
            <div className="relative z-10 max-w-[560px]">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 border border-teachpad-cardBorder px-3 py-1.5 text-xs font-bold text-teachpad-blue shadow-sm backdrop-blur-sm">
                <Sparkles className="h-4 w-4" /> AI-Powered
              </div>
              <h1 className="text-[28px] font-black tracking-tight text-teachpad-ink sm:text-[34px]">Create Lesson Plan</h1>
              <p className="mt-2.5 max-w-[520px] text-sm font-medium leading-6 text-teachpad-muted">Generate curriculum-aligned lesson plans from the selected textbook chapter in seconds.</p>
            </div>
          ) : (
            <div className="relative z-10 max-w-[560px]">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-teachpad-cardBorder bg-white px-3 py-1.5 text-xs font-semibold text-teachpad-muted shadow-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-teachpad-blue to-blue-600 text-[10px] font-bold text-white">2</span>
                Step 2 of 2
              </div>
              <h1 className="text-[28px] font-black tracking-tight text-teachpad-ink sm:text-[34px]">Customize Your Lesson</h1>
              <p className="mt-2.5 max-w-[520px] text-sm font-medium leading-6 text-teachpad-muted">Fine-tune your lesson plan by defining learning outcomes and selecting instructional components.</p>
            </div>
          )}
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] overflow-hidden lg:block">
            <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-blue-50 to-transparent" />
            <img
              src="/assets/illustrations/create-lesson-plan-header.png"
              alt=""
              aria-hidden="true"
              className="absolute -bottom-5 -right-8 w-[390px] select-none object-contain drop-shadow-[0_18px_18px_rgba(30,64,175,0.18)] xl:-right-5 xl:w-[470px]"
            />
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-5 pt-5 sm:px-6">
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
            step === 1 ? "bg-gradient-to-r from-teachpad-blue to-blue-600 text-white shadow-[0_4px_10px_rgba(22,119,255,0.3)]" : "bg-emerald-100 text-emerald-700"
          )}>
            {step > 1 ? <Check className="h-3.5 w-3.5" /> : 1}
          </div>
          <div className={cn("h-0.5 w-10 rounded transition-colors", step > 1 ? "bg-emerald-300" : "bg-[#eceef3]")} />
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
            step === 2 ? "bg-gradient-to-r from-teachpad-blue to-blue-600 text-white shadow-[0_4px_10px_rgba(22,119,255,0.3)]" : "bg-teachpad-tag text-[#9CA0AA]"
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
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-teachpad-blue">1</span>
                  <h3 className="text-base font-bold text-teachpad-ink">What are you teaching?</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <FieldCard icon={GraduationCap} label="Board / Curriculum" required color="blue">
                    <Select value={boardId} onChange={(e) => chooseBoard(e.target.value)}>
                      <option value="">Select Board / Curriculum</option>
                      {boards.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
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
                                  ? "bg-gradient-to-r from-teachpad-blue to-blue-600 text-white shadow-[0_4px_12px_rgba(22,119,255,0.25)]"
                                  : "border border-teachpad-cardBorder bg-white text-teachpad-ink hover:border-blue-200 hover:bg-blue-50/50"
                              )}
                            >{c.grade_number}</button>
                          ))}
                      </div>
                    ) : (
                      <Select value={classId} onChange={(e) => chooseClass(e.target.value)} disabled={!boardId || isLoadingClasses} isLoading={isLoadingClasses} loadingLabel="Loading classes...">
                        <option value="">Select Class / Grade</option>
                        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-teachpad-blue">2</span>
                  <h3 className="text-base font-bold text-teachpad-ink">What are we learning?</h3>
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
                        {filteredBooks.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
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
                      <Select value={chapterName} onChange={(e) => setChapterName(e.target.value)} disabled={!chapters.length} isLoading={isLoadingChapters} loadingLabel="Loading chapters...">
                        <option value="">Select Chapter / Unit</option>
                        {chapters.map((ch) => <option key={ch.id} value={ch.chapter_title || ch.title || ""}>{ch.chapter_number ? `${ch.chapter_number}. ` : ""}{ch.chapter_title || ch.title}</option>)}
                      </Select>
                    )}
                    {chaptersError && <span className="mt-1 text-xs font-semibold text-red-500">{chaptersError}</span>}
                  </FieldCard>
                  <FieldCard icon={Sparkles} label="Topic / Lesson Title" required color="amber">
                    <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Type Any Topic" maxLength={150} />
                    {chapterName && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {chapterName.split(/[,;&]+/).map(s => s.trim()).filter(Boolean).slice(0, 6).map((suggestion) => (
                          <button key={suggestion} type="button" onClick={() => setTopic(suggestion)}
                            className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-teachpad-blue transition-colors hover:bg-blue-100"
                          >
                            <Sparkles className="h-3 w-3 text-blue-400" />{suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </FieldCard>
                </div>
              </div>

              {/* Section 3: How long and how do you want to teach? */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-teachpad-blue">3</span>
                  <h3 className="text-base font-bold text-teachpad-ink">How long and how do you want to teach?</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <FieldCard icon={Clock} label="Duration" required color="blue">
                    <div className="flex flex-wrap gap-2">
                      {[30, 45, 60, 90].map((d) => (
                        <button key={d} type="button" onClick={() => setDuration(d)}
                          className={cn(
                            "inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all duration-200",
                            duration === d
                              ? "border-blue-300 bg-gradient-to-r from-teachpad-blue to-blue-600 text-white shadow-sm"
                              : "border-teachpad-cardBorder bg-white text-teachpad-muted hover:border-blue-200 hover:bg-blue-50/50"
                          )}
                        >{d} min</button>
                      ))}
                    </div>
                  </FieldCard>
                  <FieldCard icon={Globe} label="Language" required color="pink">
                    <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                      <option>English</option><option>Hindi</option><option>Urdu</option>
                    </Select>
                  </FieldCard>
                  <FieldCard icon={Monitor} label="Teaching Style" color="sky">
                    <div className="flex flex-wrap gap-2">
                      {["Interactive", "Activity Based", "Lecture + Discussion", "Inquiry Based"].map((style) => (
                        <button key={style} type="button" onClick={() => setTeachingStyle(style)}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all duration-200",
                            teachingStyle === style
                              ? "border-blue-300 bg-teachpad-blue text-white shadow-sm"
                              : "border-teachpad-cardBorder bg-white text-teachpad-muted hover:border-blue-200 hover:bg-blue-50/50"
                          )}
                        >{style}</button>
                      ))}
                    </div>
                  </FieldCard>
                </div>
              </div>

              {/* Step 1 Navigation */}
              <div className="flex items-center justify-between border-t border-teachpad-cardBorder pt-6">
                <HistoryBackButton className="text-sm font-semibold text-teachpad-muted transition-colors hover:text-red-500">
                  Cancel
                </HistoryBackButton>
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-gradient-to-r from-teachpad-blue to-blue-600" />
                  <span className="flex h-2.5 w-2.5 rounded-full bg-[#eceef3]" />
                </div>
                <button
                  type="button"
                  disabled={!canGoNext}
                  onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-teachpad-blue to-blue-600 px-5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(22,119,255,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(22,119,255,0.3)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 max-sm:h-10 max-sm:px-4 max-sm:text-xs"
                >
                  Next
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div key="step-2" className="animate-slide-in-right space-y-6">
              {/* Learning Objectives */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-teachpad-blue">1</span>
                  <h3 className="text-base font-bold text-teachpad-ink">Learning Objectives</h3>
                </div>
                <p className="mb-4 text-sm text-teachpad-muted">Define what students will learn from this lesson.</p>
                <div className="rounded-2xl border border-teachpad-cardBorder bg-white p-5 shadow-[0_8px_22px_rgba(30,50,80,0.04)]">
                  <div className="mb-4 flex flex-wrap items-center gap-2 sm:justify-between">
                    <div className="flex items-center gap-2.5">
                      <Brain className="h-4 w-4 text-teachpad-blue shrink-0" />
                      <span className="text-sm font-medium text-teachpad-muted">Learning Objectives</span>
                    </div>
                    <button type="button" onClick={suggestObjectives}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-teachpad-cardBorder bg-white px-3.5 py-2 text-xs font-semibold text-teachpad-blue shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 max-sm:px-2.5 max-sm:py-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5 shrink-0" /> AI Suggest Objectives
                    </button>
                  </div>
                  <div className="space-y-2">
                    <textarea value={learningObjective} onChange={(e) => setLearningObjective(e.target.value)}
                      className="min-h-[120px] w-full rounded-xl border border-teachpad-cardBorder bg-teachpad-input px-3.5 py-2.5 text-base font-medium text-teachpad-ink outline-none transition-colors duration-200 placeholder:text-[#9CA0AA] focus:border-teachpad-blue focus:bg-white focus:ring-4 focus:ring-blue-100/60 sm:text-sm"
                      placeholder="Type your learning objectives here. Press Enter for multiple objectives."
                    />
                  </div>
                </div>
              </div>

              {/* Class Size */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-teachpad-blue">2</span>
                  <h3 className="text-base font-bold text-teachpad-ink">Class Size</h3>
                </div>
                <p className="mb-4 text-sm text-teachpad-muted">Choose the classroom size the lesson should be practical for.</p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {classSizeOptions.map((option) => {
                    const active = classSize === option.value;
                    const OptionIcon = option.icon;
                    return (
                      <button key={option.value} type="button"
                        onClick={() => setClassSize(option.value)}
                        className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-200 ${
                          active
                            ? `${option.border} ${option.selectedBg}`
                            : "border-teachpad-cardBorder bg-white hover:border-blue-200 hover:bg-blue-50/30"
                        }`}
                      >
                        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${option.bg} ${option.text}`}>
                          <OptionIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${active ? option.text : "text-teachpad-ink"}`}>
                              {option.label}
                            </span>
                            {active && <Check className={`h-3.5 w-3.5 flex-shrink-0 ${option.text}`} strokeWidth={3} />}
                          </div>
                          <p className="mt-0.5 text-xs text-[#9CA0AA]">{option.body}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Student Ability Profile */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-teachpad-blue">3</span>
                  <h3 className="text-base font-bold text-teachpad-ink">Student Ability Profile</h3>
                </div>
                <p className="mb-4 text-sm text-teachpad-muted">Choose the student profile the entire lesson should adapt to.</p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {abilityProfileOptions.map((option) => {
                    const active = abilityProfile === option.value;
                    const OptionIcon = option.icon;
                    return (
                      <button key={option.value} type="button"
                        onClick={() => setAbilityProfile(option.value)}
                        className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-200 ${
                          active
                            ? `${option.border} ${option.selectedBg}`
                            : "border-teachpad-cardBorder bg-white hover:border-blue-200 hover:bg-blue-50/30"
                        }`}
                      >
                        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${option.bg} ${option.text}`}>
                          <OptionIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${active ? option.text : "text-teachpad-ink"}`}>
                              {option.label}
                            </span>
                            {active && <Check className={`h-3.5 w-3.5 flex-shrink-0 ${option.text}`} strokeWidth={3} />}
                          </div>
                          <p className="mt-0.5 text-xs text-[#9CA0AA]">{option.body}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customize Your Lesson Plan */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-teachpad-blue">4</span>
                  <h3 className="text-base font-bold text-teachpad-ink">Customize Your Lesson Plan</h3>
                </div>
                <p className="mb-4 text-sm text-teachpad-muted">Choose the components you want to include or emphasize.</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {lessonComponents.map((comp) => {
                    const CompIcon = comp.icon;
                    const active = selected.includes(comp.title);
                    const toneMap: Record<string, { bg: string; text: string; border: string }> = {
                      amber: { bg: "bg-[#fffbeb]", text: "text-[#d97706]", border: "border-[#fcd34d]" },
                      blue: { bg: "bg-[#eef6ff]", text: "text-[#3b82f6]", border: "border-[#93c5fd]" },
                      green: { bg: "bg-[#ecfff6]", text: "text-[#24b77a]", border: "border-[#6ee7b7]" },
                      sky: { bg: "bg-[#f0fdff]", text: "text-[#0ea5e9]", border: "border-[#7dd3fc]" },
                      orange: { bg: "bg-[#fff6df]", text: "text-[#f0a22f]", border: "border-[#fcd34d]" },
                      pink: { bg: "bg-[#fff1f7]", text: "text-[#f45f98]", border: "border-[#f9a8d4]" },
                      purple: { bg: "bg-[#f6f1ff]", text: "text-[#8b5cf6]", border: "border-[#c4b5fd]" },
                      teal: { bg: "bg-[#f0fdfa]", text: "text-[#0d9488]", border: "border-[#5eead4]" },
                      indigo: { bg: "bg-[#eef2ff]", text: "text-[#6366f1]", border: "border-[#a5b4fc]" },
                      rose: { bg: "bg-[#fff1f2]", text: "text-[#e11d48]", border: "border-[#fda4af]" },
                    };
                    const ct = toneMap[comp.color] || toneMap.blue;
                    return (
                      <div key={comp.title}
                        onClick={() => toggleComponent(comp.title)}
                        className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-all duration-200 ${
                          active
                            ? `${ct.border} ${ct.bg}`
                            : "border-teachpad-cardBorder bg-white hover:border-blue-200 hover:bg-blue-50/30"
                        }`}
                      >
                        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${ct.bg} ${ct.text}`}>
                          <CompIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${active ? ct.text : "text-teachpad-ink"}`}>
                              {comp.title}
                            </span>
                            {active && <Check className={`h-3.5 w-3.5 flex-shrink-0 ${ct.text}`} strokeWidth={3} />}
                          </div>
                          <p className="mt-0.5 text-xs text-[#9CA0AA]">{comp.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Success Card */}
              <div className="rounded-2xl border border-teachpad-cardBorder bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                    <Check className="h-5 w-5 text-emerald-600" strokeWidth={3} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-emerald-800">Great! You&apos;re all set.</h4>
                    <p className="mt-1 text-sm text-emerald-600">Click Generate Lesson Plan and let AI do the magic!</p>
                  </div>
                  <div className="hidden flex-shrink-0 lg:block">
                    <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-emerald-100/50">
                      <Sparkles className="h-6 w-6 text-emerald-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 Navigation */}
              <div className="flex items-center justify-between border-t border-teachpad-cardBorder pt-6">
                <button type="button" onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-teachpad-cardBorder bg-white px-5 text-sm font-semibold text-teachpad-muted shadow-sm transition-all duration-200 hover:border-teachpad-blue hover:text-teachpad-blue max-sm:h-10 max-sm:px-3 max-sm:text-xs"
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" /> Back
                </button>
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-[#eceef3]" />
                  <span className="flex h-2.5 w-2.5 rounded-full bg-gradient-to-r from-teachpad-blue to-blue-600" />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <TrialGatePill kind="lesson_plan" />
                  <button type="button" disabled={!canGenerate} onClick={generate}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-teachpad-blue to-blue-600 px-6 text-sm font-bold text-white shadow-[0_10px_22px_rgba(22,119,255,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(22,119,255,0.3)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 max-sm:h-10 max-sm:px-4 max-sm:text-xs"
                  >
                    <Sparkles className="h-5 w-5 max-sm:h-4 max-sm:w-4" /> Generate Lesson Plan
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
    pink: { bg: "bg-[#fff1f7]", text: "text-[#f45f98]" },
    aqua: { bg: "bg-[#f0fdff]", text: "text-[#16a9b6]" },
    purple: { bg: "bg-[#f6f1ff]", text: "text-[#8b5cf6]" },
    amber: { bg: "bg-[#fffbeb]", text: "text-[#d97706]" },
    teal: { bg: "bg-[#f0fdfa]", text: "text-[#0d9488]" },
    sky: { bg: "bg-[#f0fdff]", text: "text-[#0ea5e9]" },
    indigo: { bg: "bg-[#eef2ff]", text: "text-[#6366f1]" },
    rose: { bg: "bg-[#fff1f2]", text: "text-[#e11d48]" },
  };
  const tone = toneMap[color] || toneMap.blue;
  return (
    <div className="min-w-0 rounded-2xl border border-teachpad-cardBorder bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center gap-2.5 sm:gap-3 sm:mb-4">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 ${tone.bg} ${tone.text}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <span className="text-xs font-medium text-teachpad-muted sm:text-sm">{label} {required && <span className="text-red-500">*</span>}</span>
      </div>
      {children}
    </div>
  );
}

function Placeholder({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-10 items-center rounded-xl border border-teachpad-cardBorder bg-teachpad-input px-3.5 text-sm text-[#9CA0AA]">
      {children}
    </div>
  );
}
