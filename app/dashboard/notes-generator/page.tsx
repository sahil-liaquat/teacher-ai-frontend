"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, ClipboardCopy, Download, NotebookPen, PenLine, Save, Share2, Sparkles } from "lucide-react";
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

const styleOptions = ["Exam revision", "Classroom blackboard", "Student notebook", "Quick recap"];
const detailOptions = ["Brief", "Balanced", "Detailed"];
const NOTES_DRAFT_KEY = "notes";

type NotesFormDraft = {
  boardId: string;
  classId: string;
  subject: string;
  bookId: string;
  chapterNames: string[];
  topic: string;
  language: string;
  noteStyle: string;
  detailLevel: string;
  includeKeyTerms: boolean;
  includeExamples: boolean;
  includeSummary: boolean;
  includeQuestions: boolean;
};

export default function NotesGeneratorPage() {
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
  const [noteStyle, setNoteStyle] = useState(styleOptions[0]);
  const [detailLevel, setDetailLevel] = useState(detailOptions[1]);
  const [includeKeyTerms, setIncludeKeyTerms] = useState(true);
  const [includeExamples, setIncludeExamples] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeQuestions, setIncludeQuestions] = useState(true);
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
  const [savedGenerationLoading, setSavedGenerationLoading] = useState(false);
  const [savedGenerationError, setSavedGenerationError] = useState("");
  const [notes, setNotes] = useState<any>(null);
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
    backendApi.notesGeneration(generationId)
      .then((generation) => {
        if (!cancelled) setNotes(generation.output_json);
      })
      .catch((error) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Could not load saved notes.";
          setSavedGenerationError(message);
          toast({ title: "Could not load notes", description: message });
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
    const draft = readToolDraft<NotesFormDraft>(NOTES_DRAFT_KEY);
    if (draft) {
      setBoardId(draft.boardId || "");
      setClassId(draft.classId || "");
      setSubject(draft.subject || "");
      setBookId(draft.bookId || "");
      setChapterNames(draft.chapterNames || []);
      setTopic(draft.topic || "");
      setLanguage(draft.language || "English");
      setNoteStyle(draft.noteStyle || styleOptions[0]);
      setDetailLevel(draft.detailLevel || detailOptions[1]);
      setIncludeKeyTerms(draft.includeKeyTerms ?? true);
      setIncludeExamples(draft.includeExamples ?? true);
      setIncludeSummary(draft.includeSummary ?? true);
      setIncludeQuestions(draft.includeQuestions ?? true);
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    saveToolDraft<NotesFormDraft>(NOTES_DRAFT_KEY, {
      boardId,
      classId,
      subject,
      bookId,
      chapterNames,
      topic,
      language,
      noteStyle,
      detailLevel,
      includeKeyTerms,
      includeExamples,
      includeSummary,
      includeQuestions
    });
  }, [draftReady, boardId, chapterNames, classId, bookId, detailLevel, includeExamples, includeKeyTerms, includeQuestions, includeSummary, language, noteStyle, subject, topic]);

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
  const canGenerate = Boolean(bookId && chapterNames.length);

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
    setNotes(null);
  }

  function chooseClass(value: string) {
    setClassId(value);
    setBooks([]);
    setChapters([]);
    setSubject("");
    setBookId("");
    setChapterNames([]);
    setNotes(null);
  }

  function chooseBook(value: string) {
    setBookId(value);
    setChapters([]);
    setChapterNames([]);
    setNotes(null);
  }

  function chooseChapter(value: string) {
    setChapterNames(value ? [value] : []);
  }

  async function generate() {
    if (!canGenerate) {
      toast({ title: "Complete required details", description: "Select a textbook and at least one chapter." });
      return;
    }
    setGenerating(true);
    setGenerationError("");
    setGenerationStatus("Reading textbook context...");
    const t1 = window.setTimeout(() => setGenerationStatus("Finding important explanations..."), 3000);
    const t2 = window.setTimeout(() => setGenerationStatus("Writing classroom notes..."), 10000);
    const t3 = window.setTimeout(() => setGenerationStatus("Formatting revision sections..."), 20000);
    try {
      const generation = await backendApi.createNotes({
        book_id: bookId,
        chapter_names: chapterNames,
        topic: topic.trim() || undefined,
        language,
        note_style: noteStyle,
        detail_level: detailLevel,
        include_key_terms: includeKeyTerms,
        include_examples: includeExamples,
        include_summary: includeSummary,
        include_questions: includeQuestions
      });
      setNotes(generation.output_json);
      toast({ title: "Notes generated", description: "Your classroom notes are ready below." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not generate notes.";
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

  function notesText() {
    if (!notes) return "";
    const sections = (notes.sections || []).map((section: any) => [
      section.heading,
      section.explanation,
      ...(section.key_points || []).map((point: string) => `- ${point}`),
      ...(section.examples || []).map((example: string) => `Example: ${example}`)
    ].filter(Boolean).join("\n")).join("\n\n");
    return [
      notes.title,
      notes.quick_overview,
      sectionList("Learning Goals", notes.learning_goals),
      sections,
      termList(notes.key_terms),
      sectionList("Blackboard Summary", notes.blackboard_summary),
      sectionList("Revision Questions", notes.revision_questions),
      notes.student_summary ? `Student Summary\n${notes.student_summary}` : "",
      notes.teacher_notes ? `Teacher Notes\n${notes.teacher_notes}` : ""
    ].filter(Boolean).join("\n\n");
  }

  function copyNotes() {
    navigator.clipboard?.writeText(notesText()).then(() => {
      toast({ title: "Notes copied", description: "The generated notes are on your clipboard." });
    }).catch(() => toast({ title: "Copy failed", description: "Your browser blocked clipboard access." }));
  }

  function downloadNotes() {
    const blob = new Blob([notesText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${notes?.title || "classroom-notes"}.txt`.replace(/[^\w.-]+/g, "-");
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function downloadNotesPdf(handwritten = false) {
    try {
      await downloadGeneratedTextPdf({
        title: notes?.title || "Classroom Notes",
        subtitle: notes?.metadata?.chapter || "Textbook grounded notes",
        text: notesText(),
        filenamePrefix: "classroom-notes",
        handwritten
      });
      toast({ title: "PDF downloaded", description: "Your notes were exported as a PDF." });
    } catch (error) {
      toast({ title: "PDF export failed", description: error instanceof Error ? error.message : "Could not export notes PDF." });
    }
  }

  async function shareNotes() {
    const text = notesText();
    try {
      if (navigator.share) {
        await navigator.share({ title: notes?.title || "Classroom Notes", text });
        toast({ title: "Shared" });
      } else {
        await navigator.clipboard.writeText(text);
        toast({ title: "Share text copied", description: "Paste it wherever you want to share." });
      }
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") {
        toast({ title: "Share failed", description: "Could not share these notes." });
      }
    }
  }

  if (generating || generationError || savedGenerationLoading || savedGenerationError) {
    return (
      <GenerationLoadingScreen
        type="notes"
        state={generationError || savedGenerationError ? "error" : "loading"}
        status={generating ? generationStatus : "Loading saved notes..."}
        errorMessage={generationError || savedGenerationError}
        onRetry={generationError ? generate : () => {
          if (!generationId) return;
          setSavedGenerationError("");
          setSavedGenerationLoading(true);
          backendApi.notesGeneration(generationId)
            .then((generation) => setNotes(generation.output_json))
            .catch((error) => setSavedGenerationError(error instanceof Error ? error.message : "Could not load saved notes."))
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

  if (notes) {
    return (
      <div className="mx-auto w-full max-w-[1240px]">
        <NotesOutput notes={notes} onCopy={copyNotes} onPdf={downloadNotesPdf} onShare={shareNotes} onSave={downloadNotes} onBack={() => setNotes(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-3">
      <Link href="/dashboard/classroom-tools" className="inline-flex items-center gap-1.5 text-sm font-black text-[#be185d] transition hover:text-[#d9467d]">
        <ArrowLeft className="h-4 w-4" />
        Back to tools
      </Link>
      <section className="overflow-hidden rounded-[18px] border border-[#ffd9e8] bg-white shadow-[0_14px_34px_rgba(39,30,91,0.07)]">
        <div className="relative min-h-[166px] overflow-hidden border-b border-[#ffd9e8] bg-gradient-to-br from-[#fff1f7] to-white px-5 py-6">
          <div className="relative z-10 max-w-[620px] lg:max-w-[58%]">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-xs font-black text-[#d9467d] shadow-sm">
              <NotebookPen className="h-4 w-4" /> Textbook notes
            </div>
            <h1 className="text-[28px] font-black tracking-tight text-[#25262b] sm:text-[34px]">Notes Generator</h1>
            <p className="mt-2.5 max-w-[560px] text-sm font-medium leading-6 text-[#55516e]">
              Generate chapter-wise classroom notes, blackboard points, key terms, and revision questions from your textbook.
            </p>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] overflow-hidden lg:block">
            <img
              src="/assets/illustrations/create-notes-header.png"
              alt=""
              aria-hidden="true"
              className="absolute bottom-0 right-0 max-h-full w-[390px] select-none object-contain object-bottom drop-shadow-[0_18px_18px_rgba(217,70,125,0.18)] xl:right-2 xl:w-[470px]"
            />
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:p-5">
          <NumericSection number="1" title="Textbook Source" subtitle="Choose the book and chapters for the notes.">
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

          <NumericSection number="2" title="Notes Style" subtitle="Tune the output for how you will use it.">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <FieldBox label="Optional Topic Focus">
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Example: photosynthesis steps" />
              </FieldBox>
              <FieldBox label="Language">
                <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Urdu</option>
                </Select>
              </FieldBox>
              <FieldBox label="Style">
                <Select value={noteStyle} onChange={(e) => setNoteStyle(e.target.value)}>
                  {styleOptions.map((item) => <option key={item}>{item}</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Detail Level">
                <Select value={detailLevel} onChange={(e) => setDetailLevel(e.target.value)}>
                  {detailOptions.map((item) => <option key={item}>{item}</option>)}
                </Select>
              </FieldBox>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Option label="Key terms" checked={includeKeyTerms} onCheckedChange={setIncludeKeyTerms} />
              <Option label="Examples" checked={includeExamples} onCheckedChange={setIncludeExamples} />
              <Option label="Student summary" checked={includeSummary} onCheckedChange={setIncludeSummary} />
              <Option label="Revision questions" checked={includeQuestions} onCheckedChange={setIncludeQuestions} />
            </div>
          </NumericSection>

          <div className="flex flex-col gap-3 rounded-xl border border-[#ffd9e8] bg-[#fff8fb] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-[14px] bg-[#fff1f7] text-[#d9467d]">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-black text-[#25262b]">Generate classroom notes</p>
                <p className="mt-1 text-sm font-medium text-[#6d6f78]">
                  {selectedBook ? `Using ${selectedBook.title} - ${chapterNames.length || 0} chapter${chapterNames.length === 1 ? "" : "s"}` : "Select a subject, textbook, and chapters."}
                </p>
              </div>
            </div>
            <Button type="button" disabled={!canGenerate || generating} onClick={generate} className="bg-gradient-to-r from-[#f45f98] to-[#d9467d] shadow-[0_14px_28px_rgba(244,95,152,0.24)] sm:min-w-[220px]">
              <Sparkles className="h-5 w-5" />
              Generate Notes
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function NotesOutput({ notes, onCopy, onPdf, onShare, onSave, onBack }: { notes: any; onCopy: () => void; onPdf: (handwritten?: boolean) => void; onShare: () => void; onSave: () => void; onBack: () => void }) {
  const metadata = notes.metadata || {};
  const [handwritten, setHandwritten] = useState(false);

  return (
    <aside className="rounded-[18px] border border-[#ffd9e8] bg-white shadow-[0_14px_34px_rgba(39,30,91,0.07)]">
      <div className="flex flex-col gap-3 border-b border-[#ffd9e8] bg-gradient-to-br from-[#fff1f7] to-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.08em] text-[#be185d] transition hover:text-[#d9467d]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Inputs
          </button>
          <h2 className="mt-2 break-words text-xl font-black text-[#25262b]">{notes.title || "Generated Notes"}</h2>
          <p className="mt-1 text-sm font-semibold text-[#6d6f78]">{notes.metadata?.chapter || "Textbook grounded notes"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={handwritten ? "default" : "outline"}
            size="sm"
            onClick={() => setHandwritten((value) => !value)}
            className={handwritten ? "bg-gradient-to-r from-[#f45f98] to-[#d9467d]" : ""}
          >
            <PenLine className="h-4 w-4" /> Handwritten
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCopy}><ClipboardCopy className="h-4 w-4" /> Copy</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onPdf(handwritten)}><Download className="h-4 w-4" /> PDF</Button>
          <Button type="button" variant="outline" size="sm" onClick={onShare}><Share2 className="h-4 w-4" /> Share</Button>
          <Button type="button" variant="outline" size="sm" onClick={onSave}><Save className="h-4 w-4" /> Save</Button>
        </div>
      </div>
      <div className={`p-5 ${handwritten ? "notes-handwritten" : ""}`}>
        <NotesBlock title="Quick Overview" body={notes.quick_overview} />
        <NotesList title="Learning Goals" items={notes.learning_goals} />
        {(notes.sections || []).map((section: any, index: number) => (
          <section key={`${section.heading}-${index}`} className="mt-5 rounded-[14px] border border-[#ffd9e8] bg-[#fff8fb] p-4">
            <h3 className="text-base font-black text-[#25262b]">{section.heading}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-[#4f4b68]">{section.explanation}</p>
            <NotesList title="Key Points" items={section.key_points} compact />
            <NotesList title="Examples" items={section.examples} compact />
          </section>
        ))}
        <Terms terms={notes.key_terms} />
        <NotesList title="Blackboard Summary" items={notes.blackboard_summary} />
        <NotesList title="Revision Questions" items={notes.revision_questions} />
        <NotesBlock title="Student Summary" body={notes.student_summary} />
        <NotesBlock title="Teacher Notes" body={notes.teacher_notes} />
        <OutputMetadataFooter
          subject={metadata.subject}
          grade={metadata.grade || metadata.class}
          chapter={metadata.chapter || metadata.topic || notes.title}
          source={metadata.book || metadata.textbook || notes.textbook_source}
        />
      </div>
    </aside>
  );
}

function NumericSection({ number, title, subtitle, children }: { number: string; title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[16px] border border-[#ffd9e8] bg-white shadow-[0_10px_24px_rgba(39,30,91,0.04)]">
      <div className="flex items-start gap-3 p-4">
        <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#f45f98] to-[#d9467d] text-base font-black text-white">{number}</div>
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
    <label className="flex items-center gap-3 rounded-xl border border-[#ffd9e8] bg-[#fff8fb] p-3 text-sm font-black text-[#4f4b68]">
      <Checkbox checked={checked} onChange={(event) => onCheckedChange(event.target.checked)} />
      {label}
    </label>
  );
}

function NotesBlock({ title, body }: { title: string; body?: string }) {
  if (!body) return null;
  return (
    <section className="mt-5">
      <h3 className="text-base font-black text-[#25262b]">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-[#4f4b68]">{body}</p>
    </section>
  );
}

function NotesList({ title, items, compact = false }: { title: string; items?: string[]; compact?: boolean }) {
  if (!items?.length) return null;
  return (
    <section className={compact ? "mt-3" : "mt-5"}>
      <h3 className="text-sm font-black text-[#25262b]">{title}</h3>
      <ul className="mt-2 grid gap-2 text-sm font-medium leading-6 text-[#4f4b68]">
        {items.map((item, index) => <li key={`${item}-${index}`} className="rounded-lg bg-white px-3 py-2 shadow-sm">{item}</li>)}
      </ul>
    </section>
  );
}

function Terms({ terms }: { terms?: Array<{ term?: string; meaning?: string }> }) {
  if (!terms?.length) return null;
  return (
    <section className="mt-5">
      <h3 className="text-base font-black text-[#25262b]">Key Terms</h3>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {terms.map((term, index) => (
          <div key={`${term.term}-${index}`} className="rounded-xl border border-[#ffd9e8] bg-white p-3">
            <p className="text-sm font-black text-[#be185d]">{term.term}</p>
            <p className="mt-1 text-sm font-medium leading-6 text-[#4f4b68]">{term.meaning}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function sectionList(title: string, items?: string[]) {
  if (!items?.length) return "";
  return `${title}\n${items.map((item) => `- ${item}`).join("\n")}`;
}

function termList(terms?: Array<{ term?: string; meaning?: string }>) {
  if (!terms?.length) return "";
  return `Key Terms\n${terms.map((term) => `- ${term.term}: ${term.meaning}`).join("\n")}`;
}
