import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

function source(relativePath: string) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

test("Master Curriculum admin exposes a clear curriculum management navigation", () => {
  const page = source("components/admin/master-curriculum/master-curriculum-shell.tsx");

  // Locks the cutover rename: this surface administers the platform-owned
  // master curriculum, so it must not drift back to "Primary classroom OS".
  assert.match(page, /Master Curriculum/);
  for (const label of ["Overview", "Create Themes", "Design Curriculum", "Manage Resources", "Map Resources", "Review & Publish"]) assert.match(page, new RegExp(label));
});

test("Master lesson authoring creates topics inline and reopens saved drafts", () => {
  const editor = source("components/admin/master-curriculum/lesson-editor.tsx");

  assert.match(editor, /adminPrimaryLessons/);
  assert.match(editor, /adminCreatePrimaryTopic/);
  assert.match(editor, /Create the first topic/);
  assert.match(editor, /Version history/);
  assert.doesNotMatch(editor, /Create a topic in Themes & topics first/);
});

test("Theme and calendar management provide editing controls", () => {
  const themes = source("components/admin/master-curriculum/theme-engine-panel.tsx");
  const years = source("components/admin/master-curriculum/academic-years-panel.tsx");

  assert.match(themes, /CreateThemeForm/);
  assert.match(themes, /adminUpdatePrimaryTopic/);
  assert.match(themes, /Save topic/);
  assert.match(themes, /restoreTopic/);
  assert.match(years, /startEditing/);
  assert.match(years, /Save changes/);
});

test("Primary themes ship with a built-in hero library and optional upload", () => {
  const library = source("lib/primary-hero-library.ts");
  const picker = source("components/shared/primary-hero-image-picker.tsx");
  const createTheme = source("components/admin/master-curriculum/theme-list.tsx");
  const dashboard = source("components/primary/pages/primary-home-page.tsx");
  const slugs = [
    "farm-animals", "jungle-animals", "ocean-world", "birds", "my-family", "my-school",
    "fruits-vegetables", "transport", "community-helpers", "plants-nature",
    "seasons-weather", "festivals-celebrations",
  ];

  for (const slug of slugs) {
    assert.match(library, new RegExp(`${slug}\\.webp`));
    assert.equal(
      existsSync(new URL(`../../public/assets/primary/heroes/${slug}.webp`, import.meta.url)),
      true,
      `missing built-in hero ${slug}`,
    );
  }
  assert.match(picker, /Built-in library/);
  assert.match(picker, /Custom upload/);
  assert.match(picker, /adminUploadPrimaryHero/);
  assert.match(createTheme, /hero_image_url: heroImage/);
  assert.match(dashboard, /url\(\$\{visuals\.heroImage\}\)/);
});

test("Every admin step type has default artwork on the teacher dashboard", () => {
  const mapping = source("lib/primary-step-images.ts");
  const dashboard = source("components/primary/pages/primary-home-page.tsx");
  const adminRows = source("components/admin/master-curriculum/step-rows.tsx");
  const stepAssets: Record<string, string> = {
    warm_up: "warm-up", introduction: "introduction", story_or_rhyme: "story-or-rhyme",
    picture_talk: "picture-talk", classroom_activity: "classroom-activity", worksheet: "worksheet",
    assessment: "assessment", movement: "movement", routine: "routine", circle_time: "circle-time",
    story: "story", flashcards: "flashcards", craft: "craft", song: "song", game: "game",
    reflection: "reflection", parent_note: "parent-note",
  };

  for (const [stepType, slug] of Object.entries(stepAssets)) {
    assert.match(mapping, new RegExp(`${stepType}:.*${slug}\\.webp`));
    assert.equal(
      existsSync(new URL(`../../public/assets/primary/steps/${slug}.webp`, import.meta.url)),
      true,
      `missing default artwork for ${stepType}`,
    );
  }
  assert.match(dashboard, /const stepArt = primaryStepImage\(activity\.activity_type\)/);
  // Whitespace-tolerant on purpose: both branches asserted this same thing, one
  // with a literal space and mandatory parens. This form matches everything that
  // stricter version did, and survives Prettier reflowing the JSX.
  assert.match(dashboard, /stepArt\s*\?\s*\(?\s*<img\s+src=\{stepArt\}/);
  assert.match(adminRows, /primaryStepImage\(step\.step_type\)/);
});

test("Primary classroom steps open as complete pages with plan navigation", () => {
  const appShell = source("components/app-shell.tsx");
  const home = source("components/primary/pages/primary-home-page.tsx");
  const today = source("components/primary/pages/primary-today-page.tsx");
  const detail = source("components/primary/pages/primary-activity-detail-page.tsx");

  assert.equal(
    existsSync(new URL("../../app/primary/today/activity/[activityId]/page.tsx", import.meta.url)),
    true,
    "missing full-page Primary activity route",
  );
  assert.match(appShell, /href: "\/primary\/today", label: "Today's Plan"/);
  assert.match(home, /\/primary\/today\/activity\/\$\{activity\.id\}/);
  assert.match(today, /\/primary\/today\/activity\/\$\{act\.id\}/);
  assert.doesNotMatch(today, /ActivityDrawer/);

  assert.match(detail, /backendApi\.plannerActivity\(activityId\)/);
  assert.match(detail, /backendApi\.getTodayWorkspace/);
  assert.match(detail, /primaryStepImage\(activity\.activity_type\)/);
  assert.match(detail, /Activity guide/);
  assert.match(detail, /Learning resources/);
  assert.match(detail, /Previous activity/);
  assert.match(detail, /Next activity/);
  assert.match(detail, /upsertPrimaryObservation/);
  assert.match(detail, /updatePlannerActivity/);

  for (const stepType of [
    "warm_up", "introduction", "story_or_rhyme", "picture_talk", "classroom_activity",
    "worksheet", "assessment", "movement", "routine", "circle_time", "story",
    "flashcards", "craft", "song", "game", "reflection", "parent_note",
  ]) {
    assert.match(detail, new RegExp(`${stepType}: \\{`), `missing page presentation for ${stepType}`);
  }
});

test("Primary home scopes one classroom plan and keeps step artwork contained", () => {
  const home = source("components/primary/pages/primary-home-page.tsx");
  const styles = source("components/primary/primary.css");

  assert.match(home, /backendApi\.getTodayWorkspace\(today, sectionId \?\? undefined\)/);
  assert.match(home, /payload\.section_id = sectionId/);
  assert.match(home, /primarySections\(\)/);
  assert.match(styles, /\.primary-plan-art img \{[^}]*height: 100% !important/);
  assert.match(styles, /\.primary-plan-scroll::before/);
  assert.match(styles, /grid-auto-columns: 184px/);
});
