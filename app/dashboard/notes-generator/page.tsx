"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, BookOpen, ClipboardCopy, Download, LoaderCircle, NotebookPen, Printer, Sparkles } from "lucide-react";
import { backendApi, Board, Book, Chapter, ClassItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { GenerationLoadingScreen } from "@/components/generation-loading-screen";
import { OutputMetadataFooter } from "@/components/output-metadata-footer";
import { readToolDraft, saveToolDraft } from "@/lib/form-draft-storage";

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
  const [notes, setNotes] = useState<any>(null);
  const [draftReady, setDraftReady] = useState(false);

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

  function toggleChapter(name: string) {
    setChapterNames((items) => items.includes(name) ? items.filter((item) => item !== name) : [...items, name]);
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

  if (generating || generationError) {
    return (
      <GenerationLoadingScreen
        type="notes"
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

  if (notes) {
    return (
      <div className="mx-auto max-w-[1180px]">
        <NotesOutput notes={notes} onCopy={copyNotes} onDownload={downloadNotes} onBack={() => setNotes(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1120px]">
      <section className="overflow-hidden rounded-[18px] border border-[#ffd9e8] bg-white shadow-[0_14px_34px_rgba(39,30,91,0.07)]">
        <div className="relative min-h-[166px] border-b border-[#ffd9e8] bg-gradient-to-br from-[#fff1f7] to-white px-5 py-6">
          <div className="relative z-10 max-w-[620px]">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-xs font-black text-[#d9467d] shadow-sm">
              <NotebookPen className="h-4 w-4" /> Textbook notes
            </div>
            <h1 className="text-[28px] font-black tracking-tight text-[#25262b] sm:text-[34px]">Notes Generator</h1>
            <p className="mt-2.5 max-w-[560px] text-sm font-medium leading-6 text-[#55516e]">
              Generate chapter-wise classroom notes, blackboard points, key terms, and revision questions from your textbook.
            </p>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:p-5">
          <NumericSection number="1" title="Textbook Source" subtitle="Choose the book and chapters for the notes.">
            <div className="grid gap-4 md:grid-cols-2">
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
            <div className="mt-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-black text-[#4f4b68]">Chapters <span className="text-red-500">*</span></p>
                <span className="rounded-full bg-[#fff1f7] px-3 py-1 text-xs font-black text-[#d9467d]">{chapterNames.length} selected</span>
              </div>
              {isLoadingChapters ? (
                <div className="flex min-h-[64px] items-center justify-between rounded-xl border border-[#ffd9e8] bg-[#fff8fb] px-4 text-sm font-bold text-[#6d6f78]">
                  <span>Loading chapters...</span>
                  <LoaderCircle className="h-5 w-5 animate-spin text-[#d9467d]" />
                </div>
              ) : chaptersError ? (
                <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{chaptersError}</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
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
                        className={`flex min-h-[60px] items-start gap-3 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${active ? "border-pink-300 bg-[#fff1f7] text-[#be185d]" : "border-[#ffd9e8] bg-white text-[#4f4b68] hover:border-pink-200"}`}
                      >
                        <span className={`mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-full border-2 text-xs font-black ${active ? "border-pink-500 bg-pink-500 text-white" : "border-slate-300 text-transparent"}`}>✓</span>
                        <span className="min-w-0 text-sm font-black leading-5">{chapter.chapter_number ? `${chapter.chapter_number}. ` : ""}{name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {!bookId ? <p className="mt-3 text-sm font-semibold text-[#6d6f78]">Select a textbook to load chapters.</p> : null}
            </div>
          </NumericSection>

          <NumericSection number="2" title="Notes Style" subtitle="Tune the output for how you will use it.">
            <div className="grid gap-4 md:grid-cols-2">
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

function NotesOutput({ notes, onCopy, onDownload, onBack }: { notes: any; onCopy: () => void; onDownload: () => void; onBack: () => void }) {
  const metadata = notes.metadata || {};

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
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCopy}><ClipboardCopy className="h-4 w-4" /> Copy</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
          <Button type="button" size="sm" onClick={onDownload} className="bg-gradient-to-r from-[#f45f98] to-[#d9467d]"><Download className="h-4 w-4" /> TXT</Button>
        </div>
      </div>
      <div className="p-5">
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
          generatedAt={notes.generated_at || notes.created_at || notes.updated_at}
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
    <label className="grid min-w-0 gap-2">
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
