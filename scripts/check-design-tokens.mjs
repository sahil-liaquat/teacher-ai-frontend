import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { findViolations } from "../lib/design-guard.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = dirname(scriptDir);
const baselinePath = join(scriptDir, "design-baseline.json");

const SCAN_EXTENSIONS = new Set([".ts", ".tsx"]);

// Public marketing/pre-auth pages under app/ — not the authenticated app.
// Mirrors the components/marketing-header.tsx & marketing-footer.tsx split:
// everything below is reachable without signing in and sells the product
// rather than running it.
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

function collectAppFiles() {
  const appDir = join(root, "app");
  const out = [];
  for (const entry of readdirSync(appDir)) {
    const full = join(appDir, entry);
    const info = statSync(full);
    if (info.isDirectory()) {
      if (EXCLUDED_APP_DIRS.has(entry)) continue;
      out.push(...listFiles(full));
    } else if (SCAN_EXTENSIONS.has(entry.slice(entry.lastIndexOf("."))) && !EXCLUDED_APP_FILES.has(entry)) {
      out.push(full);
    }
  }
  return out;
}

function collectFiles() {
  const componentsDir = join(root, "components");
  return [...collectAppFiles(), ...listFiles(componentsDir)];
}

// arbitrary-font-size / arbitrary-radius / arbitrary-shadow are one-off style
// decisions: the same value reused many times isn't a new inconsistency, so
// the ratchet tracks how many distinct values are in play. raw-hex and
// sub-12px-font are tracked by occurrence instead — every appearance is its
// own real spot to fix (a hard-coded color, illegible text), not a variant
// to consolidate.
const DISTINCT_RULES = new Set(["arbitrary-font-size", "arbitrary-radius", "arbitrary-shadow"]);

function countViolations() {
  const occurrences = {};
  const distinctValues = {};
  for (const file of collectFiles()) {
    const source = readFileSync(file, "utf8");
    const relativeFile = relative(root, file);
    for (const violation of findViolations(source, relativeFile)) {
      occurrences[violation.rule] = (occurrences[violation.rule] || 0) + 1;
      if (!distinctValues[violation.rule]) distinctValues[violation.rule] = new Set();
      distinctValues[violation.rule].add(violation.value);
    }
  }
  const counts = {};
  for (const rule of Object.keys(occurrences)) {
    counts[rule] = DISTINCT_RULES.has(rule) ? distinctValues[rule].size : occurrences[rule];
  }
  return counts;
}

const writeBaseline = process.argv.includes("--write-baseline");
const counts = countViolations();

if (writeBaseline) {
  writeFileSync(baselinePath, `${JSON.stringify(counts, null, 2)}\n`);
  process.stdout.write(`Wrote ${baselinePath}\n`);
  for (const [rule, count] of Object.entries(counts).sort()) {
    process.stdout.write(`  ${rule}: ${count}\n`);
  }
  process.exit(0);
}

if (!existsSync(baselinePath)) {
  process.stderr.write(`No baseline found at ${baselinePath}. Run with --write-baseline first.\n`);
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
const rules = new Set([...Object.keys(baseline), ...Object.keys(counts)]);

let regressed = false;
for (const rule of [...rules].sort()) {
  const before = baseline[rule] || 0;
  const after = counts[rule] || 0;
  const delta = after - before;
  const marker = delta > 0 ? "+" : "";
  process.stdout.write(`${rule}: ${after} (baseline ${before}, ${marker}${delta})\n`);
  if (delta > 0) regressed = true;
}

if (regressed) {
  process.stderr.write("\nDesign token violations increased. Fix the new occurrences or update the baseline deliberately.\n");
  process.exit(1);
}

process.stdout.write("\nNo new design token violations.\n");
