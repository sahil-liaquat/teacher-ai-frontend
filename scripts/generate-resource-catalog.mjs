#!/usr/bin/env node
/**
 * Enriches the static Primary resource catalog (lib/primary-resource-catalog.ts)
 * with full search/recommendation metadata: id, subjects, levels, themes,
 * keywords, languages, skills, difficulty, fileUrl, thumbnailUrl and fileType.
 *
 * Every entry must carry the PrimaryResource fields; raw legacy entries
 * (title/category/format/assetPath) are migrated automatically, so new
 * resources can be added in either shape and re-enriched by re-running this.
 * Authors may override the inferred metadata per entry: level, language,
 * difficulty, keywords, subject, theme, topic.
 *
 * Run:  node --experimental-strip-types scripts/generate-resource-catalog.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PRIMARY_RESOURCES } from "../lib/primary-resource-catalog.ts";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CATALOG_PATH = path.join(ROOT, "lib", "primary-resource-catalog.ts");

const ALL_LEVELS = ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5"];

// Default level band per category — young classes get pre-writing/picture
// material, older classes get vocabulary/worksheets. Authors can override
// per entry with an explicit `level` array (e.g. a resource that suits
// multiple bands), and only explicitly suitable resources will reach classes
// outside the band.
const LEVEL_BAND_BY_CATEGORY = {
  "Tracing Sheets": ["Nursery", "LKG", "UKG"],
  "Colouring Pages": ["Nursery", "LKG", "UKG"],
  "Circle Time Prompts": ["Nursery", "LKG", "UKG", "Class 1"],
  Flashcards: ["Nursery", "LKG", "UKG", "Class 1", "Class 2"],
  "Picture Talk Cards": ["LKG", "UKG", "Class 1", "Class 2"],
  "Matching Activities": ["UKG", "Class 1", "Class 2", "Class 3"],
  "Calendar Activities": ["Class 1", "Class 2", "Class 3"],
  "Story Cards": ["Class 1", "Class 2", "Class 3"],
  Worksheets: ["Class 1", "Class 2", "Class 3"],
  "Vocabulary Cards": ["Class 2", "Class 3", "Class 4"],
};

const DIFFICULTY_BY_CATEGORY = {
  "Tracing Sheets": "beginner",
  "Colouring Pages": "beginner",
  "Circle Time Prompts": "beginner",
  Flashcards: "intermediate",
  "Picture Talk Cards": "intermediate",
  "Matching Activities": "intermediate",
  "Calendar Activities": "intermediate",
  "Vocabulary Cards": "intermediate",
  "Story Cards": "advanced",
  Worksheets: "advanced",
};

const KEYWORD_STOPWORDS = new Set([
  "the", "and", "for", "with", "a", "an", "of", "to", "in", "on", "at", "or",
  "sheet", "sheets", "card", "cards", "activity", "activities", "colouring",
  "coloring", "colour", "color", "printable", "worksheet", "worksheets",
  "tracing", "flashcard", "flashcards", "picture", "pictures", "pdf", "png",
  "jpg", "jpeg", "file", "primary", "resource", "resources",
]);

const SUBJECT_RULES = [
  ["Maths", /number|count|shape|pattern|size|long|short|big|small|tall|measure|money|coin|addition|subtract|time|clock|calendar|day|month|tens|units|geometry|height|length|weight/i],
  ["English", /letter|alphabet|abc|phonics|spelling|word|vocab|rhyme|poem|story|read|opposite|preposition|sound|flashcard|picture\s*talk|sentence|syllable/i],
  ["EVS", /family|school|animal|plant|fruit|vegetable|body|sense|season|weather|food|meal|transport|community|helper|water|festival|myself|me\b|home|house|seed|tree|flower|leaf|road|traffic|doctor|police|garden|insect|bird|farm|market/i],
  ["Art & Craft", /colour|color|paint|draw|craft|colouring|coloring|art|rainbow/i],
  ["Music & Movement", /song|rhyme|music|dance|action|sing/i],
  ["Physical Education", /sport|game|exercise|yoga|ball|hop|jump|skip|run/i],
];

const THEME_RULES = [
  ["My Family", /family|home|house|myself|me\b|baby|grandparent|sister|brother|mother|father/i],
  ["My School", /school|classroom|teacher|friend|bag|desk|assembly|book\b/i],
  ["Animals", /animal|farm|wild|sea|pet|bird|zoo|insect|reptile/i],
  ["Fruits & Vegetables", /fruit|vegetable|apple|banana|mango|tomato|market|watermelon/i],
  ["Colours", /colour|color|red|blue|green|yellow|rainbow|paint/i],
  ["Shapes", /shape|circle|square|triangle|rectangle|diamond|star\b/i],
  ["Numbers 1-10", /number|count|one|two|three|four|five|six|seven|eight|nine|ten|objects/i],
  ["Numbers 11-20", /number|eleven|twelve|thirteen|twenty|tens/i],
  ["Plants", /plant|tree|flower|leaf|seed|garden/i],
  ["My Body", /body|hand|face|sense|teeth|wash|feelings|emotion/i],
  ["Seasons & Weather", /season|weather|rain|summer|winter|spring|monsoon|clothes|umbrella/i],
  ["Food", /food|meal|milk|bread|healthy|vegetable|fruit|snack/i],
  ["Transport", /transport|vehicle|bus|\bcar\b|train|road|traffic|cycle|boat|aeroplane|cycle|scooter/i],
  ["Community Helpers", /community|helper|doctor|police|fire|market|shop/i],
  ["Water", /water|river|drink|bottle|rain|ocean|sea/i],
  ["Festivals of India", /festival|diwali|holi|celebration|special|eid|christmas/i],
  ["Rhymes & Poems", /rhyme|poem|song|sing/i],
  ["Patterns", /pattern|ab\b|abc\b|line\b/i],
  ["Counting", /counting|count|match|trace|objects/i],
  ["Myself", /myself|me\b|feelings|name|all about me/i],
];

const CATEGORY_SUBJECT_FALLBACK = {
  Flashcards: "English",
  "Story Cards": "English",
  "Picture Talk Cards": "English",
  "Vocabulary Cards": "English",
  "Circle Time Prompts": "EVS",
  "Calendar Activities": "EVS",
  "Matching Activities": "English",
  Worksheets: "English",
  "Tracing Sheets": "English",
  "Colouring Pages": "Art & Craft",
};

const CATEGORY_SKILLS = {
  "Calendar Activities": ["Routine", "Days & Months", "Speaking"],
  "Circle Time Prompts": ["Speaking", "Listening", "Social Skills"],
  Flashcards: ["Vocabulary", "Visual Recognition", "Memory"],
  "Vocabulary Cards": ["Vocabulary", "Word Recognition", "Reading Readiness"],
  "Story Cards": ["Listening", "Comprehension", "Sequencing"],
  "Picture Talk Cards": ["Speaking", "Observation", "Storytelling"],
  "Matching Activities": ["Observation", "Categorisation", "Visual Discrimination"],
  Worksheets: ["Concept Practice", "Writing", "Fine Motor"],
  "Tracing Sheets": ["Pre-Writing", "Fine Motor", "Handwriting Readiness"],
  "Colouring Pages": ["Fine Motor", "Creativity", "Focus"],
};

const TITLE_SKILL_RULES = [
  [/trace/i, "Pre-Writing"],
  [/match/i, "Matching"],
  [/count/i, "Counting"],
  [/colour|color/i, "Colour Recognition"],
  [/letter|alphabet|phonics|sound/i, "Phonics"],
  [/rhyme|poem|song/i, "Rhyming"],
  [/write/i, "Writing"],
  [/read/i, "Reading"],
  [/sort/i, "Sorting"],
];

const FILE_TYPE_BY_FORMAT = { PNG: "png", JPG: "jpg", JPEG: "jpg", PDF: "pdf" };

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function keywordsFor(title, themes, topic) {
  const words = new Set();
  const add = (text) => {
    for (const token of String(text).toLowerCase().split(/[^a-z0-9]+/)) {
      if (token.length < 3 || KEYWORD_STOPWORDS.has(token)) continue;
      words.add(token);
    }
  };
  add(title);
  for (const theme of themes) add(theme);
  for (const item of topic ?? []) add(item);
  return [...words].slice(0, 16);
}

function derive(resource) {
  const rawFormat = resource.format ?? (resource.fileType ? resource.fileType.toUpperCase() : undefined) ?? (resource.fileUrl?.split(".").pop()?.toUpperCase() ?? "PNG");
  const fileType = FILE_TYPE_BY_FORMAT[rawFormat] ?? "png";
  const fileUrl = resource.fileUrl ?? resource.assetPath;
  if (!fileUrl) throw new Error(`Resource missing fileUrl/assetPath: ${resource.title}`);
  const segments = fileUrl.split("/").filter(Boolean);
  const baseName = segments.pop().replace(/\.(png|jpe?g|pdf)$/i, "");
  const idSegments = segments.slice(-4).filter((segment) => !/^(primary-resources|library|teaching%20resources|teaching\sresources|printable%20activities|printable\sactivities)$/i.test(segment));
  const id = slugify(resource.id ?? [...idSegments, baseName].join("/"));
  const title = resource.title;
  const subjects = SUBJECT_RULES.filter(([, re]) => re.test(title)).map(([name]) => name);
  if (!subjects.length && CATEGORY_SUBJECT_FALLBACK[resource.category]) subjects.push(CATEGORY_SUBJECT_FALLBACK[resource.category]);
  if (!subjects.length) subjects.push("English");
  const themes = THEME_RULES.filter(([, re]) => re.test(title)).map(([name]) => name);
  const skills = [...new Set([...(CATEGORY_SKILLS[resource.category] ?? []), ...TITLE_SKILL_RULES.filter(([re]) => re.test(title)).map(([, skill]) => skill)])];
  const languages = resource.language ?? (/hindi/i.test(title) ? ["Hindi"] : ["English"]);
  const hasExplicitLevels = resource.level && resource.level.length !== ALL_LEVELS.length;
  const levels = hasExplicitLevels
    ? [...new Set(ALL_LEVELS.filter((level) => resource.level.includes(level)))]
    : [...(LEVEL_BAND_BY_CATEGORY[resource.category] ?? ALL_LEVELS)];
  const difficulty = resource.difficulty ?? DIFFICULTY_BY_CATEGORY[resource.category];
  return {
    id,
    title: resource.title,
    category: resource.category,
    subjects: [...new Set([...subjects, ...(resource.subject ?? [])])],
    levels,
    themes: [...new Set([...themes, ...(resource.theme ?? [])])],
    keywords: [...new Set([...keywordsFor(title, themes, resource.topic), ...(resource.keywords ?? [])])].slice(0, 16),
    languages,
    skills,
    ...(difficulty ? { difficulty } : {}),
    fileUrl,
    thumbnailUrl: fileType === "pdf" ? undefined : fileUrl,
    fileType,
  };
}

const ids = new Set();
const seenFileUrls = new Set();
const enriched = [];
for (const resource of PRIMARY_RESOURCES) {
  const entry = derive(resource);
  if (seenFileUrls.has(entry.fileUrl)) continue;
  seenFileUrls.add(entry.fileUrl);
  if (ids.has(entry.id)) throw new Error(`Duplicate id after enrichment: ${entry.id}`);
  ids.add(entry.id);
  enriched.push(entry);
}
const deduped = PRIMARY_RESOURCES.length - enriched.length;

const lines = [
  "// AUTO-GENERATED by scripts/generate-resource-catalog.mjs — do not edit by hand.",
  "// Add new resources to this file (any shape) and re-run the script to re-enrich metadata.",
  "",
  "export type PrimaryResource = {",
  "  id: string;",
  "  title: string;",
  "  category: string;",
  "  subjects: string[];",
  "  levels: string[];",
  "  themes: string[];",
  "  keywords: string[];",
  "  languages: string[];",
  "  skills: string[];",
  '  difficulty?: "beginner" | "intermediate" | "advanced";',
  "  fileUrl: string;",
  "  thumbnailUrl?: string;",
  '  fileType: "pdf" | "png" | "jpg";',
  "};",
  "",
  "export const PRIMARY_RESOURCES: PrimaryResource[] = [",
  ...enriched.map((entry) => `  ${JSON.stringify(entry)},`),
  "];",
  "",
];

writeFileSync(CATALOG_PATH, lines.join("\n"));

const bySubject = {};
const byTheme = {};
const bySkill = {};
const byCategory = {};
for (const entry of enriched) {
  for (const subject of entry.subjects) bySubject[subject] = (bySubject[subject] ?? 0) + 1;
  for (const theme of entry.themes) byTheme[theme] = (byTheme[theme] ?? 0) + 1;
  for (const skill of entry.skills) bySkill[skill] = (bySkill[skill] ?? 0) + 1;
  byCategory[entry.category] = (byCategory[entry.category] ?? 0) + 1;
}
console.log(`Enriched ${enriched.length} resources (removed ${deduped} duplicate file rows) → ${CATALOG_PATH}`);
console.log("By subject:", JSON.stringify(bySubject));
console.log("By theme:", JSON.stringify(byTheme));
console.log("By skill:", JSON.stringify(bySkill));
console.log("By category:", JSON.stringify(byCategory));
console.log("PDFs:", enriched.filter((entry) => entry.fileType === "pdf").length, "· PNGs:", enriched.filter((entry) => entry.fileType === "png").length, "· JPGs:", enriched.filter((entry) => entry.fileType === "jpg").length);
