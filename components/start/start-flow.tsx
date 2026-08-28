"use client";

import { useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CURRENT_USER_QUERY_KEY, backendApi, submitOnboarding, type Board, type Book } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { READY_TOOLS, type ToolDefinition } from "@/lib/tools";
import {
  START_STEP_ORDER,
  furthestReachableStep,
  isStartStep,
  nextStep,
  type StartAnswers,
  type StartStep
} from "@/lib/start-flow";
import { StepShell, type StepOption } from "@/components/start/step-shell";
import { Button } from "@/components/ui/button";

// The five chapter-grounded generators, in the order teachers actually reach for
// them first. The Writing Assistant is "ready" but takes no board/class/chapter,
// so offering it here would throw away every answer the corridor just collected.
const START_TOOL_IDS = ["worksheet", "lesson-plan", "notes", "presentation", "activity"];

const START_TOOLS: ToolDefinition[] = START_TOOL_IDS
  .map((id) => READY_TOOLS.find((tool) => tool.id === id))
  .filter((tool): tool is ToolDefinition => Boolean(tool));

const DEFAULT_BOARD_KEY = "teachpad_default_board_id";

export function StartFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const boardId = searchParams.get("board") || "";
  const classId = searchParams.get("class") || "";
  const subject = searchParams.get("subject") || "";
  const bookId = searchParams.get("book") || "";
  // Chapters are identified by title everywhere in this app: the generator forms
  // store `chapterName`, and findMatchingChapter only ever matches on the title.
  const chapterTitle = searchParams.get("chapter") || "";
  const toolId = searchParams.get("tool") || "";

  const answers: StartAnswers = useMemo(
    () => ({
      boardId: boardId || undefined,
      classId: classId || undefined,
      subjectId: subject || undefined,
      bookId: bookId || undefined,
      chapterId: chapterTitle || undefined,
      tool: toolId || undefined
    }),
    [boardId, classId, subject, bookId, chapterTitle, toolId]
  );

  const requested = searchParams.get("step");
  const step = clampStep(isStartStep(requested) ? requested : "board", furthestReachableStep(answers));
  const stepIndex = START_STEP_ORDER.indexOf(step);

  // Shared with the onboarding wizard on purpose — one boards fetch, one cache entry.
  const boardsQuery = useQuery({
    queryKey: ["onboarding-boards"],
    queryFn: () => backendApi.boards(0, 100).then((res) => res.items.filter((board) => board.is_active !== false)),
    staleTime: Infinity
  });

  const classesQuery = useQuery({
    queryKey: ["start-classes", boardId],
    queryFn: () => backendApi.classesByBoard(boardId, 0, 100).then((res) => res.items.filter((item) => item.is_active !== false)),
    staleTime: Infinity,
    enabled: Boolean(boardId)
  });

  const booksQuery = useQuery({
    queryKey: ["start-books", classId],
    queryFn: () =>
      backendApi
        .booksByClass(classId, 0, 100)
        .then((res) => res.items.filter((book) => book.is_active !== false && book.is_ingested !== false)),
    staleTime: Infinity,
    enabled: Boolean(classId)
  });

  const chaptersQuery = useQuery({
    queryKey: ["start-chapters", bookId],
    queryFn: () => backendApi.chaptersByBook(bookId),
    staleTime: Infinity,
    enabled: Boolean(bookId)
  });

  const pushCount = useRef(0);

  const goTo = useCallback(
    (target: StartStep | "generate", patch: Record<string, string>, mode: "push" | "replace" = "push") => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) params.set(key, value);
      if (target !== "generate") params.set("step", target);
      if (mode === "push") {
        pushCount.current += 1;
        router.push(`/start?${params.toString()}`);
      } else {
        router.replace(`/start?${params.toString()}`);
      }
    },
    [router, searchParams]
  );

  const handleBack = useCallback(() => {
    if (stepIndex <= 0) return;
    if (pushCount.current > 0) {
      pushCount.current -= 1;
      router.back();
      return;
    }
    // Deep-linked mid-flow in a fresh tab: there is no history entry of ours to
    // pop, so walk back explicitly rather than bouncing the teacher off the site.
    const previous = START_STEP_ORDER[stepIndex - 1];
    const params = new URLSearchParams(searchParams.toString());
    for (const key of ANSWER_PARAMS_FROM[previous]) params.delete(key);
    params.set("step", previous);
    router.replace(`/start?${params.toString()}`);
  }, [router, searchParams, stepIndex]);

  function chooseBoard(value: string) {
    const board = boardsQuery.data?.find((item) => item.id === value);
    if (board) rememberBoard(board, queryClient);
    goTo("class", { board: value });
  }

  function chooseClass(value: string) {
    goTo("subject", { class: value });
  }

  function chooseBook(value: string) {
    const book = booksQuery.data?.find((item) => item.id === value);
    if (!book) return;
    goTo("chapter", { subject: book.subject, book: book.id });
  }

  function chooseChapter(value: string) {
    goTo("tool", { chapter: value });
  }

  function chooseTool(value: string) {
    goTo("tool", { tool: value }, "replace");
  }

  function makeIt() {
    const tool = START_TOOLS.find((item) => item.id === toolId);
    if (!tool || nextStep("tool", answers) !== "generate") return;
    const handoff = new URLSearchParams({
      board: boardId,
      class: classId,
      subject,
      chapter: chapterTitle
    });
    router.push(`${tool.dashboardHref}?${handoff.toString()}`);
  }

  const subjectOptions = useMemo(() => buildSubjectOptions(booksQuery.data ?? []), [booksQuery.data]);

  if (step === "board") {
    return (
      <StepShell
        stepIndex={stepIndex}
        totalSteps={START_STEP_ORDER.length}
        title="Which board do you teach?"
        subtitle="We use this to pull the right textbooks."
        options={(boardsQuery.data ?? []).map((board) => ({ value: board.id, label: board.name, hint: board.code }))}
        onSelect={chooseBoard}
        loading={boardsQuery.isPending}
        error={boardsQuery.isError ? getErrorMessage(boardsQuery.error, "Could not load boards.") : ""}
        onRetry={() => void boardsQuery.refetch()}
        emptyMessage="No boards are available yet."
      />
    );
  }

  if (step === "class") {
    return (
      <StepShell
        stepIndex={stepIndex}
        totalSteps={START_STEP_ORDER.length}
        title="Which class?"
        options={(classesQuery.data ?? []).map((item) => ({ value: item.id, label: item.name }))}
        onSelect={chooseClass}
        loading={classesQuery.isPending}
        error={classesQuery.isError ? getErrorMessage(classesQuery.error, "Could not load classes.") : ""}
        onRetry={() => void classesQuery.refetch()}
        emptyMessage="No classes are available for this board yet."
        onBack={handleBack}
      />
    );
  }

  if (step === "subject") {
    return (
      <StepShell
        stepIndex={stepIndex}
        totalSteps={START_STEP_ORDER.length}
        title="Which subject?"
        options={subjectOptions}
        onSelect={chooseBook}
        loading={booksQuery.isPending}
        error={booksQuery.isError ? getErrorMessage(booksQuery.error, "Could not load subjects.") : ""}
        onRetry={() => void booksQuery.refetch()}
        emptyMessage="No textbooks are ingested for this class yet."
        onBack={handleBack}
      />
    );
  }

  if (step === "chapter") {
    return (
      <StepShell
        stepIndex={stepIndex}
        totalSteps={START_STEP_ORDER.length}
        title="Which chapter?"
        options={(chaptersQuery.data ?? []).map((chapter) => {
          const title = chapter.chapter_title || chapter.title || "";
          return {
            value: title,
            label: chapter.chapter_number ? `${chapter.chapter_number}. ${title}` : title
          };
        })}
        onSelect={chooseChapter}
        loading={chaptersQuery.isPending}
        error={chaptersQuery.isError ? getErrorMessage(chaptersQuery.error, "Could not load chapters.") : ""}
        onRetry={() => void chaptersQuery.refetch()}
        emptyMessage="This textbook has no chapters yet."
        onBack={handleBack}
      />
    );
  }

  return (
    <StepShell
      stepIndex={stepIndex}
      totalSteps={START_STEP_ORDER.length}
      title="What would you like to make?"
      subtitle={chapterTitle ? `From ${chapterTitle}.` : undefined}
      options={START_TOOLS.map((tool) => ({ value: tool.id, label: tool.shortName, hint: tool.description, Icon: tool.Icon }))}
      selectedValue={toolId}
      onSelect={chooseTool}
      onBack={handleBack}
      footer={
        <Button type="button" className="h-12 w-full text-base" disabled={!toolId} onClick={makeIt}>
          Make it
        </Button>
      }
    />
  );
}

// Answers a step and everything after it own — cleared when walking back to it.
const ANSWER_PARAMS_FROM: Record<StartStep, string[]> = {
  board: ["board", "class", "subject", "book", "chapter", "tool"],
  class: ["class", "subject", "book", "chapter", "tool"],
  subject: ["subject", "book", "chapter", "tool"],
  chapter: ["chapter", "tool"],
  tool: ["tool"]
};

function clampStep(requested: StartStep, furthest: StartStep): StartStep {
  return START_STEP_ORDER.indexOf(requested) > START_STEP_ORDER.indexOf(furthest) ? furthest : requested;
}

/**
 * One tap must resolve both the subject and its book. A subject with a single
 * ingested book becomes one row; a subject split across several books becomes
 * one row per book, so nothing is hidden and the step still costs one tap.
 */
function buildSubjectOptions(books: Book[]): StepOption[] {
  const bySubject = new Map<string, Book[]>();
  for (const book of books) {
    if (!book.subject) continue;
    const existing = bySubject.get(book.subject);
    if (existing) existing.push(book);
    else bySubject.set(book.subject, [book]);
  }
  return Array.from(bySubject.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([subjectName, list]) =>
      list.length === 1
        ? [{ value: list[0].id, label: subjectName }]
        : list.map((book) => ({ value: book.id, label: book.title, hint: subjectName }))
    );
}

function rememberBoard(board: Board, queryClient: ReturnType<typeof useQueryClient>) {
  localStorage.setItem(DEFAULT_BOARD_KEY, board.id);
  submitOnboarding({ board_preference: (board.code || board.name).slice(0, 30).toLowerCase() })
    .then((updated) => queryClient.setQueryData(CURRENT_USER_QUERY_KEY, updated))
    // A background preference save is not worth interrupting the corridor for —
    // the local key above is what actually prefills the generator form.
    .catch(() => undefined);
}
