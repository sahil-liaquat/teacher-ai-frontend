import type { WorkspaceHomeTopic, WorkspaceResourceType, WorkspaceTopic } from "../api";
import type { AssessmentState, PreparationSummary, TeachingState } from "./types";

const preparationLabels = {
  not_started: "Not started",
  needs_preparation: "Needs preparation",
  almost_ready: "Almost ready",
  ready: "Ready to teach",
  needs_attention: "Needs attention",
  generating: "Generating",
} as const;

export function getPreparationSummary(
  topic: WorkspaceTopic,
  requiredTypes?: WorkspaceResourceType[],
): PreparationSummary {
  const required = requiredTypes?.length
    ? topic.resources.filter((resource) => requiredTypes.includes(resource.type))
    : topic.resources;
  const ready = required.filter((resource) => resource.status === "ready");
  const failedCount = required.filter((resource) => resource.status === "failed").length;
  const generatingCount = required.filter((resource) => resource.status === "generating").length;
  const skippedCount = required.filter((resource) => resource.status === "skipped").length;
  const outstanding = required.filter((resource) => resource.status !== "ready");
  const missingCount = outstanding.length;

  let state: PreparationSummary["state"];
  if (failedCount > 0) state = "needs_attention";
  else if (generatingCount > 0) state = "generating";
  else if (required.length > 0 && ready.length === required.length) state = "ready";
  else if (ready.length === 0) state = "not_started";
  else if (missingCount <= 2) state = "almost_ready";
  else state = "needs_preparation";

  return {
    state,
    label: preparationLabels[state],
    readyCount: ready.length,
    requiredCount: required.length,
    missingCount,
    failedCount,
    generatingCount,
    skippedCount,
    ready,
    outstanding,
  };
}

export function getTeachingState(topic: WorkspaceTopic): TeachingState {
  if (topic.status === "completed") return "taught";
  if (topic.scheduled_at) return "scheduled";
  return "not_taught";
}

export function getTeachingLabel(topic: WorkspaceTopic) {
  const state = getTeachingState(topic);
  return state === "taught" ? "Taught" : state === "scheduled" ? "Scheduled" : "Not taught";
}

export function getAssessmentState(topic: WorkspaceTopic): AssessmentState {
  const reflection = topic.teacher_notes?.reflection?.trim();
  if (reflection) return "reviewed";
  const worksheet = topic.resources.find((resource) => resource.type === "worksheet");
  return worksheet?.status === "ready" ? "prepared" : "not_started";
}

export function getAssessmentLabel(topic: WorkspaceTopic) {
  const state = getAssessmentState(topic);
  return state === "reviewed" ? "Reviewed" : state === "prepared" ? "Prepared" : "Not started";
}

export function isTopicReady(topic: WorkspaceTopic, requiredTypes?: WorkspaceResourceType[]) {
  return topic.is_ready_to_teach || getPreparationSummary(topic, requiredTypes).state === "ready";
}

export function homeTopicPreparation(item: WorkspaceHomeTopic) {
  return getPreparationSummary(item.topic, item.resource_preferences);
}

