"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "primary-selected-section";
const CHOSEN_KEY = "primary-selected-section-chosen";

export function usePrimarySection(): {
  sectionId: string | null;
  setSectionId: (next: string | null, deliberate?: boolean) => void;
  hasChosen: boolean;
} {
  const [sectionId, setSectionIdState] = useState<string | null>(null);
  const [hasChosen, setHasChosen] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setSectionIdState(stored);
      if (window.localStorage.getItem(CHOSEN_KEY) === "1") setHasChosen(true);
    } catch {
      // The section-less day is the safe fallback when storage is unavailable.
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
      // The in-memory selection remains usable for this session.
    }
  }, []);

  return { sectionId, setSectionId, hasChosen };
}
