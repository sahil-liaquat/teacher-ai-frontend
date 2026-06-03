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
const ROUNDED_CORNER_RATIO = 0.18;

if (!existsSync(MASTER)) {
  console.error(
    `\n  ✗ Master icon not found:\n      ${MASTER}\n\n` +
      `  Drop a square PNG (>=512x512, 1024 ideal) there, then re-run:\n      npm run icons\n`
  );
  process.exit(1);
}

// Knock out the (near-white) background: flood-fill transparency inward from all
// four borders. Only white CONNECTED TO AN EDGE is removed, so an enclosed white
// shape — e.g. the knockout "t" inside the blue mark — is preserved. The hard
// mask edge is smoothed by the downscale in square(). A master that is already
// transparent is unaffected (its border pixels aren't near-white & opaque).
const NEAR_WHITE = 238;
const buildTransparentMaster = async () => {
  const { data, info } = await sharp(MASTER).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info; // RGBA → channels === 4
  const isBg = (p) => {
    const i = p * channels;
    return data[i + 3] !== 0 && data[i] >= NEAR_WHITE && data[i + 1] >= NEAR_WHITE && data[i + 2] >= NEAR_WHITE;
  };
  const visited = new Uint8Array(width * height);
  const stack = [];
  const seed = (p) => { if (!visited[p] && isBg(p)) { visited[p] = 1; stack.push(p); } };
  for (let x = 0; x < width; x++) { seed(x); seed((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { seed(y * width); seed(y * width + (width - 1)); }
  while (stack.length) {
    const p = stack.pop();
    data[p * channels + 3] = 0; // background → fully transparent
    const x = p % width, y = (p / width) | 0;
    if (x > 0) seed(p - 1);
    if (x < width - 1) seed(p + 1);
    if (y > 0) seed(p - width);
    if (y < height - 1) seed(p + width);
  }
  return sharp(data, { raw: { width, height, channels } }).png({ force: true }).toBuffer();
};

// The master with its outer background knocked out — source for every icon below.
const SOURCE = await buildTransparentMaster();

const roundedMask = (size) => Buffer.from(
  `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${Math.round(size * ROUNDED_CORNER_RATIO)}" ry="${Math.round(size * ROUNDED_CORNER_RATIO)}" fill="white"/>
  </svg>`
);

// Square PNG buffer at `size`. `fit: contain` defends against a slightly
// non-square master; `flatten` paints transparency onto white for the platforms
// that DON'T support it (iOS apple-icon → black otherwise; Android maskable
// needs a full-bleed background under the OS mask).
const square = (size, { flatten = false, rounded = true } = {}) => {
  let pipe = sharp(SOURCE).resize(size, size, { fit: "contain", background: TRANSPARENT });
  if (flatten) pipe = pipe.flatten({ background: WHITE });
  if (rounded) pipe = pipe.composite([{ input: roundedMask(size), blend: "dest-in" }]);
  // ensureAlpha() → 4-channel RGBA PNG. Next's metadata image/.ico processor
  // rejects non-RGBA PNGs ("The PNG is not in RGBA format!").
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
await write("app/apple-icon.png", await square(180, { flatten: true, rounded: false }));
await write("public/icons/icon-maskable-512.png", await square(512, { flatten: true, rounded: false }));

const ico = await Promise.all([16, 32, 48].map(async (size) => ({ size, buffer: await square(size) })));
await write("app/favicon.ico", buildIco(ico));

console.log(`\n  ✓ Done.\n`);
