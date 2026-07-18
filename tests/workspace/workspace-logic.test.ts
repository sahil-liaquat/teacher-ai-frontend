import assert from "node:assert/strict";
import test from "node:test";

import type {
  TeachingWorkspace,
  WorkspaceAttentionItem,
  WorkspaceHomeTopic,
  WorkspaceResourceStatus,
  WorkspaceResourceType,
  WorkspaceTopic,
} from "../../lib/api";
import { aggregateClasses, flattenWorkspaceTopics, groupAttention, selectContinuePreparing } from "../../lib/workspace/aggregation.ts";
import { getTopicRecommendation } from "../../lib/workspace/recommendations.ts";
import { getPreparationSummary } from "../../lib/workspace/readiness.ts";
import { getMissionProgress, getMissionRecommendation } from "../../lib/workspace/mission-control.ts";
import { ensureWorkspaceGeneratorContext, returnTopicRoute, topicWorkspaceRoute } from "../../lib/workspace/routes.ts";
import { getSubjectThumbnail, normalizeSubjectName } from "../../lib/workspace/subject-images.ts";

const resourceTypes: WorkspaceResourceType[] = ["lesson_plan", "presentation", "worksheet", "activity", "notes"];

function topic(overrides: Partial<WorkspaceTopic> = {}): WorkspaceTopic {
  return {
    id: "topic-1",
    title: "Control and Coordination",
    description: null,
    position: 1,
    status: "in_progress",
    is_current: true,
    is_ready_to_teach: false,
    scheduled_at: null,
    completed_at: null,
    teacher_notes: { preparation: "", teaching: "", reflection: "" },
    resources: resourceTypes.map((type) => ({
      type,
      status: "missing",
      generation_id: null,
      href: `/generate/${type}`,
      generate_href: `/generate/${type}`,
      generated_at: null,
      version_count: 0,
    })),
    updated_at: "2026-07-16T10:00:00.000Z",
    ...overrides,
  };
}

function withStatuses(statuses: Partial<Record<WorkspaceResourceType, WorkspaceResourceStatus>>, overrides: Partial<WorkspaceTopic> = {}) {
  const base = topic(overrides);
  return {
    ...base,
    resources: base.resources.map((resource) => ({ ...resource, status: statuses[resource.type] || resource.status })),
  };
}

function homeTopic(overrides: Partial<WorkspaceHomeTopic> = {}): WorkspaceHomeTopic {
  return {
    workspace_id: "workspace-1",
    workspace_is_archived: false,
    topic: topic(),
    board_code: "CBSE",
    class_id: "class-10",
    class_name: "Class 10",
    subject: "Science",
    chapter_id: "chapter-6",
    chapter_number: 6,
    chapter_title: "Control and Coordination",
    section: "A",
    lesson_duration_minutes: 45,
    resource_preferences: resourceTypes,
    last_opened_at: "2026-07-16T10:00:00.000Z",
    ...overrides,
  };
}

test("continue preparing uses the nearest upcoming topic when nothing has been generated", () => {
  const scheduled = homeTopic({
    workspace_id: "scheduled",
    topic: topic({ scheduled_at: "2099-01-02T10:00:00.000Z", is_current: false }),
    last_opened_at: "2020-01-01T00:00:00.000Z",
  });
  const current = homeTopic({ workspace_id: "current", last_opened_at: "2098-01-01T00:00:00.000Z" });
  assert.equal(selectContinuePreparing([current, scheduled])?.workspace_id, "scheduled");
});

test("continue preparing prioritizes the topic with the most recent generation", () => {
  const scheduled = homeTopic({
    workspace_id: "scheduled",
    topic: topic({ scheduled_at: "2099-01-02T10:00:00.000Z", is_current: false }),
  });
  const olderGeneration = homeTopic({
    workspace_id: "older-generation",
    topic: topic({
      resources: topic().resources.map((resource) => resource.type === "lesson_plan"
        ? { ...resource, status: "ready", generated_at: "2026-07-17T09:00:00.000Z" }
        : resource),
    }),
  });
  const latestGeneration = homeTopic({
    workspace_id: "latest-generation",
    topic: topic({
      resources: topic().resources.map((resource) => resource.type === "worksheet"
        ? { ...resource, status: "ready", generated_at: "2026-07-18T09:00:00.000Z" }
        : resource),
    }),
  });

  assert.equal(
    selectContinuePreparing([scheduled, olderGeneration, latestGeneration])?.workspace_id,
    "latest-generation",
  );
});

test("continue preparing falls back to the current topic in the most recent workspace", () => {
  const older = homeTopic({ workspace_id: "older", last_opened_at: "2026-01-01T00:00:00.000Z" });
  const newer = homeTopic({ workspace_id: "newer", last_opened_at: "2026-07-01T00:00:00.000Z" });
  assert.equal(selectContinuePreparing([older, newer])?.workspace_id, "newer");
});

test("recommendations prioritize failed, generating, then missing resources", () => {
  const failed = withStatuses({ presentation: "failed", lesson_plan: "missing" });
  assert.equal(getTopicRecommendation(failed).resourceStatus, "failed");
  const generating = withStatuses({ presentation: "generating", lesson_plan: "missing" });
  assert.equal(getTopicRecommendation(generating).resourceStatus, "generating");
  const missing = withStatuses({ lesson_plan: "ready", presentation: "ready", worksheet: "missing" });
  assert.equal(getTopicRecommendation(missing).resourceType, "worksheet");
});

test("all resources ready recommends manual ready confirmation before marking taught", () => {
  const ready = withStatuses(Object.fromEntries(resourceTypes.map((type) => [type, "ready"])));
  assert.equal(getTopicRecommendation(ready).kind, "mark_ready");
  assert.equal(getTopicRecommendation({ ...ready, is_ready_to_teach: true }).kind, "mark_taught");
});

test("readiness uses explicit labels and never relies on a percentage", () => {
  assert.equal(getPreparationSummary(topic()).label, "Not started");
  assert.equal(getPreparationSummary(withStatuses({ lesson_plan: "ready", presentation: "ready", worksheet: "ready" })).label, "Almost ready");
  assert.equal(getPreparationSummary(withStatuses(Object.fromEntries(resourceTypes.map((type) => [type, "ready"])))).label, "Ready to teach");
  assert.equal(getPreparationSummary(withStatuses({ presentation: "failed" })).label, "Needs attention");
});

test("mission control uses the five-resource teaching sequence", () => {
  const empty = topic();
  assert.equal(getMissionProgress(empty.resources).status, "not_started");
  assert.equal(getMissionRecommendation(empty.resources).resourceType, "lesson_plan");

  const lessonReady = withStatuses({ lesson_plan: "ready" });
  assert.equal(getMissionRecommendation(lessonReady.resources).resourceType, "worksheet");
  assert.match(getMissionRecommendation(lessonReady.resources).title, /lesson plan is ready/i);

  const threeReady = withStatuses({ lesson_plan: "ready", worksheet: "ready", presentation: "ready" });
  assert.deepEqual(getMissionProgress(threeReady.resources), {
    createdCount: 3,
    generatingCount: 0,
    remainingCount: 2,
    percentage: 60,
    estimatedMinutes: 8,
    status: "in_progress",
  });
});

test("mission control recommends teaching when every resource is created", () => {
  const ready = withStatuses(Object.fromEntries(resourceTypes.map((type) => [type, "ready"])));
  assert.equal(getMissionProgress(ready.resources).status, "ready");
  assert.equal(getMissionRecommendation(ready.resources).resourceType, null);
  assert.equal(getMissionRecommendation(ready.resources).action, "open");
});

test("class aggregation reports ready and attention topics", () => {
  const readyTopic = homeTopic({ topic: withStatuses(Object.fromEntries(resourceTypes.map((type) => [type, "ready"]))) });
  const attentionTopic = homeTopic({ workspace_id: "workspace-2", topic: withStatuses({ presentation: "failed" }) });
  const classes = aggregateClasses([readyTopic, attentionTopic]);
  assert.equal(classes[0].ready_topics, 1);
  assert.equal(classes[0].attention_topics, 1);
  assert.equal(classes[0].current_topic?.topic.title, "Control and Coordination");
});

test("needs-attention grouping keeps priority order and actionable counts", () => {
  const item = homeTopic();
  const attention: WorkspaceAttentionItem[] = [
    { kind: "stale_resource", priority: 6, message: "Stale", topic: item },
    { kind: "failed_resource", priority: 1, message: "Failed", topic: item },
    { kind: "failed_resource", priority: 1, message: "Failed", topic: item },
  ];
  const grouped = groupAttention(attention);
  assert.equal(grouped[0].kind, "failed_resource");
  assert.equal(grouped[0].count, 2);
});

test("generator links preserve a direct return to the same topic workspace", () => {
  const href = ensureWorkspaceGeneratorContext("/dashboard/worksheets/new?topic=Control", "workspace-1", "topic-1");
  const params = new URL(`https://teachpad.test${href}`).searchParams;
  assert.equal(params.get("workspace"), "workspace-1");
  assert.equal(params.get("workspace_topic"), "topic-1");
  assert.equal(params.get("return_to"), topicWorkspaceRoute("workspace-1", "topic-1"));
  assert.equal(returnTopicRoute(params), topicWorkspaceRoute("workspace-1", "topic-1"));
});

test("flattening retains archived state for backward-compatible routing decisions", () => {
  const workspace = {
    id: "workspace-1",
    is_archived: true,
    topics: [topic()],
    board_code: "CBSE",
    class_id: "class-10",
    class_name: "Class 10",
    subject: "Science",
    chapter_id: "chapter-6",
    chapter_number: 6,
    chapter_title: "Control and Coordination",
    section: "",
    lesson_duration_minutes: 45,
    resource_preferences: resourceTypes,
    last_opened_at: "2026-07-16T10:00:00.000Z",
  } as TeachingWorkspace;
  assert.equal(flattenWorkspaceTopics([workspace])[0].workspace_is_archived, true);
});

test("subject thumbnails normalize aliases and use a neutral fallback", () => {
  assert.equal(normalizeSubjectName("  Political_Science  "), "political science");
  assert.equal(getSubjectThumbnail("Math").key, "mathematics");
  assert.equal(getSubjectThumbnail("  Maths ").key, "mathematics");
  assert.equal(getSubjectThumbnail("Political Science").key, "politics");
  assert.equal(getSubjectThumbnail("Civics").key, "politics");
  assert.equal(getSubjectThumbnail("Social   Science").key, "social-science");
  assert.equal(getSubjectThumbnail("Robotics").key, "default-education");
  assert.equal(getSubjectThumbnail("Geography").alt, "Geography subject illustration");
});
