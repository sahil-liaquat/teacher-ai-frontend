"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Boxes, Brain, ChevronDown, ClipboardCheck, FileText, GraduationCap, Lightbulb, MessageCircle, Rocket, Sparkles, Users } from "lucide-react";
import { backendApi, Board, Book, Chapter, ClassItem, LessonPlanGeneratePayload } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { readToolDraft, saveToolDraft } from "@/lib/form-draft-storage";
import { savePendingLessonPlan } from "@/lib/pending-lesson-plan";

const lessonComponents = [
  { title: "Warm-up / Introduction", body: "Engaging start to capture attention", icon: Lightbulb, tone: "orange" },
  { title: "Direct Instruction", body: "Detailed explanation from selected chapter", icon: BookOpen, tone: "blue" },
  { title: "Classroom Activity", body: "Hands-on or group activity", icon: Users, tone: "green" },
  { title: "Class Discussion", body: "Discussion to encourage thinking", icon: MessageCircle, tone: "blue" },
  { title: "Assessment", body: "Questions to check understanding", icon: ClipboardCheck, tone: "orange" },
  { title: "Materials Needed", body: "Resources required for class", icon: Boxes, tone: "blue" },
  { title: "Differentiation", body: "Support for diverse learners", icon: Brain, tone: "blue" },
  { title: "Teacher Notes", body: "Extra guidance for teacher", icon: FileText, tone: "orange" },
  { title: "Homework", body: "Practice after class", icon: GraduationCap, tone: "blue" },
  { title: "Extension Activity", body: "Extra activity for advanced learners", icon: Rocket, tone: "blue" }
];
const defaultLessonComponents = [
  "Warm-up / Introduction",
  "Direct Instruction",
  "Classroom Activity",
  "Assessment",
  "Homework"
];
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
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    objectives: false,
    customize: false
  });
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
      setOpenSections(draft.openSections || { objectives: false, customize: false });
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
      openSections
    });
  }, [draftReady, boardId, chapterName, classId, bookId, duration, language, learningObjective, openSections, selected, subject, teachingStyle, topic]);

  useEffect(() => {
    setFetching(true);
    backendApi.boards(0, 100).then((res) => setBoards(res.items.filter((b) => b.is_active !== false))).catch((err) => toast({ title: "Could not load boards", description: err.message })).finally(() => setFetching(false));
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
        if (!cancelled) setClasses(res.items.filter((c) => c.is_active !== false));
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
        if (!cancelled) setBooks(res.items.filter((b) => b.is_active !== false && b.is_ingested !== false));
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
  const isLoadingOptions = fetching || isLoadingClasses || isLoadingSubjects || isLoadingBooks || isLoadingChapters;
  const canGenerate = Boolean(bookId && chapterName && topic.trim() && duration >= 10 && selected.length);

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
    setSubject(value);
    setBookId("");
    setChapters([]);
    setChapterName("");
    setTopic("");
    setBooksError("");
    setChaptersError("");
    setIsLoadingBooks(Boolean(value));
    window.requestAnimationFrame(() => setIsLoadingBooks(false));
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
    if (!canGenerate) {
      toast({ title: "Complete required details", description: "Select board, class, book, chapter and enter topic." });
      return;
    }
    const payload: LessonPlanGeneratePayload = {
      book_id: bookId,
      chapter_name: chapterName,
      topic: topic.trim(),
      duration_minutes: Number(duration),
      lesson_components: selected,
      learning_objectives_hint: learningObjective.trim() || undefined,
      language,
      teaching_style: teachingStyle
    };
    savePendingLessonPlan(payload);
    router.push("/dashboard/lesson-plans/generating");
  }

  return (
    <div className="mx-auto max-w-[1120px]">
      <div className="overflow-visible rounded-[18px] border border-white/70 bg-white/80 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm">
        <div className="relative min-h-[178px] overflow-hidden rounded-t-[18px] border-b border-white/50 bg-gradient-to-br from-blue-50 via-blue-50 to-white px-5 py-6 sm:px-6">
          <div className="relative z-10 max-w-[560px]">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/70 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm backdrop-blur-sm"><Sparkles className="h-4 w-4" /> AI-Powered</div>
            <h1 className="flex items-center gap-2.5 text-[28px] font-extrabold tracking-tight text-slate-900 sm:text-[34px]">Create Lesson Plan</h1>
            <p className="mt-2.5 max-w-[520px] text-sm font-medium leading-6 text-slate-600">Generate curriculum-aligned lesson plans from the selected textbook chapter in seconds.</p>
            <Button type="button" variant="outline" className="mt-4 border-blue-200 bg-white/90 px-4 text-blue-700 hover:bg-blue-50"><BookOpen className="h-4 w-4" /> Textbook grounded</Button>
          </div>
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

        <div className="grid gap-4 p-4 sm:p-5">
          <div className="grid gap-4">
            <NumericSection number="1" title="Plan Details" subtitle="Provide basic information about your lesson.">
              <div className="grid min-w-0 gap-4 md:grid-cols-2 2xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)_minmax(0,0.9fr)]">
                <FieldBox label="Board / Curriculum" required><Select value={boardId} onChange={(e) => chooseBoard(e.target.value)}><option value="">Select Board / Curriculum</option>{boards.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}</Select></FieldBox>
                <FieldBox label="Class / Grade" required error={classesError}><Select value={classId} onChange={(e) => chooseClass(e.target.value)} disabled={!boardId || isLoadingClasses} isLoading={isLoadingClasses} loadingLabel="Loading classes..."><option value="">Select Class / Grade</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></FieldBox>
                <FieldBox label="Subject" required error={subjectsError}><Select value={subject} onChange={(e) => chooseSubject(e.target.value)} disabled={!classId || !books.length || isLoadingSubjects} isLoading={isLoadingSubjects} loadingLabel="Loading subjects..."><option value="">Select Subject</option>{subjectOptions.map((item) => <option key={item} value={item}>{item}</option>)}</Select></FieldBox>
                <FieldBox label="Book / Textbook" required error={booksError}><Select value={bookId} onChange={(e) => chooseBook(e.target.value)} disabled={!classId || !subject || isLoadingBooks} isLoading={isLoadingBooks} loadingLabel="Loading books..."><option value="">Select Book / Textbook</option>{filteredBooks.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}</Select></FieldBox>
                <FieldBox label="Chapter / Unit" required error={chaptersError}><Select value={chapterName} onChange={(e) => setChapterName(e.target.value)} disabled={!bookId || isLoadingChapters} isLoading={isLoadingChapters} loadingLabel="Loading chapters..."><option value="">Select Chapter / Unit</option>{chapters.map((ch) => <option key={ch.id} value={ch.chapter_title || ch.title || ""}>{ch.chapter_number ? `${ch.chapter_number}. ` : ""}{ch.chapter_title || ch.title}</option>)}</Select></FieldBox>
                <FieldBox label="Topic / Lesson Title" required><Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Type Any Topic" maxLength={150} /></FieldBox>
                <FieldBox label="Duration" required><Select value={String(duration)} onChange={(e) => setDuration(Number(e.target.value))}><option value="30">30 min</option><option value="40">40 min</option><option value="45">45 min</option><option value="60">60 min</option><option value="90">90 min</option></Select></FieldBox>
                <FieldBox label="Language" required><Select value={language} onChange={(e) => setLanguage(e.target.value)}><option>English</option><option>Hindi</option><option>Urdu</option></Select></FieldBox>
                <FieldBox label="Teaching Style"><Select value={teachingStyle} onChange={(e) => setTeachingStyle(e.target.value)}><option>Interactive</option><option>Activity Based</option><option>Lecture + Discussion</option><option>Inquiry Based</option></Select></FieldBox>
              </div>
            </NumericSection>

            <NumericSection
              number="2"
              title="Learning Objectives"
              subtitle="Define what students will learn from this lesson."
              expandable
              open={openSections.objectives}
              onToggle={() => setOpenSections((sections) => ({ ...sections, objectives: !sections.objectives }))}
              action={<Button type="button" variant="outline" size="sm" onClick={suggestObjectives} className="w-full border-blue-300 text-blue-600 hover:bg-blue-50 sm:w-auto"><Sparkles className="h-4 w-4" />AI Suggest Objectives</Button>}
            >
              <Textarea value={learningObjective} onChange={(e) => setLearningObjective(e.target.value)} placeholder="e.g. Students will understand the uses of coal and petroleum in daily life." rows={4} />
              <div className="mt-2 flex justify-end text-xs text-slate-500">{learningObjective.length}/300</div>
            </NumericSection>

            <NumericSection
              number="3"
              title="Customize Your Lesson Plan"
              subtitle="Choose the components you want to include or emphasize."
              expandable
              open={openSections.customize}
              onToggle={() => setOpenSections((sections) => ({ ...sections, customize: !sections.customize }))}
            >
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {lessonComponents.map((component) => {
                  const Icon = component.icon;
                  const active = selected.includes(component.title);
                  return (
                    <button
                      key={component.title}
                      type="button"
                      onClick={() => toggleComponent(component.title)}
                      aria-pressed={active}
                      className={`group rounded-xl border bg-white p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:shadow-[0_12px_28px_rgba(37,99,235,0.12)] ${active ? "border-blue-300 bg-blue-50/70 shadow-[0_10px_22px_rgba(37,99,235,0.10)]" : "border-slate-200"}`}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className={`grid h-10 w-10 place-items-center rounded-lg ${toneClass(component.tone)}`}><Icon className="h-5 w-5" /></div>
                        <span className={`grid h-6 w-6 place-items-center rounded-full border-2 text-xs font-black transition-all duration-300 ${active ? "border-blue-500 bg-blue-500 text-white" : "border-slate-300 bg-transparent text-transparent group-hover:border-blue-300"}`}>✓</span>
                      </div>
                      <p className="font-black text-slate-900">{component.title}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-600">{component.body}</p>
                    </button>
                  );
                })}
              </div>
              {!selected.length ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Select at least one lesson component to generate.</p> : null}
            </NumericSection>

            <div className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-bold text-slate-900">Generate classroom-ready output</p>
                <p className="mt-1 text-sm font-medium text-slate-600">{isLoadingOptions ? "Loading options..." : selectedBook ? `Using ${selectedBook.title}` : "Select a subject, textbook, chapter, and topic."}</p>
              </div>
              <Button type="button" disabled={!canGenerate} onClick={generate} className="sm:min-w-[220px]"><Sparkles className="h-5 w-5" />Generate Lesson Plan</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NumericSection({
  number,
  title,
  subtitle,
  action,
  children,
  expandable = false,
  open = true,
  onToggle
}: {
  number: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
  expandable?: boolean;
  open?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-white/70 bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.04)] backdrop-blur-sm">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        {expandable ? (
          <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-start gap-4 text-left" aria-expanded={open}>
            <SectionTitle number={number} title={title} subtitle={subtitle} />
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <SectionTitle number={number} title={title} subtitle={subtitle} />
          </div>
        )}
        <div className="flex w-full shrink-0 items-center justify-between gap-3 sm:w-auto sm:justify-end">
          {action ? <div className="min-w-0 flex-1 sm:flex-none">{action}</div> : <span />}
          {expandable ? (
            <button
              type="button"
              onClick={onToggle}
              aria-label={`${open ? "Collapse" : "Expand"} ${title}`}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/70 bg-white/90 text-slate-600 shadow-sm backdrop-blur-sm transition hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700"
            >
              <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
            </button>
          ) : null}
        </div>
      </div>
      <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="px-4 pb-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return (
    <>
      <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-base font-extrabold text-white shadow-md">{number}</div>
      <div>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </div>
    </>
  );
}
function FieldBox({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) { 
  return (
    <label className="grid min-w-0 gap-2">
      <span className="truncate text-sm font-bold text-slate-700">{label} {required && <span className="text-red-500">*</span>}</span>
      {children}
      {error ? <span className="text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}
function toneClass(tone: string) { 
  return tone === "blue" ? "bg-gradient-to-br from-sky-100 to-blue-100 text-blue-700" : 
         tone === "green" ? "bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-700" : 
         tone === "orange" ? "bg-gradient-to-br from-amber-100 to-orange-100 text-orange-700" : 
         "bg-gradient-to-br from-blue-100 to-blue-100 text-blue-700"; 
}
