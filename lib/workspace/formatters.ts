import type { WorkspaceResourceStatus, WorkspaceResourceType } from "../api";

export const resourceLabels: Record<WorkspaceResourceType, string> = {
  lesson_plan: "Lesson Plan",
  presentation: "Presentation",
  worksheet: "Worksheet",
  activity: "Classroom Activity",
  notes: "Teaching Notes",
};

export const resourceDescriptions: Record<WorkspaceResourceType, string> = {
  lesson_plan: "Objectives, teaching sequence, timing, and classroom guidance.",
  presentation: "Classroom-ready slides for explanation and discussion.",
  worksheet: "Student practice and an understanding check.",
  activity: "An active learning task for classroom application.",
  notes: "Concise explanations, examples, and revision points.",
};

export const resourceStatusLabels: Record<WorkspaceResourceStatus, string> = {
  missing: "Not created",
  ready: "Ready",
  skipped: "Skipped for now",
  generating: "Generating",
  failed: "Generation failed",
  stale: "Needs update",
};

export function relativeTime(value: string) {
  const difference = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(difference / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function teachingDate(value: string | null) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return `Today · ${timeOnly(date)}`;
  if (date.toDateString() === tomorrow.toDateString()) return `Tomorrow · ${timeOnly(date)}`;
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(date);
}

function timeOnly(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(date);
}

