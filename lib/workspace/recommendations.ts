import type { WorkspaceResource, WorkspaceResourceType, WorkspaceTopic } from "../api";
import { getPreparationSummary } from "./readiness.ts";
import type { TopicRecommendation } from "./types";

const resourceOrder: WorkspaceResourceType[] = [
  "lesson_plan",
  "presentation",
  "worksheet",
  "activity",
  "notes",
];

const resourceLabels: Record<WorkspaceResourceType, string> = {
  lesson_plan: "lesson plan",
  presentation: "presentation",
  worksheet: "worksheet",
  activity: "classroom activity",
  notes: "teaching notes",
};

function resourceRecommendation(resource: WorkspaceResource, mode: "retry" | "review" | "create" | "update"): TopicRecommendation {
  const label = resourceLabels[resource.type];
  if (mode === "retry") {
    return {
      kind: "resource",
      title: `Retry the ${label}`,
      description: "The previous generation did not finish. Retry it before preparing anything else.",
      actionLabel: `Retry ${titleCase(label)}`,
      href: resource.href,
      resourceType: resource.type,
      resourceStatus: resource.status,
    };
  }
  if (mode === "review") {
    return {
      kind: "resource",
      title: `Review the ${label} in progress`,
      description: "This resource is still being prepared. Check its progress before starting another version.",
      actionLabel: "View Progress",
      href: resource.href,
      resourceType: resource.type,
      resourceStatus: resource.status,
    };
  }
  if (mode === "update") {
    return {
      kind: "resource",
      title: `Update the ${label}`,
      description: "This resource may no longer match the latest topic details. Refresh it before teaching.",
      actionLabel: `Update ${titleCase(label)}`,
      href: resource.href,
      resourceType: resource.type,
      resourceStatus: resource.status,
    };
  }
  const descriptions: Record<WorkspaceResourceType, string> = {
    lesson_plan: "Start with the teaching sequence, objectives, and timing for this topic.",
    presentation: "Turn the lesson flow into clear classroom visuals and explanations.",
    worksheet: "Add student practice and a quick understanding check before the lesson.",
    activity: "Plan an active classroom moment that helps students apply the concept.",
    notes: "Create concise teaching notes for explanations, examples, and revision.",
  };
  return {
    kind: "resource",
    title: `Create a ${label}`,
    description: descriptions[resource.type],
    actionLabel: `Generate ${titleCase(label)}`,
    href: resource.href,
    resourceType: resource.type,
    resourceStatus: resource.status,
  };
}

export function getTopicRecommendation(topic: WorkspaceTopic, requiredTypes?: WorkspaceResourceType[]): TopicRecommendation {
  const resources = requiredTypes?.length
    ? topic.resources.filter((resource) => requiredTypes.includes(resource.type))
    : topic.resources;

  const failed = resources.find((resource) => resource.status === "failed");
  if (failed) return resourceRecommendation(failed, "retry");

  const generating = resources.find((resource) => resource.status === "generating");
  if (generating) return resourceRecommendation(generating, "review");

  for (const type of resourceOrder) {
    const resource = resources.find((item) => item.type === type);
    if (resource?.status === "missing") return resourceRecommendation(resource, "create");
  }

  const stale = resources.find((resource) => resource.status === "stale");
  if (stale) return resourceRecommendation(stale, "update");

  if (!topic.is_ready_to_teach) {
    return {
      kind: "mark_ready",
      title: "Confirm this topic is ready to teach",
      description: `${getPreparationSummary(topic, requiredTypes).readyCount} resources are ready. Confirm when the preparation is classroom-ready.`,
      actionLabel: "Mark Ready to Teach",
    };
  }

  if (topic.status !== "completed") {
    return {
      kind: "mark_taught",
      title: "Teach this topic",
      description: "Preparation is ready. Mark the topic as taught after the lesson to move to what comes next.",
      actionLabel: "Mark as Taught",
    };
  }

  return {
    kind: "reflection",
    title: "Add a teaching reflection",
    description: "Capture what worked and what you would change while the lesson is still fresh.",
    actionLabel: "Add Reflection",
  };
}

export function titleCase(value: string) {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}
