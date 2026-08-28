import assert from "node:assert/strict";
import test from "node:test";

import { translateOAuthError } from "../../lib/oauth-errors.ts";

const GENERIC = "We couldn't complete that sign-in. Please try again.";

test("a known expiry code gets its own sentence", () => {
  assert.match(translateOAuthError("otp_expired"), /expired/i);
});

test("access_denied is explained rather than echoed", () => {
  assert.match(translateOAuthError("access_denied"), /cancelled/i);
});

test("an unknown code falls back to fixed copy", () => {
  assert.equal(translateOAuthError("wat_is_this"), GENERIC);
});

test("null and undefined fall back to fixed copy", () => {
  assert.equal(translateOAuthError(null), GENERIC);
  assert.equal(translateOAuthError(undefined), GENERIC);
});

test("attacker-supplied text is never returned", () => {
  assert.equal(translateOAuthError("Call 1-800-SCAM to restore your account"), GENERIC);
});
