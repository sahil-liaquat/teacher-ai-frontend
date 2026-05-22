import type { PresentationGeneration } from "@/lib/api";

export type PresentationOptions = {
  topic: string;
  audience: string;
  slideCount: string;
  language: string;
  style: string;
  tone: string;
  detailLevel: string;
  visualDensity: string;
  notes: string;
  includeSpeakerNotes: boolean;
  includeActivities: boolean;
  includeQuiz: boolean;
  includeImages: boolean;
};

export type PresentationSlide = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  points: string[];
  visual: string;
  visualPrompt?: string | string[] | null;
  imageUrls: string[];
  selectedImageIndex?: number;
  layout?: string;
  speakerNote: string;
  activityPrompt?: string | null;
  quizQuestions: string[];
};

export type PresentationDeck = PresentationOptions & {
  id: string;
  createdAt: string;
  summary?: string;
  estimatedDurationMinutes?: number | null;
  teacherNotes: string[];
  pptxFileUrl?: string | null;
  pdfFileUrl?: string | null;
  slides: PresentationSlide[];
};

const PRESENTATION_LAST_ID_KEY = "teacher_ai_presentation_last_id";

export function saveLatestPresentationId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRESENTATION_LAST_ID_KEY, id);
}

export function loadLatestPresentationId() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(PRESENTATION_LAST_ID_KEY) || "";
}

export function presentationGenerationToDeck(generation: PresentationGeneration): PresentationDeck {
  const output = generation.output_json || {};
  const slides = (Array.isArray(output.slides) ? output.slides : []).map((slide: any, index: number) => {
    const visualPrompt = slide.visual_prompt;
    const imageUrls = imageUrlsFromVisualPrompt(visualPrompt);
    const visual = imageUrls.length ? slide.visual_type || "Image" : slide.visual_type || visualPrompt || "Classroom visual";

    return {
      id: slide.id || `slide_${slide.slide_number || index + 1}`,
      eyebrow: `Slide ${slide.slide_number || index + 1}`,
      title: slide.title || `Slide ${index + 1}`,
      subtitle: slide.subtitle,
      points: Array.isArray(slide.bullet_points) ? slide.bullet_points : [],
      visual,
      visualPrompt,
      imageUrls,
      layout: slide.layout,
      speakerNote: slide.speaker_notes || "",
      activityPrompt: slide.activity_prompt,
      quizQuestions: Array.isArray(slide.quiz_questions) ? slide.quiz_questions : []
    };
  });

  return {
    id: generation.id,
    createdAt: generation.created_at || generation.updated_at || new Date().toISOString(),
    topic: output.title || generation.topic,
    audience: generation.audience,
    slideCount: String(generation.slide_count),
    language: generation.language,
    style: generation.style,
    tone: generation.tone,
    detailLevel: generation.detail_level,
    visualDensity: generation.visual_density,
    notes: "",
    includeSpeakerNotes: generation.include_speaker_notes,
    includeActivities: generation.include_activities,
    includeQuiz: generation.include_quiz,
    includeImages: generation.include_images,
    summary: output.summary,
    estimatedDurationMinutes: output.estimated_duration_minutes,
    teacherNotes: Array.isArray(output.teacher_notes) ? output.teacher_notes : [],
    pptxFileUrl: generation.pptx_file_url,
    pdfFileUrl: generation.pdf_file_url,
    slides
  };
}

function imageUrlsFromVisualPrompt(value: unknown) {
  const items = Array.isArray(value) ? value : [value];
  return items.filter((item): item is string => typeof item === "string" && /^https?:\/\//i.test(item));
}
