import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

test("school admin uses one reusable proposal review surface", () => {
  const dialog = read("components/school-admin/ai/ai-proposal-dialog.tsx");
  assert.match(dialog, /Review exactly what will change/);
  assert.match(dialog, /Generate again/);
  assert.match(dialog, /Apply \$\{selected\.size\} selected/);
  assert.match(dialog, /PRIMARY_AI_PROPOSAL_STALE/);
  assert.match(dialog, /disabled=\{applying \|\| selected\.size === 0\}/);
});

test("month and week AI actions call the proposal API instead of placeholder toasts", () => {
  const curriculum = read("components/school-admin/curriculum/curriculum-workspace.tsx");
  assert.match(curriculum, /openAI\("fill_month"/);
  assert.match(curriculum, /openAI\("create_month"/);
  assert.match(curriculum, /openAI\("fill_week"/);
  assert.doesNotMatch(curriculum, /needs the curriculum AI endpoint/);
});

test("block actions are contextual and proposal-first", () => {
  const editor = read("components/school-admin/day-editor/school-day-editor.tsx");
  assert.match(editor, /generate_teacher_instructions/);
  assert.match(editor, /generate_questions/);
  assert.match(editor, /suggest_resources/);
  assert.match(editor, /Save this day first/);
  assert.doesNotMatch(editor, /needs the curriculum AI endpoint/);
});

test("frontend apply sends only proposal identity and selected change ids", () => {
  const api = read("lib/api.ts");
  assert.match(api, /adminApplyPrimaryAIProposal/);
  assert.match(api, /JSON\.stringify\(\{ change_ids: changeIds \}\)/);
  assert.doesNotMatch(api, /adminApplyPrimaryAIProposal:[\s\S]{0,300}proposed/);
});
