import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

test("school admin uses one reusable proposal review surface", () => {
  const dialog = read("components/school-admin/ai/ai-proposal-dialog.tsx");
  assert.match(dialog, /Review exactly what will change/);
  assert.match(dialog, /Generate again/);
  assert.match(dialog, /Apply \$\{selected\.size\} selected/);
  assert.match(dialog, /PRIMARY_AI_PROPOSAL_STALE/);
  assert.match(dialog, /disabled=\{applying \|\| selected\.size === 0\}/);
});

test("month and week AI actions call the proposal API instead of placeholder toasts", () => {
  const curriculum = read("components/school-admin/curriculum/curriculum-workspace.tsx");
  assert.match(curriculum, /openAI\("fill_month"/);
  assert.match(curriculum, /openAI\("create_month"/);
  assert.match(curriculum, /openAI\("fill_week"/);
  assert.doesNotMatch(curriculum, /needs the curriculum AI endpoint/);
});

test("block actions are contextual and proposal-first", () => {
  const editor = read("components/school-admin/day-editor/school-day-editor.tsx");
  assert.match(editor, /generate_teacher_instructions/);
  assert.match(editor, /generate_questions/);
  assert.match(editor, /suggest_resources/);
  // A newly-added block carries a temporary client id. Save it first and use
  // the server-issued UUID, otherwise the strict proposal schema returns 422.
  assert.match(editor, /!saved \|\| !isPersistedId\(block\.id\)/);
  assert.match(editor, /savedLesson\.steps\.find\(\(item\) => item\.position === block\.position\)/);
  assert.match(editor, /step_id: persistedBlock\.id/);
  assert.doesNotMatch(editor, /needs the curriculum AI endpoint/);
});

test("frontend apply sends only proposal identity and selected change ids", () => {
  const api = read("lib/api.ts");
  assert.match(api, /schoolAdminApplyCurriculumAIProposal/);
  assert.match(api, /JSON\.stringify\(\{ change_ids: changeIds \}\)/);
  // The browser may pick WHICH stored change to apply, never supply its content.
  assert.doesNotMatch(api, /schoolAdminApplyCurriculumAIProposal:[\s\S]{0,300}proposed/);
});

// ---- surface ownership --------------------------------------------------
//
// These resolve helper NAMES to the URLs they actually request, by parsing
// lib/api.ts. The earlier version of this guard searched component sources for
// a literal "/admin/master" string and passed while curriculum-workspace.tsx
// was calling three master-bound helpers — components call helpers by name, and
// the URL lives in the API client, one file away. Resolving through the client
// is the only check that sees what the browser will actually request.

import { readdirSync, statSync } from "node:fs";

/** helper name -> every URL literal in its definition, parsed from lib/api.ts */
function apiHelperUrls(): Map<string, string[]> {
  const source = read("lib/api.ts");
  const lines = source.split("\n");
  const urls = new Map<string, string[]>();
  let current: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (!current) return;
    const found = buffer.join("\n").match(/["'`](\/[A-Za-z0-9_\-/${}.]*)/g) ?? [];
    urls.set(current, found.map((u) => u.slice(1)));
  };

  for (const line of lines) {
    const start = line.match(/^ {2}([A-Za-z][A-Za-z0-9_]*):/);
    if (start) {
      flush();
      current = start[1];
      buffer = [line];
    } else if (current) {
      buffer.push(line);
    }
  }
  flush();
  return urls;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = `${dir}/${entry}`;
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".tsx") || full.endsWith(".ts")) out.push(full);
  }
  return out;
}

/** A file's source with navigation lines removed.
 *
 * `/admin/master-curriculum` is a Next.js ROUTE and `/school-admin/themes` is
 * both a route and an API prefix, so a raw substring search cannot tell a link
 * from a request. Dropping href/router lines leaves only the lines that could
 * plausibly be a URL handed to fetch.
 */
function withoutNavigation(relativePath: string): string {
  return read(relativePath)
    .split("\n")
    .filter((line) => !/href|router\.(replace|push)|<Link|redirect\(/.test(line))
    .join("\n");
}

/** every backendApi.<helper> call in a file */
function helpersCalledIn(relativePath: string): string[] {
  const matches = read(relativePath).match(/backendApi\.([A-Za-z][A-Za-z0-9_]*)/g) ?? [];
  return Array.from(new Set(matches.map((m) => m.replace("backendApi.", ""))));
}

const HELPER_URLS = apiHelperUrls();

function urlsFor(helper: string): string[] {
  return HELPER_URLS.get(helper) ?? [];
}

test("the api client parser actually resolves helpers (guard against a vacuous guard)", () => {
  // If this ever breaks, every assertion below silently passes on an empty map.
  assert.ok(HELPER_URLS.size > 50, `parsed only ${HELPER_URLS.size} helpers from lib/api.ts`);
  assert.ok(urlsFor("schoolAdminThemes")[0].startsWith("/school-admin/themes"));
  assert.ok(urlsFor("adminPrimaryThemes")[0].startsWith("/admin/master/themes"));
});

test("no School Admin surface file calls a master-bound helper", () => {
  const offenders: string[] = [];
  for (const dir of ["components/school-admin", "app/school-admin"]) {
    let files: string[];
    try {
      files = walk(dir);
    } catch {
      continue; // directory may not exist
    }
    for (const file of files) {
      for (const helper of helpersCalledIn(file)) {
        for (const url of urlsFor(helper)) {
          if (url.startsWith("/admin/master")) {
            offenders.push(`${file}: backendApi.${helper} -> ${url}`);
          }
        }
      }
      // A hand-written API URL would bypass the client entirely. The trailing
      // slash keeps this off the /admin/master-curriculum page route.
      assert.doesNotMatch(
        withoutNavigation(file),
        /["'`]\/admin\/master\//,
        `${file} hardcodes a master API URL`,
      );
    }
  }
  assert.deepEqual(
    offenders,
    [],
    "School Admin calls helpers bound to /admin/master, which is guarded by " +
      "get_current_admin and 403s for an org_admin:\n" + offenders.join("\n"),
  );
});

test("no Master Curriculum surface file calls a school-bound helper", () => {
  const offenders: string[] = [];
  for (const dir of ["components/admin/master-curriculum", "app/admin/master-curriculum"]) {
    let files: string[];
    try {
      files = walk(dir);
    } catch {
      continue;
    }
    for (const file of files) {
      for (const helper of helpersCalledIn(file)) {
        for (const url of urlsFor(helper)) {
          if (url.startsWith("/school-admin")) {
            offenders.push(`${file}: backendApi.${helper} -> ${url}`);
          }
        }
      }
      assert.doesNotMatch(
        withoutNavigation(file),
        /["'`]\/school-admin\//,
        `${file} hardcodes a school API URL`,
      );
      // The dual-purpose flag the cutover removed must not come back.
      assert.doesNotMatch(read(file), /schoolMode/, `${file} reintroduced schoolMode`);
    }
  }
  assert.deepEqual(offenders, [], offenders.join("\n"));
});

test("no helper serves both surfaces by switching URL on the caller", () => {
  for (const [helper, urls] of Array.from(HELPER_URLS.entries())) {
    const master = urls.some((u: string) => u.startsWith("/admin/master"));
    const school = urls.some((u: string) => u.startsWith("/school-admin"));
    assert.ok(
      !(master && school),
      `${helper} points at both surfaces — role-switching helpers are exactly ` +
        "what keeps the two ownership boundaries from staying separate",
    );
  }
});

test("curriculum AI exposes distinct scope-owned helpers for school and master", () => {
  assert.deepEqual(urlsFor("schoolAdminGenerateCurriculumAIProposal"), [
    "/school-admin/curriculum/ai/proposals",
  ]);
  assert.deepEqual(urlsFor("schoolAdminApplyCurriculumAIProposal"), [
    "/school-admin/curriculum/ai/proposals/${proposalId}/apply",
  ]);
  assert.deepEqual(urlsFor("adminGenerateCurriculumAIProposal"), [
    "/admin/master/curriculum/ai/proposals",
  ]);
  assert.deepEqual(urlsFor("adminApplyCurriculumAIProposal"), [
    "/admin/master/curriculum/ai/proposals/${proposalId}/apply",
  ]);
  assert.match(read("lib/curriculum-admin-adapter.ts"), /scope === "platform"/);
});

test("every School Admin curriculum operation has a schoolAdmin* helper", () => {
  // The nine endpoints added when School Admin writes were repaired, plus the
  // ones that already existed. Each must resolve to /school-admin.
  const required = [
    "schoolAdminThemes", "schoolAdminCreateTheme", "schoolAdminUpdateTheme",
    "schoolAdminArchiveTheme", "schoolAdminDeleteTheme", "schoolAdminDuplicateTheme",
    "schoolAdminCreateTopic", "schoolAdminUpdateTopic", "schoolAdminArchiveTopic",
    "schoolAdminAcademicYears", "schoolAdminCreateAcademicYear",
    "schoolAdminUpdateAcademicYear", "schoolAdminCloneAcademicYear",
    "schoolAdminCurriculum", "schoolAdminCurriculumDay", "schoolAdminCreateCurriculumDay",
    "schoolAdminUpdateCurriculumDay", "schoolAdminReplaceCurriculumSteps",
    "schoolAdminPublishCurriculumDay", "schoolAdminDuplicateCurriculumDay",
    "schoolAdminResources", "schoolAdminCreateResource", "schoolAdminUploadResource",
    "schoolAdminUpdateResource", "schoolAdminDeleteResource",
  ];
  for (const helper of required) {
    const urls = urlsFor(helper);
    assert.ok(urls.length > 0, `${helper} is missing from lib/api.ts`);
    for (const url of urls) {
      assert.ok(
        url.startsWith("/school-admin"),
        `${helper} resolves to ${url}, which is not the school surface`,
      );
    }
  }
});
