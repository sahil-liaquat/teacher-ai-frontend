import type {
  TeachingWorkspace,
  WorkspaceAttentionItem,
  WorkspaceAttentionKind,
  WorkspaceHomeClass,
  WorkspaceHomeTopic,
} from "../api";
import { getPreparationSummary } from "./readiness.ts";
import type { AttentionGroup } from "./types";

function timestamp(value: string | null | undefined) {
  return value ? new Date(value).getTime() : 0;
}

function latestGenerationTimestamp(item: WorkspaceHomeTopic) {
  return Math.max(0, ...item.topic.resources.map((resource) => timestamp(resource.generated_at)));
}

export function flattenWorkspaceTopics(workspaces: TeachingWorkspace[]): WorkspaceHomeTopic[] {
  return workspaces.flatMap((workspace) => workspace.topics.map((topic) => {
    const lastGeneratedAt = topic.resources.reduce<string | null>((latest, resource) => {
      if (!resource.generated_at) return latest;
      if (!latest) return resource.generated_at;
      return new Date(resource.generated_at).getTime() > new Date(latest).getTime() ? resource.generated_at : latest;
    }, null);
    return {
      workspace_id: workspace.id,
      workspace_is_archived: workspace.is_archived,
      topic,
      board_code: workspace.board_code,
      class_id: workspace.class_id,
      class_name: workspace.class_name,
      subject: workspace.subject,
      chapter_id: workspace.chapter_id,
      chapter_number: workspace.chapter_number,
      chapter_title: workspace.chapter_title,
      section: workspace.section,
      lesson_duration_minutes: workspace.lesson_duration_minutes,
      resource_preferences: workspace.resource_preferences,
      last_opened_at: workspace.last_opened_at,
      last_generated_at: lastGeneratedAt,
    };
  }));
}

export function selectContinuePreparing(topics: WorkspaceHomeTopic[]) {
  const latestGenerated = [...topics]
    .filter((item) => !item.workspace_is_archived && latestGenerationTimestamp(item) > 0)
    .sort((left, right) => latestGenerationTimestamp(right) - latestGenerationTimestamp(left));
  if (latestGenerated[0]) return latestGenerated[0];

  const active = topics.filter((item) => !item.workspace_is_archived && item.topic.status !== "completed");
  if (!active.length) {
    return [...topics]
      .filter((item) => !item.workspace_is_archived)
      .sort((left, right) => timestamp(right.last_opened_at) - timestamp(left.last_opened_at))[0] || null;
  }

  const now = Date.now();
  const scheduled = active
    .filter((item) => timestamp(item.topic.scheduled_at) >= now)
    .sort((left, right) => timestamp(left.topic.scheduled_at) - timestamp(right.topic.scheduled_at));
  if (scheduled[0]) return scheduled[0];

  const current = active
    .filter((item) => item.topic.is_current)
    .sort((left, right) => timestamp(right.last_opened_at) - timestamp(left.last_opened_at));
  if (current[0]) return current[0];

  return active.sort((left, right) => timestamp(right.last_opened_at) - timestamp(left.last_opened_at))[0] || null;
}

const attentionLabels: Record<WorkspaceAttentionKind, (count: number) => string> = {
  failed_resource: (count) => `${count} resource${count === 1 ? "" : "s"} failed to generate`,
  generating_resource: (count) => `${count} resource${count === 1 ? " is" : "s are"} still generating`,
  upcoming_not_ready: (count) => `${count} upcoming topic${count === 1 ? " is" : "s are"} not ready`,
  missing_assessment: (count) => `${count} taught topic${count === 1 ? " has" : "s have"} no assessment`,
  long_incomplete: (count) => `${count} topic${count === 1 ? " has" : "s have"} been in progress for over 7 days`,
  stale_resource: (count) => `${count} resource${count === 1 ? " needs" : "s need"} an update`,
  skipped_resource: (count) => `${count} required resource${count === 1 ? " is" : "s are"} skipped`,
};

export function groupAttention(items: WorkspaceAttentionItem[]): AttentionGroup[] {
  const groups = new Map<WorkspaceAttentionKind, AttentionGroup>();
  items.forEach((item) => {
    const current = groups.get(item.kind);
    const count = (current?.count || 0) + 1;
    groups.set(item.kind, {
      kind: item.kind,
      count,
      priority: Math.min(current?.priority ?? item.priority, item.priority),
      label: attentionLabels[item.kind](count),
    });
  });
  return Array.from(groups.values()).sort((left, right) => left.priority - right.priority);
}

export function topicNeedsAttention(item: WorkspaceHomeTopic) {
  const summary = getPreparationSummary(item.topic, item.resource_preferences);
  return summary.state === "needs_attention" || summary.state === "generating" || summary.missingCount > 0;
}

export function aggregateClasses(topics: WorkspaceHomeTopic[]): WorkspaceHomeClass[] {
  const byClass = new Map<string, WorkspaceHomeTopic[]>();
  topics.filter((item) => !item.workspace_is_archived).forEach((item) => {
    byClass.set(item.class_id, [...(byClass.get(item.class_id) || []), item]);
  });
  return Array.from(byClass.entries()).map(([classId, items]) => {
    const sorted = [...items].sort((left, right) => timestamp(right.last_opened_at) - timestamp(left.last_opened_at));
    const currentTopic = sorted.find((item) => item.topic.is_current) || sorted.find((item) => item.topic.status !== "completed") || sorted[0] || null;
    return {
      class_id: classId,
      class_name: sorted[0]?.class_name || "Class",
      grade_number: Number((sorted[0]?.class_name || "").match(/\d+/)?.[0] || 0),
      board_code: sorted[0]?.board_code || "",
      subjects: Array.from(new Set(sorted.map((item) => item.subject))).sort(),
      current_topic: currentTopic,
      ready_topics: sorted.filter((item) => getPreparationSummary(item.topic, item.resource_preferences).state === "ready").length,
      attention_topics: sorted.filter(topicNeedsAttention).length,
      last_activity_at: sorted[0]?.last_opened_at || new Date(0).toISOString(),
    };
  }).sort((left, right) => timestamp(right.last_activity_at) - timestamp(left.last_activity_at));
}
