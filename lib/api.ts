function resolveApiBase() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configured) return configured.endsWith("/api/v1") ? configured : `${configured}/api/v1`;
  return "https://teacher-ai-backend-dev.onrender.com/api/v1";
}

export const API_BASE = resolveApiBase();
export const BACKEND_ROOT = API_BASE.replace(/\/api\/v1$/, "");

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const LEGACY_ACCESS_TOKEN_KEY = "teacher_ai_access_token";
const LEGACY_REFRESH_TOKEN_KEY = "teacher_ai_refresh_token";
const LEGACY_CUSTOM_TOKEN_KEY = "teacher_ai_token";
const AUTH_STORAGE_EVENT = "teacher-ai-auth-change";
const TOKEN_REFRESH_SKEW_SECONDS = 45;
export const CURRENT_USER_QUERY_KEY = ["current-user"] as const;

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
  user_id?: string;
  output_json: any;
  created_at?: string;
  updated_at?: string;
};

export type AdminSummary = {
  total_users: number;
  active_users: number;
  lesson_plans_generated: number;
  worksheets_generated: number;
  books_in_library: number;
  total_ai_calls: number;
  recent_generations: Array<{ id: string; tool: string; name: string; created_at?: string }>;
  system_status: {
    backend_api: string;
    boards: number;
    classes: number;
    books: number;
  };
  top_books: Array<{ id: string; title: string; subject?: string; created_at?: string }>;
  top_users: Array<{ id: string; name: string; created_at?: string }>;
};

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
  user?: {
    id: string;
    email?: string;
    email_confirmed?: boolean;
  };
};

type SignupResponse = {
  id: string;
  email: string;
  email_confirmed: boolean;
  message: string;
};

let refreshRequest: Promise<boolean> | null = null;

type ApiRequestInit = RequestInit & {
  redirectOnUnauthorized?: boolean;
};

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  clearAccountStorage();
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  window.localStorage.setItem(LEGACY_ACCESS_TOKEN_KEY, token);
  window.dispatchEvent(new CustomEvent(AUTH_STORAGE_EVENT));
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  clearLegacyTokens();
  clearAccountStorage();
  window.dispatchEvent(new CustomEvent(AUTH_STORAGE_EVENT));
}

function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setTokens(tokens: TokenResponse) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  window.localStorage.setItem(LEGACY_ACCESS_TOKEN_KEY, tokens.access_token);
  window.localStorage.setItem(LEGACY_REFRESH_TOKEN_KEY, tokens.refresh_token);
  window.localStorage.removeItem(LEGACY_CUSTOM_TOKEN_KEY);
  window.dispatchEvent(new CustomEvent(AUTH_STORAGE_EVENT));
}

function clearLegacyTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LEGACY_CUSTOM_TOKEN_KEY);
  window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
}

function clearAccountStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("teacher_ai_profile");
  window.localStorage.removeItem("teacher_ai_pending_lesson_plan");
  window.sessionStorage.removeItem("teacher_ai_profile");
  window.sessionStorage.removeItem("teacher_ai_pending_lesson_plan");

  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith("teacher_ai_profile:") || key?.startsWith("teacher_ai_worksheet_")) {
      window.localStorage.removeItem(key);
    }
  }

  for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = window.sessionStorage.key(index);
    if (key?.startsWith("teacher_ai_profile:") || key?.startsWith("teacher_ai_worksheet_")) {
      window.sessionStorage.removeItem(key);
    }
  }
}

function decodeTokenPayload(token: string): { sub?: string; role?: ApiUser["role"]; exp?: number; type?: string } {
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

function isTokenExpired(token: string | null, skewSeconds = 0) {
  if (!token) return true;
  const exp = decodeTokenPayload(token).exp;
  if (!exp) return false;
  return exp * 1000 <= Date.now() + skewSeconds * 1000;
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

export async function refreshSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  if (isTokenExpired(refreshToken)) {
    clearToken();
    return false;
  }
  if (refreshRequest) return refreshRequest;
  refreshRequest = fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken })
  })
    .then(async (res) => {
      if (!res.ok) {
        clearToken();
        return false;
      }
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

function isPublicAuthPath(path: string) {
  return (
    path.startsWith("/auth/login") ||
    path.startsWith("/auth/refresh") ||
    path.startsWith("/auth/signup") ||
    path.startsWith("/auth/forgot-password") ||
    path.startsWith("/auth/reset-password")
  );
}

function shouldTryRefresh(path: string, status: number) {
  return status === 401 && !isPublicAuthPath(path);
}

async function requestWithSession(path: string, init: ApiRequestInit = {}, retry = true) {
  const { redirectOnUnauthorized = true, ...fetchInit } = init;
  const publicAuthPath = isPublicAuthPath(path);
  if (!publicAuthPath && isTokenExpired(getToken(), TOKEN_REFRESH_SKEW_SECONDS)) {
    await refreshSession();
  }

  const headers = new Headers(fetchInit.headers);
  const token = getToken();
  if (!(fetchInit.body instanceof FormData) && !(fetchInit.body instanceof URLSearchParams) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!publicAuthPath && token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${API_BASE}${path}`, { ...fetchInit, headers });
  if (shouldTryRefresh(path, res.status) && retry && await refreshSession()) {
    return requestWithSession(path, init, false);
  }
  if (redirectOnUnauthorized && shouldTryRefresh(path, res.status)) {
    redirectToLogin();
  }
  return res;
}

export async function apiFetch<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const res = await requestWithSession(path, init);
  if (!res.ok) {
    throw await parseError(res);
  }
  if (res.status === 204) return undefined as T;
  const type = res.headers.get("content-type") || "";
  if (type.includes("text/html") || type.includes("text/plain")) return (await res.text()) as T;
  return res.json() as Promise<T>;
}


export async function apiFetchBlob(path: string, init: ApiRequestInit = {}): Promise<Blob> {
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
  init: ApiRequestInit,
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
  clearToken();
  const tokens = await apiFetch<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  setTokens(tokens);
  let user: ApiUser;
  try {
    user = await getCurrentUser();
  } catch (error) {
    clearToken();
    throw error;
  }
  if (!user.id || !user.email || !user.role) {
    clearToken();
    throw new Error("Could not load the signed-in account.");
  }
  return {
    ...user,
    name: user.full_name || user.name || "",
    role: user.role
  };
}

export async function completeTokenLogin(tokens: Pick<TokenResponse, "access_token" | "refresh_token">): Promise<ApiUser & { name: string; role: "admin" | "teacher" }> {
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Confirmation link is missing the required session tokens.");
  }

  clearToken();
  setTokens({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token
  });

  let user: ApiUser;
  try {
    user = await getCurrentUser({ redirectOnUnauthorized: false });
  } catch (error) {
    clearToken();
    throw error;
  }

  if (!user.id || !user.email || !user.role) {
    clearToken();
    throw new Error("Your email was verified, but we could not load the signed-in account.");
  }

  return {
    ...user,
    name: user.full_name || user.name || "",
    role: user.role
  };
}

export async function logout() {
  if (!getToken()) {
    clearToken();
    return;
  }

  try {
    await requestWithSession("/auth/logout", { method: "POST", redirectOnUnauthorized: false }, false);
  } finally {
    clearToken();
  }
}

export async function getCurrentUser(options: { redirectOnUnauthorized?: boolean } = {}) {
  return apiFetch<ApiUser>("/auth/me", { redirectOnUnauthorized: options.redirectOnUnauthorized ?? true });
}

export async function ensureSession() {
  if (!getToken() && !getRefreshToken()) return false;
  if (isTokenExpired(getToken(), TOKEN_REFRESH_SKEW_SECONDS)) return refreshSession();
  return true;
}

export async function signup(name: string, email: string, password: string, school_name?: string) {
  const created = await apiFetch<SignupResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ full_name: name, email, password })
  });
  return { ...created, full_name: name, name };
}

export async function requestPasswordReset(email: string) {
  return apiFetch<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

export async function resetPassword(accessToken: string, password: string) {
  return apiFetch<{ message: string }>("/auth/reset-password", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ password })
  });
}

export const backendApi = {
  health: () => fetch(`${BACKEND_ROOT}/health`).then((res) => res.ok ? res.json() : Promise.reject(new Error("Backend health check failed"))),
  adminSummary: () => apiFetch<AdminSummary>("/admin/summary"),
  boards: (skip = 0, limit = 100) => apiFetch<PaginatedResponse<Board>>(`/boards?skip=${skip}&limit=${limit}`),
  createBoard: (payload: Pick<Board, "code" | "name"> & { description?: string }) =>
    apiFetch<Board>("/boards", { method: "POST", body: JSON.stringify(payload) }),
  updateBoard: (id: string, payload: Partial<Pick<Board, "code" | "name" | "description" | "is_active">>) =>
    apiFetch<Board>(`/boards/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  classesByBoard: (boardId: string, skip = 0, limit = 100) => apiFetch<PaginatedResponse<ClassItem>>(`/classes/board/${boardId}?skip=${skip}&limit=${limit}`),
  createClass: (payload: Pick<ClassItem, "board_id" | "grade_number" | "name"> & { description?: string }) =>
    apiFetch<ClassItem>("/classes", { method: "POST", body: JSON.stringify(payload) }),
  updateClass: (id: string, payload: Partial<Pick<ClassItem, "grade_number" | "name" | "description" | "is_active">>) =>
    apiFetch<ClassItem>(`/classes/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  booksByClass: (classId: string, skip = 0, limit = 100) => apiFetch<PaginatedResponse<Book>>(`/books/class/${classId}?skip=${skip}&limit=${limit}`),
  book: (id: string) => apiFetch<Book>(`/books/${id}`),
  chaptersByBook: (bookId: string) => apiFetch<Chapter[]>(`/chapters/book/${bookId}`),
  lessonPlans: (skip = 0, limit = 20) => apiFetch<PaginatedResponse<LessonPlan>>(`/lesson-plans?skip=${skip}&limit=${limit}`),
  lessonPlan: (id: string) => apiFetch<LessonPlan>(`/lesson-plans/${id}`),
  deleteLessonPlan: (id: string) => apiFetch<void>(`/lesson-plans/${id}`, { method: "DELETE" }),
  createLessonPlan: (payload: LessonPlanGeneratePayload) =>
    apiFetch<LessonPlan>("/lesson-plans", { method: "POST", body: JSON.stringify(payload) }),
  streamLessonPlan: (
    payload: LessonPlanGeneratePayload,
    onEvent: (event: LessonPlanStreamEvent) => void
  ) => streamApiFetch("/lesson-plans/stream", { method: "POST", body: JSON.stringify(payload) }, onEvent),
  createWorksheet: (payload: WorksheetGeneratePayload) =>
    apiFetch<WorksheetGeneration>("/generate/worksheet", { method: "POST", body: JSON.stringify(payload) }),
  worksheets: (skip = 0, limit = 20) => apiFetch<PaginatedResponse<WorksheetGeneration>>(`/generate/worksheet?skip=${skip}&limit=${limit}`),
  worksheet: (id: string) => apiFetch<WorksheetGeneration>(`/generate/worksheet/${id}`),
  users: (skip = 0, limit = 100) => apiFetch<PaginatedResponse<ApiUser>>(`/users?skip=${skip}&limit=${limit}`),
  updateUser: (id: string, payload: Partial<Pick<ApiUser, "full_name" | "email" | "is_active">> & { password?: string }) =>
    apiFetch<ApiUser>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  updateCurrentUser: (payload: Pick<ApiUser, "full_name">) =>
    apiFetch<ApiUser>("/users/me", { method: "PATCH", body: JSON.stringify(payload) }),
  deactivateUser: (id: string) => apiFetch<void>(`/users/${id}`, { method: "DELETE" }),
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
    generated_at: plan.generated_at || item?.created_at || item?.updated_at,
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
