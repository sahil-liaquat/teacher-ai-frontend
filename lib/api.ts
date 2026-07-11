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
  role?: "admin" | "teacher" | "influencer";
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  phone?: string | null;
  phone_prompt_state?: "required" | "hidden";
  needs_school?: boolean;
  confirmed?: boolean;
  logged_in?: boolean;
  has_subscription?: boolean;
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
export type School = {
  id: string;
  name: string;
  board_id?: string | null;
  board_name?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  status: string;
  templates_count?: number;
  teachers_count?: number;
};
export type PublicSchool = { id: string; name: string; city?: string | null };
export type UserSchoolProfile = {
  id: string;
  user_id?: string;
  school_id?: string | null;
  pending_school_name?: string | null;
  role_in_school?: string | null;
  school?: School | null;
};
export type SchoolFormatAvailability = {
  available: boolean;
  template_available: boolean;
  school_name?: string | null;
  template_name?: string | null;
  template_type?: string | null;
  message?: string | null;
};
export type SchoolFormatSection = {
  key: string;
  title: string;
  required: boolean;
  children?: SchoolFormatSection[];
};
export type SchoolFormatTemplate = {
  id: string;
  school_id: string;
  template_type: "lesson_plan" | "worksheet" | "notes" | "presentation";
  template_name: string;
  description?: string | null;
  required_sections: SchoolFormatSection[];
  output_schema?: Record<string, any> | null;
  prompt_instructions?: string | null;
  sample_output?: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};
export type Host = {
  id: string;
  full_name: string;
  designation?: string | null;
  organization?: string | null;
  bio?: string | null;
  years_of_experience?: number | null;
  linkedin?: string | null;
  website?: string | null;
  is_active: boolean;
  profile_photo?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Workshop = {
  id: string;
  title: string;
  description?: string | null;
  scheduled_at: string;
  duration_minutes?: number | null;
  status: "draft" | "published";
  is_featured: boolean;
  registration_deadline?: string | null;
  mode: "online" | "offline" | "hybrid";
  meeting_link?: string | null;
  venue_details?: string | null;
  max_capacity?: number | null;
  banner_url?: string | null;
  thumbnail_url?: string | null;
  enable_certificates: boolean;
  enable_recordings: boolean;
  publishing_destination: "landing_page" | "teachpad_app" | "both";
  hosts: Host[];
  registered_users_count: number;
  is_registered: boolean;
  created_at?: string;
  updated_at?: string;
};

export type WorkshopRegistration = {
  id: string;
  workshop_id: string;
  user_id: string;
  attended: boolean;
  certificate_issued: boolean;
  feedback_rating?: number | null;
  feedback_text?: string | null;
  workshop: Workshop;
  user: ApiUser;
  created_at?: string;
  updated_at?: string;
};

export type LessonPlan = {
  id: string;
  user_id?: string;
  class_name?: string;
  subject?: string;
  chapter_name: string;
  topic: string;
  duration_minutes: number;
  plan: any;
  is_saved?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type LessonPlanDashboardSummary = {
  total: number;
  monthly_total: number;
  recent: Array<Omit<LessonPlan, "user_id" | "plan">>;
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
  use_school_format?: boolean;
  format_type?: "teachpad_standard" | "school_format";
};

export type WorksheetGeneratePayload = {
  book_id: string;
  chapter_name?: string;
  chapter_names?: string[];
  topic?: string;
  question_count?: number;
  question_types?: string[];
  question_type_counts?: Record<string, number>;
  question_type_marks?: Record<string, number>;
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
  is_saved?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type NotesGeneratePayload = {
  book_id: string;
  chapter_name?: string;
  chapter_names?: string[];
  topic?: string;
  language?: string;
  note_style?: string;
  detail_level?: string;
  include_key_terms?: boolean;
  include_examples?: boolean;
  include_summary?: boolean;
  include_questions?: boolean;
};

export type NotesGeneration = {
  id: string;
  user_id?: string;
  output_json: any;
  is_saved?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ActivityGeneratePayload = {
  book_id: string;
  chapter_name?: string;
  chapter_names?: string[];
  topic?: string;
  language?: string;
  activity_type?: string;
  duration_minutes?: number;
  group_size?: string;
  difficulty?: string;
  include_assessment?: boolean;
  include_materials?: boolean;
  include_differentiation?: boolean;
};

export type ActivityGeneration = {
  id: string;
  user_id?: string;
  output_json: any;
  is_saved?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type WritingWorkflow =
  | "parent_communication"
  | "report_card_remarks"
  | "student_feedback"
  | "notice_circular"
  | "official_letter_email"
  | "rewrite_translate";

export type WritingAction =
  | "rewrite"
  | "shorten"
  | "expand"
  | "make_polite"
  | "make_professional"
  | "simplify"
  | "translate"
  | "correct_grammar"
  | "another_version";

export type WritingGeneratePayload = {
  workflow: WritingWorkflow;
  document_type: string;
  language?: string;
  tone?: string;
  audience?: string | null;
  title?: string | null;
  details?: Record<string, unknown>;
  source_text?: string | null;
  bilingual?: boolean;
};

export type WritingTransformPayload = {
  action: WritingAction;
  language?: string | null;
  instructions?: string | null;
  content: string;
};

export type WritingDocument = {
  id: string;
  user_id?: string;
  workflow: string;
  document_type: string;
  title: string;
  language: string;
  status: "draft" | "saved" | string;
  content: string;
  input_json: Record<string, any>;
  meta_json: Record<string, any>;
  is_saved: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PresentationGeneratePayload = {
  topic: string;
  audience: "Class 6" | "Class 7" | "Class 8" | "Class 9" | "Class 10" | "Class 11" | "Class 12";
  slide_count: 6 | 8 | 10 | 12;
  language: "English" | "Hindi" | "Urdu";
  style: "Clean classroom" | "Visual story" | "Activity based" | "Exam revision";
  tone: "Simple" | "Conversational" | "Academic" | "Revision focused";
  detail_level: "Brief" | "Balanced" | "Detailed";
  visual_density: "Light visuals" | "Balanced visuals" | "Image rich";
  instructions?: string | null;
  include_speaker_notes?: boolean;
  include_activities?: boolean;
  include_quiz?: boolean;
  include_images?: boolean;
  source?: {
    board_id?: string | null;
    class_id?: string | null;
    book_id?: string | null;
    chapter_names?: string[];
  };
};

export type PresentationGeneration = {
  id: string;
  user_id?: string;
  topic: string;
  audience: string;
  slide_count: number;
  language: string;
  style: string;
  tone: string;
  detail_level: string;
  visual_density: string;
  include_speaker_notes: boolean;
  include_activities: boolean;
  include_quiz: boolean;
  include_images: boolean;
  instructions?: string | null;
  status?: "pending" | "processing" | "completed" | "failed" | null;
  output_json: any;
  error_message?: string | null;
  pptx_file_url?: string | null;
  pdf_file_url?: string | null;
  is_saved?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type DashboardCountSchema = {
  lesson_plans: number;
  worksheets: number;
  presentations: number;
  notes: number;
  activities: number;
};

export type DashboardRecentItemSchema = {
  id: string;
  type: "Lesson Plan" | "Worksheet" | "Presentation" | "Notes" | "Activity";
  topic: string;
  class_name: string;
  subject: string;
  created_at: string;
  href: string;
};

export type DashboardSummaryResponse = {
  totals: DashboardCountSchema;
  monthly_totals: DashboardCountSchema;
  recent_generations: DashboardRecentItemSchema[];
  last_7_days_timestamps: string[];
};

export type LibraryItem = {
  id: string;
  type: "lesson_plan" | "worksheet" | "presentation" | "notes" | "activity";
  title: string;
  subject: string;
  class_name: string;
  chapter_name: string;
  created_at: string;
};

export type RecentGenerationItem = {
  id: string;
  type: "lesson_plan" | "worksheet" | "presentation" | "notes" | "activity";
  title: string;
  subject: string;
  class_name: string;
  chapter_name: string;
  created_at: string;
  href: string;
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

export type AdminUsageParams = {
  start?: string; // inclusive ISO date "YYYY-MM-DD"
  end?: string;   // exclusive upper bound ISO date "YYYY-MM-DD" (send selected-end + 1 day to include it)
  sort?: "cost_inr" | "generations" | "total_tokens" | "last_generation";
  limit?: number;
};

export type AdminUsageTotals = {
  generations: number;
  failures: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_inr: number;
  active_users: number;
};

export type AdminUsageByUser = {
  user_id: string;
  email: string | null;
  name: string | null;
  tier: string; // trial | comp | paid | past_due | free | none
  sub_status: string | null;
  generations: number;
  total_tokens: number;
  cost_inr: number;
  last_generation: string | null;
  confirmed: boolean;
  logged_in: boolean;
  has_subscription: boolean;
};

export type AdminUsageByKind = {
  kind: string;
  generations: number;
  total_tokens: number;
  cost_inr: number;
};

export type AdminUsageByTier = {
  tier: string;
  users: number;
  generations: number;
  total_tokens: number;
  cost_inr: number;
};

export type AdminUsageDaily = {
  day: string; // ISO date "YYYY-MM-DD"
  generations: number;
  total_tokens: number;
  cost_inr: number;
};

export type AdminUsageResponse = {
  start: string; // echoed back by the backend
  end: string;
  totals: AdminUsageTotals;
  by_user: AdminUsageByUser[];
  by_kind: AdminUsageByKind[];
  by_tier: AdminUsageByTier[];
  daily: AdminUsageDaily[];
};

export type ActivityKind = "lesson_plan" | "worksheet" | "notes" | "activity" | "presentation";

export type AdminActivityParams = {
  user_id?: string;
  kind?: ActivityKind;
  book_id?: string;
  start?: string; // inclusive ISO date "YYYY-MM-DD"
  end?: string;   // exclusive upper bound ISO date "YYYY-MM-DD"
  skip?: number;
  limit?: number;
};

export type ActivityRow = {
  generation_id: string;
  user_id: string;
  kind: ActivityKind;
  created_at: string;
  book_id: string | null;
  topic: string | null;
  has_input: boolean;
  user_email: string | null;
  user_name: string | null;
  book_title: string | null;
  cost_inr: number | null;
  total_tokens: number | null;
};

export type AdminActivityResponse = {
  total: number;
  skip: number;
  limit: number;
  items: ActivityRow[];
};

export type ActivityDetail = {
  generation_id: string;
  kind: ActivityKind;
  user_id: string;
  created_at: string;
  book_id: string | null;
  topic: string | null;
  user_email: string | null;
  user_name: string | null;
  book_title: string | null;
  input_json: Record<string, unknown> | null;
  output_json: Record<string, unknown> | null;
  cost_inr: number | null;
  total_tokens: number | null;
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
  coupon_message?: string | null;
};

let refreshRequest: Promise<boolean> | null = null;

type ApiRequestInit = RequestInit & {
  redirectOnUnauthorized?: boolean;
};

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) || window.localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
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
    if (key?.startsWith("teacher_ai_profile:") || key?.startsWith("teacher_ai_worksheet_") || key?.startsWith("teacher_ai_tool_draft_")) {
      window.localStorage.removeItem(key);
    }
  }

  for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = window.sessionStorage.key(index);
    if (key?.startsWith("teacher_ai_profile:") || key?.startsWith("teacher_ai_worksheet_") || key?.startsWith("teacher_ai_tool_draft_")) {
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
  const code = typeof (error as { code?: unknown })?.code === "string" ? (error as { code: string }).code : undefined;
  return Object.assign(new Error(normalizeError(error)), { status: res.status, code });
}

// ─── Billing types ────────────────────────────────────────────────────────────

export type BillingMe = {
  status: string;
  plan_code: string;
  // Price actually charged to this subscriber (snapshotted at checkout) — not
  // the current marketing price, so a grandfathered price displays correctly.
  // Null for free/trial-only users who never checked out.
  price_inr: number | null;
  is_pro: boolean;
  // True only when there's a live paid subscription left to cancel. Comp/gift/
  // trial grants are false — don't show "Cancel subscription" for them.
  can_cancel: boolean;
  // True when an influencer-comped user can add a card now to auto-convert to
  // paid at comp-end (drives the billing-page nudge). False once a mandate is set.
  can_setup_mandate: boolean;
  access_until: string | null;
  paid_starts_at: string | null;
  days_left: number | null;
  billing_phone: string | null;
  monthly_used: number;
  monthly_quota: number | null;
  gift: {
    granted: boolean;
    until: string | null;
    acknowledged: boolean;
  };
};

export type PromoKind = "trial" | "comp" | "discount";

export type PromoCodeOut = {
  id: string;
  code: string;
  kind: PromoKind;
  duration_days: number | null;
  target_plan_code: string | null;
  max_redemptions: number | null;
  times_redeemed: number;
  expires_at: string | null;
  is_active: boolean;
  note: string | null;
  influencer_id?: string | null;
};

export type PromoCodeCreatePayload = {
  kind: PromoKind;
  duration_days?: number | null;
  target_plan_code?: string | null;
  max_redemptions?: number | null;
  expires_at?: string | null;
  note?: string | null;
  code?: string | null;
  influencer_id?: string | null;
};

export type InfluencerSummary = {
  id: string;
  name: string;
  created_at?: string;
};

export type InfluencerDashboard = {
  total_referred_signups: number;
  total_active_subscribers: number;
  total_earned_commission_inr: number;
  pending_payout_amount_inr: number;
  payouts_received_inr: number;
};

export type InfluencerReferralCode = {
  code: string;
  kind: PromoKind;
  duration_days?: number | null;
  expires_at?: string | null;
};

export type CommissionOut = {
  id: string;
  referred_user_name?: string | null;
  referred_user_email?: string | null;
  amount_inr: number;
  payment_status: "pending" | "paid";
  created_at: string;
  notes?: string | null;
};

export type PayoutOut = {
  id: string;
  amount_inr: number;
  payout_reference: string;
  created_at: string;
  note?: string | null;
};

export type PayoutCreateResponse = PayoutOut & {
  total_amount_cleared?: number;
  settled_commission_ids?: string[];
};

export type PromoRedemptionOut = {
  user_id: string;
  resulting_access_until: string | null;
  created_at: string;
};

export type CheckoutPayload = {
  plan_code: string;
  promo_code?: string;
  contact?: string;
};

export type CheckoutResponse = {
  razorpay_subscription_id: string;
  key_id: string;
  prefill?: { name?: string | null; email?: string | null; contact?: string | null };
  [key: string]: unknown;
};

/**
 * Shape of the HTTP 402 Payment Required body the backend returns when a
 * free user attempts a Pro-only feature (e.g. presentations, export).
 */
export type PaymentRequiredBody = {
  detail: string;
  upgrade_url?: string;
  plan_prices?: unknown;
};

/**
 * An Error subclass that carries the structured 402 body so UI code can
 * display a contextual upgrade prompt instead of a generic error message.
 * It is consistent with how `parseError` attaches `.status` to plain errors —
 * callers can use `isPaymentRequiredError` to narrow the type.
 */
export class PaymentRequiredError extends Error {
  readonly status = 402;
  readonly upgrade_url: string | undefined;
  readonly plan_prices: unknown;

  constructor(body: PaymentRequiredBody) {
    super(body.detail || "This feature requires a Pro subscription.");
    this.name = "PaymentRequiredError";
    this.upgrade_url = body.upgrade_url;
    this.plan_prices = body.plan_prices;
  }
}

/**
 * Type guard: narrows `unknown` to `PaymentRequiredError`.
 * Use in catch blocks to show an upgrade prompt.
 *
 * @example
 * } catch (err) {
 *   if (isPaymentRequiredError(err)) {
 *     // show <UpgradePrompt url={err.upgrade_url} />
 *   }
 * }
 */
export function isPaymentRequiredError(error: unknown): error is PaymentRequiredError {
  return error instanceof PaymentRequiredError;
}

// ─────────────────────────────────────────────────────────────────────────────

export type RateLimitNotice = { title: string; description: string };

/**
 * If `error` is a rate-limit response — HTTP 429 (per-user burst/hourly/daily
 * limit) or 503 (global kill-switch) — return a user-facing notice, else null.
 * The backend's `detail` (surfaced as `error.message` by parseError) already
 * names which limit was hit and roughly when to retry, so we use it as the
 * description and add a clear title so it doesn't read as a generic failure.
 */
export function getRateLimitNotice(error: unknown): RateLimitNotice | null {
  const status = (error as { status?: number } | null)?.status;
  if (status !== 429 && status !== 503) return null;
  const detail = error instanceof Error && error.message ? error.message : "";
  if (status === 503) {
    return {
      title: "Service is busy right now",
      description: detail || "We've reached overall generation capacity for the moment. Please try again in a little while.",
    };
  }
  return {
    title: "Generation limit reached",
    description: detail || "You've generated several times in quick succession. Please wait a moment and try again.",
  };
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
    if (res.status === 402) {
      const body: PaymentRequiredBody = await res.json().catch(() => ({ detail: res.statusText }));
      throw new PaymentRequiredError(body);
    }
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

export async function login(email: string, password: string): Promise<ApiUser & { name: string; role: "admin" | "teacher" | "influencer" }> {
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

export async function completeTokenLogin(tokens: Pick<TokenResponse, "access_token" | "refresh_token">): Promise<ApiUser & { name: string; role: "admin" | "teacher" | "influencer" }> {
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

export async function updateProfile(payload: {
  phone: string;
  school_id?: string;
  pending_school_name?: string;
}): Promise<ApiUser> {
  return apiFetch<ApiUser>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function ensureSession() {
  if (!getToken() && !getRefreshToken()) return false;
  if (isTokenExpired(getToken(), TOKEN_REFRESH_SKEW_SECONDS)) return refreshSession();
  return true;
}

export async function signup(
  name: string,
  email: string,
  password: string,
  phone: string,
  opts?: { school_id?: string; pending_school_name?: string; promo_code?: string }
) {
  const created = await apiFetch<SignupResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ full_name: name, email, password, phone, ...opts })
  });
  return { ...created, full_name: name, name };
}

export async function requestPasswordReset(email: string) {
  return apiFetch<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

export async function resendConfirmation(email: string) {
  return apiFetch<{ message: string }>("/auth/resend-confirmation", {
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
  adminUsage: (params: AdminUsageParams = {}) => {
    const qs = new URLSearchParams();
    if (params.start) qs.set("start", params.start);
    if (params.end) qs.set("end", params.end);
    if (params.sort) qs.set("sort", params.sort);
    if (params.limit != null) qs.set("limit", String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<AdminUsageResponse>(`/admin/usage${suffix}`);
  },
  adminActivity: (params: AdminActivityParams = {}) => {
    const qs = new URLSearchParams();
    if (params.user_id) qs.set("user_id", params.user_id);
    if (params.kind) qs.set("kind", params.kind);
    if (params.book_id) qs.set("book_id", params.book_id);
    if (params.start) qs.set("start", params.start);
    if (params.end) qs.set("end", params.end);
    if (params.skip != null) qs.set("skip", String(params.skip));
    if (params.limit != null) qs.set("limit", String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<AdminActivityResponse>(`/admin/activity${suffix}`);
  },
  adminActivityDetail: (generationId: string, kind: ActivityKind) =>
    apiFetch<ActivityDetail>(`/admin/activity/${generationId}?kind=${kind}`),
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
  schools: (q = "", skip = 0, limit = 100) => apiFetch<PaginatedResponse<School>>(`/schools?q=${encodeURIComponent(q)}&skip=${skip}&limit=${limit}`),
  // Public, unauthenticated school list for the signup picker. redirectOnUnauthorized:false
  // so a logged-out visitor is never bounced to /login if this 401s.
  publicSchools: (q = "", skip = 0, limit = 100) =>
    apiFetch<PaginatedResponse<PublicSchool>>(`/schools/public?q=${encodeURIComponent(q)}&skip=${skip}&limit=${limit}`, { redirectOnUnauthorized: false }),
  mySchool: () => apiFetch<UserSchoolProfile | null>("/schools/me"),
  updateMySchool: (payload: { school_id?: string | null; pending_school_name?: string | null; role_in_school?: string | null }) =>
    apiFetch<UserSchoolProfile>("/schools/me", { method: "PUT", body: JSON.stringify(payload) }),
  mySchoolFormat: (type = "lesson_plan") => apiFetch<SchoolFormatAvailability>(`/schools/my-format?type=${encodeURIComponent(type)}`),
  createSchool: (payload: Partial<School> & { name: string }) =>
    apiFetch<School>("/schools/admin", { method: "POST", body: JSON.stringify(payload) }),
  updateSchool: (id: string, payload: Partial<School>) =>
    apiFetch<School>(`/schools/admin/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteSchool: (id: string) => apiFetch<void>(`/schools/admin/${id}`, { method: "DELETE" }),
  schoolTemplates: (schoolId: string) => apiFetch<SchoolFormatTemplate[]>(`/schools/admin/${schoolId}/templates`),
  createSchoolTemplate: (schoolId: string, payload: Omit<SchoolFormatTemplate, "id" | "school_id" | "created_at" | "updated_at">) =>
    apiFetch<SchoolFormatTemplate>(`/schools/admin/${schoolId}/templates`, { method: "POST", body: JSON.stringify(payload) }),
  updateSchoolTemplate: (id: string, payload: Partial<Omit<SchoolFormatTemplate, "id" | "school_id" | "created_at" | "updated_at">>) =>
    apiFetch<SchoolFormatTemplate>(`/schools/admin/templates/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  lessonPlans: (skip = 0, limit = 20) => apiFetch<PaginatedResponse<LessonPlan>>(`/lesson-plans?skip=${skip}&limit=${limit}`),
  lessonPlanSummary: () => apiFetch<LessonPlanDashboardSummary>("/lesson-plans/summary"),
  dashboardSummary: () => apiFetch<DashboardSummaryResponse>("/dashboard/summary"),
  updateResourceSavedState: (type: string, id: string, isSaved: boolean) =>
    apiFetch<{ ok: boolean }>(`/library/${type}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_saved: isSaved }),
    }),
  getLibrary: (params: { skip?: number; limit?: number; q?: string; type?: string; class?: string; subject?: string }) => {
    const qStr = new URLSearchParams();
    if (params.skip !== undefined) qStr.set("skip", params.skip.toString());
    if (params.limit !== undefined) qStr.set("limit", params.limit.toString());
    if (params.q) qStr.set("q", params.q);
    if (params.type && params.type !== "all") qStr.set("resource_type", params.type);
    if (params.class) qStr.set("class_name", params.class);
    if (params.subject) qStr.set("subject", params.subject);
    return apiFetch<PaginatedResponse<LibraryItem>>(`/library?${qStr.toString()}`);
  },
  recentGenerations: (skip = 0, limit = 10) =>
    apiFetch<PaginatedResponse<RecentGenerationItem>>(`/dashboard/recent-generations?skip=${skip}&limit=${limit}`),
  lessonPlan: (id: string) => apiFetch<LessonPlan>(`/lesson-plans/${id}`),
  updateLessonPlan: (id: string, payload: Partial<Pick<LessonPlan, "class_name" | "subject" | "chapter_name" | "topic" | "duration_minutes" | "plan">>) =>
    apiFetch<LessonPlan>(`/lesson-plans/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
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
  updateWorksheet: (id: string, payload: Partial<Pick<WorksheetGeneration, "output_json">>) =>
    apiFetch<WorksheetGeneration>(`/generate/worksheet/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  createNotes: (payload: NotesGeneratePayload) =>
    apiFetch<NotesGeneration>("/notes", { method: "POST", body: JSON.stringify(payload) }),
  notesGenerations: (skip = 0, limit = 20) => apiFetch<PaginatedResponse<NotesGeneration>>(`/notes?skip=${skip}&limit=${limit}`),
  notesGeneration: (id: string) => apiFetch<NotesGeneration>(`/notes/${id}`),
  updateNotesGeneration: (id: string, payload: Partial<Pick<NotesGeneration, "output_json">>) =>
    apiFetch<NotesGeneration>(`/notes/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteNotes: (id: string) => apiFetch<void>(`/notes/${id}`, { method: "DELETE" }),
  createActivity: (payload: ActivityGeneratePayload) =>
    apiFetch<ActivityGeneration>("/activities", { method: "POST", body: JSON.stringify(payload) }),
  activities: (skip = 0, limit = 20) => apiFetch<PaginatedResponse<ActivityGeneration>>(`/activities?skip=${skip}&limit=${limit}`),
  activity: (id: string) => apiFetch<ActivityGeneration>(`/activities/${id}`),
  updateActivity: (id: string, payload: Partial<Pick<ActivityGeneration, "output_json">>) =>
    apiFetch<ActivityGeneration>(`/activities/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteActivity: (id: string) => apiFetch<void>(`/activities/${id}`, { method: "DELETE" }),
  createWritingDocument: (payload: WritingGeneratePayload) =>
    apiFetch<WritingDocument>("/writing-assistant", { method: "POST", body: JSON.stringify(payload) }),
  writingDocuments: (skip = 0, limit = 20) =>
    apiFetch<PaginatedResponse<WritingDocument>>(`/writing-assistant?skip=${skip}&limit=${limit}`),
  writingDocument: (id: string) =>
    apiFetch<WritingDocument>(`/writing-assistant/${id}`),
  updateWritingDocument: (id: string, payload: Partial<Pick<WritingDocument, "title" | "content" | "status" | "meta_json">>) =>
    apiFetch<WritingDocument>(`/writing-assistant/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  transformWritingDocument: (id: string, payload: WritingTransformPayload) =>
    apiFetch<WritingDocument>(`/writing-assistant/${id}/transform`, { method: "POST", body: JSON.stringify(payload) }),
  deleteWritingDocument: (id: string) =>
    apiFetch<void>(`/writing-assistant/${id}`, { method: "DELETE" }),
  createPresentation: (payload: PresentationGeneratePayload) =>
    apiFetch<PresentationGeneration>("/presentations", { method: "POST", body: JSON.stringify(payload) }),
  presentations: (skip = 0, limit = 20) => apiFetch<PaginatedResponse<PresentationGeneration>>(`/presentations?skip=${skip}&limit=${limit}`),
  presentation: (id: string) => apiFetch<PresentationGeneration>(`/presentations/${id}`),
  deletePresentation: (id: string) => apiFetch<void>(`/presentations/${id}`, { method: "DELETE" }),
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
    apiFetch<Book>(`/books?class_id=${encodeURIComponent(classId)}`, { method: "POST", body: form }),

  // ─── Workshops & Hosts ────────────────────────────────────────────────────────
  hosts: (activeOnly = false, skip = 0, limit = 100) =>
    apiFetch<PaginatedResponse<Host>>(`/workshops/hosts?active_only=${activeOnly}&skip=${skip}&limit=${limit}`),
  host: (id: string) =>
    apiFetch<Host>(`/workshops/hosts/${id}`),
  createHost: (payload: Omit<Host, "id" | "created_at" | "updated_at">) =>
    apiFetch<Host>("/workshops/hosts", { method: "POST", body: JSON.stringify(payload) }),
  updateHost: (id: string, payload: Partial<Host>) =>
    apiFetch<Host>(`/workshops/hosts/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteHost: (id: string) =>
    apiFetch<void>(`/workshops/hosts/${id}`, { method: "DELETE" }),
  
  workshops: (params: { destination?: "landing_page" | "teachpad_app" | "both"; status?: "draft" | "published"; is_featured?: boolean; skip?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.destination) qs.set("destination", params.destination);
    if (params.status) qs.set("status_filter", params.status);
    if (params.is_featured !== undefined) qs.set("is_featured", String(params.is_featured));
    if (params.skip !== undefined) qs.set("skip", String(params.skip));
    if (params.limit !== undefined) qs.set("limit", String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<PaginatedResponse<Workshop>>(`/workshops${suffix}`);
  },
  workshop: (id: string) =>
    apiFetch<Workshop>(`/workshops/${id}`),
  createWorkshop: (payload: any) =>
    apiFetch<Workshop>("/workshops", { method: "POST", body: JSON.stringify(payload) }),
  updateWorkshop: (id: string, payload: any) =>
    apiFetch<Workshop>(`/workshops/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteWorkshop: (id: string) =>
    apiFetch<void>(`/workshops/${id}`, { method: "DELETE" }),
  duplicateWorkshop: (id: string) =>
    apiFetch<Workshop>(`/workshops/${id}/duplicate`, { method: "POST" }),
  
  registerWorkshop: (id: string) =>
    apiFetch<WorkshopRegistration>(`/workshops/${id}/register`, { method: "POST" }),
  myRegistrations: () =>
    apiFetch<WorkshopRegistration[]>("/workshops/my-registrations"),
  workshopRegistrations: (id: string) =>
    apiFetch<WorkshopRegistration[]>(`/workshops/${id}/registrations`),
  updateWorkshopRegistration: (id: string, payload: { attended?: boolean; certificate_issued?: boolean }) =>
    apiFetch<WorkshopRegistration>(`/workshops/registrations/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  cancelWorkshopRegistration: (id: string) =>
    apiFetch<void>(`/workshops/${id}/register`, { method: "DELETE" }),
  submitWorkshopFeedback: (id: string, payload: { feedback_rating: number; feedback_text?: string | null }) =>
    apiFetch<WorkshopRegistration>(`/workshops/${id}/feedback`, { method: "PATCH", body: JSON.stringify(payload) }),
  
  uploadWorkshopMedia: (file: File, folder: "workshops" | "hosts") => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<{ path: string }>(`/workshops/upload?folder=${folder}`, {
      method: "POST",
      body: formData,
    });
  },

  // ─── Billing ────────────────────────────────────────────────────────────────
  billingMe: () =>
    apiFetch<BillingMe>("/billing/me"),
  billingCheckout: (payload: CheckoutPayload) =>
    apiFetch<CheckoutResponse>("/billing/checkout", { method: "POST", body: JSON.stringify(payload) }),
  billingCancel: () =>
    apiFetch<{ ok: boolean }>("/billing/cancel", { method: "POST" }),
  billingRedeem: (code: string) =>
    apiFetch<BillingMe>("/billing/redeem", { method: "POST", body: JSON.stringify({ code }) }),
  billingUpdatePhone: (contact: string) =>
    apiFetch<BillingMe>("/billing/phone", { method: "PATCH", body: JSON.stringify({ contact }) }),
  billingGiftAcknowledge: () =>
    apiFetch<{ ok: boolean }>("/billing/gift/acknowledge", { method: "POST" }),
  adminPromoCodes: (skip = 0, limit = 100) =>
    apiFetch<PromoCodeOut[]>(`/admin/promo-codes?skip=${skip}&limit=${limit}`),
  adminCreatePromoCode: (payload: PromoCodeCreatePayload) =>
    apiFetch<PromoCodeOut>("/admin/promo-codes", { method: "POST", body: JSON.stringify(payload) }),
  adminSetPromoActive: (id: string, isActive: boolean) =>
    apiFetch<PromoCodeOut>(`/admin/promo-codes/${id}`, { method: "PATCH", body: JSON.stringify({ is_active: isActive }) }),
  adminPromoRedemptions: (id: string) =>
    apiFetch<PromoRedemptionOut[]>(`/admin/promo-codes/${id}/redemptions`),
  adminInfluencers: () =>
    apiFetch<InfluencerSummary[]>("/admin/influencers"),
  adminChangeUserRole: (userId: string, role: "teacher" | "influencer") =>
    apiFetch<{ message: string }>(`/admin/users/${userId}/change-role`, { method: "POST", body: JSON.stringify({ role }) }),
  adminCommissions: (params: { influencer_id?: string; payment_status?: "pending" | "paid" } = {}) => {
    const qs = new URLSearchParams();
    if (params.influencer_id) qs.set("influencer_id", params.influencer_id);
    if (params.payment_status) qs.set("payment_status", params.payment_status);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<CommissionOut[]>(`/admin/commissions${suffix}`);
  },
  adminPayouts: (influencerId?: string) =>
    apiFetch<PayoutOut[]>(`/admin/payouts${influencerId ? `?influencer_id=${encodeURIComponent(influencerId)}` : ""}`),
  adminCreateInfluencerPayout: (influencerId: string, payload: { commission_ids: string[] | null; payout_reference: string; note?: string | null }) =>
    apiFetch<PayoutCreateResponse>(`/admin/influencers/${influencerId}/payout`, { method: "POST", body: JSON.stringify(payload) }),
  influencerDashboard: () =>
    apiFetch<InfluencerDashboard>("/influencer/dashboard"),
  influencerCommissions: () =>
    apiFetch<CommissionOut[]>("/influencer/commissions"),
  influencerPayouts: () =>
    apiFetch<PayoutOut[]>("/influencer/payouts"),
  influencerReferralCodes: () =>
    apiFetch<InfluencerReferralCode[]>("/influencer/codes"),
  adminExtendUser: (userId: string, days: number) =>
    apiFetch<{ ok: boolean }>(`/admin/subscriptions/${userId}/extend`, { method: "POST", body: JSON.stringify({ days }) }),
  adminCompUser: (userId: string, days: number) =>
    apiFetch<{ ok: boolean }>(`/admin/subscriptions/${userId}/comp`, { method: "POST", body: JSON.stringify({ days }) }),
  adminResendConfirmation: (userId: string) =>
    apiFetch<{ message: string }>(`/admin/users/${userId}/resend-confirmation`, { method: "POST" }),
  adminDeleteUser: (userId: string) =>
    apiFetch<void>(`/admin/users/${userId}`, { method: "DELETE" }),
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
    school_format: plan.school_format,
    school_format_sections: Array.isArray(plan.school_format_sections) ? plan.school_format_sections : [],
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
