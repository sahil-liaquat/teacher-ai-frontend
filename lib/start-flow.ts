export type StartStep = "board" | "class" | "subject" | "chapter" | "tool";

export type StartAnswers = {
  boardId?: string;
  classId?: string;
  subjectId?: string;
  bookId?: string;
  chapterId?: string;
  tool?: string;
};

const ORDER: StartStep[] = ["board", "class", "subject", "chapter", "tool"];

const SATISFIED: Record<StartStep, (a: StartAnswers) => boolean> = {
  board: (a) => Boolean(a.boardId),
  class: (a) => Boolean(a.classId),
  // Choosing a subject resolves the book, as the generator forms already do.
  subject: (a) => Boolean(a.subjectId && a.bookId),
  chapter: (a) => Boolean(a.chapterId),
  tool: (a) => Boolean(a.tool)
};

/** The step to show after *current*, or "generate" when everything is answered. */
export function nextStep(current: StartStep, answers: StartAnswers): StartStep | "generate" {
  if (!SATISFIED[current](answers)) return current;
  const index = ORDER.indexOf(current);
  return index === ORDER.length - 1 ? "generate" : ORDER[index + 1];
}

export const START_STEP_ORDER = ORDER;

export function isStartStep(value: string | null | undefined): value is StartStep {
  return ORDER.includes(value as StartStep);
}

/** The furthest step the answers so far can legitimately reach. */
export function furthestReachableStep(answers: StartAnswers): StartStep {
  let step: StartStep = "board";
  for (;;) {
    const candidate = nextStep(step, answers);
    if (candidate === "generate" || candidate === step) return step;
    step = candidate;
  }
}
