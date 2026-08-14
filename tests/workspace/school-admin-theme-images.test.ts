import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

const WORKSPACE = "components/school-admin/themes/themes-workspace.tsx";

// The School Admin theme cards showed an emoji on a gradient and nothing else.
// `/school-admin/themes` was already returning hero_image_url for every theme —
// master and school copies alike — so nothing was missing from the API, the
// schema, or clone-on-write. The card simply never rendered the field.

test("school theme cards render a hero image", () => {
  const source = read(WORKSPACE);
  assert.match(source, /<img\s+src=\{heroImage\}/, "the card renders no hero image");
  assert.match(source, /object-cover/, "the hero is not sized to fill the header band");
});

/** Just the ThemeCard component body. The create dialog lives in the same file
 *  and legitimately reaches for the built-in library to seed its default, so
 *  the "no duplicate resolution" rule is scoped to the card that displays. */
function themeCardSource(): string {
  const source = read(WORKSPACE);
  const start = source.indexOf("function ThemeCard(");
  assert.notEqual(start, -1, "ThemeCard was renamed or removed");
  const rest = source.slice(start + 1);
  const end = rest.indexOf("\nfunction ");
  return end === -1 ? rest : rest.slice(0, end);
}

test("the hero comes from the shared resolver, not a second implementation", () => {
  const card = themeCardSource();
  assert.match(read(WORKSPACE), /import \{ primaryThemeVisuals \} from "@\/lib\/primary-theme-engine";/);
  assert.match(card, /const \{ heroImage \} = primaryThemeVisuals\(theme\)/);

  // Display resolution stays in one place: the card must not reach for
  // hero_image_url, the built-in library, or URL joining on its own.
  assert.doesNotMatch(card, /theme\.hero_image_url/, "card re-reads the raw field");
  assert.doesNotMatch(card, /builtInHeroForThemeName/, "card duplicates the library fallback");
  assert.doesNotMatch(card, /resolveUploadUrl/, "card duplicates URL resolution");
  assert.doesNotMatch(card, /DEFAULT_PRIMARY_HERO_URL/, "card duplicates the default");
});

test("the resolver covers explicit, built-in and default heroes", () => {
  // Proves the three-step fallback the card now depends on actually exists,
  // so a card with no hero_image_url still shows artwork.
  const engine = read("lib/primary-theme-engine.ts");
  assert.match(
    engine,
    /heroImage: resolveUploadUrl\(theme\?\.hero_image_url \|\| \(theme \? builtInHeroForThemeName\(theme\.name\)\.src : DEFAULT_PRIMARY_HERO_URL\)\)/,
  );

  // builtInHeroForThemeName never returns undefined — it falls back to the
  // first built-in — so heroImage is always a usable src.
  const library = read("lib/primary-hero-library.ts");
  assert.match(library, /\?\? PRIMARY_BUILT_IN_HEROES\[0\]/);
  assert.match(library, /if \(!query\) return PRIMARY_BUILT_IN_HEROES\[0\]/);
});

test("built-in hero assets referenced by the library are present", () => {
  const library = read("lib/primary-hero-library.ts");
  const slugs = library.match(/([a-z-]+)\.webp/g) ?? [];
  assert.ok(slugs.length > 0, "no hero assets referenced");
  for (const file of Array.from(new Set(slugs))) {
    assert.equal(
      existsSync(`${root}/public/assets/primary/heroes/${file}`),
      true,
      `missing hero asset ${file}`,
    );
  }
});

test("a failed image still leaves a readable header band", () => {
  // The gradient sits under the <img>, so a 404 degrades to the previous
  // appearance instead of a white gap.
  const source = read(WORKSPACE);
  const band = source.slice(source.indexOf('<div className="relative h-28'));
  assert.match(band.slice(0, 400), /bg-gradient-to-br/, "gradient fallback removed");
  assert.match(band.slice(0, 400), /overflow-hidden/, "image would escape the rounded band");
});

test("the card keeps its emoji, ownership badge and actions", () => {
  // The image is decoration behind existing content — nothing was replaced.
  const source = read(WORKSPACE);
  assert.match(source, /\{theme\.emoji \|\| "🎨"\}/, "emoji dropped");
  assert.match(source, /ownershipLabel\(ownership\)/, "ownership badge dropped");
  assert.match(source, /onClick=\{onOpen\}/, "Open action dropped");
  assert.match(source, /onDuplicate/, "Duplicate action dropped");
  assert.match(source, /kind: "customize", theme/, "Customize action dropped");
});

test("the decorative hero is hidden from assistive technology", () => {
  const source = read(WORKSPACE);
  const img = source.slice(source.indexOf("<img src={heroImage}"));
  assert.match(img.slice(0, 200), /alt=""/, "decorative image needs an empty alt");
  assert.match(img.slice(0, 200), /aria-hidden="true"/);
});

test("master keeps its own hero rendering, and the card stays read-only", () => {
  // Master Curriculum resolves its own preview and must not be pulled onto the
  // school display path.
  const master = read("components/admin/master-curriculum/theme-engine-panel.tsx");
  assert.doesNotMatch(master, /primaryThemeVisuals/, "master panel was altered");

  // Choosing a hero belongs to the create dialog; the card only displays one.
  const card = themeCardSource();
  assert.doesNotMatch(card, /PrimaryHeroImagePicker/, "the card grew an editor");
  // And the school surface never posts to the master upload route.
  assert.doesNotMatch(read(WORKSPACE), /adminUploadPrimaryHero/);
});
