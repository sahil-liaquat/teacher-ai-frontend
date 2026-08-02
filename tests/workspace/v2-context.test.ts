/**
 * V2 Teaching Context and Dropdown Dependency Tests.
 * Run with: node --experimental-strip-types --test tests/workspace/v2-context.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sanitizeContext } from "../../lib/primary-context-helpers.ts";
import { subjectsForClass, skillsForContext } from "../../lib/primary-theme-content.ts";

describe("V2 Context Skill Sanitization", () => {
  it("preserves skill when it is a non-empty string", () => {
    const raw = { level: "UKG" as const, subject: "English", skill: "Phonics   " };
    const sanitized = sanitizeContext(raw);
    assert.equal(sanitized.skill, "Phonics");
  });

  it("deletes skill property if it is empty or invalid type to protect deepEqual checks", () => {
    const raw = { level: "UKG" as const, subject: "English", skill: "" };
    const sanitized = sanitizeContext(raw);
    assert.equal("skill" in sanitized, false);
  });
});

describe("V2 Context Dropdown Dependency Rules", () => {
  it("limits available subjects based on grade level (Nursery/LKG/UKG have no EVS)", () => {
    const ukgSubjects = subjectsForClass("UKG");
    const class1Subjects = subjectsForClass("Class 1");

    assert.ok(class1Subjects.includes("EVS"));
    assert.equal(ukgSubjects.includes("EVS"), false);
  });

  it("resolves focus skills dynamically from catalog or standard fallbacks", () => {
    const fallbackSkills = skillsForContext("Class 5", "Maths", "Numbers 1-10");
    assert.ok(fallbackSkills.includes("Counting"));
    assert.ok(fallbackSkills.includes("Problem Solving"));

    const emptyThemeSkills = skillsForContext("Class 5", "Maths", undefined);
    assert.deepEqual(emptyThemeSkills, []);
  });

  it("clears dependent theme and skill values when Class or Subject changes", () => {
    // Simulated updateContext dependency clearing logic
    const context = {
      level: "Class 1" as const,
      subject: "Maths",
      theme: "Numbers 1-10",
      skill: "Counting",
      language: "English" as const,
    };

    // Subject changes -> clears theme, topic, skill
    const applySubjectChange = (current: typeof context, nextSubject: string) => {
      const updated = {
        ...current,
        subject: nextSubject,
        theme: undefined,
        skill: undefined,
      };
      const sanitized = sanitizeContext(updated);
      return sanitized;
    };

    const res = applySubjectChange(context, "English");
    assert.equal(res.subject, "English");
    // Should fallback to default theme since it was cleared
    assert.equal(res.theme, "My Family");
    assert.equal("skill" in res, false);
  });
});
