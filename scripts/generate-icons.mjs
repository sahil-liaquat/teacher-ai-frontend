// Generates the full favicon / PWA icon set from ONE square master PNG.
//
//   Master: public/assets/teachpad-icon.png   (square, >=512px, 1024 ideal,
//           the mark centred with a little padding so the maskable variant
//           keeps the mark inside Android's central 80% safe zone)
//   Run:    npm run icons
//
// Emits:
//   app/favicon.ico                      16/32/48 multi-res (legacy tab/bookmark)
//   app/icon.png                         512  modern rel=icon, alpha preserved
//   app/apple-icon.png                   180  iOS home screen (flattened on white)
//   public/icons/icon-192.png            192  Android / PWA, alpha preserved
//   public/icons/icon-512.png            512  Android / PWA, alpha preserved
//   public/icons/icon-maskable-512.png   512  Android maskable (flattened on white)
//
// Next's file conventions (app/icon.png, app/apple-icon.png, app/favicon.ico)
// auto-inject the <link> tags; app/manifest.ts references the public/icons/* set.

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MASTER = resolve(root, "public/assets/teachpad-icon.png");
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

if (!existsSync(MASTER)) {
  console.error(
    `\n  ✗ Master icon not found:\n      ${MASTER}\n\n` +
      `  Drop a square PNG (>=512x512, 1024 ideal) there, then re-run:\n      npm run icons\n`
  );
  process.exit(1);
}

// Square PNG buffer at `size`. `fit: contain` defends against a slightly
// non-square master; `flatten` paints transparency onto white (iOS/maskable).
const square = (size, { flatten = false } = {}) => {
  let pipe = sharp(MASTER).resize(size, size, { fit: "contain", background: TRANSPARENT });
  if (flatten) pipe = pipe.flatten({ background: WHITE });
  // ensureAlpha() → 4-channel RGBA PNG. Next's metadata image/.ico processor
  // rejects non-RGBA PNGs ("The PNG is not in RGBA format!"), and a master
  // exported without an alpha channel (e.g. a flattened JPEG/PNG) is RGB.
  return pipe.ensureAlpha().png({ force: true }).toBuffer();
};

const write = async (relPath, buf) => {
  const abs = resolve(root, relPath);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, buf);
  console.log(`  ✓ ${relPath}`);
};

// Pack PNG buffers into a multi-resolution .ico (PNG-in-ICO; supported by all
// current browsers). images: [{ size, buffer }].
const buildIco = (images) => {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, buffer }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 => 256)
    e.writeUInt8(size >= 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // palette colour count
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(buffer.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += buffer.length;
    return e;
  });

  return Buffer.concat([header, ...entries, ...images.map((i) => i.buffer)]);
};

console.log(`\n  Generating icons from ${MASTER}\n`);

await write("app/icon.png", await square(512));
await write("public/icons/icon-192.png", await square(192));
await write("public/icons/icon-512.png", await square(512));
await write("app/apple-icon.png", await square(180, { flatten: true }));
await write("public/icons/icon-maskable-512.png", await square(512, { flatten: true }));

const ico = await Promise.all([16, 32, 48].map(async (size) => ({ size, buffer: await square(size) })));
await write("app/favicon.ico", buildIco(ico));

console.log(`\n  ✓ Done.\n`);
