export const WORKSHEET_STORAGE_PREFIX = "teacher_ai_worksheet_";
export const WORKSHEET_STORAGE_EVENT = "teacher-ai-worksheet-updated";

export function saveWorksheetGeneration(generation: any) {
  if (typeof window === "undefined" || !generation?.id) return;
  window.localStorage.setItem(`${WORKSHEET_STORAGE_PREFIX}${generation.id}`, JSON.stringify(generation));
  window.dispatchEvent(new CustomEvent(WORKSHEET_STORAGE_EVENT, { detail: generation }));
}

export function getWorksheetGeneration(id: string) {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(`${WORKSHEET_STORAGE_PREFIX}${id}`);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function listWorksheetGenerations() {
  if (typeof window === "undefined") return [];
  const items: any[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(WORKSHEET_STORAGE_PREFIX)) continue;
    const stored = window.localStorage.getItem(key);
    if (!stored) continue;
    try {
      const generation = JSON.parse(stored);
      if (generation?.id && generation?.output_json) items.push(generation);
    } catch {
    }
  }
  return items.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
}

export function deleteWorksheetGeneration(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(`${WORKSHEET_STORAGE_PREFIX}${id}`);
  window.dispatchEvent(new CustomEvent(WORKSHEET_STORAGE_EVENT, { detail: { id } }));
}

export function clearAllWorksheetGenerations() {
  if (typeof window === "undefined") return;
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(WORKSHEET_STORAGE_PREFIX)) {
      window.localStorage.removeItem(key);
    }
  }
  window.dispatchEvent(new CustomEvent(WORKSHEET_STORAGE_EVENT, { detail: {} }));
}