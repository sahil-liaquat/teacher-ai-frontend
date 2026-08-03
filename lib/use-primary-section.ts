"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "primary-selected-section";

/**
 * The class the teacher is currently planning for, or null for the
 * section-less day every teacher gets by default.
 *
 * localStorage, not the server-side teaching context: adding a field to
 * primary_teaching_contexts would mean a migration and a version bump on a
 * record the whole Primary UI reads on every page, for a preference that is
 * per-device anyway.
 */
export function usePrimarySection(): {
  sectionId: string | null;
  setSectionId: (next: string | null) => void;
} {
  // Starts null on both server and client, then reads storage after mount:
  // reading localStorage during render would produce a hydration mismatch.
  const [sectionId, setSectionIdState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setSectionIdState(stored);
    } catch {
      // Private-mode Safari throws on localStorage access. The section-less
      // day is a correct fallback, so there is nothing to report.
    }
  }, []);

  const setSectionId = useCallback((next: string | null) => {
    setSectionIdState(next);
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, next);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // See above.
    }
  }, []);

  return { sectionId, setSectionId };
}
