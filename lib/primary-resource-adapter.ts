import { type PrimaryResource } from "./primary-resource-catalog.ts";

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
