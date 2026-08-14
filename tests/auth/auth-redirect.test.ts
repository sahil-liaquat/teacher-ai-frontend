import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGoogleCallbackUrl,
  dashboardForRole,
  getPostLoginPath,
  getSafeNextPath,
} from "../../lib/auth-redirect.ts";

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

test("dashboardForRole returns the canonical workspace home", () => {
  assert.equal(dashboardForRole("admin"), "/admin");
  assert.equal(dashboardForRole("org_admin"), "/school-admin");
  assert.equal(dashboardForRole("teacher"), "/dashboard");
  assert.equal(dashboardForRole("influencer"), "/dashboard");
});

test("an admin cannot be sent to a teacher workspace by a stale next parameter", () => {
  assert.equal(getPostLoginPath("admin", "/dashboard"), "/admin");
  assert.equal(getPostLoginPath("admin", "/dashboard/settings"), "/admin");
  assert.equal(getPostLoginPath("admin", "/primary/today"), "/admin");
  assert.equal(getPostLoginPath("admin", "/admin/users"), "/admin/users");
});

test("each signed-in role stays inside its own privileged workspace", () => {
  assert.equal(getPostLoginPath("teacher", "/admin/users"), "/dashboard");
  assert.equal(getPostLoginPath("teacher", "/school-admin"), "/dashboard");
  assert.equal(getPostLoginPath("org_admin", "/dashboard"), "/school-admin");
  assert.equal(getPostLoginPath("influencer", "/influencer/payouts"), "/influencer/payouts");
});

test("role-neutral authenticated destinations are retained", () => {
  assert.equal(
    getPostLoginPath("teacher", "/invitations/invite-token"),
    "/invitations/invite-token"
  );
});
