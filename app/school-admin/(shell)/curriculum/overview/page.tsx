"use client";

import { Suspense } from "react";
import { CurriculumOverview } from "@/components/school-admin/curriculum/curriculum-overview";
import { Skeleton } from "@/components/ui/skeleton";

export default function CurriculumOverviewPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1320px] space-y-5"><Skeleton className="h-24" /><Skeleton className="h-32" /><Skeleton className="h-64" /></div>}>
      <CurriculumOverview />
    </Suspense>
  );
}
