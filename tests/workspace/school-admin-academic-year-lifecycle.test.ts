import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

const YEARS = "components/school-admin/academic-years/academic-years-workspace.tsx";
const SETTINGS = "components/school-admin/settings/settings-workspace.tsx";

// Two gaps this covers:
//   1. There was no way to remove an academic year through the UI at all — a
//      mistakenly created year could only be cleaned up with SQL.
//   2. Settings said "No current academic year is set yet" whether the school
//      had no years or had years with none marked current. The second case is
//      one click from fixed, and is why every readiness figure reads zero.

test("the delete helper targets the school academic-year route", () => {
  const api = read("lib/api.ts");
  assert.match(
    api,
    /schoolAdminDeleteAcademicYear: \(id: string\) =>\s*\n\s*apiFetch<void>\(`\/school-admin\/academic-years\/\$\{id\}`, \{ method: "DELETE" \}\)/,
  );
  // Deleting a tenant's year is school work, not platform work.
  assert.doesNotMatch(api, /adminDeleteAcademicYear/);
});

test("academic years can be deleted from the UI", () => {
  const source = read(YEARS);
  assert.match(source, /backendApi\.schoolAdminDeleteAcademicYear\(remove\.id\)/);
  assert.match(source, /confirmLabel="Delete year"/, "delete is not behind a confirmation");
});

test("delete is offered only on a year that is not current", () => {
  // The service refuses the active year with 409; hiding the control keeps the
  // UI from inviting a guaranteed failure.
  const source = read(YEARS);
  const actions = source.slice(source.indexOf('{state !== "current" ?'));
  assert.match(actions.slice(0, 400), /Make current/);
  assert.match(actions.slice(0, 400), /onClick=\{onDelete\}/);
  assert.doesNotMatch(
    actions.slice(0, 400).split("</>")[1] ?? "",
    /onDelete/,
    "delete leaked into the current-year branch",
  );
});

test("the delete confirmation states the conditions rather than just warning", () => {
  const source = read(YEARS);
  assert.match(source, /no teaching days, classes or teacher assignments/);
  assert.match(source, /is not the current year/);
});

test("a refused delete surfaces the server's reason through the error gateway", () => {
  // The 409 explains exactly what still references the year; a generic message
  // would throw that away.
  const source = read(YEARS);
  assert.match(source, /import \{ getErrorMessage \} from "@\/lib\/errors";/);
  assert.match(source, /Could not delete academic year[\s\S]{0,140}getErrorMessage\(error/);
});

test("settings distinguishes no years from no current year", () => {
  const source = read(SETTINGS);
  assert.match(source, /const hasYears = Boolean\(years\.data\?\.length\)/);
  // years exist, none current -> explains the zeros and names the fix
  assert.match(source, /No academic year is set as current/);
  assert.match(source, /readiness reads zero everywhere|readiness reads zero/);
  assert.match(source, /Make current/);
  // no years at all -> a different instruction
  assert.match(source, /No academic year exists yet/);
  // the misleading single message is gone
  assert.doesNotMatch(source, /"No current academic year is set yet\."/);
});

test("settings changes its call to action when a year merely needs activating", () => {
  assert.match(read(SETTINGS), /Choose a current year/);
});
