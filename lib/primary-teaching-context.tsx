"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from "react";
import { apiFetch } from "@/lib/api";
import {
  type PrimaryTeachingContext,
  type StoredPrimaryContext,
  PRIMARY_LEVELS,
  PRIMARY_LANGUAGES,
  CACHE_KEY,
  LEGACY_CACHE_KEY,
  DEFAULT_PRIMARY_TEACHING_CONTEXT,
  PRIMARY_LEVEL_TO_API,
  apiLevelToPrimaryLevel,
  sanitizeContext,
  migrateLegacyContext,
  reconcileServerContext,
} from "./primary-context-helpers";
import { themesForSubject, subjectsForClass, skillsForContext } from "./primary-theme-content";

export type { PrimaryTeachingContext, StoredPrimaryContext };
export { PRIMARY_LEVELS, PRIMARY_LANGUAGES, CACHE_KEY, LEGACY_CACHE_KEY, DEFAULT_PRIMARY_TEACHING_CONTEXT };

// GET/PUT /primary/context return `updated_at` (PrimaryTeachingContextRead).
// `new Date(undefined).toISOString()` throws RangeError, not NaN — when the
// field went missing, that throw landed in the catch blocks below and every
// successful save was reported to the user as "unsynced". Degrade instead.
function serverTimestamp(raw: unknown): string {
  const parsed = new Date(typeof raw === "string" ? raw : NaN);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function readCachedEnvelope(): StoredPrimaryContext {
  if (typeof window === "undefined") {
    return {
      schemaVersion: 2,
      context: DEFAULT_PRIMARY_TEACHING_CONTEXT,
      updatedAt: new Date(0).toISOString(),
      syncStatus: "synced",
      version: 1,
    };
  }

  try {
    const rawCache = window.localStorage.getItem(CACHE_KEY);
    const rawLegacy = window.localStorage.getItem(LEGACY_CACHE_KEY);
    const migrated = migrateLegacyContext(rawCache, rawLegacy);
    if (migrated) {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(migrated));
      if (rawLegacy) window.localStorage.removeItem(LEGACY_CACHE_KEY);
      return migrated;
    }

    if (rawCache) {
      const parsed = JSON.parse(rawCache);
      if (parsed && parsed.schemaVersion === 2 && parsed.context) {
        return {
          schemaVersion: 2,
          context: sanitizeContext(parsed.context),
          updatedAt: parsed.updatedAt || new Date(0).toISOString(),
          syncStatus: parsed.syncStatus || "synced",
          serverUpdatedAt: parsed.serverUpdatedAt,
          version: typeof parsed.version === "number" ? parsed.version : 1,
        };
      }
    }
  } catch {
    window.localStorage.removeItem(CACHE_KEY);
  }

  const defaultEnvelope: StoredPrimaryContext = {
    schemaVersion: 2,
    context: DEFAULT_PRIMARY_TEACHING_CONTEXT,
    updatedAt: new Date(0).toISOString(),
    syncStatus: "synced",
    version: 1,
  };
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(defaultEnvelope));
  return defaultEnvelope;
}

type PrimaryTeachingContextValue = {
  context: PrimaryTeachingContext;
  isLoading: boolean;
  contextKey: string;
  syncStatus: "synced" | "syncing" | "unsynced";
  updateContext: (next: Partial<PrimaryTeachingContext>) => Promise<boolean>;
  resetContext: () => Promise<boolean>;
  retrySync: () => Promise<boolean>;
};

const PrimaryContext = createContext<PrimaryTeachingContextValue | null>(null);

export function PrimaryTeachingContextProvider({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<PrimaryTeachingContext>(DEFAULT_PRIMARY_TEACHING_CONTEXT);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "unsynced">("synced");
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [serverUpdatedAt, setServerUpdatedAt] = useState<string | undefined>(undefined);
  const [version, setVersion] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);

  const latestVersionRef = useRef<number>(1);
  const syncRequestInProgress = useRef<boolean>(false);
  const autoSyncAttempted = useRef<boolean>(false);

  const persist = useCallback(async (nextContext: PrimaryTeachingContext, versionToSync: number): Promise<boolean> => {
    if (syncRequestInProgress.current) {
      return false;
    }
    syncRequestInProgress.current = true;

    try {
      // The backend's PrimaryTeachingContextUpdate.level is a snake_case
      // Literal enum ("class_1", ...), not this file's Title-Case display
      // string ("Class 1") — convert on the way out or every save 422s.
      const saved = await apiFetch<{ updated_at: string } & PrimaryTeachingContext>("/primary/context", {
        method: "PUT",
        body: JSON.stringify({ ...nextContext, level: PRIMARY_LEVEL_TO_API[nextContext.level] }),
        redirectOnUnauthorized: false,
      });

      if (versionToSync === latestVersionRef.current) {
        // ...and the response comes back with that same snake_case level, so
        // convert on the way in too or sanitizeContext silently rejects it
        // and resets the level to the default.
        const clean = sanitizeContext({ ...saved, level: apiLevelToPrimaryLevel(saved.level) });
        const serverTime = serverTimestamp(saved.updated_at);

        setContext(clean);
        setSyncStatus("synced");
        setServerUpdatedAt(serverTime);
        setUpdatedAt(serverTime);

        const envelope: StoredPrimaryContext = {
          schemaVersion: 2,
          context: clean,
          updatedAt: serverTime,
          syncStatus: "synced",
          serverUpdatedAt: serverTime,
          version: versionToSync,
        };
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(envelope));
      }
      return true;
    } catch (error) {
      console.error("Could not save Primary teaching context", error);
      if (versionToSync === latestVersionRef.current) {
        setSyncStatus("unsynced");
        const currentEnvelope = readCachedEnvelope();
        if (currentEnvelope && currentEnvelope.version === versionToSync) {
          currentEnvelope.syncStatus = "unsynced";
          window.localStorage.setItem(CACHE_KEY, JSON.stringify(currentEnvelope));
        }
      }
      return false;
    } finally {
      syncRequestInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const stored = readCachedEnvelope();

    setContext(stored.context);
    setSyncStatus(stored.syncStatus);
    setUpdatedAt(stored.updatedAt);
    setServerUpdatedAt(stored.serverUpdatedAt);
    setVersion(stored.version);
    latestVersionRef.current = stored.version;

    apiFetch<{ updated_at: string } & PrimaryTeachingContext | null>("/primary/context", { redirectOnUnauthorized: false })
      .then((saved) => {
        if (cancelled || !saved) {
          setIsLoading(false);
          return;
        }

        const serverTime = serverTimestamp(saved.updated_at);
        const latestEnvelope = readCachedEnvelope();
        // Same snake_case-vs-Title-Case mismatch as persist()'s response above.
        const resolvedContext: PrimaryTeachingContext = { ...saved, level: apiLevelToPrimaryLevel(saved.level) };
        const { nextEnvelope, action } = reconcileServerContext(latestEnvelope, resolvedContext, serverTime);

        if (action === "overwrite_local") {
          setContext(nextEnvelope.context);
          setSyncStatus("synced");
          setServerUpdatedAt(nextEnvelope.serverUpdatedAt);
          setUpdatedAt(nextEnvelope.updatedAt);
          window.localStorage.setItem(CACHE_KEY, JSON.stringify(nextEnvelope));
        } else if (action === "auto_sync") {
          if (!autoSyncAttempted.current) {
            autoSyncAttempted.current = true;
            void persist(latestEnvelope.context, latestEnvelope.version);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSyncStatus((curr) => (curr === "syncing" ? "unsynced" : curr));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [persist]);

  const updateContext = useCallback(
    async (next: Partial<PrimaryTeachingContext>) => {
      const updated = { ...context, ...next };

      // These cascades exist to drop values that the change just made STALE.
      // A field the caller passed in this same call is not stale — it is the
      // teacher's actual choice. Clearing it anyway means a caller that sets
      // level+subject+theme together (the Today setup modal, the home card's
      // "View full plan") loses the theme it just picked and gets whatever
      // themesForSubject() happens to list first backfilled in its place.

      // 1. Class (level) changes
      if (next.level && next.level !== context.level) {
        const validSubjects = subjectsForClass(next.level);
        // Only rescue a subject the caller left alone. subjectsForClass is a
        // static list and the curriculum has since outgrown it (EVS is
        // published for UKG but missing from its entry), so overriding an
        // explicit subject here silently teaches the wrong one.
        if (next.subject === undefined && !validSubjects.includes(updated.subject)) {
          updated.subject = validSubjects[0];
        }
        if (next.theme === undefined) updated.theme = undefined;
        if (next.topic === undefined) updated.topic = undefined;
        if (next.skill === undefined) updated.skill = undefined;
      }

      // 2. Subject changes
      if (next.subject && next.subject !== context.subject) {
        if (next.theme === undefined) updated.theme = undefined;
        if (next.topic === undefined) updated.topic = undefined;
        if (next.skill === undefined) updated.skill = undefined;
      }

      // 3. Theme changes
      if (next.theme && next.theme !== context.theme) {
        updated.topic = next.theme;
        updated.skill = undefined;
      }

      const merged = sanitizeContext(updated);

      // Backfill default theme if cleared/invalidated
      if (!merged.theme) {
        const themes = themesForSubject(merged.subject);
        merged.theme = themes[0] || "My Family";
        merged.topic = merged.theme;
      }

      // Validate skill if present
      if (merged.skill) {
        const validSkills = skillsForContext(merged.level, merged.subject, merged.theme);
        if (!validSkills.includes(merged.skill)) {
          merged.skill = undefined;
        }
      }

      const nextVersion = version + 1;
      const nextUpdatedAt = new Date().toISOString();

      setContext(merged);
      setSyncStatus("syncing");
      setUpdatedAt(nextUpdatedAt);
      setVersion(nextVersion);
      latestVersionRef.current = nextVersion;

      const envelope: StoredPrimaryContext = {
        schemaVersion: 2,
        context: merged,
        updatedAt: nextUpdatedAt,
        syncStatus: "syncing",
        serverUpdatedAt,
        version: nextVersion,
      };
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(envelope));

      return persist(merged, nextVersion);
    },
    [context, version, serverUpdatedAt, persist]
  );

  const resetContext = useCallback(() => updateContext(DEFAULT_PRIMARY_TEACHING_CONTEXT), [updateContext]);

  const retrySync = useCallback(async (): Promise<boolean> => {
    if (syncStatus !== "unsynced") {
      return false;
    }
    const nextVersion = version + 1;
    const nextUpdatedAt = new Date().toISOString();

    setSyncStatus("syncing");
    setUpdatedAt(nextUpdatedAt);
    setVersion(nextVersion);
    latestVersionRef.current = nextVersion;

    const envelope: StoredPrimaryContext = {
      schemaVersion: 2,
      context,
      updatedAt: nextUpdatedAt,
      syncStatus: "syncing",
      serverUpdatedAt,
      version: nextVersion,
    };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(envelope));

    return persist(context, nextVersion);
  }, [context, syncStatus, version, serverUpdatedAt, persist]);

  const contextKey = useMemo(
    () => `${context.level}|${context.subject}|${context.theme ?? ""}`,
    [context.level, context.subject, context.theme]
  );

  const value = useMemo<PrimaryTeachingContextValue>(
    () => ({ context, isLoading, contextKey, syncStatus, updateContext, resetContext, retrySync }),
    [context, isLoading, contextKey, syncStatus, updateContext, resetContext, retrySync]
  );

  return <PrimaryContext.Provider value={value}>{children}</PrimaryContext.Provider>;
}

export function usePrimaryTeachingContext() {
  const value = useContext(PrimaryContext);
  if (!value) throw new Error("usePrimaryTeachingContext must be used inside PrimaryTeachingContextProvider");
  return value;
}
