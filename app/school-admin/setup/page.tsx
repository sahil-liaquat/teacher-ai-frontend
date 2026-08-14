"use client";

import { Suspense } from "react";
import { SetupWizard } from "@/components/school-admin/onboarding/setup-wizard";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * ⚠ Deliberately absent from SCHOOL_ADMIN_NAV. Setup is a one-time path
 * reachable from the Overview prompt and by URL; a permanent sidebar entry
 * would invite a configured school to redo it.
 */
export default function SchoolSetupPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[900px] space-y-4"><Skeleton className="h-16" /><Skeleton className="h-[420px]" /></div>}>
      <SetupWizard />
    </Suspense>
  );
}
