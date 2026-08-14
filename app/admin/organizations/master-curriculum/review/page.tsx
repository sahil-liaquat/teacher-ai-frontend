"use client";

import { Suspense } from "react";
import { ReviewPublishWorkspace } from "@/components/school-admin/curriculum/review-publish-workspace";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Master Review & Publish now runs the SAME surface as School Admin, with the
 * platform adapter. It previously had its own `master-review.tsx`, which
 * evaluated readiness with the frontend-only rule and offered no bulk publish —
 * two authoring experiences that had already drifted apart.
 */
export default function MasterReviewPage() {
  return (
    <Suspense fallback={<div className="space-y-5"><Skeleton className="h-24" /><Skeleton className="h-32" /><Skeleton className="h-[420px]" /></div>}>
      <ReviewPublishWorkspace scope="platform" />
    </Suspense>
  );
}
