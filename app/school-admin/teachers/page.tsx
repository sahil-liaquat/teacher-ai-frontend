import { Suspense } from "react";
import { TeachersWorkspace } from "@/components/school-admin/teachers/teachers-workspace";

export default function SchoolTeachersPage() {
  // The workspace reads its filters from the URL via useSearchParams, which
  // needs a Suspense boundary under the App Router.
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm font-semibold text-slate-500">Loading teachers…</div>}>
      <TeachersWorkspace />
    </Suspense>
  );
}
