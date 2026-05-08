"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { backendApi, normalizeLessonPlanForOutput } from "@/lib/api";
import { LessonPlanOutput } from "@/components/generation-output";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminGenerationDetailPage() {
  const params = useParams<{ id: string }>();
  const generation = useQuery({ queryKey: ["admin-generation", params.id], queryFn: () => backendApi.lessonPlan(params.id) });
  const output = generation.data ? normalizeLessonPlanForOutput(generation.data) : null;

  if (generation.isLoading) {
    return <Card><CardContent className="p-6 text-sm font-semibold text-[#52617d]">Loading generation...</CardContent></Card>;
  }

  if (generation.error || !output) {
    return (
      <Card>
        <CardContent className="p-6">
          <h1 className="text-xl font-black text-red-700">Could not load generation</h1>
          <p className="mt-2 text-sm text-[#52617d]">{generation.error instanceof Error ? generation.error.message : "This backend exposes lesson-plan detail records only."}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      <PageHeader title={output.title || "Generated lesson plan"} description="Rendered from the live backend lesson-plan record." />
      <LessonPlanOutput output={output} streamKey={`admin-generation-${params.id}`} streamSpeed="instant" />
    </div>
  );
}
