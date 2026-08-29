import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { mapFontSize } from "../lib/type-scale.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = dirname(scriptDir);

const SCAN_EXTENSIONS = new Set([".ts", ".tsx"]);

// Mirrors check-design-tokens.mjs exactly — that script is the source of truth
// for what "the authenticated app" means, and the codemod must fix precisely
// the files the guard measures. Keep the two lists identical.
const EXCLUDED_APP_DIRS = new Set([
  "(legal)",
  "academy",
  "ai-tools",
  "auth",
  "boards-curriculums",
  "classroom-activity-generator",
  "featured-teachers",
  "lesson-plan",
  "lesson-plan-generator",
  "login",
  "notes-generator",
  "presentation-generator",
  "pricing",
  "reset-password",
  "school-excellence",
  "signup",
  "worksheet-generator"
]);

const EXCLUDED_APP_FILES = new Set(["page.tsx"]);

const EXCLUDED_COMPONENT_DIRS = new Set(["school-excellence", "legal"]);
const EXCLUDED_COMPONENT_FILES = new Set(["marketing-header.tsx", "marketing-footer.tsx", "landing-client.tsx"]);

// Same pattern as design-guard.ts's arbitrary-font-size rule, split into
// capture groups. Anything the guard flags, this matches.
const ARBITRARY_FONT_SIZE = /\btext-\[([0-9.]+)(px|rem|em)\]/g;

function listFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const info = statSync(full);
    if (info.isDirectory()) {
      out.push(...listFiles(full));
    } else if (SCAN_EXTENSIONS.has(entry.slice(entry.lastIndexOf(".")))) {
      out.push(full);
    }
  }
  return out;
}

function collectDir(dir, excludedDirs, excludedFiles) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const info = statSync(full);
    if (info.isDirectory()) {
      if (excludedDirs.has(entry)) continue;
      out.push(...listFiles(full));
    } else if (SCAN_EXTENSIONS.has(entry.slice(entry.lastIndexOf("."))) && !excludedFiles.has(entry)) {
      out.push(full);
    }
  }
  return out;
}

function collectFiles() {
  return [
    ...collectDir(join(root, "app"), EXCLUDED_APP_DIRS, EXCLUDED_APP_FILES),
    ...collectDir(join(root, "components"), EXCLUDED_COMPONENT_DIRS, EXCLUDED_COMPONENT_FILES)
  ];
}

const skipped = [];

/** The token class for one arbitrary value, or null when it must stay human-decided. */
function tokenFor(number, unit, file, line) {
  // em resolves against the *parent's* computed size, so there is no single
  // pixel value to map: 1.5em is 18px under a 12px parent and 36px under 24px.
  // Match it (the guard does) but never guess it.
  if (unit === "em") {
    skipped.push({ file, line, value: `text-[${number}${unit}]`, reason: "em is relative to the parent font size" });
    return null;
  }
  // The guard's [0-9.]+ also matches junk like text-[1.2.3px], which Number()
  // turns into NaN and mapFontSize would silently band as text-display.
  if (!/^[0-9]+(\.[0-9]+)?$/.test(number)) {
    skipped.push({ file, line, value: `text-[${number}${unit}]`, reason: "not a plain decimal number" });
    return null;
  }
  return mapFontSize(unit === "rem" ? Number(number) * 16 : Number(number));
}

function rewrite(source, file) {
  const replacements = new Map();
  let line = 1;
  let cursor = 0;

  const next = source.replace(ARBITRARY_FONT_SIZE, (match, number, unit, offset) => {
    for (; cursor < offset; cursor += 1) if (source[cursor] === "\n") line += 1;
    const token = tokenFor(number, unit, file, line);
    if (token === null) return match;
    const key = `${match} → ${token}`;
    replacements.set(key, (replacements.get(key) || 0) + 1);
    return token;
  });

  return { next, replacements };
}

const write = process.argv.includes("--write");

let filesChanged = 0;
let total = 0;

for (const file of collectFiles()) {
  const source = readFileSync(file, "utf8");
  if (!source.includes("text-[")) continue;

  const relativeFile = relative(root, file);
  const { next, replacements } = rewrite(source, relativeFile);
  if (next === source) continue;

  filesChanged += 1;
  process.stdout.write(`${relativeFile}\n`);
  for (const [change, count] of [...replacements.entries()].sort()) {
    total += count;
    process.stdout.write(`  ${change}  ×${count}\n`);
  }

  if (write) writeFileSync(file, next);
}

process.stdout.write(`\n${total} replacement(s) across ${filesChanged} file(s).\n`);

if (skipped.length > 0) {
  process.stdout.write(`\n${skipped.length} value(s) left for a human:\n`);
  for (const item of skipped) {
    process.stdout.write(`  ${item.file}:${item.line}  ${item.value} — ${item.reason}\n`);
  }
}

process.stdout.write(write ? "\nFiles written.\n" : "\nDry run. Re-run with --write to apply.\n");
