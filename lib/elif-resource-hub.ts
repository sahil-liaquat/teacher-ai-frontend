import type { LessonPlan } from "@/lib/api";

export type ElifResourceKind = "worksheet" | "presentation" | "notes" | "activity";
export type ElifResourceGenerationState = {
  status: "idle" | "generating" | "success";
  generationId?: string;
};
export type ElifResourceGenerationStates = Record<ElifResourceKind, ElifResourceGenerationState>;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

const resourceKinds: ElifResourceKind[] = ["worksheet", "presentation", "notes", "activity"];

const customizePaths: Record<ElifResourceKind, string> = {
  worksheet: "/dashboard/worksheets/new",
  presentation: "/dashboard/presentation-generator",
  notes: "/dashboard/notes-generator",
  activity: "/dashboard/activity-generator",
};

export function emptyElifResourceStates(): ElifResourceGenerationStates {
  return {
    worksheet: { status: "idle" },
    presentation: { status: "idle" },
    notes: { status: "idle" },
    activity: { status: "idle" },
  };
}

export function readElifResourceStates(lessonPlanId: string, storage: StorageLike): ElifResourceGenerationStates {
  const empty = emptyElifResourceStates();
  try {
    const parsed = JSON.parse(storage.getItem(resourceStateKey(lessonPlanId)) || "null");
    if (!parsed || typeof parsed !== "object") return empty;
    for (const resource of resourceKinds) {
      const saved = parsed[resource];
      if (saved?.status === "success" && typeof saved.generationId === "string" && saved.generationId.trim()) {
        empty[resource] = { status: "success", generationId: saved.generationId };
      }
    }
    return empty;
  } catch {
    return empty;
  }
}

export function writeElifResourceStates(lessonPlanId: string, states: ElifResourceGenerationStates, storage: StorageLike) {
  const stable = emptyElifResourceStates();
  for (const resource of resourceKinds) {
    const state = states[resource];
    if (state.status === "success" && state.generationId) {
      stable[resource] = { status: "success", generationId: state.generationId };
    }
  }
  storage.setItem(resourceStateKey(lessonPlanId), JSON.stringify(stable));
}

export function updateStoredElifResourceState(
  lessonPlanId: string,
  resource: ElifResourceKind,
  state: ElifResourceGenerationState,
  storage: StorageLike,
) {
  const stored = readElifResourceStates(lessonPlanId, storage);
  stored[resource] = state.status === "success" && state.generationId
    ? { status: "success", generationId: state.generationId }
    : { status: "idle" };
  writeElifResourceStates(lessonPlanId, stored, storage);
  return stored;
}

function resourceStateKey(lessonPlanId: string) {
  return `teachpad_elif_resources_${lessonPlanId}`;
}

export function lessonResourceCustomizeHref(resource: ElifResourceKind, lesson?: LessonPlan) {
  const path = customizePaths[resource];
  if (!lesson) return path;

  const metadata = lesson.plan?.metadata || {};
  const query = new URLSearchParams();
  setIfPresent(query, "board", metadata.board);
  setIfPresent(query, "class", lesson.class_name || metadata.grade);
  setIfPresent(query, "subject", lesson.subject || metadata.subject);
  setIfPresent(query, "chapter", lesson.chapter_name || metadata.chapter);
  setIfPresent(query, "topic", lesson.topic || metadata.topic);
  return `${path}?${query.toString()}`;
}

export function lessonResourceOpenHref(resource: ElifResourceKind, generationId: string) {
  const id = encodeURIComponent(generationId);
  if (resource === "worksheet") return `/dashboard/worksheets/${id}?new=true`;
  if (resource === "presentation") return `/dashboard/presentation-generator/output?id=${id}&new=true`;
  if (resource === "notes") return `/dashboard/notes-generator/output?id=${id}&new=true`;
  return `/dashboard/activity-generator/output?id=${id}&new=true`;
}

function setIfPresent(query: URLSearchParams, key: string, value: unknown) {
  const text = String(value ?? "").trim();
  if (text) query.set(key, text);
}
