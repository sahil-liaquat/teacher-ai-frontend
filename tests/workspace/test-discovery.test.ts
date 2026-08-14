import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * Guard: every test file is actually discovered.
 *
 * The `test` script's pattern used to be UNQUOTED — `node --test
 * tests/**\/*.test.ts`. npm runs scripts through `sh`, and `sh` does not treat
 * `**` as recursive: it collapses to a single `*`, so the pattern really meant
 * `tests/*\/*.test.ts`. Every existing test file happens to sit exactly one
 * directory deep, so nothing was being missed — but a file added at
 * `tests/foo.test.ts` or `tests/a/b/c.test.ts` would have been silently
 * invisible, passing CI by never running.
 *
 * Quoting hands the pattern to Node, which does expand `**` recursively. This
 * test pins that: it counts the test files on disk and asserts the runner's
 * pattern still reaches all of them.
 */

const packageJson = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
) as { scripts: Record<string, string> };

test("the test pattern is quoted so Node expands it, not sh", () => {
  const script = packageJson.scripts.test;
  assert.match(
    script,
    /"tests\/\*\*\/\*\.test\.ts"/,
    "an unquoted ** is collapsed by sh and silently stops finding nested tests",
  );
});

test("every test file on disk is reachable by the runner's pattern", () => {
  const root = new URL("../../", import.meta.url).pathname;

  const onDisk = execFileSync(
    "find",
    ["tests", "-name", "*.test.ts", "-type", "f"],
    { cwd: root, encoding: "utf8" },
  )
    .trim()
    .split("\n")
    .filter(Boolean)
    .sort();

  // The same expansion Node performs for the quoted pattern.
  const reachable = execFileSync(
    "node",
    ["-e", "console.log([...require('node:fs').globSync('tests/**/*.test.ts')].join('\\n'))"],
    { cwd: root, encoding: "utf8" },
  )
    .trim()
    .split("\n")
    .filter(Boolean)
    .sort();

  assert.deepEqual(
    onDisk,
    reachable,
    "a test file exists that the runner's pattern does not reach — it would " +
      "never run and its absence would look like a passing suite",
  );
});
