import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  ACADEMIC_STAGES,
  SETTINGS_AREAS,
  TERMINOLOGY_KEYS,
  activeStage,
  reachableStages,
  settingsArea,
} from "../../lib/school-admin-settings.ts";
import { vocabularyFrom } from "../../lib/school-admin-levels.ts";

/**
 * Settings as progressive disclosure, and fully functional.
 *
 * The old design listed seven sections permanently, with no indication of what
 * was inside any of them — and three had no controls at all, so finding that
 * out cost a navigation each. Two of the seven were worse than empty: School
 * Profile pointed at TeachPad support, and Terminology saved values nothing
 * read.
 */

const ROOT = new URL("../../", import.meta.url);

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, ROOT), "utf8");
}

const WORKSPACE = "components/school-admin/settings/settings-workspace.tsx";

// ── Disclosure ──────────────────────────────────────────────────────────────

test("availability is declared per area, so the index can state it before the click", () => {
  for (const area of SETTINGS_AREAS) {
    assert.ok(
      ["configurable", "read_only", "unavailable"].includes(area.availability),
      `${area.key} must declare what is behind it`,
    );
    assert.ok(area.purpose.length > 10, `${area.key} must say what it decides`);
  }
});

test("an area with nothing behind it is not a link", () => {
  const workspace = source(WORKSPACE);
  // Putting a dead end behind a click is the defect this replaces.
  assert.ok(
    workspace.includes('area.availability === "unavailable" ? ('),
    "an unavailable area must render as inert",
  );
  assert.ok(workspace.includes("Not available yet"), "and must say so on the card");
});

test("read-only is distinguished from unavailable", () => {
  // Roles are real and fixed in this release; Integrations do not exist. An
  // admin deciding who can do what needs to know which they are looking at.
  assert.equal(settingsArea("roles")?.availability, "read_only");
  assert.equal(settingsArea("integrations")?.availability, "unavailable");
  assert.ok(source(WORKSPACE).includes("View only"));
});

test("opening an area shows that area and nothing else", () => {
  const workspace = source(WORKSPACE);
  assert.ok(workspace.includes("if (!area) return <SettingsIndex"), "no area means the index");
  assert.ok(workspace.includes("All settings"), "an open area must offer a way back");
});

test("deep links into a section still work", () => {
  // `?section=<key>` is linked from the levels card and from setup.
  const workspace = source(WORKSPACE);
  assert.ok(workspace.includes('params.get("section")'));
  assert.ok(workspace.includes("?section=${key}"));
  for (const key of ["profile", "academic", "calendar", "curriculum", "roles"]) {
    assert.ok(settingsArea(key), `?section=${key} must still resolve`);
  }
});

test("an unknown section falls back to the index rather than a blank page", () => {
  assert.equal(settingsArea("nonsense"), undefined);
  assert.equal(settingsArea(null), undefined);
});

// ── The index reports real state ────────────────────────────────────────────

test("the index summarises each area with real values, not a generic label", () => {
  const workspace = source(WORKSPACE);
  assert.ok(workspace.includes("function summary("), "each area must report its own state");
  // "Configured" tells an admin nothing they can act on.
  assert.ok(!/return "Configured"/.test(workspace));
  // Phrases that split across a singular/plural template expression are matched
  // on their stable half.
  for (const value of ["is current", "No framework chosen yet", "renamed"]) {
    assert.ok(workspace.includes(value), `the summary must be able to say: ${value}`);
  }
});

test("areas with an outstanding decision are flagged on the index", () => {
  const workspace = source(WORKSPACE);
  assert.ok(workspace.includes("function needsAttention("));
  assert.ok(workspace.includes("Needs attention"));
});

// ── Academic setup is gated by real dependencies ────────────────────────────

test("academic stages unlock in the order the server actually accepts", () => {
  // The service refuses programmes without a framework and levels without an
  // enabled programme. Showing all three at once would offer forms the API
  // rejects.
  assert.deepEqual(
    reachableStages({ hasFramework: false, hasProgramme: false }),
    { framework: true, programmes: false, levels: false },
  );
  assert.deepEqual(
    reachableStages({ hasFramework: true, hasProgramme: false }),
    { framework: true, programmes: true, levels: false },
  );
  assert.deepEqual(
    reachableStages({ hasFramework: true, hasProgramme: true }),
    { framework: true, programmes: true, levels: true },
  );
});

test("every locked stage explains what unlocks it", () => {
  for (const stage of ACADEMIC_STAGES) {
    if (stage.key === "framework") continue;
    assert.ok(stage.blockedReason.length > 20, `${stage.key} must say why it is locked`);
  }
});

test("the open stage is the first unmet one", () => {
  assert.equal(activeStage({ hasFramework: false, hasProgramme: false, hasLevel: false }), "framework");
  assert.equal(activeStage({ hasFramework: true, hasProgramme: false, hasLevel: false }), "programmes");
  assert.equal(activeStage({ hasFramework: true, hasProgramme: true, hasLevel: false }), "levels");
});

test("a fully configured school lands on levels, the stage it revisits", () => {
  assert.equal(activeStage({ hasFramework: true, hasProgramme: true, hasLevel: true }), "levels");
});

// ── School profile is genuinely editable now ────────────────────────────────

test("school profile is a real form, not a referral to support", () => {
  const workspace = source(WORKSPACE);
  assert.ok(workspace.includes("schoolAdminUpdateSchoolProfile"), "it must write");
  // ⚠ Absence checks read CODE. The file's own comment explains what was
  // replaced by naming it, and a raw-source check flags that explanation.
  const code = workspace.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.ok(!code.includes("NotConfigurableYet"), "no area may still be a placeholder panel");
  assert.ok(!/edited by TeachPad support/.test(code), "the referral to support must be gone");
});

test("the profile form never offers commercial or platform state", () => {
  const workspace = source(WORKSPACE);
  const fields = workspace.slice(workspace.indexOf("const fields:"), workspace.indexOf("];", workspace.indexOf("const fields:")));
  for (const forbidden of ["plan", "subscription", "entitlement", "school_code"]) {
    assert.ok(!fields.includes(forbidden), `${forbidden} must not be editable`);
  }
  // The code is shown, explained, and locked.
  assert.ok(workspace.includes("school_code"), "the code should be visible");
  assert.ok(workspace.includes("cannot be changed here"));
});

test("the wire type makes the read/write asymmetry explicit", () => {
  const api = source("lib/api.ts");
  assert.ok(
    api.includes('Partial<Omit<SchoolProfile, "school_code">>'),
    "the update shape must exclude the identifier",
  );
});

// ── Terminology actually works ──────────────────────────────────────────────

test("terminology applies even when no programme has resolved", () => {
  // It used to short-circuit to the compiled vocabulary, so a school that
  // renamed "level" to "Year" kept seeing "level" until a programme resolved —
  // a setting that works only under a condition the admin cannot see.
  const vocabulary = vocabularyFrom(undefined, { level: "Year", lesson: "Period", theme: "Unit" });
  assert.equal(vocabulary.levelNoun, "Year");
  assert.equal(vocabulary.lessonNoun, "Period");
  assert.equal(vocabulary.labelFor("theme"), "Unit");
});

test("terminology with no overrides leaves the compiled vocabulary intact", () => {
  const vocabulary = vocabularyFrom(undefined, undefined);
  assert.equal(vocabulary.source, "fallback");
  assert.ok(vocabulary.nodes.length > 0);
});

test("an unset term falls through to the definition's own word", () => {
  const vocabulary = vocabularyFrom(
    {
      source: "structure", lesson_noun: "lesson", level_noun: "grade",
      nodes: [
        { key: "subject", label: "Subject", depth: 0, is_required: true },
        { key: "unit", label: "Unit", depth: 1, is_required: true },
      ],
    },
    { subject: "Learning Area" },
  );
  assert.equal(vocabulary.labelFor("subject"), "Learning Area");
  assert.equal(vocabulary.labelFor("unit"), "Unit", "an unset term must not blank the label");
  assert.equal(vocabulary.lessonNoun, "lesson");
});

test("the editor offers the terms the vocabulary actually consumes", () => {
  const keys = TERMINOLOGY_KEYS.map((entry) => entry.key);
  // These three are read directly by `vocabularyFrom`.
  for (const consumed of ["level", "lesson", "theme"]) {
    assert.ok(keys.includes(consumed as never), `${consumed} is consumed and must be editable`);
  }
  for (const entry of TERMINOLOGY_KEYS) {
    assert.ok(entry.hint.includes(","), `${entry.key} must show real alternatives`);
  }
});

test("terminology saves explicitly rather than per keystroke", () => {
  const workspace = source(WORKSPACE);
  assert.ok(workspace.includes("const [draft, setDraft]"), "edits must be local until saved");
  assert.ok(workspace.includes("Save wording"));
  assert.ok(workspace.includes("Discard"));
});

// ── Honesty preserved ───────────────────────────────────────────────────────

test("curriculum source offers three options and acknowledges a stored import", () => {
  const workspace = source(WORKSPACE);
  const points = workspace.slice(workspace.indexOf("const STARTING_POINTS"), workspace.indexOf("];", workspace.indexOf("const STARTING_POINTS")));
  assert.equal((points.match(/value: "/g) ?? []).length, 3);
  assert.ok(!points.includes('value: "import"'), "import must not be offered");
  // But a school already carrying it must not be silently misrepresented.
  assert.ok(workspace.includes('curriculum_starting_point === "import"'));
});

test("every mutation routes through the error gateway", () => {
  const workspace = source(WORKSPACE);
  // ⚠ Asserted as an invariant, not a count. `LevelsStage` shares one `onError`
  // handler across three mutations, so a 1:1 ratio was never the right shape —
  // what matters is that no failure path renders a raw message.
  assert.ok((workspace.match(/onError/g) ?? []).length > 0, "there must be failure paths");
  assert.ok(
    !/description:\s*(error|cause)\??\.message/.test(workspace),
    "no failure path may render a raw error message",
  );
  assert.ok(workspace.includes("getErrorMessage("), "failures must use the gateway");
});

test("changing a level invalidates the canonical list every surface reads", () => {
  const workspace = source(WORKSPACE);
  assert.ok(
    workspace.includes("SCHOOL_LEVELS_QUERY_KEY"),
    "a level added here must appear in Curriculum without a reload",
  );
});
