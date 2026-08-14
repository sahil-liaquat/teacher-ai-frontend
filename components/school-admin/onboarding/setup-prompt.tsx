"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles } from "lucide-react";
import { backendApi, type OnboardingState } from "@/lib/api";

const STEP_LABELS: Record<string, string> = {
  framework: "Framework",
  programmes: "Programmes",
  levels: "Levels",
  curriculum: "Curriculum",
  academic_year: "Academic year",
};

/**
 * The only discovery path to guided setup.
 *
 * ⚠ Renders nothing for a completed school. Existing schools were backfilled to
 * `completed`, so they never see this — a working school being nagged to run a
 * setup wizard would be a regression, not an onboarding improvement.
 *
 * ⚠ Names the outstanding steps rather than saying "finish setup". The steps
 * come from the backend's derived readiness, so this cannot claim a step is
 * missing that the school has actually configured elsewhere.
 */
export function SetupPrompt() {
  const onboarding = useQuery<OnboardingState>({
    queryKey: ["school-admin", "onboarding"],
    queryFn: backendApi.schoolAdminOnboarding,
    // Cheap and cached: every Overview render would otherwise re-ask.
    staleTime: 60_000,
    retry: false,
  });

  if (!onboarding.data || onboarding.data.is_complete) return null;

  const outstanding = Object.entries(onboarding.data.readiness)
    .filter(([, done]) => !done)
    .map(([key]) => STEP_LABELS[key] ?? key);

  return (
    <section className="mb-5 rounded-3xl border border-blue-200 bg-blue-50/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-blue-950">Finish setting up your school</p>
            <p className="mt-1 text-sm leading-6 text-blue-900/80">
              {outstanding.length
                ? `Still to do: ${outstanding.join(", ")}.`
                : "Everything is configured — confirm to finish."}
            </p>
          </div>
        </div>
        <Link
          href={`/school-admin/setup?step=${onboarding.data.resume_step}`}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700"
        >
          Continue setup <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
