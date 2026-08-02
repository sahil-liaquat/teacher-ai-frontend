import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGeneratePayload,
  PRIMARY_LEVEL_TO_API,
  type PrimaryTeachingContext,
} from "../../lib/primary-context-helpers.ts";

// `context.level` is the Title-Case display string used across the whole
// Primary UI ("Class 1", "UKG", ...) — NOT the backend's snake_case enum. A
// context fixture with an already-lowercase level (e.g. "nursery") would
// never exercise the level conversion buildGeneratePayload is responsible
// for, so this fixture deliberately uses the real Title-Case shape.
const ctx: PrimaryTeachingContext = {
  level: "Class 1",
  subject: "EVS",
  theme: "My Family",
  topic: "My Family",
  language: "English",
};

test("buildGeneratePayload carries the theme id, not the theme name", () => {
  // The server resolves a published lesson by theme_id. Sending a name would
  // 404 for every theme whose display string does not round-trip.
  const payload = buildGeneratePayload(ctx, "theme-uuid-1", "2026-08-03", false);
  assert.equal(payload?.theme_id, "theme-uuid-1");
  assert.equal(payload?.date, "2026-08-03");
  assert.equal(payload?.subject, "EVS");
});

test("buildGeneratePayload converts the Title-Case context level to the backend's snake_case enum", () => {
  // context.level is "Class 1" (PrimaryTeachingContext, display string). The
  // backend's PrimaryTodayGenerateRequest.level is Literal["nursery", "lkg",
  // "ukg", "class_1", ...] with extra="forbid" — sending "Class 1" straight
  // through 422s on every single request.
  const payload = buildGeneratePayload(ctx, "theme-uuid-1", "2026-08-03", false);
  assert.equal(payload?.level, "class_1");
});

test("buildGeneratePayload converts every Primary level to its backend enum value", () => {
  for (const [displayLevel, apiLevel] of Object.entries(PRIMARY_LEVEL_TO_API)) {
    const payload = buildGeneratePayload(
      { ...ctx, level: displayLevel as PrimaryTeachingContext["level"] },
      "theme-uuid-1",
      "2026-08-03",
      false
    );
    assert.equal(payload?.level, apiLevel, `${displayLevel} should map to ${apiLevel}`);
  }
});

test("buildGeneratePayload defaults replace to false", () => {
  assert.equal(buildGeneratePayload(ctx, "t1", "2026-08-03", false)?.replace, false);
});

test("buildGeneratePayload sets replace for an explicit regenerate", () => {
  // Regenerate is the ONLY thing that clears a day. It happens server-side in
  // one transaction, replacing the old client sequence of N deletes + a create.
  assert.equal(buildGeneratePayload(ctx, "t1", "2026-08-03", true)?.replace, true);
});

test("buildGeneratePayload falls back to English when the context has no language", () => {
  const payload = buildGeneratePayload({ ...ctx, language: "" as PrimaryTeachingContext["language"] }, "t1", "2026-08-03", false);
  assert.equal(payload?.language, "English");
});

test("buildGeneratePayload returns null when the context has no subject", () => {
  // Generating without a subject would 404 on the server; catching it here
  // keeps the button disabled instead of firing a doomed request.
  assert.equal(buildGeneratePayload({ ...ctx, subject: "" }, "t1", "2026-08-03", false), null);
});

test("buildGeneratePayload returns null when no theme is selected", () => {
  assert.equal(buildGeneratePayload(ctx, "", "2026-08-03", false), null);
});
