import assert from "node:assert/strict";
import test from "node:test";

import {
  sanitizeContext,
  migrateLegacyContext,
  reconcileServerContext,
  type StoredPrimaryContext,
  type PrimaryTeachingContext,
} from "../../lib/primary-context-helpers.ts";

const DEFAULT_CONTEXT: PrimaryTeachingContext = {
  level: "UKG",
  subject: "English",
  theme: "My Family",
  topic: "My Family",
  language: "English",
};

test("sanitizeContext fills defaults for missing fields", () => {
  const result = sanitizeContext(null);
  assert.deepEqual(result, DEFAULT_CONTEXT);

  const partial = sanitizeContext({ level: "Class 1", subject: "Maths" });
  assert.equal(partial.level, "Class 1");
  assert.equal(partial.subject, "Maths");
  assert.equal(partial.theme, "My Family"); // default fallback
});

test("sanitizeContext drops server-only fields from the API response", () => {
  // The provider feeds the raw /primary/context payload straight in. Anything
  // extra that survives ends up on the next PUT, which the backend schema
  // rejects with extra="forbid" — a 422 on every save, silent to the teacher.
  const fromServer = sanitizeContext({
    level: "Class 1",
    subject: "Maths",
    theme: "Numbers",
    topic: "Numbers",
    language: "English",
    id: "9f1e",
    user_id: "abc",
    version: 4,
    updated_at: "2026-08-03T00:00:00Z",
  } as never);

  assert.deepEqual(Object.keys(fromServer).sort(), ["language", "level", "subject", "theme", "topic"]);
});

test("migrateLegacyContext handles schema version 1 cache objects", () => {
  const oldCache = JSON.stringify({
    level: "Class 3",
    subject: "Science",
    theme: "Plants",
    language: "English",
  });
  
  const migrated = migrateLegacyContext(oldCache, null);
  assert.ok(migrated);
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.syncStatus, "synced");
  assert.equal(migrated.context.subject, "Science");
  assert.equal(migrated.version, 1);
});

test("migrateLegacyContext handles legacy separate grade/subject keys", () => {
  const legacyStore = JSON.stringify({
    grade: "Class 5",
    subject: "EVS",
    topic: "Water Life",
  });

  const migrated = migrateLegacyContext(null, legacyStore);
  assert.ok(migrated);
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.context.level, "Class 5");
  assert.equal(migrated.context.subject, "EVS");
  assert.equal(migrated.context.theme, "Water Life");
});

test("reconcileServerContext overwrites local context when local status is synced", () => {
  const local: StoredPrimaryContext = {
    schemaVersion: 2,
    context: DEFAULT_CONTEXT,
    updatedAt: "2026-08-01T12:00:00.000Z",
    syncStatus: "synced",
    serverUpdatedAt: "2026-08-01T12:00:00.000Z",
    version: 1,
  };

  const serverVal: PrimaryTeachingContext = {
    level: "Class 2",
    subject: "EVS",
    theme: "Birds",
    language: "English",
  };
  const serverTime = "2026-08-01T13:00:00.000Z";

  const { nextEnvelope, action } = reconcileServerContext(local, serverVal, serverTime);
  assert.equal(action, "overwrite_local");
  assert.equal(nextEnvelope.context.level, "Class 2");
  assert.equal(nextEnvelope.syncStatus, "synced");
  assert.equal(nextEnvelope.serverUpdatedAt, serverTime);
});

test("reconcileServerContext triggers auto_sync when local context has unsynced changes and server matches last known sync time", () => {
  const local: StoredPrimaryContext = {
    schemaVersion: 2,
    context: {
      ...DEFAULT_CONTEXT,
      theme: "Updated Theme Locally",
    },
    updatedAt: "2026-08-01T12:05:00.000Z",
    syncStatus: "unsynced",
    serverUpdatedAt: "2026-08-01T12:00:00.000Z", // last synced time
    version: 2,
  };

  const serverVal: PrimaryTeachingContext = DEFAULT_CONTEXT;
  const serverTime = "2026-08-01T12:00:00.000Z"; // server is at last synced time (no concurrent remote edits)

  const { nextEnvelope, action } = reconcileServerContext(local, serverVal, serverTime);
  assert.equal(action, "auto_sync");
  // Local should not be overwritten
  assert.equal(nextEnvelope.context.theme, "Updated Theme Locally");
});

test("reconcileServerContext overwrites local even if unsynced when server has a newer timestamp (concurrent remote edit)", () => {
  const local: StoredPrimaryContext = {
    schemaVersion: 2,
    context: {
      ...DEFAULT_CONTEXT,
      theme: "Updated Theme Locally",
    },
    updatedAt: "2026-08-01T12:05:00.000Z",
    syncStatus: "unsynced",
    serverUpdatedAt: "2026-08-01T12:00:00.000Z",
    version: 2,
  };

  const serverVal: PrimaryTeachingContext = {
    level: "Class 1",
    subject: "Maths",
    theme: "Remote Theme Wins",
    language: "Hindi",
  };
  const serverTime = "2026-08-01T12:10:00.000Z"; // Server has newer time

  const { nextEnvelope, action } = reconcileServerContext(local, serverVal, serverTime);
  assert.equal(action, "overwrite_local");
  assert.equal(nextEnvelope.context.theme, "Remote Theme Wins");
  assert.equal(nextEnvelope.syncStatus, "synced");
  assert.equal(nextEnvelope.serverUpdatedAt, serverTime);
});
