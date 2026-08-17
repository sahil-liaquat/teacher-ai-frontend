"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { backendApi, type PrimaryAcademicYear } from "@/lib/api";
import {
  useCurriculumVocabulary,
  useSchoolLevels,
  type CurriculumVocabulary,
  type SchoolLevelOption,
} from "@/lib/use-school-levels";

/**
 * The context every Curriculum surface works inside: year, level, programme,
 * and the vocabulary that programme is authored in.
 *
 * ⚠ ONE resolution, not six. Each curriculum workspace used to re-derive the
 * academic year, re-pick a default level and hardcode "Theme"/"Topic" for
 * itself, so the same three decisions were made in six places and could
 * disagree. This is where they are made once.
 *
 * ⚠ The programme comes from the LEVEL, not from a picker. `SchoolGradeLevel`
 * carries `programme_id`, so choosing a level already chooses the programme —
 * and therefore the hierarchy and the vocabulary. Asking the admin to select a
 * programme separately would be asking them to restate something they have
 * already said.
 *
 * `programme_id` is nullable, and that is an ordinary state rather than an
 * error: a level filed under no programme, or a school mid-onboarding, resolves
 * to the compiled vocabulary — exactly what the server's own resolver falls
 * back to.
 */
export function useCurriculumContext(selectedLevel?: string): {
  year: PrimaryAcademicYear | undefined;
  years: PrimaryAcademicYear[];
  level: SchoolLevelOption | undefined;
  levels: SchoolLevelOption[];
  curriculumLevels: SchoolLevelOption[];
  labelFor: (code: string) => string;
  vocabulary: CurriculumVocabulary;
  isLoading: boolean;
} {
  const yearsQuery = useQuery<PrimaryAcademicYear[]>({
    queryKey: ["school-admin", "academic-years"],
    queryFn: backendApi.schoolAdminAcademicYears,
    staleTime: 60_000,
  });
  const { levels, curriculumLevels, labelFor, isLoading: levelsLoading } = useSchoolLevels();

  const level = useMemo(
    () => levels.find((item) => item.value === selectedLevel),
    [levels, selectedLevel],
  );
  const { vocabulary, isLoading: vocabularyLoading } = useCurriculumVocabulary(level?.programmeId);

  const years = yearsQuery.data ?? [];
  return {
    year: years.find((item) => item.is_active) ?? years[0],
    years,
    level,
    levels,
    curriculumLevels,
    labelFor,
    vocabulary,
    isLoading: yearsQuery.isLoading || levelsLoading || vocabularyLoading,
  };
}
