"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { backendApi, normalizeLessonPlanForOutput } from "@/lib/api";
import { LessonPlanOutput } from "@/components/generation-output";
import { AdminPageHeader, AdminPanel, EmptyState, LoadingState, StatusPill, formatDateTime } from "@/components/admin/admin-ui";
import { getErrorMessage } from "@/lib/errors";

export default function AdminGenerationDetailPage() {
  const params = useParams<{ id: string }>();
  const generation = useQuery({ queryKey: ["admin-generation", params.id], queryFn: () => backendApi.lessonPlan(params.id) });
  const output = generation.data ? normalizeLessonPlanForOutput(generation.data) : null;

  if (generation.isLoading) {
    return <LoadingState label="Loading generation" />;
  }

  if (generation.error || !output) {
    return (
      <AdminPanel>
        <EmptyState
          title="Could not load generation"
          description={getErrorMessage(generation.error, "This backend exposes lesson-plan detail records only.")}
        />
      </AdminPanel>
    );
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Generation detail"
        title={output.title || "Generated lesson plan"}
        description="Rendered from the live backend lesson-plan record."
        meta={
          <>
            <StatusPill status="info">Lesson plan</StatusPill>
            <StatusPill status="neutral">{formatDateTime(generation.data?.created_at)}</StatusPill>
          </>
        }
      />
      <AdminPanel
        title="Rendered output"
        description="The lesson plan below is shown exactly through the existing output renderer."
        actions={<FileText className="h-5 w-5 text-slate-500" />}
        contentClassName="bg-slate-50 p-3 sm:p-4"
      >
        <LessonPlanOutput output={output} streamKey={`admin-generation-${params.id}`} streamSpeed="instant" />
      </AdminPanel>
    </>
  );
}
