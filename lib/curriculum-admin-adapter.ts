import { backendApi, type PrimaryAIProposalRequest } from "@/lib/api";

export type CurriculumAdminScope = "school" | "platform";

/** One authoring contract, two ownership-aware API doors. Components never
 * infer tenancy from a row or role; the route chooses the adapter explicitly. */
export function curriculumAdminAdapter(scope: CurriculumAdminScope) {
  const platform = scope === "platform";
  return {
    scope,
    queryRoot: platform ? "master-curriculum" : "school-admin",
    ownerLabel: platform ? "TeachPad Master Curriculum" : "school curriculum",
    years: platform ? backendApi.adminPrimaryAcademicYears : backendApi.schoolAdminAcademicYears,
    themes: (level?: string) => platform ? backendApi.adminPrimaryThemes(level) : backendApi.schoolAdminThemes(level),
    lessons: (params: any) => platform ? backendApi.adminPrimaryLessons(params) : backendApi.schoolAdminCurriculum(params),
    lesson: (id: string) => platform ? backendApi.adminPrimaryLesson(id) : backendApi.schoolAdminCurriculumDay(id),
    createLesson: (payload: any) => platform ? backendApi.adminCreatePrimaryLesson(payload) : backendApi.schoolAdminCreateCurriculumDay(payload),
    updateLesson: (id: string, payload: any) => platform ? backendApi.adminUpdatePrimaryLesson(id, payload) : backendApi.schoolAdminUpdateCurriculumDay(id, payload),
    replaceSteps: (id: string, steps: any[]) => platform ? backendApi.adminReplacePrimarySteps(id, steps) : backendApi.schoolAdminReplaceCurriculumSteps(id, steps),
    publishLesson: (id: string) => platform ? backendApi.adminPublishPrimaryLesson(id) : backendApi.schoolAdminPublishCurriculumDay(id),
    duplicateLesson: (id: string) => platform ? backendApi.adminDuplicatePrimaryLesson(id) : backendApi.schoolAdminDuplicateCurriculumDay(id),
    customizeLesson: (id: string, academicYearId?: string | null) => platform ? backendApi.adminDuplicatePrimaryLesson(id) : backendApi.schoolAdminCustomizeLesson(id, academicYearId),
    resources: (params: any) => platform ? backendApi.adminResources(params) : backendApi.schoolAdminResources(params),
    uploadResource: (file: File, category: string, title?: string) => platform ? backendApi.adminUploadPrimaryResource(file, category, title) : backendApi.schoolAdminUploadResource(file, category, title),
    generateProposal: (request: PrimaryAIProposalRequest) => platform ? backendApi.adminGenerateCurriculumAIProposal(request) : backendApi.schoolAdminGenerateCurriculumAIProposal(request),
    applyProposal: (id: string, changeIds?: string[]) => platform ? backendApi.adminApplyCurriculumAIProposal(id, changeIds) : backendApi.schoolAdminApplyCurriculumAIProposal(id, changeIds),
  };
}

export type CurriculumAdminAdapter = ReturnType<typeof curriculumAdminAdapter>;
