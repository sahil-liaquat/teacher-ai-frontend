"use client";

import { Suspense } from "react";
import { CurriculumWorkspace } from "@/components/school-admin/curriculum/curriculum-workspace";
import { Skeleton } from "@/components/ui/skeleton";

export default function SchoolCurriculumPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1320px] space-y-5"><Skeleton className="h-24" /><Skeleton className="h-16" /><Skeleton className="h-[520px]" /></div>}>
      <CurriculumWorkspace />
    </Suspense>
  );
}
