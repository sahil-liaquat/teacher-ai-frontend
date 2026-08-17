"use client";

import { Suspense } from "react";
import { PlanningWorkspace } from "@/components/school-admin/planning/planning-workspace";
import { Skeleton } from "@/components/ui/skeleton";

export default function SchoolPlanningPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1320px] space-y-5"><Skeleton className="h-24" /><Skeleton className="h-32" /><Skeleton className="h-64" /></div>}>
      <PlanningWorkspace />
    </Suspense>
  );
}
