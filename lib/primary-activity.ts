import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backendApi, type PrimaryActivityAction, type PrimaryActivityEntityType, type PrimaryActivityEvent } from "@/lib/api";

export const ACTIVITY_QUERY_KEY = ["primary-activity-events"];

const LOCAL_STORAGE_KEY = "teachpad-primary-activity-events";
const LOCAL_CAP = 50;

export const ACTIVITY_ENTITY_LABELS: Record<PrimaryActivityEntityType, string> = {
  resource: "Resource",
  teaching_kit: "Teaching Kit",
  lesson_plan: "Lesson Plan",
  planner_activity: "Planner Activity",
  assessment: "Assessment",
  ai_creation: "AI Creation",
};

export const ACTIVITY_ACTION_LABELS: Record<PrimaryActivityAction, string> = {
  viewed: "Viewed",
  downloaded: "Downloaded",
  created: "Created",
  edited: "Edited",
  saved: "Added",
};

export function activityHref(event: Pick<PrimaryActivityEvent, "entityType" | "entityId">): string {
  switch (event.entityType) {
    case "teaching_kit":
      return "/primary/teaching-kits";
    case "lesson_plan":
      return "/primary/lesson-plan";
    case "planner_activity":
    case "assessment":
      return "/primary/today";
    case "ai_creation":
      return "/primary/ai-studio";
    case "resource":
    default:
      return `/primary/resource-library?search=${encodeURIComponent(event.entityId)}`;
  }
}

export function activityDisplayName(entityType: PrimaryActivityEntityType, entityId: string, resolvedTitle?: string): string {
  if (resolvedTitle) return resolvedTitle;
  const pretty = (entityId || "").replace(/[_-]+/g, " ").trim();
  if (entityType === "resource") {
    return pretty
      .replace(/^(pdfs|tmp|page)\s+/i, "")
      .replace(/^(file|pages|sheet)\s+/i, "")
      .replace(/\b\d{2}\b/, "")
      .trim() || "Resource";
  }
  return pretty || ACTIVITY_ENTITY_LABELS[entityType];
}

export function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function readLocalEvents(): PrimaryActivityEvent[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((event) => event?.entityType && event?.entityId && event?.action) : [];
  } catch {
    return [];
  }
}

function writeLocalEvents(events: PrimaryActivityEvent[]): void {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events.slice(0, LOCAL_CAP)));
  } catch {
    // storage full or unavailable — history still works via the backend
  }
}

function saveLocalEvent(event: PrimaryActivityEvent): void {
  const events = readLocalEvents();
  const withoutDupes = events.filter((item) => !(item.entityType === event.entityType && item.entityId === event.entityId && item.action === event.action));
  writeLocalEvents([event, ...withoutDupes]);
}

export function useTrackActivity() {
  const queryClient = useQueryClient();
  return useCallback(
    (entityType: PrimaryActivityEntityType, entityId: string, action: PrimaryActivityAction) => {
      const clientEventId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).substring(2));
      const fallback: PrimaryActivityEvent = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: "local",
        entityType,
        entityId,
        action,
        createdAt: new Date().toISOString(),
        clientEventId,
      };
      void backendApi
        .createPrimaryActivityEvent({
          entity_type: entityType,
          entity_id: entityId,
          action,
          client_event_id: clientEventId,
        })
        .then(() => {
          void queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEY });
        })
        .catch(() => saveLocalEvent(fallback));
    },
    [queryClient],
  );
}

export function usePrimaryActivityHistory(limit = 15): { events: PrimaryActivityEvent[]; isLoading: boolean } {
  const [localEvents, setLocalEvents] = useState<PrimaryActivityEvent[]>([]);
  const query = useQuery({
    queryKey: ACTIVITY_QUERY_KEY,
    queryFn: () => backendApi.primaryActivityEvents(limit),
    staleTime: 30_000,
    retry: 1,
  });

  useEffect(() => {
    const sync = () => setLocalEvents(readLocalEvents());
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const events = useMemo(() => {
    const rawEvents = query.isSuccess ? query.data : [];
    const serverEvents: PrimaryActivityEvent[] = (rawEvents as any[]).map((e) => ({
      id: e.id,
      userId: e.user_id || e.userId,
      entityType: e.entity_type || e.entityType,
      entityId: e.entity_id || e.entityId,
      action: e.action,
      createdAt: e.created_at || e.createdAt,
      clientEventId: e.client_event_id || e.clientEventId,
    }));
    
    // 1. Deduplicate server events by clientEventId
    const seenServerClientEventIds = new Set<string>();
    const uniqueServerEvents: PrimaryActivityEvent[] = [];
    for (const event of serverEvents) {
      if (event.clientEventId) {
        if (seenServerClientEventIds.has(event.clientEventId)) {
          continue;
        }
        seenServerClientEventIds.add(event.clientEventId);
      }
      uniqueServerEvents.push(event);
    }

    // 2. Filter local events
    const serverClientEventIds = new Set(
      uniqueServerEvents.map((e) => e.clientEventId).filter((id): id is string => Boolean(id))
    );

    const localOnly = localEvents.filter((localEvent) => {
      if (localEvent.clientEventId) {
        // remove a local fallback only when its client_event_id matches a successfully stored server event
        return !serverClientEventIds.has(localEvent.clientEventId);
      }
      // retain compatibility for legacy events without client event IDs
      return !uniqueServerEvents.some(
        (se) =>
          se.entityType === localEvent.entityType &&
          se.entityId === localEvent.entityId &&
          se.action === localEvent.action
      );
    });

    return [...localOnly, ...uniqueServerEvents]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }, [localEvents, query.isSuccess, query.data, limit]);

  return { events, isLoading: query.isLoading };
}
