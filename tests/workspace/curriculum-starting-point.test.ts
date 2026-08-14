import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

const DIALOG = "components/school-admin/academic-years/academic-years-workspace.tsx";
const API = "lib/api.ts";
const PLANNER = "components/primary/pages/primary-plan-setup-modal.tsx";

/**
 * ⚠ THE BUG. The create-academic-year dialog offered three "Start curriculum
 * with" cards, and only "copy" did anything. "teachpad" and "empty" ran the
 * identical code path and differed solely in the toast sentence — the choice
 * never left the browser. A school that picked "Start empty" therefore still
 * read through to the TeachPad master and opened with a full theme list and one
 * ready teaching day, which is exactly what "empty" is supposed to rule out.
 */
test("the Start empty choice is sent to the server, not just to a toast", () => {
  const dialog = read(DIALOG);
  assert.match(
    dialog,
    /schoolAdminSetCurriculumStartingPoint\(/,
    "the create-year dialog no longer persists the starting point; " +
      "'Start empty' is decorative again"
  );
  // Both non-copy modes must persist, otherwise switching back to TeachPad
  // after choosing empty would leave the school permanently empty.
  assert.match(dialog, /mode === "empty" \? "empty" : "teachpad"/);
});

test("the API helper points at the school-admin starting-point route", () => {
  const api = read(API);
  const helper = api.slice(api.indexOf("schoolAdminSetCurriculumStartingPoint"));
  assert.match(helper, /\/school-admin\/curriculum-starting-point/);
  assert.match(helper, /method: "PUT"/);
  assert.match(helper, /curriculum_starting_point/);
});

test("copying a year does not change the school's starting point", () => {
  /** Copy duplicates this school's own work; it says nothing about whether the
   * master is inherited, so it must leave that decision alone. */
  const dialog = read(DIALOG);
  assert.match(dialog, /if \(mode !== "copy"\)/);
});

/**
 * The teacher planner is the consumer that defines "reachable". It keeps a
 * theme only when some ACTIVE topic of it has a published lesson, and refuses
 * to submit without a selected topic. That is the invariant the backend's
 * publish validation now enforces — if this gate ever relaxes, the backend rule
 * is stricter than it needs to be and should be revisited together.
 */
test("the teacher planner still requires an active, published topic", () => {
  const planner = read(PLANNER);
  assert.match(planner, /topic\.is_active && topic\.has_published_lesson/);
  assert.match(planner, /canSubmit =[^;]*!!selectedTopic/);
});
