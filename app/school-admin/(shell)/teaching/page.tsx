"use client";

import { Suspense } from "react";
import { ExecutionWorkspace } from "@/components/school-admin/teaching/execution-workspace";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Teaching → Coverage.
 *
 * ⚠ Was a foundation page that deliberately showed nothing. It now shows real
 * delivery data, sourced from the statuses teachers set on their own planner
 * activities — never from a date having passed.
 */
export default function SchoolTeachingPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1320px] space-y-5"><Skeleton className="h-24" /><Skeleton className="h-40" /></div>}>
      <ExecutionWorkspace />
    </Suspense>
  );
}
