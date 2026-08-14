import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const api = readFileSync(new URL("../../lib/api.ts", import.meta.url), "utf8");
const shell = readFileSync(new URL("../../components/app-shell.tsx", import.meta.url), "utf8");

test("the current-user contract carries the assigned organization name", () => {
  assert.match(api, /organization_name\?: string \| null/);
});

test("assigned teachers see their school in both top bars", () => {
  assert.match(shell, /assignedSchoolName = currentUser\?\.organization_name/);
  assert.equal((shell.match(/\{assignedSchoolName\}/g) ?? []).length >= 2, true);
  assert.match(shell, /title=\{assignedSchoolName\}/);
});

test("the header does not invent a school name for unassigned accounts", () => {
  assert.match(shell, /assignedSchoolName && \(/);
  assert.doesNotMatch(shell, /Primary Demonstration School/);
});
