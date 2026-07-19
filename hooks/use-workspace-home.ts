"use client";

import { useQuery } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";

export const workspaceHomeQueryKey = ["workspace-home"] as const;

export function useWorkspaceHome() {
  return useQuery({
    queryKey: workspaceHomeQueryKey,
    queryFn: backendApi.workspaceHome,
    staleTime: 0,
    refetchOnMount: "always",
  });
}
