#!/usr/bin/env node
/**
 * Rewrites lib/primary-resource-catalog.ts so every fileUrl / thumbnailUrl points
 * at Cloudinary instead of /public/primary-resources (~900MB we refuse to commit).
 *
 * Why read Cloudinary back instead of constructing URLs? Cloudinary normalises
 * public_ids on upload (spaces, case, punctuation) and the compressor changes
 * extensions (.png -> .webp). Guessing either produces a catalog full of 404s
 * that nothing detects until a teacher opens the Library. So: upload first,
 * then ask Cloudinary what actually landed, and match on path-minus-extension.
 *
 * Usage:
 *   1. Upload:
 *        cld upload_dir compressed -f teachpad-primary -e -w 8
 *   2. Dump what landed:
 *        cld search "folder:teachpad-primary/*" \
 *          -fi public_id,format,secure_url -n 500 -A -F \
 *          --json cloudinary-assets.json
 *   3. Relink:
 *        node scripts/relink-catalog-to-cloudinary.mjs \
 *          --cloud <cloud_name> --assets /path/to/cloudinary-assets.json
 *
 * Add --dry-run to report coverage without writing the catalog.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CATALOG_PATH = path.join(ROOT, "lib", "primary-resource-catalog.ts");
const UPLOAD_FOLDER = "teachpad-primary";

// Delivery transformations. f_auto/q_auto is the whole reason we're on
// Cloudinary: one master, per-request format and quality.
const THUMB_TX = "f_auto,q_auto,w_400,c_limit";
const FULL_TX = "f_auto,q_auto,w_1600,c_limit";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const cloud = arg("cloud");
const assetsPath = arg("assets");
const dryRun = process.argv.includes("--dry-run");

if (!cloud || !assetsPath) {
  console.error("Missing --cloud <cloud_name> and/or --assets <cloudinary-assets.json>");
  process.exit(1);
}

/**
 * Percent-encode each path segment of a public_id. Cloudinary public_ids can
 * contain spaces (our folders are "Printable Activities", "Teaching Resources"),
 * and an unencoded space in an <Image src> is a broken request. Slashes are
 * path structure, so encode per-segment rather than the whole string.
 */
function encodePublicId(publicId) {
  return publicId.split("/").map(encodeURIComponent).join("/");
}

/** Normalise any path to a comparison key: decoded, lowercased, no extension. */
function keyOf(p) {
  let s = decodeURIComponent(p).replace(/^\/+/, "");
  s = s.replace(/\.[a-z0-9]+$/i, "");
  return s.toLowerCase();
}

// ---- 1. Index what Cloudinary actually has -------------------------------
const raw = JSON.parse(readFileSync(assetsPath, "utf8"));
const resources = Array.isArray(raw) ? raw : (raw.resources ?? []);
if (!resources.length) {
  console.error(`No resources found in ${assetsPath}. Did the upload finish?`);
  process.exit(1);
}

const byKey = new Map();
for (const r of resources) {
  const publicId = r.public_id ?? "";
  // Drop the upload folder prefix so keys line up with local catalog paths.
  const rel = publicId.startsWith(`${UPLOAD_FOLDER}/`)
    ? publicId.slice(UPLOAD_FOLDER.length + 1)
    : publicId;
  byKey.set(keyOf(rel), { publicId, format: r.format, resourceType: r.resource_type ?? "image" });
}
console.log(`Cloudinary assets indexed: ${byKey.size}`);

// ---- 2. Rewrite the catalog ---------------------------------------------
const source = readFileSync(CATALOG_PATH, "utf8");

let matched = 0;
const misses = [];

// Entries are one JSON object per line (the generator emits them that way).
const rewritten = source.replace(/"fileUrl":"([^"]+)"/g, (whole, localUrl) => {
  const hit = byKey.get(keyOf(localUrl));
  if (!hit) {
    misses.push(localUrl);
    return whole;
  }
  matched += 1;
  const isRaw = hit.resourceType === "raw";
  const kind = isRaw ? "raw" : "image";
  const base = `https://res.cloudinary.com/${cloud}/${kind}/upload`;
  const ext = hit.format ? `.${hit.format}` : "";
  // Raw assets (our PDFs) reject image transformations — a /raw/upload/f_auto/...
  // URL errors rather than degrading. Only image assets get a transform segment.
  const tx = isRaw ? "" : `${FULL_TX}/`;
  return `"fileUrl":"${base}/${tx}${encodePublicId(hit.publicId)}${ext}"`;
});

// thumbnailUrl mirrors fileUrl but at grid size. PDFs keep no thumbnail.
const final = rewritten.replace(
  /"fileUrl":"(https:\/\/res\.cloudinary\.com\/[^"]+)","thumbnailUrl":"[^"]*"/g,
  (_whole, full) => {
    const thumb = full.replace(FULL_TX, THUMB_TX);
    return `"fileUrl":"${full}","thumbnailUrl":"${thumb}"`;
  }
);

console.log(`Catalog entries relinked: ${matched}`);
console.log(`Unmatched (left pointing at /public): ${misses.length}`);
if (misses.length) {
  console.log("\nFirst 15 unmatched:");
  for (const m of misses.slice(0, 15)) console.log("  " + m);
  console.log("\nUnmatched entries usually mean the upload is incomplete, or the");
  console.log("compressor skipped a file. Re-run the upload before relinking.");
}

if (dryRun) {
  console.log("\n--dry-run: catalog not written.");
  process.exit(misses.length ? 1 : 0);
}

writeFileSync(CATALOG_PATH, final, "utf8");
console.log(`\nWrote ${CATALOG_PATH}`);
console.log("Next: npx tsc --noEmit && npm run test && npx next build");
