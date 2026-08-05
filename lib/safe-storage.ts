/**
 * localStorage access that can't take a page down.
 *
 * Three real environments break a bare `window.localStorage.setItem(...)`:
 * a full quota, iOS private browsing, and any context with storage disabled —
 * where even *reading* the `localStorage` property throws a SecurityError.
 * Callers on a render or effect path must never let that reach the error
 * boundary, so every entry point here degrades to "no storage" instead.
 */
function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readStoredItem(key: string): string | null {
  try {
    return storage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** True when the value was actually persisted. */
export function writeStoredItem(key: string, value: string): boolean {
  try {
    const store = storage();
    if (!store) return false;
    store.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStoredItem(key: string): void {
  try {
    storage()?.removeItem(key);
  } catch {
    // Nothing to report — the item is unreachable either way.
  }
}

