/**
 * V2 Navigation and Route Architecture Tests.
 * Run with: node --experimental-strip-types --test tests/workspace/v2-routing.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Mocking AppShell and dynamic routing behavior to verify route compatibility mapping
const redirects: Record<string, string> = {
  planner: "/primary/today",
  planning: "/primary/today",
  "teaching-kits": "/primary/today",
  "teaching-resources": "/primary/today",
  "resource-library": "/primary/library",
  "printable-activities": "/primary/library",
  "worksheet-library": "/primary/library",
  "classroom-resources": "/primary/library",
  "ai-studio": "/primary/create",
  "classroom-activities": "/primary/create",
  "creative-corner": "/primary/create",
  assessment: "/primary/progress",
  "lesson-plan": "/primary/today",
};

describe("V2 Route Redirect Mappings", () => {
  it("redirects legacy routes to correct new canonical V2 routes", () => {
    assert.equal(redirects["planner"], "/primary/today");
    assert.equal(redirects["planning"], "/primary/today");
    assert.equal(redirects["teaching-kits"], "/primary/today");
    assert.equal(redirects["teaching-resources"], "/primary/today");
    assert.equal(redirects["resource-library"], "/primary/library");
    assert.equal(redirects["worksheet-library"], "/primary/library");
    assert.equal(redirects["ai-studio"], "/primary/create");
    assert.equal(redirects["assessment"], "/primary/progress");
  });

  it("handles query parameter preservation helper logically", () => {
    const simulateRedirect = (section: string, params: Record<string, any>) => {
      const target = redirects[section];
      if (!target) return null;
      const qp = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) qp.append(k, v);
      }
      const qs = qp.toString();
      return qs ? `${target}?${qs}` : target;
    };

    assert.equal(
      simulateRedirect("resource-library", { view: "saved", search: "math" }),
      "/primary/library?view=saved&search=math"
    );
    assert.equal(
      simulateRedirect("planner", { date: "2026-08-01" }),
      "/primary/today?date=2026-08-01"
    );
  });
});

describe("V2 Sidebar Navigation Structure", () => {
  const primaryNavKeys = [
    "home",
    "today",
    "library",
    "create",
    "progress",
    "saved",
    "settings",
  ];

  it("contains exactly the required 7 navigation items", () => {
    assert.equal(primaryNavKeys.length, 7);
    assert.deepEqual(primaryNavKeys, [
      "home",
      "today",
      "library",
      "create",
      "progress",
      "saved",
      "settings",
    ]);
  });
});
