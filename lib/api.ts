function resolveApiBase() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configured) return configured.endsWith("/api/v1") ? configured : `${configured}/api/v1`;
  return "http://localhost:8000/api/v1";
}

export const API_BASE = resolveApiBase();
export const BACKEND_ROOT = API_BASE.replace(/\/api\/v1$/, "");

const ACCESS_TOKEN_KEY = "teacher_ai_access_token";
const REFRESH_TOKEN_KEY = "teacher_ai_refresh_token";

export type ApiUser = {
  id?: string;
  full_name?: string;
  name?: string;
  email?: string;
  role?: "admin" | "teacher";
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
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

export type WorksheetGeneratePayload = {
  book_id: string;
  chapter_name?: string;
  chapter_names?: string[];
  topic?: string;
  question_count: number;
  question_types: string[];
  language?: string;
  difficulty_distribution?: { easy: number; medium: number; hard: number };
  include_answer_key?: boolean;
  include_marking_scheme?: boolean;
  include_hints?: boolean;
  include_diagrams_images?: boolean;
};

export type WorksheetGeneration = {
  id: string;
  output_json: any;
  created_at?: string;
};

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
};

let refreshRequest: Promise<boolean> | null = null;

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) || window.localStorage.getItem("teacher_ai_token") || window.localStorage.getItem("access_token");
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  window.localStorage.setItem("teacher_ai_token", token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  clearLegacyTokens();
}

function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setTokens(tokens: TokenResponse) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  window.localStorage.setItem("teacher_ai_token", tokens.access_token);
}

function clearLegacyTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("teacher_ai_token");
  window.localStorage.removeItem("access_token");
  window.localStorage.removeItem("refresh_token");
}

function decodeTokenPayload(token: string): { sub?: string; role?: ApiUser["role"] } {
  try {
    const payload = token.split(".")[1];
    if (!payload) return {};
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(window.atob(padded));
  } catch {
    return {};
  }
}

function normalizeError(error: any) {
  const detail = error?.detail || error?.message || error?.error;
  if (Array.isArray(detail)) return detail.map((item) => item?.msg || JSON.stringify(item)).join("\n");
  if (typeof detail === "object") return JSON.stringify(detail);
  return detail || "Request failed";
}

async function parseError(res: Response) {
  const error = await res.json().catch(() => ({ detail: res.statusText }));
  return Object.assign(new Error(normalizeError(error)), { status: res.status });
}

async function refreshSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  if (refreshRequest) return refreshRequest;
  refreshRequest = fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken })
  })
    .then(async (res) => {
      if (!res.ok) return false;
      setTokens(await res.json() as TokenResponse);
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshRequest = null;
    });
  return refreshRequest;
}

function redirectToLogin() {
  clearToken();
  if (typeof window === "undefined") return;
  const current = `${window.location.pathname}${window.location.search}`;
  if (window.location.pathname !== "/login") {
    window.location.href = `/login?next=${encodeURIComponent(current)}`;
  }
}

function shouldTryRefresh(path: string, status: number) {
  return status === 401 && !path.startsWith("/auth/login") && !path.startsWith("/auth/refresh");
}

async function requestWithSession(path: string, init: RequestInit = {}, retry = true) {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (!(init.body instanceof FormData) && !(init.body instanceof URLSearchParams) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (shouldTryRefresh(path, res.status) && retry && await refreshSession()) {
    return requestWithSession(path, init, false);
  }
  if (shouldTryRefresh(path, res.status)) {
    redirectToLogin();
  }
  return res;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await requestWithSession(path, init);
  if (!res.ok) {
    throw await parseError(res);
  }
  if (res.status === 204) return undefined as T;
  const type = res.headers.get("content-type") || "";
  if (type.includes("text/html") || type.includes("text/plain")) return (await res.text()) as T;
  return res.json() as Promise<T>;
}


export async function apiFetchBlob(path: string, init: RequestInit = {}): Promise<Blob> {
  const res = await requestWithSession(path, init);
  if (!res.ok) {
    throw await parseError(res);
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
  const res = await requestWithSession(path, init);
  if (!res.ok) {
    throw await parseError(res);
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

export async function login(email: string, password: string): Promise<ApiUser & { name: string; role: "admin" | "teacher" }> {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);
  const tokens = await apiFetch<TokenResponse>("/auth/login", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  setTokens(tokens);
  const user = await getCurrentUser().catch(() => {
    const payload = decodeTokenPayload(tokens.access_token);
    return { email, role: payload.role || "teacher" } as ApiUser;
  });
  return {
    ...user,
    name: user.full_name || user.name || email.split("@")[0],
    email: user.email || email,
    role: user.role || "teacher"
  };
}

export async function logout() {
  clearLegacyTokens();
  clearToken();
}

export async function getCurrentUser() {
  return apiFetch<ApiUser>("/auth/me");
}

export async function signup(name: string, email: string, password: string, school_name?: string) {
  const created = await apiFetch<ApiUser>("/users", {
    method: "POST",
    body: JSON.stringify({ full_name: name, email, password, role: "teacher" })
  });
  return { ...created, name: created.full_name || name };
}

export const backendApi = {
  health: () => fetch(`${BACKEND_ROOT}/health`).then((res) => res.ok ? res.json() : Promise.reject(new Error("Backend health check failed"))),
  boards: (skip = 0, limit = 100) => apiFetch<PaginatedResponse<Board>>(`/boards?skip=${skip}&limit=${limit}`),
  classesByBoard: (boardId: string, skip = 0, limit = 100) => apiFetch<PaginatedResponse<ClassItem>>(`/classes/board/${boardId}?skip=${skip}&limit=${limit}`),
  booksByClass: (classId: string, skip = 0, limit = 100) => apiFetch<PaginatedResponse<Book>>(`/books/class/${classId}?skip=${skip}&limit=${limit}`),
  book: (id: string) => apiFetch<Book>(`/books/${id}`),
  chaptersByBook: (bookId: string) => apiFetch<Chapter[]>(`/chapters/book/${bookId}`),
  lessonPlans: (skip = 0, limit = 20) => apiFetch<PaginatedResponse<LessonPlan>>(`/lesson-plans?skip=${skip}&limit=${limit}`),
  lessonPlan: (id: string) => apiFetch<LessonPlan>(`/lesson-plans/${id}`),
  createLessonPlan: (payload: LessonPlanGeneratePayload) =>
    apiFetch<LessonPlan>("/lesson-plans", { method: "POST", body: JSON.stringify(payload) }),
  streamLessonPlan: (
    payload: LessonPlanGeneratePayload,
    onEvent: (event: LessonPlanStreamEvent) => void
  ) => streamApiFetch("/lesson-plans/stream", { method: "POST", body: JSON.stringify(payload) }, onEvent),
  createWorksheet: (payload: WorksheetGeneratePayload) =>
    apiFetch<WorksheetGeneration>("/generate/worksheet", { method: "POST", body: JSON.stringify(payload) }),
  users: (skip = 0, limit = 100) => apiFetch<PaginatedResponse<ApiUser>>(`/users?skip=${skip}&limit=${limit}`),
  updateUser: (id: string, payload: Partial<Pick<ApiUser, "full_name" | "email" | "is_active">> & { password?: string }) =>
    apiFetch<ApiUser>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteUser: (id: string) => apiFetch<void>(`/users/${id}`, { method: "DELETE" }),
  updateBook: (id: string, payload: Partial<Book>) =>
    apiFetch<Book>(`/books/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteBook: (id: string) => apiFetch<void>(`/books/${id}`, { method: "DELETE" }),
  uploadBook: (classId: string, form: FormData) =>
    apiFetch<Book>(`/books?class_id=${encodeURIComponent(classId)}`, { method: "POST", body: form })
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
      class: metadata.class || metadata.grade || item?.class_name,
      subject: metadata.subject || item?.subject,
      chapter: metadata.chapter || item?.chapter_name,
      chapter_number: metadata.chapter_number || item?.chapter_number,
      topic: metadata.topic || item?.topic,
      duration: metadata.duration || (metadata.duration_minutes || item?.duration_minutes ? `${metadata.duration_minutes || item?.duration_minutes} min` : undefined),
      book: metadata.book
    },
    textbook_source: plan.textbook_source || metadata.book,
    lesson_outline: lessonFlow.map((row: any) => ({
      time: row.time || "",
      phase: row.phase || row.title || "",
      teacher_action: row.teacher_action || row.teacher || row.description || (typeof row === "string" ? row : ""),
      student_action: row.student_action || row.student || ""
    })),
    learning_objectives: objectives,
    previous_knowledge: plan.previous_knowledge,
    key_concepts: concepts,
    teaching_method_strategy: strategies,
    classroom_activity: plan.classroom_activity || plan.activity,
    introduction_warm_up: plan.introduction_warm_up,
    explanation_of_concept: plan.explanation_of_concept,
    physical_properties_key_features: toArray(plan.physical_properties_key_features),
    chemical_properties_main_concept_details: plan.chemical_properties_main_concept_details,
    uses_daily_life_connection: plan.uses_daily_life_connection,
    assessment_questions: assessment.map((q: any) => typeof q === "string" ? { question: q, marks: 1 } : q),
    board_work: plan.board_work,
    materials_needed: materials,
    differentiation: plan.differentiation && typeof plan.differentiation === "object" && !Array.isArray(plan.differentiation) ? plan.differentiation : {},
    homework: plan.homework,
    learning_outcome: plan.learning_outcome,
    selected_components: toArray(plan.selected_components),
    teacher_notes: plan.teacher_notes
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
