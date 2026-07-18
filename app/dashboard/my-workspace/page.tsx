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
    if (!legacyWorkspaceId && legacyClassId) router.replace(`${workspaceHomeRoute()}#recent-chapters`);
  }, [isLegacyNew, legacyClassId, legacyWorkspace.data, legacyWorkspaceId, router, searchParams]);

  if (isLegacyNew || legacyClassId || legacyWorkspaceId) {
    if (legacyWorkspace.isError) return <WorkspaceError title="This workspace link could not be opened" onRetry={() => void legacyWorkspace.refetch()} />;
    return <WorkspaceSkeleton />;
  }
  return <WorkspaceHomeView />;
}
