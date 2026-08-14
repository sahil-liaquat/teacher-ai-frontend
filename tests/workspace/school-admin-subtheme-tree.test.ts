import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

const WORKSPACE = "components/school-admin/themes/themes-workspace.tsx";

// Sub-theme used to be a free-text label that was never queried, so the theme
// detail could only ever render one flat list. It is now
// primary_curriculum_topics.parent_topic_id: a sub-theme is a topic that other
// topics point at. Both shapes must render naturally:
//
//   Animals → Farm Animals → Cow      (nested)
//   Plants  → Parts of a Plant        (flat — nothing invented)

test("the topic type carries the parent, and marks the old label deprecated", () => {
  const api = read("lib/api.ts");
  assert.match(api, /parent_topic_id\?: string \| null;/);
  // The legacy label stays for existing rows but must not attract new writes.
  assert.match(api, /@deprecated[\s\S]{0,160}subtheme\?: string \| null;/);
});

test("the detail view groups a flat list into an optional two-level tree", () => {
  const source = read(WORKSPACE);
  assert.match(source, /const childrenOf = useMemo\(/, "no parent → children grouping");
  assert.match(source, /topics\.filter\(\(topic\) => !topic\.parent_topic_id\)/, "no root selection");
  // Grouping client-side means no new endpoint and no change for existing
  // consumers, which simply ignore the extra field.
  assert.doesNotMatch(source, /schoolAdminTopicTree|\/topics\/tree/, "invented an endpoint");
});

test("a theme with no nesting still renders as a plain list", () => {
  // roots === every topic when none has a parent, so the flat case needs no
  // special branch and no placeholder sub-theme row.
  const source = read(WORKSPACE);
  assert.match(source, /roots\.length \?/, "flat rendering path missing");
  assert.match(source, /No topics yet\./, "empty state lost");
});

test("a topic can be created under another, which is what makes a sub-theme", () => {
  const source = read(WORKSPACE);
  assert.match(source, /async function addTopicUnder\(parent: PrimaryCurriculumTopic\)/);
  assert.match(source, /parent_topic_id: parent\.id/);
  // and a plain top-level add still passes null rather than omitting the field
  assert.match(source, /parent_topic_id: null/);
});

test("a topic with children is labelled as a sub-theme", () => {
  const source = read(WORKSPACE);
  assert.match(source, /isSubtheme=\{children\.length > 0\}/, "sub-theme is not derived from having children");
  assert.match(source, /Sub-theme<\/span>/, "no visible sub-theme marker");
});

test("the depth limit is explained by the server, not guessed in the UI", () => {
  // The service caps the tree at one level; its 400 carries the reason, so the
  // UI must surface that rather than substituting its own wording.
  const source = read(WORKSPACE);
  assert.match(source, /import \{ getErrorMessage \} from "@\/lib\/errors";/);
  assert.match(source, /Could not add topic[\s\S]{0,120}getErrorMessage\(error/);
});

test("nested topics keep reorder and archive controls", () => {
  // Children render through the same TopicRow, so nothing is lost at depth two.
  const source = read(WORKSPACE);
  const nested = source.slice(source.indexOf("children.slice()"));
  assert.match(nested.slice(0, 400), /<TopicRow/, "children do not use the shared row");
  assert.match(nested.slice(0, 400), /onMove=\{moveTopic\}/);
});

test("master themes stay read-only", () => {
  // Adding a child is offered only when the school owns the theme; a master
  // theme must be customized first.
  const source = read(WORKSPACE);
  assert.match(source, /onAddChild=\{schoolOwned \? \(\) =>/, "add-child is not gated on ownership");
});
