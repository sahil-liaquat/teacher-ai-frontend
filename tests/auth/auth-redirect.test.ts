import assert from "node:assert/strict";
import test from "node:test";

import { buildGoogleCallbackUrl, getSafeNextPath } from "../../lib/auth-redirect.ts";

test("getSafeNextPath accepts a same-origin relative path", () => {
  assert.equal(getSafeNextPath("/dashboard/worksheet-generator"), "/dashboard/worksheet-generator");
});

test("getSafeNextPath rejects null, undefined, and empty string", () => {
  assert.equal(getSafeNextPath(null), null);
  assert.equal(getSafeNextPath(undefined), null);
  assert.equal(getSafeNextPath(""), null);
});

test("getSafeNextPath rejects paths with no leading slash", () => {
  assert.equal(getSafeNextPath("dashboard"), null);
});

test("getSafeNextPath rejects protocol-relative URLs", () => {
  assert.equal(getSafeNextPath("//evil.com"), null);
  assert.equal(getSafeNextPath("//evil.com/dashboard"), null);
});

test("getSafeNextPath rejects backslash-prefixed paths", () => {
  assert.equal(getSafeNextPath("/\\evil.com"), null);
});

test("getSafeNextPath rejects absolute URLs", () => {
  assert.equal(getSafeNextPath("https://evil.com"), null);
});

test("buildGoogleCallbackUrl with no next and no ref", () => {
  const url = buildGoogleCallbackUrl("https://teachpad.in", {});
  assert.equal(url, "https://teachpad.in/auth/callback");
});

test("buildGoogleCallbackUrl forwards a safe next", () => {
  const url = buildGoogleCallbackUrl("https://teachpad.in", { next: "/dashboard/worksheet-generator" });
  assert.equal(url, "https://teachpad.in/auth/callback?next=%2Fdashboard%2Fworksheet-generator");
});

test("buildGoogleCallbackUrl drops an unsafe next", () => {
  const url = buildGoogleCallbackUrl("https://teachpad.in", { next: "//evil.com" });
  assert.equal(url, "https://teachpad.in/auth/callback");
});

test("buildGoogleCallbackUrl forwards ref", () => {
  const url = buildGoogleCallbackUrl("https://teachpad.in", { ref: "PROMO1" });
  assert.equal(url, "https://teachpad.in/auth/callback?ref=PROMO1");
});

test("buildGoogleCallbackUrl forwards both next and ref together", () => {
  const url = buildGoogleCallbackUrl("https://teachpad.in", { next: "/dashboard", ref: "PROMO1" });
  assert.equal(url, "https://teachpad.in/auth/callback?next=%2Fdashboard&ref=PROMO1");
});

test("buildGoogleCallbackUrl ignores an empty-string ref", () => {
  const url = buildGoogleCallbackUrl("https://teachpad.in", { ref: "" });
  assert.equal(url, "https://teachpad.in/auth/callback");
});

test("getSafeNextPath rejects a leading-newline control-character bypass", () => {
  assert.equal(getSafeNextPath("/\n/evil.com"), null);
});

test("getSafeNextPath rejects a leading-tab control-character bypass", () => {
  assert.equal(getSafeNextPath("/\t/evil.com"), null);
});

test("getSafeNextPath rejects a leading-carriage-return control-character bypass", () => {
  assert.equal(getSafeNextPath("/\r/evil.com"), null);
});

test("getSafeNextPath rejects malformed bracket-host input instead of throwing", () => {
  assert.equal(getSafeNextPath("//[not-valid-ipv6"), null);
  assert.equal(getSafeNextPath("//[::1"), null);
  assert.equal(getSafeNextPath("//[zzzz]"), null);
});
