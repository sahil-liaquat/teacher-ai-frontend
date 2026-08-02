#!/usr/bin/env node
/**
 * Exports the Primary seed data out of TypeScript and into JSON for the backend
 * importer. The source of truth is still `lib/*.ts` at this point — after Task
 * 14 deletes those modules, this JSON is the only copy, so keep the output
 * committed alongside the backend script.
 *
 * Usage:
 *   node --experimental-strip-types scripts/export-primary-seed.mjs \
 *     > ../backend/scripts/primary-seed.json
 */
import { PRIMARY_RESOURCES } from "../lib/primary-resource-catalog.ts";
import { THEME_LESSON_DATA_FOR_SEED, THEMES_BY_SUBJECT_FOR_SEED } from "../lib/teaching-kit.ts";

process.stdout.write(JSON.stringify({
  resources: PRIMARY_RESOURCES,
  themes: THEMES_BY_SUBJECT_FOR_SEED,
  lessons: THEME_LESSON_DATA_FOR_SEED,
}, null, 2));
