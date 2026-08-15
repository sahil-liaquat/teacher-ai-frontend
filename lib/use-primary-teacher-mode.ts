"use client";

import { useQuery } from "@tanstack/react-query";
import { backendApi, type PrimaryAssignment, type PrimaryTeacherContextResolved } from "@/lib/api";

// Re-exported so call sites import one module. The implementations live in a
// types-only file that the node test runner can load directly.
export { curriculumSourceLabel, schoolContextLabel } from "@/lib/primary-teacher-mode";

/**
 * The teacher's resolved operating mode, for every `/primary` surface.
 *
 * ⚠ Consume this rather than testing `organization_id` anywhere. The server
 * distinguishes three states and two of them are invisible to a null check:
 *
 *   independent               no school. Their own classes, TeachPad's master
 *                             curriculum, and no administrator to refer them to.
 *   organization_assigned     school-owned classes arrive from their assignments.
 *   organization_unassigned   a school that has not set them up yet. NOT
 *                             independent — offering them the independent
 *                             experience invites a parallel classroom the
 *                             school already models.
 *
 * Nothing here decides the mode; it renders what the server resolved.
 */

export const PRIMARY_TEACHER_CONTEXT_KEY = ["primary-teacher-context"] as const;

export type PrimaryTeacherModeState = {
  context: PrimaryTeacherContextResolved | undefined;
  isLoading: boolean;
  isError: boolean;
  /** The school owns this teacher's structure — assigned or merely waiting. */
  isOrganization: boolean;
  /** A school teacher their school has not assigned a class to yet. */
  isUnassigned: boolean;
  isIndependent: boolean;
  assignments: PrimaryAssignment[];
  /**
   * The classes to offer, already bridged to the execution rows the rest of
   * `/primary` addresses. Empty for an independent teacher, who picks from
   * their own sections instead.
   */
  assignedSectionIds: string[];
};

export function usePrimaryTeacherMode(): PrimaryTeacherModeState {
  const query = useQuery({
    queryKey: PRIMARY_TEACHER_CONTEXT_KEY,
    queryFn: backendApi.primaryTeacherContext,
    // The mode changes only when an admin assigns or removes a class, which is
    // rare and never mid-session for the teacher watching. A short stale window
    // keeps every surface from refetching it on each mount.
    staleTime: 5 * 60 * 1000,
  });

  const context = query.data;
  const assignments = context?.assignments ?? [];
  return {
    context,
    isLoading: query.isLoading,
    isError: query.isError,
    // ⚠ Both organization modes are "the school owns this", so anything asking
    // "should I show school structure?" wants this, not `isAssigned`.
    isOrganization: context?.mode === "organization_assigned" || context?.mode === "organization_unassigned",
    isUnassigned: context?.mode === "organization_unassigned",
    isIndependent: context?.mode === "independent",
    assignments,
    assignedSectionIds: assignments
      .map((item) => item.primary_section_id)
      .filter((id): id is string => Boolean(id)),
  };
}
