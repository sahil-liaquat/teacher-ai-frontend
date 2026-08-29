import assert from "node:assert/strict";
import test from "node:test";

import { cn } from "../../lib/cn.ts";

// Stock tailwind-merge classifies these tokens as text-color / shadow-color, so a colour
// class on the same element silently swallowed them. Regression cover for that.

test("a font-size token survives a colour class in either order", () => {
  assert.equal(cn("text-h1", "text-slate-900"), "text-h1 text-slate-900");
  assert.equal(cn("text-slate-900", "text-h1"), "text-slate-900 text-h1");
});

test("every font-size token survives a colour class", () => {
  for (const size of ["micro", "lead", "h1", "h2", "h3", "display"]) {
    assert.equal(cn(`text-${size}`, "text-fg"), `text-${size} text-fg`, `text-${size} was dropped`);
  }
});

test("font-size tokens still conflict with each other and with built-in sizes", () => {
  assert.equal(cn("text-h1", "text-h2"), "text-h2");
  assert.equal(cn("text-h1", "text-lg"), "text-lg");
  assert.equal(cn("text-lg", "text-h1"), "text-h1");
});

test("built-in font sizes are unaffected", () => {
  assert.equal(cn("text-sm", "text-slate-900"), "text-sm text-slate-900");
  assert.equal(cn("text-base", "text-slate-900"), "text-base text-slate-900");
});

test("a shadow token survives a shadow-colour class in either order", () => {
  assert.equal(cn("shadow-e1", "shadow-blue-200"), "shadow-e1 shadow-blue-200");
  assert.equal(cn("shadow-blue-200", "shadow-e1"), "shadow-blue-200 shadow-e1");
});

test("shadow tokens conflict with each other and with built-in shadows", () => {
  assert.equal(cn("shadow-e1", "shadow-e2"), "shadow-e2");
  assert.equal(cn("shadow-sm", "shadow-e1"), "shadow-e1");
  assert.equal(cn("shadow-e1", "shadow-sm"), "shadow-sm");
});

test("radius tokens conflict with each other and with built-in radii", () => {
  assert.equal(cn("rounded-chip", "rounded-control"), "rounded-control");
  assert.equal(cn("rounded-xl", "rounded-card"), "rounded-card");
  assert.equal(cn("rounded-card", "rounded-full"), "rounded-full");
});

test("cn still merges ordinary conflicts and accepts clsx inputs", () => {
  assert.equal(cn("px-2", "px-4"), "px-4");
  assert.equal(cn("p-2", false && "p-4", ["text-fg", null]), "p-2 text-fg");
});
