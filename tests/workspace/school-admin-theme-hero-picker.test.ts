import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

const PICKER = "components/shared/primary-hero-image-picker.tsx";
const WORKSPACE = "components/school-admin/themes/themes-workspace.tsx";

// School admins could name a theme but not choose its banner — every school
// theme fell back to whatever the built-in library matched on the name, with no
// way to pick a different one or upload their own. The master surface already
// had that control; this shares it rather than growing a second copy.

test("the picker is shared rather than owned by the master surface", () => {
  assert.equal(existsSync(`${root}/${PICKER}`), true, "picker was not moved out of master-curriculum");
  assert.equal(
    existsSync(`${root}/components/admin/master-curriculum/hero-image-picker.tsx`),
    false,
    "the master copy still exists — two pickers will drift",
  );
  // School Admin must not reach into the master directory for UI.
  assert.doesNotMatch(read(WORKSPACE), /master-curriculum/);
});

test("both surfaces use the one picker", () => {
  for (const path of [
    "components/admin/master-curriculum/theme-engine-panel.tsx",
    "components/admin/master-curriculum/theme-list.tsx",
    WORKSPACE,
  ]) {
    assert.match(
      read(path),
      /import \{ PrimaryHeroImagePicker \} from "@\/components\/shared\/primary-hero-image-picker";/,
      `${path} does not use the shared picker`,
    );
  }
});

test("the upload endpoint is injected, not switched on role", () => {
  const picker = read(PICKER);
  assert.match(picker, /uploadHero\?: \(file: File\) => Promise<\{ path: string \}>/);
  assert.match(picker, /const uploaded = await uploadHero\(file\)/);
  // A single helper that picks its URL from the caller's role is exactly the
  // coupling the master/school split exists to prevent.
  assert.doesNotMatch(picker, /schoolAdmin/, "the shared picker hardcodes a school helper");
});

test("school theme creation posts to the school upload route", () => {
  const api = read("lib/api.ts");
  assert.match(
    api,
    /schoolAdminUploadThemeHero: \(file: File\) => \{[\s\S]{0,220}apiFetch<\{ path: string \}>\("\/school-admin\/media\/hero"/,
  );
  assert.match(read(WORKSPACE), /uploadHero=\{backendApi\.schoolAdminUploadThemeHero\}/);
});

test("master theme creation still posts to the master upload route", () => {
  // The default keeps the master surface behaving exactly as before.
  const picker = read(PICKER);
  assert.match(picker, /uploadHero = backendApi\.adminUploadPrimaryHero/);
  const api = read("lib/api.ts");
  assert.match(api, /adminUploadPrimaryHero:[\s\S]{0,200}"\/admin\/master\/media\/hero"/);
});

test("the chosen hero is saved on the new school theme", () => {
  const source = read(WORKSPACE);
  assert.match(source, /schoolAdminCreateTheme\(\{[^}]*hero_image_url: resolvedHero/);
});

test("an untouched picker still yields the image the card would have shown", () => {
  // Without this the create payload would send an empty hero and the theme
  // would silently differ from the preview the admin was looking at.
  const source = read(WORKSPACE);
  assert.match(source, /const resolvedHero = hero \|\| builtInHeroForThemeName\(name\)\.src/);
  assert.match(source, /import \{ builtInHeroForThemeName \} from "@\/lib\/primary-hero-library";/);
});

test("the picker state resets with the rest of the dialog", () => {
  assert.match(read(WORKSPACE), /setTopics\(""\); setHero\(""\)/);
});

test("both built-in selection and custom upload are offered", () => {
  const picker = read(PICKER);
  assert.match(picker, /Built-in library/);
  assert.match(picker, /PRIMARY_BUILT_IN_HEROES/);
  assert.match(picker, /type="file"/);
  assert.match(picker, /getErrorMessage/, "upload failures would surface a raw error");
});
