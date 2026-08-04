import assert from "node:assert/strict";
import test from "node:test";

import { getErrorMessage, getErrorCode } from "../../lib/errors.ts";

function apiError(message: string, extra: Record<string, unknown>) {
  return Object.assign(new Error(message), extra);
}

test("a backend-authored message is shown verbatim when it carries a code", () => {
  const error = apiError("You already have a plan for this day. Regenerate to replace it.", {
    status: 409,
    code: "PRIMARY_DAY_ALREADY_GENERATED",
  });
  assert.equal(
    getErrorMessage(error, "We couldn't generate a plan."),
    "You already have a plan for this day. Regenerate to replace it."
  );
});

test("pydantic schema wording never reaches the user", () => {
  // The backend's RequestValidationError handler emits field-level pydantic
  // text under code SCHEMA_VALIDATION. It is developer output — any drift
  // between a client payload and an extra="forbid" schema produced sentences
  // like "level: Input should be 'nursery'" on a teacher's screen.
  const error = apiError(
    "Please check your input — level: Input should be 'nursery', 'lkg' or 'ukg'",
    { status: 422, code: "SCHEMA_VALIDATION" }
  );
  assert.equal(
    getErrorMessage(error, "We couldn't generate a plan. Try again."),
    "We couldn't generate a plan. Try again."
  );
});

test("hand-authored 4xx details still win over the fallback", () => {
  // Only the schema handler is untrusted. A plain HTTPException(400/422) with a
  // real sentence keeps code VALIDATION and must still be shown.
  const error = apiError("Pick a different class to copy from.", {
    status: 400,
    code: "VALIDATION",
  });
  assert.equal(
    getErrorMessage(error, "We couldn't copy that plan."),
    "Pick a different class to copy from."
  );
});

test("an explicit override still beats the schema-validation suppression", () => {
  const error = apiError("Please check your input — date: invalid", {
    status: 422,
    code: "SCHEMA_VALIDATION",
  });
  assert.equal(
    getErrorMessage(error, "Generic fallback.", { SCHEMA_VALIDATION: "That date isn't valid." }),
    "That date isn't valid."
  );
});

test("getErrorCode still reports the schema-validation code to callers", () => {
  const error = apiError("Please check your input — date: invalid", {
    status: 422,
    code: "SCHEMA_VALIDATION",
  });
  assert.equal(getErrorCode(error), "SCHEMA_VALIDATION");
});
