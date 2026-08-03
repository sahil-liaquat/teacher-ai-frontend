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
const CHOSEN_KEY = "primary-selected-section-chosen";

export function usePrimarySection(): {
  sectionId: string | null;
  /** `deliberate: false` records the selection without marking it as the
   *  teacher's own choice — for the caller that auto-selects a default. */
  setSectionId: (next: string | null, deliberate?: boolean) => void;
  /** True once the teacher has picked a group themselves — the auto-default
   *  must never override a deliberate choice, including "no class". */
  hasChosen: boolean;
} {
  // Starts null on both server and client, then reads storage after mount:
  // reading localStorage during render would produce a hydration mismatch.
  const [sectionId, setSectionIdState] = useState<string | null>(null);
  const [hasChosen, setHasChosen] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setSectionIdState(stored);
      // A teacher who explicitly picked "All children" stores no section id,
      // which is indistinguishable from "never picked anything" — hence the
      // separate flag, so the default-to-first-class rule doesn't fight them.
      if (window.localStorage.getItem(CHOSEN_KEY) === "1") setHasChosen(true);
    } catch {
      // Private-mode Safari throws on localStorage access. The section-less
      // day is a correct fallback, so there is nothing to report.
    }
  }, []);

  const setSectionId = useCallback((next: string | null, deliberate = true) => {
    setSectionIdState(next);
    if (deliberate) setHasChosen(true);
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, next);
      else window.localStorage.removeItem(STORAGE_KEY);
      if (deliberate) window.localStorage.setItem(CHOSEN_KEY, "1");
    } catch {
      // See above.
    }
  }, []);

  return { sectionId, setSectionId, hasChosen };
}
