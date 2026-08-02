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
  const base: PrimaryTeachingContext = { ...DEFAULT_PRIMARY_TEACHING_CONTEXT, ...(input ?? {}) };
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
