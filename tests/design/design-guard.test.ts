import assert from "node:assert/strict";
import test from "node:test";

import { findViolations } from "../../lib/design-guard.ts";

test("an arbitrary font size is a violation", () => {
  const v = findViolations('<p className="text-[13px]">hi</p>', "a.tsx");
  assert.equal(v.length, 1);
  assert.equal(v[0].rule, "arbitrary-font-size");
  assert.equal(v[0].value, "text-[13px]");
});

test("a half-pixel font size is reported as sub-pixel, the clearest tell", () => {
  const v = findViolations('<p className="text-[10.5px]">hi</p>', "a.tsx");
  assert.ok(v.some((x) => x.rule === "arbitrary-font-size"));
});

test("a font size below 12px is reported separately as illegible", () => {
  const v = findViolations('<p className="text-[9px]">hi</p>', "a.tsx");
  assert.ok(v.some((x) => x.rule === "sub-12px-font"));
});

test("a raw hex literal is a violation", () => {
  const v = findViolations('<div className="text-[#25262b]" />', "a.tsx");
  assert.ok(v.some((x) => x.rule === "raw-hex" && x.value === "#25262b"));
});

test("an arbitrary radius is a violation", () => {
  const v = findViolations('<div className="rounded-[18px]" />', "a.tsx");
  assert.ok(v.some((x) => x.rule === "arbitrary-radius"));
});

test("an arbitrary shadow is a violation", () => {
  const v = findViolations('<div className="shadow-[0_14px_34px_rgba(15,23,42,0.07)]" />', "a.tsx");
  assert.ok(v.some((x) => x.rule === "arbitrary-shadow"));
});

test("token classes are clean", () => {
  const clean = '<div className="rounded-card text-sm shadow-e1 text-fg-muted p-4" />';
  assert.deepEqual(findViolations(clean, "a.tsx"), []);
});

test("violations carry a 1-indexed line number", () => {
  const v = findViolations('line one\n<p className="text-[13px]" />', "a.tsx");
  assert.equal(v[0].line, 2);
});

test("a CSS variable reference is not a raw hex", () => {
  assert.deepEqual(findViolations('<div className="text-[var(--fg)]" />', "a.tsx"), []);
});
