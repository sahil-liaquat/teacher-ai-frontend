"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { backendApi, type TeachingWorkspace, type WorkspaceResourceType, type WorkspaceTopic } from "@/lib/api";
import { workspaceHomeQueryKey } from "./use-workspace-home";

export function useTopicWorkspace(workspaceId: string, topicId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["workspace-topic", workspaceId, topicId] as const;
  const query = useQuery({ queryKey, queryFn: () => backendApi.teachingWorkspace(workspaceId), staleTime: 10_000 });

  function store(workspace: TeachingWorkspace) {
    queryClient.setQueryData(queryKey, workspace);
    queryClient.setQueryData(["teaching-workspace", workspace.id], workspace);
  }

  function refreshRelated(workspace: TeachingWorkspace) {
    store(workspace);
    void queryClient.invalidateQueries({ queryKey: workspaceHomeQueryKey });
    void queryClient.invalidateQueries({ queryKey: ["workspace-class", workspace.class_id] });
    void queryClient.invalidateQueries({ queryKey: ["workspace-navigation"] });
  }

  const topicMutation = useMutation({
    mutationFn: (payload: Partial<Pick<WorkspaceTopic, "title" | "description" | "status" | "is_current" | "is_ready_to_teach" | "scheduled_at" | "teacher_notes">>) => backendApi.updateTeachingWorkspaceTopic(workspaceId, topicId, payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TeachingWorkspace>(queryKey);
      if (previous) store({ ...previous, topics: previous.topics.map((topic) => topic.id === topicId ? { ...topic, ...payload } : payload.is_current ? { ...topic, is_current: false } : topic) });
      return { previous };
    },
    onError: (_error, _payload, context) => { if (context?.previous) store(context.previous); },
    onSuccess: refreshRelated,
  });

  const workspaceMutation = useMutation({
    mutationFn: (payload: Partial<Pick<TeachingWorkspace, "section" | "lesson_duration_minutes" | "is_archived" | "is_bookmarked" | "resource_preferences">>) => backendApi.updateTeachingWorkspace(workspaceId, payload),
    onSuccess: refreshRelated,
  });

  const resourceMutation = useMutation({
    mutationFn: ({ type, status }: { type: WorkspaceResourceType; status: "skipped" | "missing" }) => backendApi.updateTeachingWorkspaceResource(workspaceId, topicId, type, status),
    onSuccess: refreshRelated,
  });

  return {
    query,
    workspace: query.data,
    topic: query.data?.topics.find((topic) => topic.id === topicId),
    topicMutation,
    workspaceMutation,
    resourceMutation,
    busy: topicMutation.isPending || workspaceMutation.isPending || resourceMutation.isPending,
  };
}

