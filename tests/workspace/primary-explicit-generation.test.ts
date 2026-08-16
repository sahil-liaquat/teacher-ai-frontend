import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import {
  buildGeneratePayload,
  type PrimaryTeachingContext,
} from "../../lib/primary-context-helpers.ts";

// A teacher opened TeachPad on a Sunday, clicked "Change classroom", chose
// Nursery → Animals → Farm Animals → Cow and pressed Generate — and was told
// "No teaching scheduled today." The calendar had refused a question nobody
// asked it. The calendar governs what is DELIVERED automatically; it does not
// govern what a teacher may CREATE.

const ctx: PrimaryTeachingContext = {
  level: "Nursery",
  subject: "EVS",
  theme: "Animals",
  topic: "Cow",
  language: "English",
};

const read = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const today = read("components/primary/pages/primary-today-page.tsx");
const home = read("components/primary/pages/primary-home-page.tsx");
const modal = read("components/primary/pages/primary-plan-setup-modal.tsx");

// ── The payload carries who asked ───────────────────────────────────────────

test("a payload with no stated intent is automatic", () => {
  // ⚠ The restrictive default. An older build, a script, anything calling this
  // unattended keeps the full quota protection — permission is asked for, never
  // assumed.
  assert.equal(buildGeneratePayload(ctx, "theme-1", "2026-08-16", false)?.intent, "automatic");
});

test("an explicit payload says so", () => {
  assert.equal(
    buildGeneratePayload(ctx, "theme-1", "2026-08-16", false, "topic-1", "explicit")?.intent,
    "explicit",
  );
});

test("an explicit payload still carries the teacher's own curriculum selection", () => {
  // The explicit path resolves by class/theme/topic, NOT by a calendar
  // coordinate — so these three fields are the whole request.
  const payload = buildGeneratePayload(ctx, "theme-1", "2026-08-16", false, "topic-1", "explicit");
  assert.equal(payload?.level, "nursery");
  assert.equal(payload?.theme_id, "theme-1");
  assert.equal(payload?.topic_id, "topic-1");
});

test("an explicit payload keeps the date the teacher is on", () => {
  // ⚠ 2026-08-16 must not become 2026-08-17. Silently rewriting the date would
  // handn the teacher a day they never asked for and could overwrite a plan
  // already sitting on Monday.
  const payload = buildGeneratePayload(ctx, "theme-1", "2026-08-16", false, "topic-1", "explicit");
  assert.equal(payload?.date, "2026-08-16");
});

// ── The Today page blocks only the automatic path ───────────────────────────

test("the non-teaching guard applies to automatic generation only", () => {
  assert.match(
    today,
    /if \(intent === "automatic" && date === selectedDate && teachingStatus\?\.blocks_generation\)/,
  );
});

test("every teacher-triggered generation on the Today page is explicit", () => {
  // "View full plan", the setup modal, and "Sync from Curriculum" are all
  // things a teacher clicked. None of them is the app resolving today.
  const explicitCalls = today.match(/intent: "explicit"/g) ?? [];
  assert.equal(explicitCalls.length, 3, "expected all three teacher call sites to be explicit");
});

test("runGenerate defaults to automatic, so a new call site is safe by omission", () => {
  assert.match(today, /intent = "automatic",/);
});

// ── The workflow is reachable on a closed day ───────────────────────────────

test("the non-teaching card offers the explicit setup flow", () => {
  const card = today.slice(
    today.indexOf('viewState === "no-teaching"'),
    today.indexOf('viewState === "empty"'),
  );
  assert.match(card, /Set up today&apos;s plan/);
  assert.match(card, /setSetupOpen\(true\)/);
});

test("the non-teaching card is still not an error", () => {
  // The calm state stays calm — adding a way forward must not turn it red.
  const card = today.slice(
    today.indexOf('viewState === "no-teaching"'),
    today.indexOf('viewState === "empty"'),
  );
  assert.doesNotMatch(card, /rose-|red-/);
  assert.match(card, /No teaching scheduled today\./);
});

test("the dashboard's closed-day card offers the same flow", () => {
  assert.match(home, /Set up today&apos;s plan anyway/);
});

test("the dashboard's Change classroom generates explicitly", () => {
  assert.match(home, /"explicit",\n\s*\);/);
});

// ── The selection cascade never depended on the date ────────────────────────

test("the setup modal gates its selects on the previous choice, not on the date", () => {
  // Class → Theme → Subtheme → Topic. If any of these were gated on the
  // calendar, the form would be unusable on the very day a teacher has time to
  // fill it in.
  assert.doesNotMatch(modal, /teaching_status|blocks_generation|is_teaching_day/);
  assert.match(modal, /disabled=\{!selectedTheme\}/);
  assert.match(modal, /disabled=\{!selectedTheme \|\| topicOptions\.length === 0\}/);
});

test("the modal opens from the closed-day state without a date check", () => {
  assert.doesNotMatch(
    today.slice(today.indexOf("<PrimaryPlanSetupModal")),
    /blocks_generation/,
  );
});

// ── The plan a teacher built on a closed day is presented as theirs ─────────

test("a plan built on a closed day is explained, not warned about", () => {
  assert.match(today, /closedForTeaching && viewState === "plan"/);
  assert.match(today, /You built this plan yourself/);
  const notice = today.slice(
    today.indexOf('closedForTeaching && viewState === "plan"'),
    today.indexOf('viewState === "loading" ?'),
  );
  assert.doesNotMatch(notice, /rose-|red-|error/i);
});
