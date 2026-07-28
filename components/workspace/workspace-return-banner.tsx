"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { returnTopicRoute } from "@/lib/workspace/routes.ts";

export function WorkspaceReturnBanner({ complete = true }: { complete?: boolean }) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const href = returnTopicRoute(searchParams);
  const workspaceId = searchParams.get("workspace");
  const topicId = searchParams.get("workspace_topic");
  useEffect(() => {
    if (!href) return;
    void queryClient.invalidateQueries({ queryKey: ["workspace-home"] });
    if (workspaceId && topicId) void queryClient.invalidateQueries({ queryKey: ["workspace-topic", workspaceId, topicId] });
  }, [href, queryClient, topicId, workspaceId]);
  if (!href) return null;
  return <div className="mb-4 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-sm font-bold text-emerald-900">{complete ? <CheckCircle2 className="h-4 w-4" /> : null}{complete ? "Resource ready in your topic workspace" : "Opened from My Workspace"}</div><Link href={href} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white hover:bg-emerald-800"><ArrowLeft className="h-3.5 w-3.5" />Return to Topic Workspace</Link></div>;
}
