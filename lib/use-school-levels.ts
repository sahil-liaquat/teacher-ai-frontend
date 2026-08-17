"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  backendApi,
  type ResolvedDefinition,
  type TeachableSchoolLevel,
} from "@/lib/api";
import {
  levelLabelResolver,
  levelOptionsFrom,
  vocabularyFrom,
  type CurriculumVocabulary,
  type SchoolLevelOption,
} from "@/lib/school-admin-levels";

/**
 * The canonical level vocabulary for School Admin — the fetching half.
 *
 * The rules live in `school-admin-levels.ts` so they are unit-testable; this
 * file is only the React Query wiring around them.
 *
 * ⚠ SCOPE MATTERS. This is for the SCHOOL surfaces only. The platform master
 * curriculum under `/admin/organizations/master-curriculum` has no school and
 * therefore no `school_grade_levels` — `/school-admin/academic/levels/available`
 * is guarded by `get_current_org_admin`, so a platform admin cannot call it.
 * The master curriculum keeps the compiled list, which is correct: it is
 * authored against the compiled definition, not against any one school.
 */

export type { CurriculumVocabulary, SchoolLevelOption };
export { defaultLevel } from "@/lib/school-admin-levels";

export const SCHOOL_LEVELS_QUERY_KEY = ["school-admin", "levels", "available"] as const;

export function useSchoolLevels(): {
  levels: SchoolLevelOption[];
  /** Only the levels curriculum can actually be authored against. */
  curriculumLevels: SchoolLevelOption[];
  labelFor: (code: string) => string;
  isLoading: boolean;
  isError: boolean;
} {
  const query = useQuery<TeachableSchoolLevel[]>({
    queryKey: SCHOOL_LEVELS_QUERY_KEY,
    queryFn: () => backendApi.schoolAdminAvailableLevels(),
    // Levels change during onboarding and then effectively never. Refetching on
    // every workspace mount would be one wasted request per navigation.
    staleTime: 5 * 60_000,
  });

  const levels = useMemo(() => levelOptionsFrom(query.data), [query.data]);
  const curriculumLevels = useMemo(
    () => levels.filter((level) => level.supportsCurriculum),
    [levels],
  );
  const labelFor = useMemo(() => levelLabelResolver(levels), [levels]);

  return {
    levels,
    curriculumLevels,
    labelFor,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * The curriculum vocabulary in force, for a programme.
 *
 * ⚠ Read from `GET /programmes/{id}/definition`, which resolves a
 * `CurriculumStructure` when the programme has one and the compiled Primary
 * definition when it does not — which is every programme today. Consuming it
 * now means a subject-based programme renders "Subject → Unit → Lesson" through
 * the same components that render "Theme → Topic", with no `if (primary)`
 * anywhere in the UI.
 *
 * `programmeId` may be null — a school that has not finished onboarding, or a
 * level filed under no programme. The compiled vocabulary is the answer then,
 * which is exactly what the server's own resolver falls back to.
 */
export function useCurriculumVocabulary(programmeId: string | null | undefined): {
  vocabulary: CurriculumVocabulary;
  isLoading: boolean;
} {
  const definition = useQuery<ResolvedDefinition>({
    queryKey: ["school-admin", "programme-definition", programmeId],
    queryFn: () => backendApi.schoolAdminProgrammeDefinition(programmeId as string),
    enabled: Boolean(programmeId),
    staleTime: 5 * 60_000,
  });
  const profile = useQuery({
    queryKey: ["school-admin", "academic-profile"],
    queryFn: backendApi.schoolAdminAcademicProfile,
    staleTime: 5 * 60_000,
  });

  // ⚠ Always through `vocabularyFrom`, including the no-definition case. This
  // used to short-circuit to `COMPILED_VOCABULARY`, which silently dropped the
  // school's terminology whenever no programme had resolved.
  const vocabulary = useMemo(
    () => vocabularyFrom(definition.data, profile.data?.terminology),
    [definition.data, profile.data?.terminology],
  );

  return { vocabulary, isLoading: Boolean(programmeId) && definition.isLoading };
}
