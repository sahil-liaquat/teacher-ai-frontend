import type { WorkspaceResource, WorkspaceResourceType } from "../api";
import { resourceLabels } from "./formatters.ts";

export const missionResourceOrder: WorkspaceResourceType[] = [
  "lesson_plan",
  "worksheet",
  "presentation",
  "notes",
  "activity",
];

export type MissionProgress = {
  createdCount: number;
  generatingCount: number;
  remainingCount: number;
  percentage: number;
  estimatedMinutes: number;
  status: "not_started" | "in_progress" | "ready";
};

export type MissionRecommendation = {
  resourceType: WorkspaceResourceType | null;
  title: string;
  actionLabel: string;
  action: "generate" | "open";
};

export function getMissionProgress(resources: WorkspaceResource[]): MissionProgress {
  const visible = missionResourceOrder.map((type) => resources.find((resource) => resource.type === type));
  const createdCount = visible.filter((resource) => resource?.status === "ready").length;
  const generatingCount = visible.filter((resource) => resource?.status === "generating").length;
  const remainingCount = missionResourceOrder.length - createdCount;
  const hasStarted = visible.some((resource) => resource && ["ready", "generating", "failed", "stale"].includes(resource.status));

  return {
    createdCount,
    generatingCount,
    remainingCount,
    percentage: Math.round((createdCount / missionResourceOrder.length) * 100),
    estimatedMinutes: remainingCount * 4,
    status: createdCount === missionResourceOrder.length
      ? "ready"
      : !hasStarted
        ? "not_started"
        : "in_progress",
  };
}

export function getMissionRecommendation(resources: WorkspaceResource[]): MissionRecommendation {
  const next = missionResourceOrder
    .map((type) => resources.find((resource) => resource.type === type))
    .find((resource) => resource?.status !== "ready");

  if (!next) {
    return {
      resourceType: null,
      title: "Your chapter is fully prepared. You’re ready to teach.",
      actionLabel: "Open workspace",
      action: "open",
    };
  }

  const label = resourceLabels[next.type];
  if (next.status === "generating") {
    return {
      resourceType: next.type,
      title: `Your ${label.toLowerCase()} is being generated. We’ll keep this workspace up to date.`,
      actionLabel: "View progress",
      action: "open",
    };
  }

  if (next.status === "failed") {
    return {
      resourceType: next.type,
      title: `Your ${label.toLowerCase()} needs another try before you continue.`,
      actionLabel: `Retry ${label}`,
      action: "generate",
    };
  }

  const titles: Record<WorkspaceResourceType, string> = {
    lesson_plan: "Start with a lesson plan to build the foundation for this chapter.",
    worksheet: "Your lesson plan is ready. Generate a worksheet to continue preparing.",
    presentation: "Generate a presentation to complete your classroom preparation.",
    notes: "Add teaching notes so the key explanations are ready when class begins.",
    activity: "Create a classroom activity to turn the chapter into active learning.",
  };

  return {
    resourceType: next.type,
    title: titles[next.type],
    actionLabel: `${next.status === "stale" ? "Update" : "Generate"} ${label}`,
    action: "generate",
  };
}
