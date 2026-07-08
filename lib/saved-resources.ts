const SAVED_KEYS_STORAGE_KEY = "teachpad_saved_resource_ids";
const INITIALIZED_STORAGE_KEY = "teachpad_saved_initialized";

export function isResourceSaved(id: string): boolean {
  if (typeof window === "undefined") return false;
  const initialized = localStorage.getItem(INITIALIZED_STORAGE_KEY) === "true";
  if (!initialized) return true; // Show all by default until initialized
  
  const stored = localStorage.getItem(SAVED_KEYS_STORAGE_KEY);
  if (!stored) return false;
  try {
    const ids = JSON.parse(stored);
    return Array.isArray(ids) && ids.includes(id);
  } catch {
    return false;
  }
}

export function saveResourceId(id: string) {
  if (typeof window === "undefined") return;
  let ids: string[] = [];
  const stored = localStorage.getItem(SAVED_KEYS_STORAGE_KEY);
  if (stored) {
    try {
      ids = JSON.parse(stored);
    } catch {}
  }
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(SAVED_KEYS_STORAGE_KEY, JSON.stringify(ids));
  }
  // Mark as initialized to enable strict filtering
  localStorage.setItem(INITIALIZED_STORAGE_KEY, "true");
}

export function initializeSavedResourceIds(allIds: string[]) {
  if (typeof window === "undefined") return;
  const initialized = localStorage.getItem(INITIALIZED_STORAGE_KEY) === "true";
  if (!initialized) {
    localStorage.setItem(SAVED_KEYS_STORAGE_KEY, JSON.stringify(allIds));
    localStorage.setItem(INITIALIZED_STORAGE_KEY, "true");
  }
}
