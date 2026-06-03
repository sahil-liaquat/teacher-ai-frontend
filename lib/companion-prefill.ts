import type { Board, Book, Chapter, ClassItem } from "@/lib/api";

export type CompanionPrefillContext = {
  board: string;
  classLabel: string;
  subject: string;
  chapter: string;
  topic: string;
};

export function getCompanionPrefillContext(params: URLSearchParams): CompanionPrefillContext {
  return {
    board: clean(params.get("board")),
    classLabel: clean(params.get("class")),
    subject: clean(params.get("subject")),
    chapter: clean(params.get("chapter")),
    topic: clean(params.get("topic"))
  };
}

export function hasCompanionPrefill(context: CompanionPrefillContext) {
  return Boolean(context.board || context.classLabel || context.subject || context.chapter || context.topic);
}

export function findMatchingBoard(boards: Board[], value: string) {
  const target = normalize(value);
  if (!target) return undefined;
  return boards.find((board) => normalize(board.id) === target || normalize(board.name) === target || normalize(board.code) === target || normalize(`${board.name} (${board.code})`) === target);
}

export function findMatchingClass(classes: ClassItem[], value: string) {
  const target = normalizeGrade(value);
  if (!target) return undefined;
  return classes.find((item) => normalizeGrade(item.id) === target || normalizeGrade(item.name) === target || String(item.grade_number || "") === target);
}

export function findMatchingSubject(subjects: string[], value: string) {
  const target = normalize(value);
  if (!target) return "";
  return subjects.find((subject) => normalize(subject) === target) || "";
}

export function findMatchingChapter(chapters: Chapter[], value: string) {
  const target = normalizeChapter(value);
  if (!target) return undefined;
  return chapters.find((chapter) => {
    const title = chapter.chapter_title || chapter.title || "";
    return normalizeChapter(title) === target || normalizeChapter(`${chapter.chapter_number || ""} ${title}`) === target;
  });
}

export function filteredBooksForSubject(books: Book[], subject: string) {
  const target = normalize(subject);
  return target ? books.filter((book) => normalize(book.subject) === target) : books;
}

function clean(value: string | null) {
  return String(value || "").trim();
}

function normalize(value: string | number | null | undefined) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeGrade(value: string | number | null | undefined) {
  return normalize(value).replace(/^class\s+/, "").replace(/^grade\s+/, "");
}

function normalizeChapter(value: string | number | null | undefined) {
  return normalize(value).replace(/^\d+[\s.)-]+/, "");
}
