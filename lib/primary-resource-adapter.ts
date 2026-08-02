// UI-shape resource type. The backend's raw `PrimaryResource` (lib/api.ts,
// snake_case fields) is adapted into this camelCase shape below; components
// under components/primary/* consume this type, not the raw API shape.
export type PrimaryResource = {
  id: string;
  title: string;
  category: string;
  subjects: string[];
  levels: string[];
  themes: string[];
  keywords: string[];
  languages: string[];
  skills: string[];
  difficulty?: "beginner" | "intermediate" | "advanced";
  fileUrl: string;
  thumbnailUrl?: string;
  fileType: "pdf" | "png" | "jpg";
};

export function adaptApiResource(apiRes: any): PrimaryResource {
  return {
    id: apiRes.legacy_resource_id,
    title: apiRes.title,
    category: apiRes.category,
    subjects: apiRes.subjects || [],
    levels: apiRes.levels || [],
    themes: apiRes.themes || [],
    keywords: apiRes.keywords || [],
    languages: apiRes.languages || [],
    skills: apiRes.skills || [],
    difficulty: apiRes.difficulty || undefined,
    fileUrl: apiRes.file_url,
    thumbnailUrl: apiRes.thumbnail_url || undefined,
    fileType: apiRes.file_type,
  };
}
