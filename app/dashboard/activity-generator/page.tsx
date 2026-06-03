"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Activity, ArrowLeft, BookOpen, ClipboardCopy, Download, Save, Share2, Sparkles } from "lucide-react";
import { backendApi, Board, Book, Chapter, ClassItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { GenerationLoadingScreen } from "@/components/generation-loading-screen";
import { OutputMetadataFooter } from "@/components/output-metadata-footer";
import { readToolDraft, saveToolDraft } from "@/lib/form-draft-storage";
import { downloadGeneratedTextPdf } from "@/lib/generated-text-pdf";
import { filteredBooksForSubject, findMatchingBoard, findMatchingChapter, findMatchingClass, findMatchingSubject, getCompanionPrefillContext, hasCompanionPrefill } from "@/lib/companion-prefill";

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
  durationInput: string;
  groupSize: string;
  difficulty: string;
  includeAssessment: boolean;
  includeMaterials: boolean;
  includeDifferentiation: boolean;
};

export default function ActivityGeneratorPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
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
  const [durationInput, setDurationInput] = useState("20");
  const [groupSize, setGroupSize] = useState(groupSizes[2]);
  const [difficulty, setDifficulty] = useState(difficultyOptions[1]);
  const [includeAssessment, setIncludeAssessment] = useState(true);
  const [includeMaterials, setIncludeMaterials] = useState(true);
  const [includeDifferentiation, setIncludeDifferentiation] = useState(true);
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
  const [activity, setActivity] = useState<any>(null);
  const [draftReady, setDraftReady] = useState(false);

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
      setDurationInput(draft.durationInput || "20");
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
      durationInput,
      groupSize,
      difficulty,
      includeAssessment,
      includeMaterials,
      includeDifferentiation
    });
  }, [draftReady, activityType, boardId, chapterNames, classId, bookId, difficulty, durationInput, groupSize, includeAssessment, includeDifferentiation, includeMaterials, language, subject, topic]);

  useEffect(() => {
    setFetching(true);
    backendApi.boards(0, 100)
      .then((res) => setBoards(res.items.filter((board) => board.is_active !== false)))
      .catch((err) => toast({ title: "Could not load boards", description: err.message }))
      .finally(() => setFetching(false));
  }, [toast]);

  useEffect(() => {
    if (!boardId) return setIsLoadingClasses(false);
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
    if (!classId) return setIsLoadingBooks(false);
    let cancelled = false;
    setBooksError("");
    setIsLoadingBooks(true);
    backendApi.booksByClass(classId, 0, 100)
      .then((res) => {
        if (!cancelled) setBooks(res.items.filter((book) => book.is_active !== false && book.is_ingested !== false));
      })
      .catch((err) => {
        if (!cancelled) setBooksError(err instanceof Error ? err.message : "Could not load books.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBooks(false);
      });
    return () => {
      cancelled = true;
    };
  }, [classId]);

  useEffect(() => {
    if (!bookId) return setIsLoadingChapters(false);
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
  const duration = Number(durationInput);
  const canGenerate = Boolean(bookId && chapterNames.length && Number.isFinite(duration) && duration >= 5);

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
  }

  function chooseClass(value: string) {
    setClassId(value);
    setBooks([]);
    setChapters([]);
    setSubject("");
    setBookId("");
    setChapterNames([]);
    setActivity(null);
  }

  function chooseBook(value: string) {
    setBookId(value);
    setChapters([]);
    setChapterNames([]);
    setActivity(null);
  }

  function chooseChapter(value: string) {
    setChapterNames(value ? [value] : []);
  }

  function updateDuration(value: string) {
    if (/^\d{0,2}$/.test(value)) setDurationInput(value);
  }

  function normalizeDuration() {
    setDurationInput(String(Math.min(90, Math.max(5, Number(durationInput || 20)))));
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
        duration_minutes: duration,
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

  if (generating || generationError) {
    return (
      <GenerationLoadingScreen
        type="activity"
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

  if (activity) {
    return (
      <div className="mx-auto w-full max-w-[1240px]">
        <ActivityOutput activity={activity} onCopy={copyActivity} onPdf={downloadActivityPdf} onShare={shareActivity} onSave={downloadActivity} onBack={() => setActivity(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1240px]">
      <section className="overflow-hidden rounded-[18px] border border-[#c9f7fb] bg-white shadow-[0_14px_34px_rgba(39,30,91,0.07)]">
        <div className="relative overflow-hidden border-b border-[#c9f7fb] bg-gradient-to-br from-[#f0fdff] to-white px-5 py-6">
          <div className="relative z-10 max-w-[640px] lg:max-w-[58%]">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-black text-[#16a9b6] shadow-sm">
              <Activity className="h-4 w-4" /> Classroom activity
            </div>
            <h1 className="text-[28px] font-black tracking-tight text-[#25262b] sm:text-[34px]">Activity Generator</h1>
            <p className="mt-2.5 max-w-[580px] text-sm font-medium leading-6 text-[#55516e]">
              Generate textbook-grounded classroom activities with timing, materials, teacher actions, and assessment prompts.
            </p>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] overflow-hidden lg:block">
            <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#f0fdff] to-transparent" />
            <img
              src="/assets/illustrations/create-activity-header.png"
              alt=""
              aria-hidden="true"
              className="absolute bottom-0 right-0 max-h-full w-[390px] select-none object-contain object-bottom drop-shadow-[0_18px_18px_rgba(22,169,182,0.18)] xl:right-2 xl:w-[470px]"
            />
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:p-5">
          <NumericSection number="1" title="Textbook Source" subtitle="Choose the book and chapters for this activity.">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <FieldBox label="Board / Curriculum" required>
                <Select value={boardId} onChange={(e) => chooseBoard(e.target.value)} disabled={fetching}>
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
              <FieldBox label="Subject" required>
                <Select value={subject} onChange={(e) => { setSubject(e.target.value); setBookId(""); setChapters([]); setChapterNames([]); }} disabled={!classId || !books.length || isLoadingBooks}>
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
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <FieldBox label="Chapter / Unit" required error={chaptersError}>
                <Select value={chapterNames[0] || ""} onChange={(event) => chooseChapter(event.target.value)} disabled={!bookId || isLoadingChapters} isLoading={isLoadingChapters} loadingLabel="Loading chapters...">
                  <option value="">Select Chapter / Unit</option>
                  {chapters.map((chapter) => <option key={chapter.id} value={chapter.chapter_title || chapter.title || ""}>{chapter.chapter_number ? `${chapter.chapter_number}. ` : ""}{chapter.chapter_title || chapter.title}</option>)}
                </Select>
              </FieldBox>
            </div>
          </NumericSection>

          <NumericSection number="2" title="Activity Setup" subtitle="Tune the activity for your class period.">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <FieldBox label="Optional Topic Focus">
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Example: food chain role play" />
              </FieldBox>
              <FieldBox label="Duration" required>
                <Input value={durationInput} onChange={(e) => updateDuration(e.target.value)} onBlur={normalizeDuration} inputMode="numeric" />
              </FieldBox>
              <FieldBox label="Activity Type">
                <Select value={activityType} onChange={(e) => setActivityType(e.target.value)}>
                  {activityTypes.map((item) => <option key={item}>{item}</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Group Size">
                <Select value={groupSize} onChange={(e) => setGroupSize(e.target.value)}>
                  {groupSizes.map((item) => <option key={item}>{item}</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Difficulty">
                <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  {difficultyOptions.map((item) => <option key={item}>{item}</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Language">
                <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Urdu</option>
                </Select>
              </FieldBox>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Option label="Materials" checked={includeMaterials} onCheckedChange={setIncludeMaterials} />
              <Option label="Assessment" checked={includeAssessment} onCheckedChange={setIncludeAssessment} />
              <Option label="Differentiation" checked={includeDifferentiation} onCheckedChange={setIncludeDifferentiation} />
            </div>
          </NumericSection>

          <div className="flex flex-col gap-3 rounded-xl border border-[#c9f7fb] bg-[#f8feff] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-[14px] bg-[#f0fdff] text-[#16a9b6]">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-black text-[#25262b]">Generate classroom activity</p>
                <p className="mt-1 text-sm font-medium text-[#6d6f78]">
                  {selectedBook ? `Using ${selectedBook.title} - ${chapterNames.length || 0} chapter${chapterNames.length === 1 ? "" : "s"}` : "Select a subject, textbook, and chapters."}
                </p>
              </div>
            </div>
            <Button type="button" disabled={!canGenerate || generating} onClick={generate} className="bg-gradient-to-r from-[#20c4cf] to-[#16a9b6] shadow-[0_14px_28px_rgba(22,169,182,0.22)] sm:min-w-[230px]">
              <Sparkles className="h-5 w-5" />
              Generate Activity
            </Button>
          </div>
        </div>
      </section>
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
          <p className="mt-1 text-sm font-semibold text-[#6d6f78]">{activity.metadata?.chapter || "Textbook grounded activity"}</p>
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
            <p className="mt-2 text-sm font-semibold leading-6 text-[#4f4b68]"><span className="text-[#087c86]">Teacher:</span> {step.teacher_action}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#4f4b68]"><span className="text-[#087c86]">Students:</span> {step.student_action}</p>
          </section>
        ))}
        <TextBlock title="Grouping Plan" body={activity.grouping_plan} />
        <ListBlock title="Discussion Prompts" items={activity.discussion_prompts} />
        <ListBlock title="Assessment" items={activity.assessment} />
        {activity.differentiation ? (
          <section className="mt-5 rounded-[14px] border border-[#c9f7fb] bg-white p-4">
            <h3 className="text-base font-black text-[#25262b]">Differentiation</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-[#4f4b68]"><span className="font-black text-[#087c86]">Support:</span> {activity.differentiation.support}</p>
            <p className="mt-2 text-sm font-medium leading-6 text-[#4f4b68]"><span className="font-black text-[#087c86]">Challenge:</span> {activity.differentiation.challenge}</p>
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

function NumericSection({ number, title, subtitle, children }: { number: string; title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[16px] border border-[#c9f7fb] bg-white shadow-[0_10px_24px_rgba(39,30,91,0.04)]">
      <div className="flex items-start gap-3 p-4">
        <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#20c4cf] to-[#16a9b6] text-base font-black text-white">{number}</div>
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
      <span className="truncate text-sm font-black text-[#4f4b68]">{label} {required && <span className="text-red-500">*</span>}</span>
      {children}
      {error ? <span className="text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

function Option({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-[#c9f7fb] bg-[#f8feff] p-3 text-sm font-black text-[#4f4b68]">
      <Checkbox checked={checked} onChange={(event) => onCheckedChange(event.target.checked)} />
      {label}
    </label>
  );
}

function TextBlock({ title, body }: { title: string; body?: string }) {
  if (!body) return null;
  return (
    <section className="mt-5">
      <h3 className="text-base font-black text-[#25262b]">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-[#4f4b68]">{body}</p>
    </section>
  );
}

function ListBlock({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <section className="mt-5">
      <h3 className="text-base font-black text-[#25262b]">{title}</h3>
      <ul className="mt-2 grid gap-2 text-sm font-medium leading-6 text-[#4f4b68]">
        {items.map((item, index) => <li key={`${item}-${index}`} className="rounded-lg bg-white px-3 py-2 shadow-sm">{item}</li>)}
      </ul>
    </section>
  );
}

function listText(title: string, items?: string[]) {
  if (!items?.length) return "";
  return `${title}\n${items.map((item) => `- ${item}`).join("\n")}`;
}
