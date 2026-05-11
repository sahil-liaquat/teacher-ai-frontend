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
import { savePendingLessonPlan } from "@/lib/pending-lesson-plan";

const lessonComponents = [
  { title: "Warm-up / Introduction", body: "Engaging start to capture attention", icon: Lightbulb, tone: "orange" },
  { title: "Direct Instruction", body: "Detailed explanation from selected chapter", icon: BookOpen, tone: "blue" },
  { title: "Classroom Activity", body: "Hands-on or group activity", icon: Users, tone: "green" },
  { title: "Class Discussion", body: "Discussion to encourage thinking", icon: MessageCircle, tone: "purple" },
  { title: "Assessment", body: "Questions to check understanding", icon: ClipboardCheck, tone: "orange" },
  { title: "Materials Needed", body: "Resources required for class", icon: Boxes, tone: "purple" },
  { title: "Differentiation", body: "Support for diverse learners", icon: Brain, tone: "blue" },
  { title: "Teacher Notes", body: "Extra guidance for teacher", icon: FileText, tone: "orange" },
  { title: "Homework", body: "Practice after class", icon: GraduationCap, tone: "purple" },
  { title: "Extension Activity", body: "Extra activity for advanced learners", icon: Rocket, tone: "blue" }
];
const defaultLessonComponents = [
  "Warm-up / Introduction",
  "Direct Instruction",
  "Classroom Activity",
  "Assessment",
  "Homework"
];

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
    <div className="mx-auto max-w-[1120px] 2xl:max-w-[1320px]">
      <div className="overflow-visible rounded-[24px] border border-white/70 bg-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm">
        <div className="relative min-h-[240px] overflow-hidden rounded-t-[24px] border-b border-white/50 bg-gradient-to-br from-violet-50 via-purple-50 to-white px-5 py-9 sm:px-7 2xl:min-h-[300px] 2xl:py-12">
          <div className="relative z-10 max-w-[560px] 2xl:max-w-[620px]">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/70 border border-violet-200 px-4 py-2 text-xs font-bold text-violet-700 shadow-md backdrop-blur-sm"><Sparkles className="h-4 w-4" /> AI-Powered</div>
            <h1 className="flex items-center gap-3 text-[34px] font-extrabold tracking-tight text-slate-900 sm:text-[42px] 2xl:text-5xl">Create Lesson Plan</h1>
            <p className="mt-4 max-w-[520px] text-base font-medium leading-relaxed text-slate-600 2xl:mt-5 2xl:max-w-[560px] 2xl:text-lg 2xl:leading-9">Generate curriculum-aligned lesson plans from the selected textbook chapter in seconds.</p>
            <Button type="button" variant="outline" className="mt-7 border-violet-200 bg-white/90 px-6 text-violet-700 hover:bg-violet-50"><BookOpen className="h-4 w-4" /> Textbook grounded</Button>
          </div>
          <div className="absolute bottom-0 right-6 hidden h-64 w-[560px] 2xl:block 2xl:h-80 2xl:w-[720px]">
            <div className="absolute bottom-0 right-0 h-52 w-[620px] rounded-t-full bg-white/60" />
            <div className="absolute bottom-28 right-[288px] h-28 w-28 rounded-t-full bg-emerald-200/50" />
            <div className="absolute bottom-[72px] right-[264px] h-[72px] w-36 rounded-[14px] bg-emerald-100/50" />
            <div className="absolute bottom-[88px] right-24 h-32 w-32 rounded-[18px] bg-violet-500/75 shadow-lg" />
            <div className="absolute bottom-[120px] right-[72px] h-20 w-10 rotate-12 rounded-[12px] bg-violet-600/75" />
            <div className="absolute bottom-0 right-[180px] h-28 w-20 rounded-t-[16px] bg-amber-200/90" />
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-6 2xl:gap-6 2xl:p-8">
          <div className="grid gap-6">
            <NumericSection number="1" title="Plan Details" subtitle="Provide basic information about your lesson.">
              <div className="grid min-w-0 gap-4 md:grid-cols-2 2xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)_minmax(0,0.9fr)] 2xl:gap-5">
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
              action={<Button type="button" variant="outline" size="sm" onClick={suggestObjectives} className="w-full border-indigo-300 text-indigo-600 hover:bg-indigo-50 sm:w-auto"><Sparkles className="h-4 w-4" />AI Suggest Objectives</Button>}
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
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 2xl:gap-6">
                {lessonComponents.map((component) => {
                  const Icon = component.icon;
                  const active = selected.includes(component.title);
                  return (
                    <button
                      key={component.title}
                      type="button"
                      onClick={() => toggleComponent(component.title)}
                      aria-pressed={active}
                      className={`group rounded-2xl border bg-white p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-[0_16px_36px_rgba(85,66,188,0.14)] ${active ? "border-indigo-300 bg-indigo-50/70 shadow-[0_12px_28px_rgba(85,66,188,0.10)]" : "border-slate-200"}`}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className={`grid h-10 w-10 place-items-center rounded-lg ${toneClass(component.tone)}`}><Icon className="h-5 w-5" /></div>
                        <span className={`grid h-6 w-6 place-items-center rounded-full border-2 text-xs font-black transition-all duration-300 ${active ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-300 bg-transparent text-transparent group-hover:border-indigo-300"}`}>✓</span>
                      </div>
                      <p className="font-black text-slate-900">{component.title}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-600">{component.body}</p>
                    </button>
                  );
                })}
              </div>
              {!selected.length ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Select at least one lesson component to generate.</p> : null}
            </NumericSection>

            <div className="flex flex-col gap-3 rounded-[18px] border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4 sm:flex-row sm:items-center sm:justify-between 2xl:p-5">
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
    <div className="overflow-hidden rounded-[20px] border border-white/70 bg-white/80 shadow-[0_12px_30px_rgba(15,23,42,0.04)] backdrop-blur-sm">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6 2xl:p-8">
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
              className="grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/90 text-slate-600 shadow-md backdrop-blur-sm transition hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700"
            >
              <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
            </button>
          ) : null}
        </div>
      </div>
      <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="px-5 pb-5 sm:px-6 sm:pb-6 2xl:px-8 2xl:pb-8">
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
      <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-lg font-extrabold text-white shadow-lg">{number}</div>
      <div>
        <h2 className="text-base font-bold text-slate-900 2xl:text-lg">{title}</h2>
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
         "bg-gradient-to-br from-violet-100 to-purple-100 text-violet-700"; 
}
