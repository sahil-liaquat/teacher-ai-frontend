import assert from "node:assert/strict";
import test from "node:test";

import { deriveAuthState } from "../../lib/auth-state.ts";

function err(code: string, message = "boom", extra: Record<string, unknown> = {}) {
  return Object.assign(new Error(message), { code, ...extra });
}

test("EMAIL_NOT_CONFIRMED produces the unconfirmed state carrying the email", () => {
  const s = deriveAuthState(err("EMAIL_NOT_CONFIRMED"), "priya@gmail.com");
  assert.equal(s.kind, "unconfirmed");
  assert.equal(s.email, "priya@gmail.com");
  assert.equal(s.canResend, true);
  assert.equal(s.showGoogle, false);
});

test("unconfirmed gmail address offers the Open Gmail shortcut", () => {
  assert.equal(deriveAuthState(err("EMAIL_NOT_CONFIRMED"), "priya@gmail.com").showOpenGmail, true);
  assert.equal(deriveAuthState(err("EMAIL_NOT_CONFIRMED"), "priya@school.edu").showOpenGmail, false);
});

test("INVALID_CREDENTIALS with a google provider hint becomes wrong_provider", () => {
  const s = deriveAuthState(err("INVALID_CREDENTIALS", "no", { provider_hint: "google" }), "a@b.com");
  assert.equal(s.kind, "wrong_provider");
  assert.equal(s.showGoogle, true);
  assert.equal(s.canResend, false);
});

test("INVALID_CREDENTIALS without a hint stays bad_credentials", () => {
  const s = deriveAuthState(err("INVALID_CREDENTIALS"), "a@b.com");
  assert.equal(s.kind, "bad_credentials");
  assert.equal(s.showGoogle, false);
});

test("EMAIL_TAKEN with a google hint becomes taken_google", () => {
  const s = deriveAuthState(err("EMAIL_TAKEN", "exists", { provider_hint: "google" }), "a@b.com");
  assert.equal(s.kind, "taken_google");
  assert.equal(s.showGoogle, true);
});

test("EMAIL_TAKEN without a hint stays taken", () => {
  assert.equal(deriveAuthState(err("EMAIL_TAKEN"), "a@b.com").kind, "taken");
});

test("RATE_LIMITED produces the rate_limited state", () => {
  assert.equal(deriveAuthState(err("RATE_LIMITED"), "a@b.com").kind, "rate_limited");
});

test("SESSION_EXPIRED on a confirmation link becomes link_expired", () => {
  assert.equal(deriveAuthState(err("SESSION_EXPIRED"), "a@b.com").kind, "link_expired");
});

test("an unknown code degrades to generic rather than throwing", () => {
  const s = deriveAuthState(err("SOMETHING_NEW_FROM_THE_FUTURE"), "a@b.com");
  assert.equal(s.kind, "generic");
  assert.equal(s.message, "boom");
});

test("a network TypeError degrades to generic with the network message", () => {
  const s = deriveAuthState(new TypeError("Failed to fetch"), "a@b.com");
  assert.equal(s.kind, "generic");
  assert.match(s.message, /internet connection/i);
});

test("null error produces the idle state", () => {
  assert.equal(deriveAuthState(null, "").kind, "idle");
});
