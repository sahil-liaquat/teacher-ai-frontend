import type { PrimaryLevel, PrimaryTodayGeneratePayload } from "@/lib/api";

export type PrimaryTeachingContext = {
  level: "Nursery" | "LKG" | "UKG" | "Class 1" | "Class 2" | "Class 3" | "Class 4" | "Class 5";
  subject: string;
  theme?: string;
  topic?: string;
  skill?: string;
  language: "English" | "Hindi" | "Bilingual";
};

export type StoredPrimaryContext = {
  schemaVersion: 2;
  context: PrimaryTeachingContext;
  updatedAt: string; // ISO string
  syncStatus: "synced" | "syncing" | "unsynced";
  serverUpdatedAt?: string;
  version: number;
};

export const PRIMARY_LEVELS = ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5"] as const;
export const PRIMARY_LANGUAGES = ["English", "Hindi", "Bilingual"] as const;

// The backend's PrimaryLevel enum is snake_case ("class_1"); this file's
// PrimaryTeachingContext.level is the Title-Case display string used across
// every Primary dropdown/UI ("Class 1"). Any call that sends `level` to the
// backend (context sync, generate) MUST go through this map — sending the
// Title-Case string straight through 422s, because PrimaryTeachingContextUpdate
// and PrimaryTodayGenerateRequest both declare `level: PrimaryLevel` as a
// Literal enum with extra="forbid". This is the single source of truth for
// the conversion; API_LEVEL_TO_PRIMARY_LEVEL below is derived from it so the
// two directions can never drift apart.
export const PRIMARY_LEVEL_TO_API: Record<PrimaryTeachingContext["level"], PrimaryLevel> = {
  Nursery: "nursery",
  LKG: "lkg",
  UKG: "ukg",
  "Class 1": "class_1",
  "Class 2": "class_2",
  "Class 3": "class_3",
  "Class 4": "class_4",
  "Class 5": "class_5",
};

const API_LEVEL_TO_PRIMARY_LEVEL = Object.fromEntries(
  (Object.entries(PRIMARY_LEVEL_TO_API) as Array<[PrimaryTeachingContext["level"], PrimaryLevel]>).map(
    ([display, api]) => [api, display] as const
  )
) as Record<PrimaryLevel, PrimaryTeachingContext["level"]>;

/**
 * Converts a backend snake_case level (as returned by GET/PUT /primary/context)
 * back to the Title-Case display value PrimaryTeachingContext expects. Falls
 * back to the input unchanged when it isn't a recognized API level, so a
 * value that is already Title-Case (e.g. a stale local cache) isn't mangled.
 */
export function apiLevelToPrimaryLevel(level: string): PrimaryTeachingContext["level"] {
  return API_LEVEL_TO_PRIMARY_LEVEL[level as PrimaryLevel] ?? (level as PrimaryTeachingContext["level"]);
}

export const CACHE_KEY = "teachpad-primary-teaching-context";
export const LEGACY_CACHE_KEY = "teachpad-primary-context";

export const DEFAULT_PRIMARY_TEACHING_CONTEXT: PrimaryTeachingContext = {
  level: "UKG",
  subject: "English",
  theme: "My Family",
  topic: "My Family",
  language: "English",
};

const VALID_LEVELS = new Set<string>(PRIMARY_LEVELS);
const VALID_LANGUAGES = new Set<string>(PRIMARY_LANGUAGES);

export function sanitizeContext(input: Partial<PrimaryTeachingContext> | null | undefined): PrimaryTeachingContext {
  const raw = input ?? {};
  // Copy the known keys ONLY — never spread the input wholesale. Callers hand
  // this the raw GET/PUT /primary/context response, which also carries
  // id/user_id/version/updated_at. Spreading those in makes them part of the
  // context, so the next PUT echoes them back at PrimaryTeachingContextUpdate
  // (extra="forbid") and every save 422s for the rest of the session.
  const base: PrimaryTeachingContext = {
    level: raw.level ?? DEFAULT_PRIMARY_TEACHING_CONTEXT.level,
    subject: raw.subject ?? DEFAULT_PRIMARY_TEACHING_CONTEXT.subject,
    theme: raw.theme,
    topic: raw.topic,
    skill: raw.skill,
    language: raw.language ?? DEFAULT_PRIMARY_TEACHING_CONTEXT.language,
  };
  if (!VALID_LEVELS.has(base.level)) base.level = DEFAULT_PRIMARY_TEACHING_CONTEXT.level;
  if (!VALID_LANGUAGES.has(base.language)) base.language = DEFAULT_PRIMARY_TEACHING_CONTEXT.language;
  const subject = base.subject?.trim();
  if (!subject) base.subject = DEFAULT_PRIMARY_TEACHING_CONTEXT.subject;
  const theme = base.theme?.trim();
  base.theme = theme || DEFAULT_PRIMARY_TEACHING_CONTEXT.theme;
  base.topic = base.topic?.trim() || base.theme;
  if (typeof base.skill === "string" && base.skill.trim()) {
    base.skill = base.skill.trim();
  } else {
    delete base.skill;
  }
  return base;
}

export function migrateLegacyContext(rawCache: string | null, rawLegacy: string | null): StoredPrimaryContext | null {
  if (rawCache) {
    try {
      const parsed = JSON.parse(rawCache);
      if (parsed && parsed.schemaVersion === 2 && parsed.context) {
        return null; // already migrated
      }
      const clean = sanitizeContext(parsed);
      return {
        schemaVersion: 2,
        context: clean,
        updatedAt: new Date().toISOString(),
        syncStatus: "synced",
        version: 1,
      };
    } catch {
      // ignore
    }
  }

  if (rawLegacy) {
    try {
      const legacy = JSON.parse(rawLegacy) as { grade?: string; subject?: string; topic?: string };
      if (legacy.grade || legacy.subject || legacy.topic) {
        const migratedContext = sanitizeContext({
          level: (PRIMARY_LEVELS as readonly string[]).includes(legacy.grade ?? "")
            ? (legacy.grade as PrimaryTeachingContext["level"])
            : undefined,
          subject: legacy.subject || undefined,
          theme: legacy.topic || undefined,
          topic: legacy.topic || undefined,
        });
        return {
          schemaVersion: 2,
          context: migratedContext,
          updatedAt: new Date().toISOString(),
          syncStatus: "synced",
          version: 1,
        };
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export function reconcileServerContext(
  latestEnvelope: StoredPrimaryContext,
  serverContext: PrimaryTeachingContext,
  serverTime: string
): { nextEnvelope: StoredPrimaryContext; action: "overwrite_local" | "auto_sync" | "none" } {
  if (latestEnvelope.syncStatus === "synced") {
    return {
      nextEnvelope: {
        schemaVersion: 2,
        context: sanitizeContext(serverContext),
        updatedAt: serverTime,
        syncStatus: "synced",
        serverUpdatedAt: serverTime,
        version: latestEnvelope.version,
      },
      action: "overwrite_local",
    };
  }

  if (serverTime !== latestEnvelope.serverUpdatedAt) {
    // Server was updated elsewhere; overwrite local
    return {
      nextEnvelope: {
        schemaVersion: 2,
        context: sanitizeContext(serverContext),
        updatedAt: serverTime,
        syncStatus: "synced",
        serverUpdatedAt: serverTime,
        version: latestEnvelope.version,
      },
      action: "overwrite_local",
    };
  }

  // Server has same sync time; local edits are newer. Auto-sync them once.
  return {
    nextEnvelope: latestEnvelope,
    action: "auto_sync",
  };
}

/**
 * Builds the generate payload, or null when the context is not complete enough
 * to produce a day. Pure so the guard is testable without a component.
 */
export function buildGeneratePayload(
  context: PrimaryTeachingContext,
  themeId: string,
  date: string,
  replace: boolean
): PrimaryTodayGeneratePayload | null {
  if (!themeId || !context.subject || !context.level) return null;
  return {
    date,
    level: PRIMARY_LEVEL_TO_API[context.level],
    subject: context.subject,
    theme_id: themeId,
    language: context.language || "English",
    replace,
  };
}
