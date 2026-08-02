import type { PrimaryResource as ApiPrimaryResource } from "./api";

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
  // Free-form, matching the backend column. NOT the old "pdf" | "png" | "jpg"
  // union: seed_primary.py derives file_type from the Cloudinary URL, so the
  // seeded catalog is 838 "webp" + 23 "pdf" and zero png/jpg. Consumers only
  // ever test for "pdf".
  fileType: string;
};

// Typed against the real wire shape on purpose: this adapter previously took
// `any` and read a `legacy_resource_id` field the backend never sends, which
// silently produced `id: undefined` on every resource.
export function adaptApiResource(apiRes: ApiPrimaryResource): PrimaryResource {
  return {
    // PrimaryResource.id IS the catalog's string key (e.g.
    // "primary-resources-library-...-04-birthdays"), not a UUID — see
    // backend/app/models/primary.py:226.
    id: apiRes.id,
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
