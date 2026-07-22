import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { LessonPlan } from "../../lib/api";
import {
  emptyElifResourceStates,
  lessonResourceCustomizeHref,
  lessonResourceOpenHref,
  readElifResourceStates,
  updateStoredElifResourceState,
  writeElifResourceStates,
} from "../../lib/elif-resource-hub.ts";
import { presentationNeedsImageRepair } from "../../lib/presentation-generator.ts";

const lesson: LessonPlan = {
  id: "lesson-1",
  class_name: "Class 8",
  subject: "Science",
  chapter_name: "Coal and Petroleum",
  topic: "Conservation of fossil fuels",
  duration_minutes: 45,
  plan: { metadata: { board: "CBSE" } },
};

test("Elif customization keeps the existing generator pages and prefills lesson context", () => {
  for (const [resource, pathname] of [
    ["worksheet", "/dashboard/worksheets/new"],
    ["presentation", "/dashboard/presentation-generator"],
    ["notes", "/dashboard/notes-generator"],
    ["activity", "/dashboard/activity-generator"],
  ] as const) {
    const href = lessonResourceCustomizeHref(resource, lesson);
    const url = new URL(href, "https://teachpad.test");
    assert.equal(url.pathname, pathname);
    assert.equal(url.searchParams.get("board"), "CBSE");
    assert.equal(url.searchParams.get("class"), "Class 8");
    assert.equal(url.searchParams.get("subject"), "Science");
    assert.equal(url.searchParams.get("chapter"), "Coal and Petroleum");
    assert.equal(url.searchParams.get("topic"), "Conservation of fossil fuels");
  }
});

test("Elif completion actions open the existing resource output routes", () => {
  assert.equal(lessonResourceOpenHref("worksheet", "result/1"), "/dashboard/worksheets/result%2F1?new=true");
  assert.equal(lessonResourceOpenHref("presentation", "p-1"), "/dashboard/presentation-generator/output?id=p-1&new=true");
  assert.equal(lessonResourceOpenHref("notes", "n-1"), "/dashboard/notes-generator/output?id=n-1&new=true");
  assert.equal(lessonResourceOpenHref("activity", "a-1"), "/dashboard/activity-generator/output?id=a-1&new=true");
});

test("Elif opens on the resource hub and only analyses in review mode", () => {
  const panel = readFileSync(new URL("../../components/lesson-plan-chatbot-panel.tsx", import.meta.url), "utf8");

  assert.match(panel, /useState<"home" \| "review">\("home"\)/);
  assert.match(panel, /panelView === "home" \? \(/);
  assert.match(panel, /panelView !== "review"/);
  assert.match(panel, /onReview=\{beginReview\}/);
  assert.match(panel, /onClick=\{returnToResourceHub\}/);
  assert.match(panel, /aria-label="Back to lesson resources"/);
  assert.doesNotMatch(panel, /if \(!isOpen \|\| analysis \|\| analysisLoading/);
});

test("completed Elif resources open in a new tab and preserve the lesson hub", () => {
  const panel = readFileSync(new URL("../../components/lesson-plan-chatbot-panel.tsx", import.meta.url), "utf8");

  assert.match(panel, /target="_blank" rel="noopener noreferrer"/);
  assert.doesNotMatch(panel, /window\.open\(/);
  assert.doesNotMatch(panel, /router\.push\(href\)/);
  assert.match(panel, /onOpen=\{openGeneratedResource\}/);
});

test("Elif home fills the panel height without adding more controls", () => {
  const panel = readFileSync(new URL("../../components/lesson-plan-chatbot-panel.tsx", import.meta.url), "utf8");

  assert.match(panel, /className="flex min-h-full flex-col"/);
  assert.match(panel, /mt-4 flex flex-1 flex-col gap-3/);
  assert.match(panel, /min-h-\[78px\] flex-1 items-center/);
  assert.match(panel, /What would you like to do next\?/);
  assert.match(panel, /Create more teaching resources from the same lesson plan/);
});

test("Elif resource actions stack cleanly on narrow screens", () => {
  const panel = readFileSync(new URL("../../components/lesson-plan-chatbot-panel.tsx", import.meta.url), "utf8");

  assert.match(panel, /flex-col gap-3 min-\[480px\]:flex-row/);
  assert.match(panel, /grid w-full shrink-0 grid-cols-2/);
  assert.match(panel, /role="status" aria-live="polite"/);
});

test("completed Elif generations survive returning to the same lesson", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
  const states = emptyElifResourceStates();
  states.worksheet = { status: "success", generationId: "worksheet-1" };
  states.presentation = { status: "success", generationId: "presentation-1" };
  states.notes = { status: "generating" };

  writeElifResourceStates("lesson-1", states, storage);

  assert.deepEqual(readElifResourceStates("lesson-1", storage), {
    worksheet: { status: "success", generationId: "worksheet-1" },
    presentation: { status: "success", generationId: "presentation-1" },
    notes: { status: "idle" },
    activity: { status: "idle" },
  });
  assert.deepEqual(readElifResourceStates("another-lesson", storage), emptyElifResourceStates());
});

test("invalid saved Elif state fails safely", () => {
  const storage = {
    getItem: () => "not-json",
    setItem: () => undefined,
  };

  assert.deepEqual(readElifResourceStates("lesson-1", storage), emptyElifResourceStates());
});

test("simultaneous Elif completions merge instead of overwriting each other", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };

  updateStoredElifResourceState("lesson-1", "presentation", { status: "success", generationId: "presentation-1" }, storage);
  updateStoredElifResourceState("lesson-1", "activity", { status: "success", generationId: "activity-1" }, storage);
  updateStoredElifResourceState("lesson-1", "notes", { status: "success", generationId: "notes-1" }, storage);

  assert.deepEqual(readElifResourceStates("lesson-1", storage), {
    worksheet: { status: "idle" },
    presentation: { status: "success", generationId: "presentation-1" },
    notes: { status: "success", generationId: "notes-1" },
    activity: { status: "success", generationId: "activity-1" },
  });
});

test("presentation slides discard a broken image and try the next alternative", () => {
  const output = readFileSync(
    new URL("../../app/dashboard/presentation-generator/output/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(output, /imageUrls: slide\.imageUrls\.filter/);
  assert.match(output, /selectedImageIndex: 0/);
  assert.doesNotMatch(output, /Math\.min\(imageIndex \+ 1, slide\.imageUrls\.length - 1\)/);
});

test("presentations repair slides that have fewer than three image alternatives", () => {
  const generation = {
    include_images: true,
    output_json: {
      slides: [
        { visual_prompt: ["https://images.test/one.png", "https://images.test/two.png", "https://images.test/three.png"] },
        { visual_prompt: [] },
      ],
    },
  } as any;

  assert.equal(presentationNeedsImageRepair(generation), true);
  generation.output_json.slides[1].visual_prompt = [
    "https://images.test/four.png",
    "https://images.test/five.png",
    "https://images.test/six.png",
  ];
  assert.equal(presentationNeedsImageRepair(generation), false);
});

test("selected teacher notes appear in the editor and PowerPoint speaker notes", () => {
  const form = readFileSync(new URL("../../app/dashboard/presentation-generator/page.tsx", import.meta.url), "utf8");
  const output = readFileSync(new URL("../../app/dashboard/presentation-generator/output/page.tsx", import.meta.url), "utf8");
  const exporter = readFileSync(new URL("../../lib/presentation-export.ts", import.meta.url), "utf8");

  assert.match(form, /label: "Teacher Notes"/);
  assert.match(output, /deck\.includeSpeakerNotes \? \(/);
  assert.match(output, /<TeacherNotesPanel/);
  assert.match(output, /updateActiveSlide\(\{ speakerNote \}\)/);
  assert.match(exporter, /if \(deck\.includeSpeakerNotes\)/);
  assert.match(exporter, /pptSlide\.addNotes\(notes\)/);
});

test("Elif notes and activities use dedicated output routes without showing input forms first", () => {
  const notes = readFileSync(new URL("../../app/dashboard/notes-generator/page.tsx", import.meta.url), "utf8");
  const activity = readFileSync(new URL("../../app/dashboard/activity-generator/page.tsx", import.meta.url), "utf8");
  const notesOutputRoute = readFileSync(new URL("../../app/dashboard/notes-generator/output/page.tsx", import.meta.url), "utf8");
  const activityOutputRoute = readFileSync(new URL("../../app/dashboard/activity-generator/output/page.tsx", import.meta.url), "utf8");

  assert.match(notes, /useState\(Boolean\(generationId\)\)/);
  assert.match(notes, /generationId && !notes/);
  assert.match(activity, /useState\(Boolean\(generationId\)\)/);
  assert.match(activity, /generationId && !activity/);
  assert.match(notesOutputRoute, /from "\.\.\/page"/);
  assert.match(activityOutputRoute, /from "\.\.\/page"/);
});
