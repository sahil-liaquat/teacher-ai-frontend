import assert from "node:assert/strict";
import test from "node:test";

import { shouldAskForPhone, shouldRedirectToStart } from "../../lib/first-run.ts";
import { activeGlobalCard, claimGlobalCard, releaseGlobalCard } from "../../lib/global-card.ts";

const teacher = {
  role: "teacher",
  first_run_v2: true,
  needs_onboarding: true,
  phone_prompt_state: "required" as const
};

test("a fresh teacher under the flag is sent to /start", () => {
  assert.equal(shouldRedirectToStart(teacher), true);
});

test("nothing happens while the flag is off — the old modals still own this", () => {
  assert.equal(shouldRedirectToStart({ ...teacher, first_run_v2: false }), false);
  assert.equal(shouldAskForPhone({ ...teacher, first_run_v2: false }), false);
});

test("a missing flag is treated as off, not assumed on", () => {
  assert.equal(shouldRedirectToStart({ ...teacher, first_run_v2: undefined }), false);
  assert.equal(shouldAskForPhone({ ...teacher, first_run_v2: undefined }), false);
});

test("admins are excluded from both surfaces", () => {
  assert.equal(shouldRedirectToStart({ ...teacher, role: "admin" }), false);
  assert.equal(shouldAskForPhone({ ...teacher, role: "admin" }), false);
});

test("an unloaded user triggers nothing", () => {
  assert.equal(shouldRedirectToStart(undefined), false);
  assert.equal(shouldAskForPhone(null), false);
});

test("a teacher who finished onboarding is left alone", () => {
  assert.equal(shouldRedirectToStart({ ...teacher, needs_onboarding: false }), false);
});

test("the phone ask follows the server-computed state", () => {
  assert.equal(shouldAskForPhone(teacher), true);
  assert.equal(shouldAskForPhone({ ...teacher, phone_prompt_state: "hidden" }), false);
});

test("the second card is refused while the first holds the slot", (t) => {
  t.after(() => releaseGlobalCard("phone-ask"));
  assert.equal(claimGlobalCard("phone-ask"), true);
  assert.equal(claimGlobalCard("feedback"), false);
  assert.equal(activeGlobalCard(), "phone-ask");
});

test("releasing hands the slot to the other card", () => {
  claimGlobalCard("phone-ask");
  releaseGlobalCard("phone-ask");
  assert.equal(activeGlobalCard(), null);
  assert.equal(claimGlobalCard("feedback"), true);
  releaseGlobalCard("feedback");
});

test("releasing a card that does not hold the slot cannot steal it", () => {
  claimGlobalCard("phone-ask");
  releaseGlobalCard("feedback");
  assert.equal(activeGlobalCard(), "phone-ask");
  releaseGlobalCard("phone-ask");
});
