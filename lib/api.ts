function resolveApiBase() {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, "");
  return "http://localhost:8000/api/v1";
}

export const API_BASE = resolveApiBase();

export type ApiUser = {
  id?: string;
  full_name?: string;
  name?: string;
  email?: string;
  role?: "admin" | "teacher" | "super_admin";
  is_active?: boolean;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
};

export type Board = { id: string; code: string; name: string; description?: string; is_active?: boolean };
export type ClassItem = { id: string; board_id: string; grade_number?: number; name: string; description?: string; is_active?: boolean };
export type Book = { id: string; class_id: string; title: string; subject: string; is_ingested?: boolean; is_active?: boolean; pinecone_index?: string };
export type Chapter = { id: string; book_id: string; chapter_number?: number; chapter_title: string; title?: string };
export type LessonPlan = {
  id: string;
  user_id?: string;
  class_name?: string;
  subject?: string;
  chapter_name: string;
  topic: string;
  duration_minutes: number;
  plan: any;
  created_at?: string;
  updated_at?: string;
};

export type LessonPlanGeneratePayload = {
  book_id: string;
  chapter_name: string;
  topic: string;
  duration_minutes: number;
  lesson_components?: string[];
  learning_objectives_hint?: string;
  language?: string;
  teaching_style?: string;
};

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("teacher_ai_token") || window.localStorage.getItem("access_token");
}

export function setToken(token: string) {
  window.localStorage.setItem("teacher_ai_token", token);
  window.localStorage.setItem("access_token", token);
}

export function clearToken() {
  window.localStorage.removeItem("teacher_ai_token");
  window.localStorage.removeItem("access_token");
}

function normalizeError(error: any) {
  const detail = error?.detail || error?.message || error?.error;
  if (Array.isArray(detail)) return detail.map((item) => item?.msg || JSON.stringify(item)).join("\n");
  if (typeof detail === "object") return JSON.stringify(detail);
  return detail || "Request failed";
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(init.body instanceof FormData) && !(init.body instanceof URLSearchParams) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw Object.assign(new Error(normalizeError(error)), { status: res.status });
  }
  if (res.status === 204) return undefined as T;
  const type = res.headers.get("content-type") || "";
  if (type.includes("text/html") || type.includes("text/plain")) return (await res.text()) as T;
  return res.json() as Promise<T>;
}


export async function apiFetchBlob(path: string, init: RequestInit = {}): Promise<Blob> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(init.body instanceof FormData) && !(init.body instanceof URLSearchParams) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw Object.assign(new Error(normalizeError(error)), { status: res.status });
  }
  return res.blob();
}

export type LessonPlanStreamEvent =
  | { type: "status"; message: string }
  | { type: "chunk"; text: string }
  | { type: "complete"; lesson_plan: LessonPlan }
  | { type: "error"; message: string };

export async function streamApiFetch(
  path: string,
  init: RequestInit,
  onEvent: (event: LessonPlanStreamEvent) => void
) {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(init.body instanceof FormData) && !(init.body instanceof URLSearchParams) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw Object.assign(new Error(normalizeError(error)), { status: res.status });
  }
  if (!res.body) throw new Error("Streaming is not supported by this browser.");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      onEvent(JSON.parse(line) as LessonPlanStreamEvent);
    }
  }

  buffer += decoder.decode();
  if (buffer.trim()) onEvent(JSON.parse(buffer) as LessonPlanStreamEvent);
}

export async function login(email: string, password: string): Promise<ApiUser & { name: string; role: "admin" | "teacher" | "super_admin" }> {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);
  const data = await apiFetch<{ access_token: string; refresh_token?: string; token_type?: string }>("/auth/login", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  setToken(data.access_token);
  return { name: email.split("@")[0], email, role: "teacher" as const };
}

export async function signup(name: string, email: string, password: string, school_name?: string) {
  const created = await apiFetch<ApiUser>("/users", {
    method: "POST",
    body: JSON.stringify({ full_name: name, email, password, school_name, role: "teacher" })
  });
  return { ...created, name: created.full_name || name };
}

export const backendApi = {
  boards: (skip = 0, limit = 100) => apiFetch<PaginatedResponse<Board>>(`/boards?skip=${skip}&limit=${limit}`),
  classesByBoard: (boardId: string, skip = 0, limit = 100) => apiFetch<PaginatedResponse<ClassItem>>(`/classes/board/${boardId}?skip=${skip}&limit=${limit}`),
  booksByClass: (classId: string, skip = 0, limit = 100) => apiFetch<PaginatedResponse<Book>>(`/books/class/${classId}?skip=${skip}&limit=${limit}`),
  chaptersByBook: (bookId: string) => apiFetch<Chapter[]>(`/chapters/book/${bookId}`),
  lessonPlans: (skip = 0, limit = 20) => apiFetch<PaginatedResponse<LessonPlan>>(`/lesson-plans?skip=${skip}&limit=${limit}`),
  lessonPlan: (id: string) => apiFetch<LessonPlan>(`/lesson-plans/${id}`),
  createLessonPlan: (payload: LessonPlanGeneratePayload) =>
    apiFetch<LessonPlan>("/lesson-plans", { method: "POST", body: JSON.stringify(payload) }),
  streamLessonPlan: (
    payload: LessonPlanGeneratePayload,
    onEvent: (event: LessonPlanStreamEvent) => void
  ) => streamApiFetch("/lesson-plans/stream", { method: "POST", body: JSON.stringify(payload) }, onEvent),
  users: (skip = 0, limit = 100) => apiFetch<PaginatedResponse<ApiUser>>(`/users?skip=${skip}&limit=${limit}`)
};

export function normalizeLessonPlanForOutput(item: LessonPlan | any) {
  const plan = sanitizeGeneratedValue(parseJsonObject(item?.plan || item?.output_json || item || {}));
  const metadata = plan.metadata || {};
  const lessonFlow = toArray(plan.lesson_flow || plan.lesson_outline);
  const assessment = toArray(plan.assessment_questions);
  const objectives = toArray(plan.learning_objectives);
  const concepts = toArray(plan.key_concepts).length ? toArray(plan.key_concepts) : toArray(plan.physical_properties_key_features);
  const strategies = toArray(plan.teaching_method_strategy);
  const materials = toArray(plan.materials_needed);
  return {
    ...plan,
    title: plan.title || item?.topic || "Generated Lesson Plan",
    metadata: {
      ...metadata,
      class: metadata.class || metadata.grade || item?.class_name || "Class",
      subject: metadata.subject || item?.subject || "Subject",
      chapter: metadata.chapter || item?.chapter_name || "Chapter",
      topic: metadata.topic || item?.topic || "Topic",
      duration: metadata.duration || `${metadata.duration_minutes || item?.duration_minutes || 45} min`,
      book: metadata.book || "Selected textbook"
    },
    textbook_source: plan.textbook_source || metadata.book || "Selected textbook",
    lesson_outline: lessonFlow.map((row: any) => ({
      time: row.time || "10 min",
      phase: row.phase || row.title || "Lesson Activity",
      teacher_action: row.teacher_action || row.teacher || row.description || String(row),
      student_action: row.student_action || row.student || "Participate and respond using textbook evidence."
    })),
    learning_objectives: objectives,
    previous_knowledge: plan.previous_knowledge,
    key_concepts: concepts,
    teaching_method_strategy: strategies.length ? strategies : ["Textbook-grounded explanation", "Interactive questioning", "Classroom discussion"],
    classroom_activity: plan.classroom_activity || plan.activity || "Use the selected textbook content for a short classroom discussion and activity.",
    introduction_warm_up: plan.introduction_warm_up,
    explanation_of_concept: plan.explanation_of_concept,
    physical_properties_key_features: toArray(plan.physical_properties_key_features),
    chemical_properties_main_concept_details: plan.chemical_properties_main_concept_details,
    uses_daily_life_connection: plan.uses_daily_life_connection,
    assessment_questions: assessment.map((q: any) => typeof q === "string" ? { question: q, marks: 1 } : q),
    board_work: plan.board_work,
    materials_needed: materials.length ? materials : ["Textbook", "Notebook", "Blackboard / Whiteboard"],
    differentiation: plan.differentiation && typeof plan.differentiation === "object" && !Array.isArray(plan.differentiation) ? plan.differentiation : {
      support: "Use guided examples and textbook lines for learners who need support.",
      core: "Ask students to explain key concepts in their own words.",
      challenge: "Ask advanced learners to connect the concept with local real-life examples."
    },
    homework: plan.homework || "Revise the topic and answer the textbook-based questions.",
    learning_outcome: plan.learning_outcome,
    selected_components: toArray(plan.selected_components),
    teacher_notes: plan.teacher_notes || "Keep the lesson grounded in the selected chapter and avoid adding unsupported facts."
  };
}

function parseJsonObject(value: any) {
  if (typeof value !== "string") return value || {};
  const cleaned = value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return {};
  }
}

function toArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === "string") return value.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (typeof value === "object") return Object.values(value);
  return [value];
}

function sanitizeGeneratedValue(value: any): any {
  if (Array.isArray(value)) return value.map(sanitizeGeneratedValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, sanitizeGeneratedValue(child)]));
  }
  if (typeof value !== "string") return value;
  return value
    .replace(/```(?:json|markdown|md)?/gi, "")
    .replace(/```/g, "")
    .split("\n")
    .map((line) => line.replace(/^\s{0,3}#{1,6}\s+/, "").replace(/^\s*[-*]\s+/, "").replace(/\*\*/g, "").trimEnd())
    .join("\n")
    .trim();
}
