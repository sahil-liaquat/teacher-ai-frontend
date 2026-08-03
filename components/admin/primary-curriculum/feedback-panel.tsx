"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { backendApi, type PrimaryLevel, type PrimaryStepFeedback } from "@/lib/api";
import { AdminPanel, EmptyState, LoadingState, StatusPill } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatSkipRate, skipSeverity } from "@/lib/primary-feedback";
import { LEVEL_OPTIONS } from "@/components/admin/primary-curriculum/theme-list";

export const ADMIN_PRIMARY_FEEDBACK_QUERY_KEY = "admin-primary-curriculum-feedback";

const SEVERITY_STATUS = {
  danger: "danger",
  warning: "warning",
  neutral: "neutral",
  unknown: "neutral",
} as const;

export function FeedbackPanel() {
  const [level, setLevel] = useState<PrimaryLevel | "">("");

  const feedback = useQuery({
    queryKey: [ADMIN_PRIMARY_FEEDBACK_QUERY_KEY, level],
    queryFn: () => backendApi.adminPrimaryCurriculumFeedback(level ? { level } : undefined),
  });

  const items = feedback.data ?? [];
  const withData = items.filter((item) => item.skip_rate !== null);

  return (
    <AdminPanel
      title="Which steps do teachers skip?"
      description="Aggregated across every teacher who has generated a day against a published step. No student data — this is curriculum signal only."
      actions={
        <Select
          value={level}
          onChange={(event) => setLevel(event.target.value as PrimaryLevel | "")}
          className="w-full sm:w-40"
        >
          <option value="">All levels</option>
          {LEVEL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Select>
      }
      contentClassName="p-0"
    >
      {feedback.isLoading ? <div className="p-6"><LoadingState label="Loading feedback" /></div> : null}
      {feedback.isError ? (
        <div className="p-6">
          <EmptyState
            title="Couldn't load feedback"
            description="Something went wrong fetching skip-rate feedback. Please try again."
            action={
              <Button type="button" variant="outline" size="sm" onClick={() => void feedback.refetch()}>
                Try again
              </Button>
            }
          />
        </div>
      ) : null}
      {!feedback.isLoading && !feedback.isError && !items.length ? (
        <div className="p-6">
          <EmptyState title="No published steps yet" description="Author and publish a lesson to start seeing feedback here." />
        </div>
      ) : null}
      {!feedback.isLoading && !feedback.isError && items.length > 0 && !withData.length ? (
        <div className="p-6">
          <EmptyState title="No teacher has generated a day yet" description="Feedback appears once teachers start marking activities complete, partial, or skipped." />
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((item: PrimaryStepFeedback) => (
            <li key={item.step_id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">{item.title}</p>
                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {item.theme_name} · {item.subject} · {item.level} · step {item.position + 1}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {item.resolved_attempts} resolved · {item.distinct_teachers} teacher{item.distinct_teachers === 1 ? "" : "s"}
                </p>
              </div>
              <StatusPill status={SEVERITY_STATUS[skipSeverity(item.skip_rate)]}>
                {formatSkipRate(item.skip_rate)}
              </StatusPill>
            </li>
          ))}
        </ul>
      )}
    </AdminPanel>
  );
}
