"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { WorkspaceHomeView } from "@/components/workspace/workspace-home";
import { WorkspaceError, WorkspaceSkeleton } from "@/components/workspace/workspace-states";
import { backendApi } from "@/lib/api";
import { topicWorkspaceRoute, workspaceHomeRoute } from "@/lib/workspace/routes.ts";

export default function WorkspacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const legacyWorkspaceId = searchParams.get("workspace");
  const legacyClassId = searchParams.get("class");
  const isLegacyNew = searchParams.get("new") === "1";
  const legacyWorkspace = useQuery({
    queryKey: ["teaching-workspace", legacyWorkspaceId || "legacy-disabled"],
    queryFn: () => backendApi.teachingWorkspace(legacyWorkspaceId!),
    enabled: Boolean(legacyWorkspaceId),
  });
  const legacyClassOverview = useQuery({
    queryKey: ["workspace-class-overview", legacyClassId || "legacy-disabled"],
    queryFn: () => backendApi.workspaceClassOverview(legacyClassId!),
    enabled: Boolean(legacyClassId) && !legacyWorkspaceId,
  });
  const classCurrentTopic = legacyClassOverview.data?.class_summary?.current_topic;
  const chapterToOpen = classCurrentTopic ? null : legacyClassOverview.data?.available_chapters[0];
  const legacyChapterWorkspace = useQuery({
    queryKey: ["open-workspace-chapter", chapterToOpen?.chapter_id || "legacy-disabled"],
    queryFn: () => backendApi.openWorkspaceChapter(chapterToOpen!.chapter_id),
    enabled: Boolean(legacyClassId && !legacyWorkspaceId && chapterToOpen),
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  useEffect(() => {
    if (isLegacyNew) {
      router.replace("/dashboard/textbooks");
      return;
    }
    if (legacyWorkspace.data) {
      const topic = legacyWorkspace.data.topics.find((item) => item.is_current) || legacyWorkspace.data.topics[0];
      router.replace(topic ? topicWorkspaceRoute(legacyWorkspace.data.id, topic.id) : workspaceHomeRoute());
      return;
    }
    if (!legacyWorkspaceId && legacyClassId && classCurrentTopic) {
      router.replace(topicWorkspaceRoute(classCurrentTopic.workspace_id, classCurrentTopic.topic.id));
      return;
    }
    if (!legacyWorkspaceId && legacyClassId && legacyChapterWorkspace.data) {
      const topic = legacyChapterWorkspace.data.topics.find((item) => item.is_current) || legacyChapterWorkspace.data.topics[0];
      router.replace(topic ? topicWorkspaceRoute(legacyChapterWorkspace.data.id, topic.id) : `${workspaceHomeRoute()}#recent-chapters`);
      return;
    }
    if (!legacyWorkspaceId && legacyClassId && legacyClassOverview.data && !classCurrentTopic && !chapterToOpen) {
      router.replace(`${workspaceHomeRoute()}#recent-chapters`);
    }
  }, [chapterToOpen, classCurrentTopic, isLegacyNew, legacyChapterWorkspace.data, legacyClassId, legacyClassOverview.data, legacyWorkspace.data, legacyWorkspaceId, router]);

  if (isLegacyNew || legacyClassId || legacyWorkspaceId) {
    if (legacyWorkspace.isError) return <WorkspaceError title="This workspace link could not be opened" onRetry={() => void legacyWorkspace.refetch()} />;
    if (legacyClassOverview.isError) return <WorkspaceError title="This class could not be opened" onRetry={() => void legacyClassOverview.refetch()} />;
    if (legacyChapterWorkspace.isError) return <WorkspaceError title="This chapter could not be opened" onRetry={() => void legacyChapterWorkspace.refetch()} />;
    return <WorkspaceSkeleton />;
  }
  return <WorkspaceHomeView />;
}
