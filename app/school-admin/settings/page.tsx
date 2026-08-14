"use client";

import { Suspense } from "react";
import { SettingsWorkspace } from "@/components/school-admin/settings/settings-workspace";
import { Skeleton } from "@/components/ui/skeleton";

export default function SchoolSettingsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1320px] space-y-5"><Skeleton className="h-24" /><Skeleton className="h-[420px]" /></div>}>
      <SettingsWorkspace />
    </Suspense>
  );
}
