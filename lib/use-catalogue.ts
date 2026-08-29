"use client";

import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { backendApi, type Board, type Chapter, type ClassItem, type Book } from "@/lib/api";

/**
 * The board → class → book → chapter cascade, as shared React Query hooks.
 *
 * Every generator form used to load this with its own useEffect + useState, five
 * near-identical copies, so each form refetched all four levels on every mount
 * and a teacher moving between tools paid for the same lists again and again.
 * Because the query keys here are shared, the second form to ask for a list gets
 * it from cache with no request at all.
 *
 * Ten minutes of staleness is safe: this data only changes when an admin edits
 * curriculum or ingests a textbook. React Query is stale-while-revalidate, so
 * past that window the teacher still sees the cached list instantly while a
 * background refetch confirms it — they never wait, and never sit on a list that
 * stays wrong. Admin mutations should invalidate `catalogueKeys` directly.
 */
export const CATALOGUE_STALE_TIME = 10 * 60 * 1000;
const CATALOGUE_GC_TIME = 30 * 60 * 1000;

export const catalogueKeys = {
  all: ["catalogue"] as const,
  boards: ["catalogue", "boards"] as const,
  classes: (boardId: string) => ["catalogue", "classes", boardId] as const,
  books: (classId: string) => ["catalogue", "books", classId] as const,
  chapters: (bookId: string) => ["catalogue", "chapters", bookId] as const
};

// The filtering lives here rather than in each form: a teacher must never be
// offered an inactive board/class, or a book whose text has not been ingested,
// because generation is grounded in the ingested chapters and would have nothing
// to retrieve. Admin screens deliberately use their own keys and see everything.
async function fetchBoards(): Promise<Board[]> {
  const res = await backendApi.boards(0, 100);
  return res.items.filter((board) => board.is_active !== false);
}

async function fetchClasses(boardId: string): Promise<ClassItem[]> {
  const res = await backendApi.classesByBoard(boardId, 0, 100);
  return res.items.filter((item) => item.is_active !== false);
}

async function fetchBooks(classId: string): Promise<Book[]> {
  const res = await backendApi.booksByClass(classId, 0, 100);
  return res.items.filter((book) => book.is_active !== false && book.is_ingested !== false);
}

function fetchChapters(bookId: string): Promise<Chapter[]> {
  return backendApi.chaptersByBook(bookId);
}

const catalogueOptions = {
  staleTime: CATALOGUE_STALE_TIME,
  gcTime: CATALOGUE_GC_TIME
};

export function useBoards() {
  return useQuery({
    queryKey: catalogueKeys.boards,
    queryFn: fetchBoards,
    ...catalogueOptions
  });
}

export function useClassesByBoard(boardId: string) {
  return useQuery({
    queryKey: catalogueKeys.classes(boardId),
    queryFn: () => fetchClasses(boardId),
    enabled: Boolean(boardId),
    ...catalogueOptions
  });
}

export function useBooksByClass(classId: string) {
  return useQuery({
    queryKey: catalogueKeys.books(classId),
    queryFn: () => fetchBooks(classId),
    enabled: Boolean(classId),
    ...catalogueOptions
  });
}

export function useChaptersByBook(bookId: string) {
  return useQuery({
    queryKey: catalogueKeys.chapters(bookId),
    queryFn: () => fetchChapters(bookId),
    enabled: Boolean(bookId),
    ...catalogueOptions
  });
}

/**
 * Warm the next level of the cascade before the teacher reaches it.
 *
 * Picking a class makes the book list the only possible next step, and picking a
 * book makes the chapter list the only next step, so the request can start on
 * selection instead of on render. prefetchQuery is a no-op when the data is
 * already fresh, and it swallows its own errors — the real query renders the
 * failure if there is one.
 */
export function useCataloguePrefetch() {
  const queryClient = useQueryClient();

  return {
    classes: (boardId: string) => {
      if (!boardId) return;
      void queryClient.prefetchQuery({
        queryKey: catalogueKeys.classes(boardId),
        queryFn: () => fetchClasses(boardId),
        ...catalogueOptions
      });
    },
    books: (classId: string) => {
      if (!classId) return;
      void queryClient.prefetchQuery({
        queryKey: catalogueKeys.books(classId),
        queryFn: () => fetchBooks(classId),
        ...catalogueOptions
      });
    },
    chapters: (bookId: string) => {
      if (!bookId) return;
      void queryClient.prefetchQuery({
        queryKey: catalogueKeys.chapters(bookId),
        queryFn: () => fetchChapters(bookId),
        ...catalogueOptions
      });
    }
  };
}

/**
 * Read chapters through the cache outside of a hook.
 *
 * The companion prefill scans several books for a matching chapter before the
 * teacher has chosen one. Going through fetchQuery means those reads populate
 * the same cache the chapter dropdown will use, so selecting the matched book
 * renders its chapters with no second request.
 */
export function fetchChaptersCached(queryClient: QueryClient, bookId: string): Promise<Chapter[]> {
  return queryClient.fetchQuery({
    queryKey: catalogueKeys.chapters(bookId),
    queryFn: () => fetchChapters(bookId),
    ...catalogueOptions
  });
}
