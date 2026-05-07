"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ClipboardList, Sparkles } from "lucide-react";
import { apiFetch, backendApi, Board, Book, Chapter, ClassItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { saveWorksheetGeneration } from "@/lib/worksheet-storage";

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

export default function NewWorksheetPage() {
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
  const [questionCountInput, setQuestionCountInput] = useState("16");
  const [language, setLanguage] = useState("English");
  const [difficulty, setDifficulty] = useState<DifficultyDistribution>(difficultyPresets[1].values);
  const [questionTypes, setQuestionTypes] = useState(defaultQuestionTypes);
  const [fetching, setFetching] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setFetching(true);
    backendApi.boards(0, 100)
      .then((res) => setBoards(res.items.filter((board) => board.is_active !== false)))
      .catch((err) => toast({ title: "Could not load boards", description: err.message }))
      .finally(() => setFetching(false));
  }, [toast]);

  useEffect(() => {
    if (!boardId) return;
    setClasses([]);
    setBooks([]);
    setChapters([]);
    setClassId("");
    setSubject("");
    setBookId("");
    setChapterNames([]);
    setFetching(true);
    backendApi.classesByBoard(boardId, 0, 100)
      .then((res) => setClasses(res.items.filter((item) => item.is_active !== false)))
      .catch((err) => toast({ title: "Could not load classes", description: err.message }))
      .finally(() => setFetching(false));
  }, [boardId, toast]);

  useEffect(() => {
    if (!classId) return;
    setBooks([]);
    setChapters([]);
    setSubject("");
    setBookId("");
    setChapterNames([]);
    setFetching(true);
    backendApi.booksByClass(classId, 0, 100)
      .then((res) => setBooks(res.items.filter((book) => book.is_active !== false && book.is_ingested !== false)))
      .catch((err) => toast({ title: "Could not load books", description: err.message }))
      .finally(() => setFetching(false));
  }, [classId, toast]);

  useEffect(() => {
    if (!bookId) return;
    setChapters([]);
    setChapterNames([]);
    setFetching(true);
    backendApi.chaptersByBook(bookId)
      .then((items) => setChapters(items))
      .catch((err) => toast({ title: "Could not load chapters", description: err.message }))
      .finally(() => setFetching(false));
  }, [bookId, toast]);

  const selectedBook = useMemo(() => books.find((book) => book.id === bookId), [books, bookId]);
  const subjectOptions = useMemo(() => Array.from(new Set(books.map((book) => book.subject).filter(Boolean))).sort(), [books]);
  const filteredBooks = useMemo(() => books.filter((book) => !subject || book.subject === subject), [books, subject]);
  const questionCount = Number(questionCountInput);
  const canGenerate = Boolean(bookId && chapterNames.length && Number.isFinite(questionCount) && questionCount >= 1 && questionTypes.length);

  function chooseSubject(value: string) {
    setSubject(value);
    setBookId("");
    setChapters([]);
    setChapterNames([]);
  }

  function chooseBook(value: string) {
    setBookId(value);
    setChapters([]);
    setChapterNames([]);
  }

  function toggleQuestionType(type: string) {
    setQuestionTypes((items) => items.includes(type) ? items.filter((item) => item !== type) : [...items, type]);
  }

  function toggleChapter(name: string) {
    setChapterNames((items) => items.includes(name) ? items.filter((item) => item !== name) : [...items, name]);
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
    try {
      const generation = await apiFetch<any>("/generate/worksheet", {
        method: "POST",
        body: JSON.stringify({
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
        })
      });
      saveWorksheetGeneration(generation);
      toast({ title: "Worksheet generated", description: "Opening printable worksheet." });
      router.push(`/dashboard/worksheets/${generation.id}`);
    } catch (error) {
      toast({ title: "Generation failed", description: error instanceof Error ? error.message : "Could not generate worksheet." });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1120px] 2xl:max-w-[1320px]">
      <div className="overflow-hidden rounded-[24px] border border-[#d8f1e5] bg-white shadow-[0_18px_50px_rgba(39,30,91,0.08)]">
        <div className="relative border-b border-[#d8f1e5] bg-gradient-to-br from-[#ecfff7] to-[#def8ef] px-5 py-9 sm:px-7 2xl:py-12">
          <div className="relative z-10 max-w-[620px]">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-xs font-black text-[#159565] shadow-sm 2xl:text-sm">
              <Sparkles className="h-4 w-4" /> Printable practice
            </div>
            <h1 className="flex items-center gap-3 text-[34px] font-black tracking-tight text-[#101039] sm:text-[42px] 2xl:text-5xl">
              Create Worksheet
            </h1>
            <p className="mt-4 max-w-[560px] text-base font-medium leading-7 text-[#55516e] 2xl:mt-5 2xl:text-xl 2xl:leading-9">
              Generate clean A4 worksheets from selected textbook chapters with only the question types you choose.
            </p>
            <Button type="button" variant="outline" className="mt-7 border-[#bdebd7] bg-white/90 px-6 text-[#159565]">
              <BookOpen className="h-4 w-4" /> Textbook grounded
            </Button>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-6 2xl:gap-6 2xl:p-8">
          <NumericSection number="1" title="Worksheet Setup" subtitle="Select the textbook source and chapters for this worksheet.">
            <div className="grid min-w-0 gap-4 md:grid-cols-2 2xl:grid-cols-3 2xl:gap-5">
              <FieldBox label="Board / Curriculum" required>
                <Select value={boardId} onChange={(e) => setBoardId(e.target.value)}>
                  <option value="">Select Board / Curriculum</option>
                  {boards.map((board) => <option key={board.id} value={board.id}>{board.name} ({board.code})</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Class / Grade" required>
                <Select value={classId} onChange={(e) => setClassId(e.target.value)} disabled={!boardId}>
                  <option value="">Select Class / Grade</option>
                  {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Subject" required>
                <Select value={subject} onChange={(e) => chooseSubject(e.target.value)} disabled={!classId || !books.length}>
                  <option value="">Select Subject</option>
                  {subjectOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Book / Textbook" required>
                <Select value={bookId} onChange={(e) => chooseBook(e.target.value)} disabled={!classId || !subject}>
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
            <div className="mt-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-[#4f4b68]">Chapters / Units <span className="text-red-500">*</span></p>
                <span className="rounded-full bg-[#ecfff7] px-3 py-1 text-xs font-black text-[#0b7f53]">{chapterNames.length} selected</span>
              </div>
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
                      className={`premium-hover-sm flex min-h-[70px] items-start gap-3 rounded-[16px] border p-4 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${active ? "border-emerald-300 bg-[#ecfff7] text-[#0b7f53] shadow-[0_12px_28px_rgba(22,163,99,0.10)]" : "border-[#ebe7f4] bg-white text-[#4f4b68] hover:border-emerald-200"}`}
                    >
                      <span className={`mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-full border-2 text-xs font-black ${active ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent"}`}>✓</span>
                      <span className="min-w-0 text-sm font-black leading-5">
                        {chapter.chapter_number ? `${chapter.chapter_number}. ` : ""}{name}
                      </span>
                    </button>
                  );
                })}
              </div>
              {!bookId ? <p className="mt-3 text-sm font-semibold text-[#67627d]">Select a textbook to load chapters.</p> : null}
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
                    className={`premium-hover-sm flex min-h-[74px] items-center gap-3 rounded-[16px] border p-4 text-left transition-all duration-200 ${active ? "border-emerald-300 bg-[#ecfff7] text-[#0b7f53] shadow-[0_12px_28px_rgba(22,163,99,0.10)]" : "border-[#ebe7f4] bg-white text-[#4f4b68] hover:border-emerald-200"}`}
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
            <div className="grid gap-5">
              <div className="flex rounded-[16px] border border-[#ebe7f4] bg-[#fbfaff] p-1.5">
                {difficultyPresets.map((preset) => {
                  const active = difficulty.easy === preset.values.easy && difficulty.medium === preset.values.medium && difficulty.hard === preset.values.hard;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => setDifficulty(preset.values)}
                      className={`h-12 flex-1 rounded-xl text-sm font-black transition-all duration-200 ${active ? "bg-white text-[#101039] shadow-md" : "text-[#67627d] hover:text-emerald-700"}`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <div className="overflow-hidden rounded-[16px] border border-[#ebe7f4] bg-white">
                <div className="flex h-5">
                  <div className="bg-emerald-400 transition-all duration-500" style={{ width: `${difficulty.easy}%` }} />
                  <div className="bg-blue-500 transition-all duration-500" style={{ width: `${difficulty.medium}%` }} />
                  <div className="bg-orange-400 transition-all duration-500" style={{ width: `${difficulty.hard}%` }} />
                </div>
                <div className="grid gap-3 p-4 text-sm font-black text-[#101039] md:grid-cols-3">
                  <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-400" /> Easy {difficulty.easy}%</span>
                  <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-500" /> Medium {difficulty.medium}%</span>
                  <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-orange-400" /> Hard {difficulty.hard}%</span>
                </div>
              </div>
            </div>
          </NumericSection>

          <div className="flex flex-col gap-3 rounded-[18px] border border-[#bdebd7] bg-[#f8fffb] p-4 sm:flex-row sm:items-center sm:justify-between 2xl:p-5">
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-[14px] bg-[#dbfae6] text-[#24a760]">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-black text-[#101039]">Generate printable worksheet</p>
                <p className="mt-1 text-sm font-medium text-[#67627d]">
                  {fetching ? "Loading options..." : selectedBook ? `Using ${selectedBook.title} • ${chapterNames.length || 0} chapter${chapterNames.length === 1 ? "" : "s"}` : "Select a subject, textbook, and chapters."}
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
    <section className="overflow-hidden rounded-[18px] border border-[#ebe7f4] bg-white shadow-[0_12px_30px_rgba(39,30,91,0.04)] 2xl:rounded-[20px]">
      <div className="flex items-start gap-4 p-5 sm:p-6 2xl:p-8">
        <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#22c977] to-[#079765] text-lg font-black text-white">{number}</div>
        <div>
          <h2 className="text-base font-black text-[#101039] 2xl:text-lg">{title}</h2>
          <p className="text-sm text-[#67627d]">{subtitle}</p>
        </div>
      </div>
      <div className="px-5 pb-5 sm:px-6 sm:pb-6 2xl:px-8 2xl:pb-8">{children}</div>
    </section>
  );
}

function FieldBox({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="truncate text-sm font-black text-[#4f4b68]">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
