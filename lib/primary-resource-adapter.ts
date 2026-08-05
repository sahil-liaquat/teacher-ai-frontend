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
  fileType: string;
};

type ApiPrimaryResourceLike = {
  id?: string;
  legacy_resource_id?: string;
  title: string;
  category: string;
  file_url: string;
  thumbnail_url?: string | null;
  file_type: string;
  subjects?: string[];
  levels?: string[];
  themes?: string[];
  keywords?: string[];
  languages?: string[];
  skills?: string[];
  difficulty?: string | null;
};

export function adaptApiResource(apiRes: ApiPrimaryResourceLike): PrimaryResource {
  const difficulty = ["beginner", "intermediate", "advanced"].includes(apiRes.difficulty ?? "")
    ? apiRes.difficulty as PrimaryResource["difficulty"]
    : undefined;
  return {
    // Deployed catalogue versions used legacy_resource_id; the refactored
    // Primary endpoint uses id. Supporting both keeps saved-resource links
    // stable during rollout (seeded rows use the same catalogue key).
    id: apiRes.legacy_resource_id || apiRes.id || "",
    title: apiRes.title,
    category: apiRes.category,
    subjects: apiRes.subjects || [],
    levels: apiRes.levels || [],
    themes: apiRes.themes || [],
    keywords: apiRes.keywords || [],
    languages: apiRes.languages || [],
    skills: apiRes.skills || [],
    difficulty,
    fileUrl: apiRes.file_url,
    thumbnailUrl: apiRes.thumbnail_url || undefined,
    fileType: apiRes.file_type,
  };
}
