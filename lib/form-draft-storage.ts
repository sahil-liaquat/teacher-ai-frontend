const TOOL_DRAFT_PREFIX = "teacher_ai_tool_draft_";

type DraftRecord<T> = {
  value: T;
  savedAt: number;
};

export function readToolDraft<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`${TOOL_DRAFT_PREFIX}${key}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<DraftRecord<T>>;
    return parsed && "value" in parsed ? parsed.value as T : null;
  } catch {
    window.localStorage.removeItem(`${TOOL_DRAFT_PREFIX}${key}`);
    return null;
  }
}

export function saveToolDraft<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  const record: DraftRecord<T> = { value, savedAt: Date.now() };
  window.localStorage.setItem(`${TOOL_DRAFT_PREFIX}${key}`, JSON.stringify(record));
}
