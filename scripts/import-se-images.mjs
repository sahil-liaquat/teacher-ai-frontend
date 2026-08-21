/**
 * One-off import for the /school-excellence illustration set.
 *
 * The source renders are 1.5–2.8 MB PNGs. Ten of the twelve carry a real alpha
 * channel, so they are trimmed of their transparent margin — the page floats
 * them directly on its own background rather than boxing them in a white frame,
 * which only works if the margin is gone.
 *
 * ⚠ The transparent ones are written as **quantised PNG, not WebP**. Modern
 * browsers get WebP either way, because next/image re-encodes on request. But
 * when a client does not send `Accept: image/webp`, next/image falls back to the
 * source family — and a WebP source falls back to *JPEG*, which has no alpha, so
 * every illustration would arrive matted onto solid black. A PNG source falls
 * back to PNG and keeps the transparency. The source bytes are never what a user
 * downloads, so paying for PNG here costs repo size only.
 *
 * Run: node scripts/import-se-images.mjs
 */

import { mkdir, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import sharp from "sharp";

const SOURCE_DIR = join(homedir(), "Downloads");
const OUT_DIR = join(process.cwd(), "public", "landing", "se");

/**
 * source basename → published name.
 * `trim` marks the transparent renders (PNG out, see the note above); the two
 * opaque images have no alpha to protect, so they take the smaller encodings.
 */
const IMAGES = [
  { from: "D3AA308D-E456-467A-92E6-E63F2A2E4ED5.PNG", to: "system-overview", trim: true },
  { from: "B74B1D92-A0B1-4BCD-AD64-FA91699994D8.PNG", to: "implementation-tracking", trim: true },
  { from: "6A040464-C368-4E31-A36C-F43F96623F02.PNG", to: "assessment-grading", trim: true },
  { from: "18A77245-0D8A-4F72-8FE3-73850155A6B8.PNG", to: "teacher-ai-workspace", trim: true },
  { from: "A5E6B49D-1F98-4F3E-8BC1-AA7CD1D941DA.PNG", to: "ai-teaching-assistant", trim: true },
  { from: "322A516F-1E72-4AC6-A35C-67FD638493FB.PNG", to: "teachers-daily-plan", trim: true },
  { from: "D24C999B-7077-4D25-99FE-97200A6C9A4B.PNG", to: "academic-structure", trim: true },
  { from: "B678127F-47F5-4B7C-8351-8D9F02C26B0E.PNG", to: "plan-to-practice", trim: true },
  { from: "C8189C25-A4D3-42D3-AEA1-025544F77E1E.PNG", to: "school-leadership", format: "jpeg" },
  { from: "C205DCC5-A0A3-4D7B-AC0C-E4D144A16DFE.PNG", to: "academic-execution-cycle", trim: true },
  { from: "3948EF06-22A5-426F-8D15-123ACDD3CCC6.PNG", to: "execution-gap", trim: true },
  { from: "0BAAE110-2CA9-4580-8489-EEDE8DE16CC6.PNG", to: "execution-cycle-poster", format: "webp" },
];

const MAX_EDGE = 1600;

async function findSource(name) {
  const direct = join(SOURCE_DIR, name);
  try {
    await stat(direct);
    return direct;
  } catch {
    // Case can differ between the Photos export and the filesystem.
    const entries = await readdir(SOURCE_DIR);
    const match = entries.find((entry) => entry.toLowerCase() === name.toLowerCase());
    if (!match) throw new Error(`source not found: ${name}`);
    return join(SOURCE_DIR, match);
  }
}

await mkdir(OUT_DIR, { recursive: true });

const manifest = [];

for (const image of IMAGES) {
  const source = await findSource(image.from);
  let pipeline = sharp(source);

  if (image.trim) {
    // Trim against fully transparent black. The renders have a faint coloured
    // halo at alpha 0–1, so the threshold has to look past it.
    pipeline = pipeline.trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 12 });
  }

  pipeline = pipeline.resize({
    width: MAX_EDGE,
    height: MAX_EDGE,
    fit: "inside",
    withoutEnlargement: true,
  });

  const extension = image.format === "jpeg" ? "jpg" : image.format === "webp" ? "webp" : "png";
  if (image.format === "jpeg") {
    pipeline = pipeline.jpeg({ quality: 86, mozjpeg: true });
  } else if (image.format === "webp") {
    pipeline = pipeline.webp({ quality: 88, effort: 6 });
  } else {
    // Quantised so the committed source stays reasonable; the alpha channel
    // survives quantisation, which is the whole point of staying on PNG.
    pipeline = pipeline.png({ palette: true, quality: 95, effort: 10, compressionLevel: 9 });
  }

  const target = join(OUT_DIR, `${image.to}.${extension}`);
  const info = await pipeline.toFile(target);
  const before = (await stat(source)).size;

  manifest.push({ name: image.to, file: `${image.to}.${extension}`, width: info.width, height: info.height });

  console.log(
    `${image.to}.${extension}  ${info.width}×${info.height}  ` +
      `${(before / 1024 / 1024).toFixed(2)}MB → ${(info.size / 1024).toFixed(0)}KB`
  );
}

// ─── Social card ─────────────────────────────────────────────────────
// Open Graph consumers do not composite alpha, so the hero render is flattened
// onto the page's own paper tone at the 1.91:1 ratio the spec expects.

const card = await sharp(join(OUT_DIR, "system-overview.png"))
  .resize({ width: 1120, height: 560, fit: "inside" })
  .toBuffer();

const cardInfo = await sharp({
  create: { width: 1200, height: 630, channels: 3, background: { r: 244, g: 248, b: 255 } },
})
  .composite([{ input: card, gravity: "centre" }])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(join(OUT_DIR, "og-school-excellence.jpg"));

console.log(`og-school-excellence.jpg  1200×630  ${(cardInfo.size / 1024).toFixed(0)}KB`);

console.log("\n--- manifest ---");
console.log(JSON.stringify(manifest, null, 2));
