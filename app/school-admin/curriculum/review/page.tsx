"use client";

import { Suspense } from "react";
import { ReviewPublishWorkspace } from "@/components/school-admin/curriculum/review-publish-workspace";
import { Skeleton } from "@/components/ui/skeleton";

export default function SchoolCurriculumReviewPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1320px] space-y-5"><Skeleton className="h-24" /><Skeleton className="h-32" /><Skeleton className="h-[420px]" /></div>}>
      <ReviewPublishWorkspace />
    </Suspense>
  );
}
