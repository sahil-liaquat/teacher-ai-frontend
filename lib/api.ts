import { TOOL_REGISTRY } from "@/lib/tools";
import type { ProfileAvatarKey } from "@/lib/profile-avatars";
import type {
  PrimaryCoverageDayState,
  PrimaryLevelKey,
  PrimaryThemeCoverageState,
} from "./primary-coverage";

// Re-exported so every consumer keeps treating lib/api.ts as the source of truth
// for API types. The unions themselves live in lib/primary-coverage.ts because
// that module is import-free and node-testable, and it needs them at runtime.
export type { PrimaryCoverageDayState, PrimaryLevelKey, PrimaryThemeCoverageState };

import type { ObservationRating, ObservationTrend } from "./primary-roster";
import type { PrimaryTeachingContext } from "./primary-context-helpers";

// Re-exported so callers import every Primary wire type from one module. The
// unions themselves live in lib/primary-roster.ts because that module must stay
// import-free for the node test runner.
export type { ObservationRating, ObservationTrend };

function resolveApiBase() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configured) return configured.endsWith("/api/v1") ? configured : `${configured}/api/v1`;
  return "https://teacher-ai-backend-dev.onrender.com/api/v1";
}

export const API_BASE = resolveApiBase();
export const BACKEND_ROOT = API_BASE.replace(/\/api\/v1$/, "");

export function resolveUploadUrl(value?: string | null) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/assets/") || value.startsWith("/landing/") || value.startsWith("/ai-tools/")) return value;

  const relativePath = value
    .replace(/^\/+/, "")
    .replace(/^uploads\//, "");
  return `${BACKEND_ROOT}/uploads/${relativePath}`;
}

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
  needs_onboarding?: boolean;
  confirmed?: boolean;
  logged_in?: boolean;
  has_subscription?: boolean;
  board_preference?: string | null;
  role_in_school?: string | null;
  school_id?: string | null;
  pending_school_name?: string | null;
  feedback_tools?: string[];
  avatar_key?: ProfileAvatarKey;
};

export type NotificationSeverity = "info" | "success" | "warning" | "urgent";
export type AppNotification = {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  action_label: string | null;
  action_url: string | null;
  expires_at: string | null;
  is_active: boolean;
  published_by_id: string | null;
  created_at: string;
  updated_at: string;
  is_read?: boolean;
  read_at?: string | null;
};
export type NotificationInbox = {
  items: AppNotification[];
  unread_count: number;
};
export type NotificationCreatePayload = {
  title: string;
  message: string;
  severity: NotificationSeverity;
  action_label?: string | null;
  action_url?: string | null;
  expires_at?: string | null;
};

/** Tools that fire the first-use feedback popup, one per tool per user. */
export type GenerationTool = "lesson_plan" | "worksheet" | "presentation" | "notes" | "activity";

/** Dispatched on `window` after a generation succeeds; the feedback modal listens. */
export const GENERATION_COMPLETED_EVENT = "teachpad:generation-completed";

function withGenerationEvent<T>(tool: GenerationTool, promise: Promise<T>): Promise<T> {
  return promise.then((result) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(GENERATION_COMPLETED_EVENT, { detail: { tool } }));
    }
    return result;
  });
}

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
export type WorkspaceResourceType = "lesson_plan" | "presentation" | "worksheet" | "activity" | "notes";
export type WorkspaceResourceStatus = "missing" | "ready" | "skipped" | "generating" | "failed" | "stale";
export type WorkspaceTopicStatus = "pending" | "in_progress" | "completed";
export type WorkspaceResource = {
  type: WorkspaceResourceType;
  status: WorkspaceResourceStatus;
  generation_id: string | null;
  href: string;
  generate_href: string;
  generated_at: string | null;
  version_count: number;
};
export type WorkspaceTopic = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  status: WorkspaceTopicStatus;
  is_current: boolean;
  is_ready_to_teach: boolean;
  scheduled_at: string | null;
  completed_at: string | null;
  teacher_notes: WorkspaceTeacherNotes;
  resources: WorkspaceResource[];
  updated_at: string;
};
export type WorkspaceTeacherNotes = {
  preparation: string;
  teaching: string;
  reflection: string;
};
export type TeachingWorkspace = {
  id: string;
  user_id: string;
  board_id: string;
  board_code: string;
  board_name: string;
  class_id: string;
  class_name: string;
  grade_number: number;
  book_id: string;
  book_title: string;
  subject: string;
  chapter_id: string;
  chapter_number: number;
  chapter_title: string;
  section: string;
  lesson_duration_minutes: number;
  is_archived: boolean;
  is_bookmarked: boolean;
  last_opened_at: string;
  resource_preferences: WorkspaceResourceType[];
  completed_topic_count: number;
  covered_topic_count: number;
  total_topic_count: number;
  ready_resource_count: number;
  expected_resource_count: number;
  current_topic_id: string | null;
  topics: WorkspaceTopic[];
  created_at: string;
  updated_at: string;
};
export type TeachingWorkspaceCreatePayload = {
  board_id: string;
  class_id: string;
  book_id: string;
  chapter_id: string;
  section?: string;
  lesson_duration_minutes?: number;
  resource_preferences?: WorkspaceResourceType[];
  topics: Array<{ title: string; description?: string | null }>;
};

export type WorkspaceClassSummary = {
  class_id: string;
  class_name: string;
  grade_number: number;
  board_id: string;
  board_code: string;
  board_name: string;
  subjects: string[];
  chapters_worked_on: number;
  resources_generated: number;
  completed_topics: number;
  total_topics: number;
  progress_percent: number;
  last_opened_at: string;
};

export type WorkspaceChapterSummary = {
  class_id: string;
  class_name: string;
  board_id: string;
  board_code: string;
  book_id: string;
  book_title: string;
  chapter_id: string;
  chapter_number: number;
  chapter_title: string;
  subject: string;
  workspace_id: string | null;
  is_archived: boolean;
  completed_topics: number;
  total_topics: number;
  progress_percent: number;
  resources_generated: number;
  last_opened_at: string;
};
export type WorkspaceHomeTopic = {
  workspace_id: string;
  workspace_is_archived: boolean;
  topic: WorkspaceTopic;
  board_code: string;
  class_id: string;
  class_name: string;
  subject: string;
  chapter_id: string;
  chapter_number: number;
  chapter_title: string;
  section: string;
  lesson_duration_minutes: number;
  resource_preferences: WorkspaceResourceType[];
  last_opened_at: string;
  last_generated_at: string | null;
};
export type WorkspaceHomeClass = {
  class_id: string;
  class_name: string;
  grade_number: number;
  board_code: string;
  subjects: string[];
  current_topic: WorkspaceHomeTopic | null;
  ready_topics: number;
  attention_topics: number;
  last_activity_at: string;
};
export type WorkspaceAttentionKind =
  | "failed_resource"
  | "generating_resource"
  | "upcoming_not_ready"
  | "missing_assessment"
  | "long_incomplete"
  | "stale_resource"
  | "skipped_resource";
export type WorkspaceAttentionItem = {
  kind: WorkspaceAttentionKind;
  priority: number;
  message: string;
  topic: WorkspaceHomeTopic;
};
export type WorkspaceHome = {
  continue_preparing: WorkspaceHomeTopic | null;
  recent_chapters: WorkspaceHomeTopic[];
  upcoming: WorkspaceHomeTopic[];
  needs_attention: WorkspaceAttentionItem[];
  classes: WorkspaceHomeClass[];
};
export type WorkspaceClassOverview = {
  class_summary: WorkspaceHomeClass | null;
  workspaces: TeachingWorkspace[];
  available_chapters: WorkspaceChapterSummary[];
};
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
  whatsapp_group_link?: string | null;
  venue_details?: string | null;
  max_capacity?: number | null;
  banner_url?: string | null;
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
  input_json?: Record<string, any> | null;
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
  available_resources?: string[];
  selected_competencies?: string[];
  learning_objectives_hint?: string;
  student_ability_profile: "needs_more_support" | "mixed_ability" | "at_expected_level" | "advanced";
  class_size: "small" | "medium" | "large";
  language?: string;
  teaching_style?: string;
  workspace?: string;
  use_school_format?: boolean;
  format_type?: "teachpad_standard" | "school_format";
};

export type ElifPriority = "high" | "medium" | "low";
export type ElifStrength = { title: string; evidence: string; affected_sections: string[] };
export type ElifIssue = {
  id: string;
  title: string;
  problem: string;
  evidence: string;
  why_it_matters: string;
  recommended_change: string;
  affected_sections: string[];
  priority: ElifPriority;
  action_type: string;
};
export type ElifQuickAction = { id: string; label: string; instruction: string; affected_sections: string[] };
export type ElifAnalysis = {
  overall_summary: string;
  quality_score: Record<"overall" | "objectives" | "alignment" | "pedagogy" | "assessment" | "feasibility" | "differentiation", number>;
  strengths: ElifStrength[];
  issues: ElifIssue[];
  quick_actions: ElifQuickAction[];
  cached: boolean;
};
export type ElifProposedChange = { id: string; title: string; instruction: string; affected_sections: string[]; action_type: string };
export type ElifChatResponse = {
  message: string;
  intent: "explain" | "suggest" | "update" | "clarify";
  proposed_changes: ElifProposedChange[];
  requires_confirmation: boolean;
};
export type ElifApplyResponse = {
  lesson_plan: Record<string, any>;
  updated_sections: Record<string, any>;
  change_summary: string;
  unchanged_sections: string[];
  revision: { revision_id: string; affected_sections: string[]; change_summary: string; created_at: string };
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
  workspace?: string;
  difficulty_distribution?: { easy: number; medium: number; hard: number };
  question_mix?: Array<
    "recall_based" |
    "competency_based" |
    "real_life_application" |
    "value_based" |
    "computational_thinking"
  >;
  competency_focus?: Array<
    "conceptual_understanding" |
    "application_problem_solving" |
    "critical_thinking" |
    "communication" |
    "creativity"
  >;
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
  /** Languages this worksheet can be read in, primary first. */
  available_languages?: string[];
  primary_language?: string;
};

export type WorksheetTranslation = {
  id: string;
  worksheet_id: string;
  language: string;
  output_json: any;
  model?: string | null;
  /** The source worksheet was edited after this translation — offer a re-translate. */
  is_stale: boolean;
  created_at?: string;
  updated_at?: string;
};

export type NotesGeneratePayload = {
  book_id: string;
  chapter_name?: string;
  chapter_names?: string[];
  topic?: string;
  language?: string;
  workspace?: string;
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
  workspace?: string;
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
  audience: "Class 1" | "Class 2" | "Class 3" | "Class 4" | "Class 5" | "Class 6" | "Class 7" | "Class 8" | "Class 9" | "Class 10" | "Class 11" | "Class 12";
  slide_count: 6 | 8 | 10 | 12;
  language: "English" | "Hindi" | "Urdu";
  workspace?: string;
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

export type StreakRewardStatus = "locked" | "in_progress" | "unlocked" | "claimed" | "expired";
export type StreakReward = {
  id: string;
  milestone_days: number;
  reward_type: "badge" | "certificate" | "recognition";
  reward_value: { badge_tier: StreakBadgeTier; has_certificate: boolean; recognition_eligible: boolean };
  reward_label: string;
  reward_description: string;
  includes: string[];
  badge_tier: StreakBadgeTier;
  has_certificate: boolean;
  recognition_eligible: boolean;
  recognition_consent: boolean | null;
  status: StreakRewardStatus;
  days_remaining: number;
  unlocked_at: string | null;
  claimed_at: string | null;
  expires_at: string | null;
};
export type StreakBadgeTier = "bronze" | "silver" | "gold" | "champion";
export type RecognitionProfile = {
  display_name: string;
  avatar_key: ProfileAvatarKey;
  school: string | null;
  district: string | null;
  current_streak: number;
};
export type RecognitionConsent = { reward: StreakReward; profile: RecognitionProfile | null; message: string };
export type FeaturedTeacher = {
  milestone_days: 14 | 30;
  badge_tier: "gold" | "champion";
  achievement_date: string;
  profile: RecognitionProfile;
};
export type StreakSummary = {
  current_streak: number;
  best_streak: number;
  total_teaching_days: number;
  current_month_teaching_days: number;
  last_qualifying_date: string | null;
  completed_today: boolean;
  has_started: boolean;
  next_reward: StreakReward | null;
  timezone: string;
};
export type StreakWeek = {
  start: string;
  end: string;
  completed_count: number;
  days: Array<{
    date: string;
    label: string;
    status: "completed" | "pending" | "future" | "missed";
    resource_count: number;
  }>;
};
export type StreakMonth = {
  year: number;
  month: number;
  today: string;
  days: Array<{
    date: string;
    resource_count: number;
    resource_types: GenerationTool[];
    streak_day: number | null;
    reward_milestone: 3 | 7 | 14 | 30 | null;
    is_reward_milestone: boolean;
  }>;
  projected_rewards: Array<{
    date: string;
    milestone_days: 3 | 7 | 14 | 30;
  }>;
};
export type StreakRewards = { items: StreakReward[] };
export type StreakAdminAnalytics = {
  activated_users: number;
  streak_starters: number;
  activated_users_starting_streak_pct: number;
  reached_3_pct: number;
  reached_7_pct: number;
  reached_14_pct: number;
  reached_30_pct: number;
  d7_retention_started_pct: number;
  d7_retention_not_started_pct: number;
  paid_conversion_by_milestone: Record<string, number>;
  average_teaching_days_per_active_teacher: number;
  reward_claim_rate_pct: number;
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
  topic?: string | null;
  language?: string | null;
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
  user_funnel: {
    total: number;
    active: number;
    confirmed: number;
    logged_in: number;
    onboarded: number;
    subscribed: number;
    new_last_24_hours: number;
    confirmed_never_logged_in: number;
    logged_in_without_subscription: number;
    subscribed_inactive_30d: number;
  };
};

export type AdminSignupActivity = {
  start: string;
  end: string;
  total: number;
  buckets: Array<{
    day: string;
    signups: number;
    generations: number;
    activated: number;
    activation_rate: number;
  }>;
};

export type AdminFeedbackItem = {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  tool: string;
  rating: number | null;
  comment: string | null;
  dismissed: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminFeedbackResponse = {
  items: AdminFeedbackItem[];
  total: number;
  skip: number;
  limit: number;
  tools: string[];
  summary: {
    total: number;
    submitted: number;
    dismissed: number;
    with_comments: number;
    average_rating: number | null;
  };
};

export type AdminFeedbackParams = {
  q?: string;
  tool?: string;
  status?: "submitted" | "dismissed";
  rating?: number;
  skip?: number;
  limit?: number;
};

export type AdminUserDetail = {
  account: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    avatar_key: string;
    role: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  auth: {
    confirmed: boolean;
    logged_in: boolean;
    email_confirmed_at: string | null;
    last_sign_in_at: string | null;
  };
  onboarding: {
    completed_at: string | null;
    board_preference: string | null;
    role_in_school: string | null;
    phone_prompt_exempt: boolean;
    pending_school_name: string | null;
  };
  school: {
    id: string;
    name: string;
    city: string | null;
    district: string | null;
    state: string | null;
    board_name: string | null;
  } | null;
  subscription: {
    id: string;
    plan_code: string;
    status: string;
    source: string;
    price_inr: number | null;
    access_until: string | null;
    trial_started_at: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    paid_starts_at: string | null;
    cancel_at_period_end: boolean;
    is_launch_gift: boolean;
    comp_from_influencer: boolean;
    gift_acknowledged_at: string | null;
    billing_phone: string | null;
    razorpay_subscription_id: string | null;
    razorpay_customer_id: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  referrer: { id: string; name: string; email: string } | null;
  generation_counts: {
    lesson_plans: number;
    worksheets: number;
    notes: number;
    activities: number;
    presentations: number;
    writing_documents: number;
    workspaces: number;
  };
  usage: {
    calls: number;
    failures: number;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost_inr: number;
    last_generation_at: string | null;
  };
  feedback: Array<{
    id: string;
    tool: string;
    rating: number | null;
    comment: string | null;
    dismissed: boolean;
    created_at: string;
  }>;
  workshops: Array<{
    id: string;
    workshop_id: string;
    title: string;
    scheduled_at: string;
    attended: boolean;
    certificate_issued: boolean;
    feedback_rating: number | null;
    feedback_text: string | null;
    registered_at: string;
  }>;
  promo_redemptions: Array<{
    id: string;
    code: string;
    kind: string;
    duration_days: number | null;
    resulting_access_until: string | null;
    redeemed_at: string;
  }>;
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

export function hasStoredAuthTokens() {
  if (typeof window === "undefined") return false;
  return [
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    LEGACY_ACCESS_TOKEN_KEY,
    LEGACY_REFRESH_TOKEN_KEY,
    LEGACY_CUSTOM_TOKEN_KEY
  ].some((key) => Boolean(window.localStorage.getItem(key)));
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

export type TrialGateInfo = {
  free_per_tool: number;
  remaining: Record<string, number>;
};

/**
 * State of a failed recurring payment. Present on BillingMe only while a charge
 * is failing, so its presence alone is the signal to show the payment-problem
 * surface — never infer "payment failed" from `is_pro: false`, which is also
 * true for an ordinary expired trial.
 */
export type PastDueInfo = {
  // "retrying" — Razorpay is still auto-retrying the charge and the teacher
  // still has access. "halted" — retries exhausted, access is paused.
  stage: "retrying" | "halted" | string;
  since: string | null;
  grace_until: string | null;
  // Computed server-side so the UI never has to reason about clock skew.
  in_grace: boolean;
  // Razorpay-hosted invoice link — one tap to clear the outstanding charge.
  invoice_url: string | null;
  amount_inr: number | null;
  attempts: number;
  // Razorpay's reason for the last failure, e.g. "Insufficient balance".
  last_error: string | null;
};

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
  // Per-tool free-generation state during a gated trial; null when the gate
  // does not apply (comped/paid/gate-off).
  trial_gate?: TrialGateInfo | null;
  // Present only while a recurring payment is failing; null when healthy.
  past_due?: PastDueInfo | null;
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

export type FunnelStage = "paying" | "churned" | "on_free_access";

export type InfluencerOverviewRow = {
  id: string;
  name: string;
  email: string;
  created_at?: string | null;
  signups: number;
  on_free_access: number;
  paying: number;
  churned: number;
  lifetime_earned_inr: number;
  pending_owed_inr: number;
  paid_out_inr: number;
};

export type InfluencerOverviewResponse = {
  total: number;
  skip: number;
  limit: number;
  totals: { influencers: number; referred: number; paying: number; pending_owed_inr: number };
  items: InfluencerOverviewRow[];
};

export type InfluencerDetail = {
  id: string;
  name: string;
  email: string;
  created_at?: string | null;
  phone?: string | null;
  funnel: { signups: number; on_free_access: number; paying: number; churned: number };
  money: { lifetime_earned_inr: number; pending_owed_inr: number; paid_out_inr: number };
};

export type ReferredUserRow = {
  user_id: string;
  name?: string | null;
  email: string;
  stage: FunnelStage;
  code_used?: string | null;
  signed_up_at?: string | null;
  plan_code?: string | null;
  status?: string | null;
  earned_from_inr: number;
};

export type AdminCommissionRow = {
  id: string;
  referred_user_name?: string | null;
  referred_user_email?: string | null;
  plan_code?: string | null;
  amount_inr: number;
  payment_status: "pending" | "paid";
  payout_reference?: string | null;
  created_at: string;
  notes?: string | null;
};

export type AdminPayoutRow = {
  id: string;
  amount_inr: number;
  payout_reference: string;
  created_at: string;
};

type Envelope<T> = { total: number; skip: number; limit: number; items: T[] };
export type ReferredUsersResponse = Envelope<ReferredUserRow>;
export type AdminCommissionsResponse = Envelope<AdminCommissionRow>;
export type AdminPayoutsResponse = Envelope<AdminPayoutRow>;

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
  code?: string;
  upgrade_url?: string;
  plan_prices?: unknown;
};

/**
 * An Error subclass that carries the structured 402 body so UI code can
 * display a contextual upgrade prompt instead of a generic error message.
 * It is consistent with how `parseError` attaches `.status` to plain errors —
 * callers can use `isPaymentRequiredError` to narrow the type. It also carries
 * `.code` (e.g. "TRIAL_MANDATE_REQUIRED") so `getErrorCode` (lib/errors.ts)
 * can distinguish specific 402 reasons instead of treating all of them as the
 * generic "Pro plan required" gate.
 */
export class PaymentRequiredError extends Error {
  readonly status = 402;
  readonly code: string | undefined;
  readonly upgrade_url: string | undefined;
  readonly plan_prices: unknown;

  constructor(body: PaymentRequiredBody) {
    super(body.detail || "This feature requires a Pro subscription.");
    this.name = "PaymentRequiredError";
    this.code = body.code;
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
  if (typeof window !== "undefined" && !headers.has("X-TeachPad-Timezone")) {
    headers.set("X-TeachPad-Timezone", Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
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

export async function submitOnboarding(payload: {
  role_in_school?: string;
  board_preference?: string;
  school_id?: string;
  pending_school_name?: string;
}): Promise<ApiUser> {
  return apiFetch<ApiUser>("/auth/me/onboarding", {
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
  adminSignupActivity: () => apiFetch<AdminSignupActivity>("/admin/signup-activity"),
  adminStreakAnalytics: () => apiFetch<StreakAdminAnalytics>("/admin/streaks/analytics"),
  streakSummary: () => apiFetch<StreakSummary>("/streak/summary"),
  streakWeek: () => apiFetch<StreakWeek>("/streak/week"),
  streakMonth: (year?: number, month?: number) => {
    const qs = new URLSearchParams();
    if (year != null) qs.set("year", String(year));
    if (month != null) qs.set("month", String(month));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<StreakMonth>(`/streak/month${suffix}`);
  },
  streakRewards: () => apiFetch<StreakRewards>("/streak/rewards"),
  claimStreakReward: (milestone: number) =>
    apiFetch<{ reward: StreakReward; message: string }>(`/streak/rewards/${milestone}/claim`, { method: "POST" }),
  streakRecognitionProfile: (milestone: number) =>
    apiFetch<RecognitionConsent>(`/streak/rewards/${milestone}/recognition`),
  updateStreakRecognition: (milestone: number, approved: boolean) =>
    apiFetch<RecognitionConsent>(`/streak/rewards/${milestone}/recognition`, {
      method: "PUT",
      body: JSON.stringify({ approved }),
    }),
  featuredTeachers: () => apiFetch<{ items: FeaturedTeacher[] }>("/streak/featured-teachers", { redirectOnUnauthorized: false }),
  trackStreakEvent: (payload: {
    event_name: "streak_pill_viewed" | "streak_pill_clicked" | "streak_drawer_opened" | "streak_cta_clicked" | "full_journey_viewed";
    current_streak?: number;
    milestone?: number;
    resource_type?: GenerationTool;
    activity_date?: string;
    metadata?: Record<string, unknown>;
  }) => apiFetch<void>("/streak/events", { method: "POST", body: JSON.stringify(payload) }),
  adminUserDetail: (userId: string) => apiFetch<AdminUserDetail>(`/admin/users/${userId}`),
  adminFeedback: (params: AdminFeedbackParams = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.tool) qs.set("tool", params.tool);
    if (params.status) qs.set("status", params.status);
    if (params.rating != null) qs.set("rating", String(params.rating));
    if (params.skip != null) qs.set("skip", String(params.skip));
    if (params.limit != null) qs.set("limit", String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<AdminFeedbackResponse>(`/admin/feedback${suffix}`);
  },
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
  notifications: () => apiFetch<NotificationInbox>("/notifications"),
  markNotificationRead: (id: string) =>
    apiFetch<{ ok: boolean; marked_read: number }>(`/notifications/${id}/read`, { method: "POST" }),
  markAllNotificationsRead: () =>
    apiFetch<{ ok: boolean; marked_read: number }>("/notifications/read-all", { method: "POST" }),
  clearNotification: (id: string) =>
    apiFetch<{ ok: boolean; cleared: number }>(`/notifications/${id}/clear`, { method: "POST" }),
  clearAllNotifications: () =>
    apiFetch<{ ok: boolean; cleared: number }>("/notifications/clear-all", { method: "POST" }),
  adminNotifications: () => apiFetch<AppNotification[]>("/admin/notifications"),
  adminPublishNotification: (payload: NotificationCreatePayload) =>
    apiFetch<AppNotification>("/admin/notifications", { method: "POST", body: JSON.stringify(payload) }),
  adminSetNotificationActive: (id: string, isActive: boolean) =>
    apiFetch<AppNotification>(`/admin/notifications/${id}`, { method: "PATCH", body: JSON.stringify({ is_active: isActive }) }),
  adminDeleteNotification: (id: string) =>
    apiFetch<void>(`/admin/notifications/${id}`, { method: "DELETE" }),
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
  teachingWorkspaces: (includeArchived = false) =>
    apiFetch<TeachingWorkspace[]>(`/teaching-workspaces?include_archived=${includeArchived}`),
  workspaceHome: () => apiFetch<WorkspaceHome>("/teaching-workspaces/home"),
  workspaceClassOverview: (classId: string) =>
    apiFetch<WorkspaceClassOverview>(`/teaching-workspaces/classes/${classId}/overview`),
  workspaceClasses: () =>
    apiFetch<WorkspaceClassSummary[]>("/teaching-workspaces/navigation/classes"),
  workspaceChapters: (classId: string) =>
    apiFetch<WorkspaceChapterSummary[]>(`/teaching-workspaces/navigation/classes/${classId}/chapters`),
  openWorkspaceChapter: (chapterId: string) =>
    apiFetch<TeachingWorkspace>(`/teaching-workspaces/navigation/chapters/${chapterId}/open`, { method: "POST" }),
  currentTeachingWorkspace: () => apiFetch<TeachingWorkspace | null>("/teaching-workspaces/current"),
  teachingWorkspace: (id: string) => apiFetch<TeachingWorkspace>(`/teaching-workspaces/${id}`),
  createTeachingWorkspace: (payload: TeachingWorkspaceCreatePayload) =>
    apiFetch<TeachingWorkspace>("/teaching-workspaces", { method: "POST", body: JSON.stringify(payload) }),
  updateTeachingWorkspace: (id: string, payload: Partial<Pick<TeachingWorkspace, "section" | "lesson_duration_minutes" | "is_archived" | "is_bookmarked" | "resource_preferences">>) =>
    apiFetch<TeachingWorkspace>(`/teaching-workspaces/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  addTeachingWorkspaceTopic: (id: string, payload: { title: string; description?: string | null }) =>
    apiFetch<TeachingWorkspace>(`/teaching-workspaces/${id}/topics`, { method: "POST", body: JSON.stringify(payload) }),
  updateTeachingWorkspaceTopic: (workspaceId: string, topicId: string, payload: Partial<Pick<WorkspaceTopic, "title" | "description" | "status" | "is_current" | "is_ready_to_teach" | "scheduled_at" | "teacher_notes">>) =>
    apiFetch<TeachingWorkspace>(`/teaching-workspaces/${workspaceId}/topics/${topicId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  updateTeachingWorkspaceResource: (workspaceId: string, topicId: string, resourceType: WorkspaceResourceType, status: "skipped" | "missing") =>
    apiFetch<TeachingWorkspace>(`/teaching-workspaces/${workspaceId}/topics/${topicId}/resources/${resourceType}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
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
  primaryActivityEvents: (limit = 30) => apiFetch<PrimaryActivityEvent[]>(`/primary-activity-events?limit=${limit}`),
  createPrimaryActivityEvent: (payload: PrimaryActivityEventCreatePayload) =>
    apiFetch<PrimaryActivityEvent>("/primary-activity-events", { method: "POST", body: JSON.stringify(payload) }),
  plannerActivities: (start: string, end: string, sectionId?: string) =>
    apiFetch<PrimaryPlannerActivity[]>(
      `/primary-planner-activities?start=${start}&end=${end}${sectionId ? `&section_id=${sectionId}` : ""}`,
    ),
  plannerActivity: (id: string) => apiFetch<PrimaryPlannerActivity>(`/primary-planner-activities/${id}`),
  primaryCoverage: (start: string, end: string, sectionId?: string) =>
    apiFetch<PrimaryCoverageReport>(
      `/primary/coverage?start=${start}&end=${end}${sectionId ? `&section_id=${sectionId}` : ""}`,
    ),
  primaryThemeCoverage: (filters: { level: PrimaryLevelKey; subject?: string; language?: string }) => {
    const params = new URLSearchParams({ level: filters.level });
    if (filters.subject) params.append("subject", filters.subject);
    if (filters.language) params.append("language", filters.language);
    return apiFetch<PrimaryThemeCoverageReport>(`/primary/coverage/themes?${params.toString()}`);
  },
  primarySections: (includeArchived = false) =>
    apiFetch<PrimarySection[]>(
      `/primary/sections${includeArchived ? "?include_archived=true" : ""}`,
    ),
  createPrimarySection: (payload: PrimarySectionCreatePayload) =>
    apiFetch<PrimarySection>("/primary/sections", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePrimarySection: (id: string, payload: PrimarySectionUpdatePayload) =>
    apiFetch<PrimarySection>(`/primary/sections/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deletePrimarySection: (id: string) =>
    apiFetch<void>(`/primary/sections/${id}`, { method: "DELETE" }),
  primaryStudents: (filters: { sectionId?: string; includeArchived?: boolean } = {}) => {
    const params = new URLSearchParams();
    if (filters.sectionId) params.set("section_id", filters.sectionId);
    if (filters.includeArchived) params.set("include_archived", "true");
    const suffix = params.toString();
    return apiFetch<PrimaryStudent[]>(`/primary/students${suffix ? `?${suffix}` : ""}`);
  },
  createPrimaryStudent: (payload: PrimaryStudentCreatePayload) =>
    apiFetch<PrimaryStudent>("/primary/students", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePrimaryStudent: (id: string, payload: PrimaryStudentUpdatePayload) =>
    apiFetch<PrimaryStudent>(`/primary/students/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deletePrimaryStudent: (id: string) =>
    apiFetch<void>(`/primary/students/${id}`, { method: "DELETE" }),
  primaryStudentProfile: (id: string, start: string, end: string) =>
    apiFetch<PrimaryStudentProfile>(
      `/primary/students/${id}/profile?start=${start}&end=${end}`,
    ),
  primaryObservations: (filters: {
    start: string;
    end: string;
    studentId?: string;
    teachingDayId?: string;
  }) => {
    const params = new URLSearchParams({ start: filters.start, end: filters.end });
    if (filters.studentId) params.set("student_id", filters.studentId);
    if (filters.teachingDayId) params.set("teaching_day_id", filters.teachingDayId);
    return apiFetch<PrimaryObservation[]>(`/primary/observations?${params.toString()}`);
  },
  // POST is create-or-replace here, not create — see the route's comment.
  upsertPrimaryObservation: (payload: PrimaryObservationUpsertPayload) =>
    apiFetch<PrimaryObservation>("/primary/observations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePrimaryObservation: (id: string, payload: PrimaryObservationUpdatePayload) =>
    apiFetch<PrimaryObservation>(`/primary/observations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deletePrimaryObservation: (id: string) =>
    apiFetch<void>(`/primary/observations/${id}`, { method: "DELETE" }),
  getTodayWorkspace: (date: string, sectionId?: string) =>
    apiFetch<PrimaryTodayRead>(
      `/primary/today?date=${date}${sectionId ? `&section_id=${sectionId}` : ""}`,
    ),
  updateTodayDayRecord: (
    date: string,
    payload: PrimaryTeachingDayUpdatePayload,
    sectionId?: string,
  ) =>
    apiFetch<PrimaryTeachingDay>(
      `/primary/today?date=${date}${sectionId ? `&section_id=${sectionId}` : ""}`,
      { method: "PUT", body: JSON.stringify(payload) },
    ),
  createPlannerActivity: (payload: PrimaryPlannerActivityCreatePayload, sectionId?: string) =>
    apiFetch<PrimaryPlannerActivity>(
      `/primary-planner-activities${sectionId ? `?section_id=${sectionId}` : ""}`,
      { method: "POST", body: JSON.stringify(payload) },
    ),
  updatePlannerActivity: (id: string, payload: PrimaryPlannerActivityUpdatePayload) =>
    apiFetch<PrimaryPlannerActivity>(`/primary-planner-activities/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deletePlannerActivity: (id: string) =>
    apiFetch<void>(`/primary-planner-activities/${id}`, { method: "DELETE" }),
  primaryResources: (filters: {
    search?: string;
    category?: string;
    subject?: string;
    level?: string;
    theme?: string;
    language?: string;
    page?: number;
    page_size?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.category && filters.category !== "All Resources") params.append("category", filters.category);
    if (filters.subject) params.append("subject", filters.subject);
    if (filters.level) params.append("level", filters.level);
    if (filters.theme) params.append("theme", filters.theme);
    if (filters.language) params.append("language", filters.language);
    if (filters.page) params.append("page", String(filters.page));
    if (filters.page_size) params.append("page_size", String(filters.page_size));
    return apiFetch<PrimaryResourceListResponse>(`/primary/resources?${params.toString()}`);
  },
  primaryResource: (id: string) => apiFetch<PrimaryResource>(`/primary/resources/${encodeURIComponent(id)}`),
  savedPrimaryResources: () => apiFetch<SavedPrimaryResource[]>("/primary/saved-resources"),
  savePrimaryResource: (resourceId: string) =>
    apiFetch<SavedPrimaryResource>("/primary/saved-resources", {
      method: "POST",
      body: JSON.stringify({ resource_id: resourceId }),
    }),
  unsavePrimaryResource: (resourceId: string) =>
    apiFetch<void>(`/primary/saved-resources/${encodeURIComponent(resourceId)}`, { method: "DELETE" }),
  primaryCurriculumThemes: (params: {
    level?: string; subject?: string; language?: string;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.level) query.set("level", params.level);
    if (params.subject) query.set("subject", params.subject);
    if (params.language) query.set("language", params.language);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiFetch<PrimaryCurriculumTheme[]>(`/primary/curriculum/themes${suffix}`);
  },
  primaryCurriculumLesson: (themeId: string, level: string, topicId?: string) =>
    apiFetch<PrimaryCurriculumLesson>(
      `/primary/curriculum/lessons/${themeId}?level=${encodeURIComponent(level)}${topicId ? `&topic_id=${encodeURIComponent(topicId)}` : ""}`
    ),
  generatePrimaryToday: (payload: PrimaryTodayGeneratePayload) =>
    apiFetch<PrimaryTeachingDay>("/primary/today/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  /** Clones an already-planned day onto another class. Not a generation —
   *  no Gemini call, so it never consumes the teacher's quota. */
  copyPrimaryToday: (payload: PrimaryTodayCopyPayload) =>
    apiFetch<PrimaryTeachingDay>("/primary/today/copy", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  recentGenerations: (skip = 0, limit = 10, workspace?: string) =>
    apiFetch<PaginatedResponse<RecentGenerationItem>>(
      `/dashboard/recent-generations?skip=${skip}&limit=${limit}${workspace ? `&workspace=${encodeURIComponent(workspace)}` : ""}`,
    ),
  lessonPlan: (id: string) => apiFetch<LessonPlan>(`/lesson-plans/${id}`),
  updateLessonPlan: (id: string, payload: Partial<Pick<LessonPlan, "class_name" | "subject" | "chapter_name" | "topic" | "duration_minutes" | "plan">>) =>
    apiFetch<LessonPlan>(`/lesson-plans/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteLessonPlan: (id: string) => apiFetch<void>(`/lesson-plans/${id}`, { method: "DELETE" }),
  tweakLessonPlan: (id: string, instruction: string) =>
    apiFetch<any>(`/lesson-plans/${id}/tweak`, { method: "POST", body: JSON.stringify({ instruction }) }),
  analyseLessonPlanWithElif: (id: string, force = false) =>
    apiFetch<ElifAnalysis>(`/lesson-plans/${id}/assistant/analyse?force=${force}`, { method: "POST" }),
  chatWithElif: (id: string, message: string, conversationHistory: Array<{ role: "user" | "assistant"; content: string }>) =>
    apiFetch<ElifChatResponse>(`/lesson-plans/${id}/assistant/chat`, {
      method: "POST",
      body: JSON.stringify({ message, conversation_history: conversationHistory }),
    }),
  explainElifSuggestion: (id: string, suggestion: ElifIssue) =>
    apiFetch<{ message: string; criticality: "critical" | "recommended" | "optional" }>(`/lesson-plans/${id}/assistant/explain`, {
      method: "POST",
      body: JSON.stringify({ suggestion }),
    }),
  applyElifSuggestion: (id: string, payload: {
    suggestion: { id: string; action_type: string; recommended_change: string };
    affected_sections: string[];
    teacher_instruction?: string;
  }) => apiFetch<ElifApplyResponse>(`/lesson-plans/${id}/assistant/apply`, { method: "POST", body: JSON.stringify(payload) }),
  undoLatestElifChange: (id: string) =>
    apiFetch<{ lesson_plan: Record<string, any>; change_summary: string; affected_sections: string[]; revision_id: string }>(`/lesson-plans/${id}/assistant/undo`, { method: "POST" }),
  generateLessonWorksheet: (id: string) =>
    withGenerationEvent("worksheet", apiFetch<WorksheetGeneration>(`/lesson-plans/${id}/resources/worksheet`, { method: "POST" })),
  generateLessonPresentation: (id: string) =>
    withGenerationEvent("presentation", apiFetch<PresentationGeneration>(`/lesson-plans/${id}/resources/presentation`, { method: "POST" })),
  generateLessonNotes: (id: string) =>
    withGenerationEvent("notes", apiFetch<NotesGeneration>(`/lesson-plans/${id}/resources/notes`, { method: "POST" })),
  generateLessonActivity: (id: string) =>
    withGenerationEvent("activity", apiFetch<ActivityGeneration>(`/lesson-plans/${id}/resources/activity`, { method: "POST" })),
  createLessonPlan: (payload: LessonPlanGeneratePayload) =>
    withGenerationEvent("lesson_plan", apiFetch<LessonPlan>("/lesson-plans", { method: "POST", body: JSON.stringify(payload) })),
  streamLessonPlan: (
    payload: LessonPlanGeneratePayload,
    onEvent: (event: LessonPlanStreamEvent) => void
  ) => streamApiFetch("/lesson-plans/stream", { method: "POST", body: JSON.stringify(payload) }, onEvent),
  createWorksheet: (payload: WorksheetGeneratePayload) =>
    withGenerationEvent("worksheet", apiFetch<WorksheetGeneration>("/generate/worksheet", { method: "POST", body: JSON.stringify(payload) })),
  worksheets: (skip = 0, limit = 20) => apiFetch<PaginatedResponse<WorksheetGeneration>>(`/generate/worksheet?skip=${skip}&limit=${limit}`),
  worksheet: (id: string) => apiFetch<WorksheetGeneration>(`/generate/worksheet/${id}`),
  updateWorksheet: (id: string, payload: Partial<Pick<WorksheetGeneration, "output_json">>) =>
    apiFetch<WorksheetGeneration>(`/generate/worksheet/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  /**
   * Translate a worksheet into another language. Spends a generation slot.
   *
   * Deliberately NOT wrapped in withGenerationEvent: this is the same worksheet
   * in another language, so it must not re-trigger the first-use feedback popup.
   */
  translateWorksheet: (id: string, language: string) =>
    apiFetch<WorksheetTranslation>(`/generate/worksheet/${id}/translations`, {
      method: "POST",
      body: JSON.stringify({ language }),
    }),
  /** Read an existing language variant. Free — no generation is spent. */
  worksheetTranslation: (id: string, language: string) =>
    apiFetch<WorksheetTranslation>(`/generate/worksheet/${id}/translations/${encodeURIComponent(language)}`),
  updateWorksheetTranslation: (id: string, language: string, output_json: any) =>
    apiFetch<WorksheetTranslation>(`/generate/worksheet/${id}/translations/${encodeURIComponent(language)}`, {
      method: "PATCH",
      body: JSON.stringify({ output_json }),
    }),
  /** Compose a bilingual variant. Spends no generation — the backend only zips. */
  composeWorksheetPairing: (worksheetId: string, language: string) =>
    apiFetch<WorksheetTranslation>(`/generate/worksheet/${worksheetId}/pairings`, {
      method: "POST",
      body: JSON.stringify({ language }),
    }),
  createNotes: (payload: NotesGeneratePayload) =>
    withGenerationEvent("notes", apiFetch<NotesGeneration>("/notes", { method: "POST", body: JSON.stringify(payload) })),
  notesGenerations: (skip = 0, limit = 20) => apiFetch<PaginatedResponse<NotesGeneration>>(`/notes?skip=${skip}&limit=${limit}`),
  notesGeneration: (id: string) => apiFetch<NotesGeneration>(`/notes/${id}`),
  updateNotesGeneration: (id: string, payload: Partial<Pick<NotesGeneration, "output_json">>) =>
    apiFetch<NotesGeneration>(`/notes/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteNotes: (id: string) => apiFetch<void>(`/notes/${id}`, { method: "DELETE" }),
  createActivity: (payload: ActivityGeneratePayload) =>
    withGenerationEvent("activity", apiFetch<ActivityGeneration>("/activities", { method: "POST", body: JSON.stringify(payload) })),
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
    withGenerationEvent("presentation", apiFetch<PresentationGeneration>("/presentations", { method: "POST", body: JSON.stringify(payload) })),
  presentations: (skip = 0, limit = 20) => apiFetch<PaginatedResponse<PresentationGeneration>>(`/presentations?skip=${skip}&limit=${limit}`),
  presentation: (id: string) => apiFetch<PresentationGeneration>(`/presentations/${id}`),
  repairPresentationImages: (id: string) =>
    apiFetch<PresentationGeneration>(`/presentations/${id}/images/repair`, { method: "POST" }),
  deletePresentation: (id: string) => apiFetch<void>(`/presentations/${id}`, { method: "DELETE" }),
  submitFeedback: (payload: { tool: string; rating?: number | null; comment?: string | null; dismissed?: boolean }) =>
    apiFetch<{ id: string; tool: string }>("/feedback", { method: "POST", body: JSON.stringify(payload) }),
  users: (skip = 0, limit = 100) => apiFetch<PaginatedResponse<ApiUser>>(`/users?skip=${skip}&limit=${limit}`),
  updateUser: (id: string, payload: Partial<Pick<ApiUser, "full_name" | "email" | "is_active" | "avatar_key">> & { password?: string }) =>
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
  adminPromoCodes: (params: { skip?: number; limit?: number; influencer_id?: string } = {}) => {
    const qs = new URLSearchParams();
    qs.set("skip", String(params.skip ?? 0));
    qs.set("limit", String(params.limit ?? 100));
    if (params.influencer_id) qs.set("influencer_id", params.influencer_id);
    return apiFetch<PromoCodeOut[]>(`/admin/promo-codes?${qs.toString()}`);
  },
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
  adminInfluencerOverview: (params: { skip?: number; limit?: number; sort?: string; order?: "asc" | "desc"; q?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.skip != null) qs.set("skip", String(params.skip));
    if (params.limit != null) qs.set("limit", String(params.limit));
    if (params.sort) qs.set("sort", params.sort);
    if (params.order) qs.set("order", params.order);
    if (params.q) qs.set("q", params.q);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<InfluencerOverviewResponse>(`/admin/influencers/overview${suffix}`);
  },
  adminInfluencerDetail: (id: string) => apiFetch<InfluencerDetail>(`/admin/influencers/${id}`),
  adminInfluencerReferredUsers: (id: string, params: { stage?: string; q?: string; skip?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.stage) qs.set("stage", params.stage);
    if (params.q) qs.set("q", params.q);
    if (params.skip != null) qs.set("skip", String(params.skip));
    if (params.limit != null) qs.set("limit", String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<ReferredUsersResponse>(`/admin/influencers/${id}/referred-users${suffix}`);
  },
  adminInfluencerCommissions: (id: string, params: { status?: "pending" | "paid"; skip?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.skip != null) qs.set("skip", String(params.skip));
    if (params.limit != null) qs.set("limit", String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<AdminCommissionsResponse>(`/admin/influencers/${id}/commissions${suffix}`);
  },
  adminInfluencerPayouts: (id: string, params: { skip?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.skip != null) qs.set("skip", String(params.skip));
    if (params.limit != null) qs.set("limit", String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<AdminPayoutsResponse>(`/admin/influencers/${id}/payouts${suffix}`);
  },
  adminPayoutCommissions: (payoutId: string) =>
    apiFetch<AdminCommissionRow[]>(`/admin/influencers/payouts/${payoutId}/commissions`),
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
  adminPrimaryThemes: (level?: string) =>
    apiFetch<PrimaryCurriculumTheme[]>(
      `/admin/primary/curriculum/themes${level ? `?level=${encodeURIComponent(level)}` : ""}`
    ),
  adminPrimaryAcademicYears: () =>
    apiFetch<PrimaryAcademicYear[]>("/admin/primary/academic-years"),
  adminCreatePrimaryAcademicYear: (payload: Omit<PrimaryAcademicYear, "id">) =>
    apiFetch<PrimaryAcademicYear>("/admin/primary/academic-years", {
      method: "POST", body: JSON.stringify(payload),
    }),
  adminUpdatePrimaryAcademicYear: (id: string, payload: Partial<Omit<PrimaryAcademicYear, "id">>) =>
    apiFetch<PrimaryAcademicYear>(`/admin/primary/academic-years/${id}`, {
      method: "PUT", body: JSON.stringify(payload),
    }),
  adminCreatePrimaryTheme: (payload: {
    name: string; subject?: string; language?: string;
    description?: string | null; emoji?: string | null;
    hero_image_url?: string | null; background_image_url?: string | null;
    illustration_pack?: string[]; color_palette?: Record<string, string>;
    icon_map?: Record<string, string>; decorations?: Array<Record<string, unknown>>;
    keywords?: string[]; aliases?: string[];
  }) =>
    apiFetch<PrimaryCurriculumTheme>("/admin/primary/curriculum/themes", {
      method: "POST", body: JSON.stringify(payload),
    }),
  adminUpdatePrimaryTheme: (id: string, payload: Record<string, unknown>) =>
    apiFetch<PrimaryCurriculumTheme>(`/admin/primary/curriculum/themes/${id}`, {
      method: "PUT", body: JSON.stringify(payload),
    }),
  adminUploadPrimaryHero: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<{ path: string }>("/admin/primary/media/hero", {
      method: "POST",
      body: formData,
    });
  },
  adminUploadPrimaryResource: (file: File, category: string, title?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    if (title) formData.append("title", title);
    return apiFetch<PrimaryResource>("/admin/primary/resources/upload", {
      method: "POST",
      body: formData,
    });
  },
  adminDuplicatePrimaryTheme: (id: string) =>
    apiFetch<PrimaryCurriculumTheme>(`/admin/primary/curriculum/themes/${id}/duplicate`, { method: "POST" }),
  adminArchivePrimaryTheme: (id: string) =>
    apiFetch<void>(`/admin/primary/curriculum/themes/${id}`, { method: "DELETE" }),
  adminDeletePrimaryTheme: (id: string) =>
    apiFetch<void>(`/admin/primary/curriculum/themes/${id}/permanent`, { method: "DELETE" }),
  adminCreatePrimaryTopic: (themeId: string, payload: Omit<PrimaryCurriculumTopic, "id" | "theme_id" | "created_at" | "updated_at" | "has_published_lesson">) =>
    apiFetch<PrimaryCurriculumTopic>(`/admin/primary/curriculum/themes/${themeId}/topics`, {
      method: "POST", body: JSON.stringify(payload),
    }),
  adminUpdatePrimaryTopic: (topicId: string, payload: Partial<PrimaryCurriculumTopic>) =>
    apiFetch<PrimaryCurriculumTopic>(`/admin/primary/curriculum/topics/${topicId}`, {
      method: "PUT", body: JSON.stringify(payload),
    }),
  adminArchivePrimaryTopic: (topicId: string) =>
    apiFetch<void>(`/admin/primary/curriculum/topics/${topicId}`, { method: "DELETE" }),
  adminPrimaryLessons: (params: { theme_id?: string; level?: string; topic_id?: string } = {}) => {
    const query = new URLSearchParams(params);
    return apiFetch<PrimaryCurriculumLesson[]>(`/admin/primary/curriculum/lessons${query.size ? `?${query}` : ""}`);
  },
  adminPrimaryLesson: (lessonId: string) =>
    apiFetch<PrimaryCurriculumLesson>(`/admin/primary/curriculum/lessons/${lessonId}`),
  adminCreatePrimaryLesson: (payload: {
    theme_id: string; topic_id?: string | null; academic_year_id?: string | null;
    title?: string | null; daily_focus?: string | null;
    month?: number | null; week?: number | null; day?: number | null;
    level: string; objectives: string[]; vocabulary: string[];
    assessment_questions: string[]; homework?: string | null;
    parent_update?: string | null; steps: unknown[];
  }) =>
    apiFetch<PrimaryCurriculumLesson>("/admin/primary/curriculum/lessons", {
      method: "POST", body: JSON.stringify(payload),
    }),
  adminUpdatePrimaryLesson: (lessonId: string, payload: Record<string, unknown>) =>
    apiFetch<PrimaryCurriculumLesson>(`/admin/primary/curriculum/lessons/${lessonId}`, {
      method: "PUT", body: JSON.stringify(payload),
    }),
  adminReplacePrimarySteps: (lessonId: string, steps: unknown[]) =>
    apiFetch<PrimaryCurriculumLesson>(`/admin/primary/curriculum/lessons/${lessonId}/steps`, {
      method: "PUT", body: JSON.stringify({ steps }),
    }),
  adminPublishPrimaryLesson: (lessonId: string) =>
    apiFetch<PrimaryCurriculumLesson>(`/admin/primary/curriculum/lessons/${lessonId}/publish`, {
      method: "POST",
    }),
  adminDuplicatePrimaryLesson: (lessonId: string) =>
    apiFetch<PrimaryCurriculumLesson>(`/admin/primary/curriculum/lessons/${lessonId}/duplicate`, {
      method: "POST",
    }),
  adminPrimaryCurriculumFeedback: (params?: { level?: string; subject?: string; language?: string }) => {
    const query = new URLSearchParams();
    if (params?.level) query.set("level", params.level);
    if (params?.subject) query.set("subject", params.subject);
    if (params?.language) query.set("language", params.language);
    const suffix = query.toString();
    return apiFetch<PrimaryStepFeedback[]>(
      `/admin/primary/curriculum/feedback${suffix ? `?${suffix}` : ""}`
    );
  },
  adminCloneAcademicYear: (yearId: string, payload: {
    destination_year_id: string;
    classes?: string[];
    months?: number[];
    include_drafts?: boolean;
    include_published?: boolean;
    include_resources?: boolean;
  }) =>
    apiFetch<{ cloned_count: number }>(`/admin/primary/academic-years/${yearId}/clone`, {
      method: "POST", body: JSON.stringify(payload),
    }),
  adminResources: (params: {
    search?: string; category?: string; subject?: string;
    level?: string; theme?: string; language?: string;
    page?: number; page_size?: number;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.category) query.set("category", params.category);
    if (params.subject) query.set("subject", params.subject);
    if (params.level) query.set("level", params.level);
    if (params.theme) query.set("theme", params.theme);
    if (params.language) query.set("language", params.language);
    if (params.page) query.set("page", String(params.page));
    if (params.page_size) query.set("page_size", String(params.page_size));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiFetch<PrimaryResourceListResponse>(`/admin/primary/resources${suffix}`);
  },
  adminCreateResource: (payload: any) =>
    apiFetch<PrimaryResource>("/admin/primary/resources", {
      method: "POST", body: JSON.stringify(payload),
    }),
  adminUpdateResource: (id: string, payload: any) =>
    apiFetch<PrimaryResource>(`/admin/primary/resources/${encodeURIComponent(id)}`, {
      method: "PUT", body: JSON.stringify(payload),
    }),
  adminDeleteResource: (id: string) =>
    apiFetch<void>(`/admin/primary/resources/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  adminBulkCreateResources: (payload: { resources: any[] }) =>
    apiFetch<{ added_count: number; skipped_count: number }>("/admin/primary/resources/bulk", {
      method: "POST", body: JSON.stringify(payload),
    }),
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

export const ONBOARDING_ROLE_OPTIONS = [
  { value: "school_teacher", label: "School teacher" },
  { value: "tuition_teacher", label: "Tuition teacher" },
  { value: "school_coordinator", label: "School coordinator" },
  { value: "principal", label: "Principal" },
  { value: "other", label: "Other" }
] as const;

export const ONBOARDING_BOARD_OPTIONS = [
  { value: "cbse", label: "CBSE" },
  { value: "jkbose", label: "JKBOSE" },
  { value: "icse", label: "ICSE" },
  { value: "state_board", label: "State board" },
  { value: "other", label: "Other" }
] as const;

export const ONBOARDING_CREATE_FIRST_OPTIONS = [
  { id: "lesson-plan", label: "Lesson plan" },
  { id: "worksheet", label: "Worksheet" },
  { id: "presentation", label: "Presentation" },
  { id: "quiz", label: "Quiz" },
  { id: "notes", label: "Notes" }
] as const;

export function onboardingCreateFirstHref(id: string): string {
  const tool = TOOL_REGISTRY.find((t) => t.id === id);
  return tool ? tool.dashboardHref : "/dashboard";
}

// Teaching Kit content remains a client-side composition layer used by the
// existing Primary generators. Keep these contracts alongside the server-led
// curriculum types below so the refactor reuses those generators unchanged.
export type KitComponent =
  | "daily-plan" | "objectives" | "warm-up" | "explanation" | "story"
  | "flashcards" | "picture-talk" | "classroom-activity" | "worksheet"
  | "homework" | "assessment" | "parent-update";

export type TeachingKitResource = {
  id: string;
  component: KitComponent;
  title: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  fileType?: "pdf" | "png" | "jpg";
  content?: string;
  category?: string;
};

export type KitLearningObjective = {
  id: string;
  text: string;
  source?: "curated" | "template" | "resource" | "teacher-edited";
};

export type KitSequenceItemType =
  | "warm_up" | "introduction" | "story_or_rhyme" | "picture_talk"
  | "classroom_activity" | "worksheet" | "assessment";

export type KitSequenceItem = {
  id: string;
  type: KitSequenceItemType;
  title: string;
  instructions: string[];
  duration: number;
  objectiveIds: string[];
  resourceIds: string[];
  source?: "curated" | "template" | "resource" | "teacher-edited";
};

export type KitAssessmentBlock = {
  type: "oral" | "worksheet" | "observation";
  title: string;
  questions: string[];
  successCriteria: string[];
  source?: "curated" | "template" | "resource" | "teacher-edited";
};

export type KitResourceItem = {
  id: string;
  title: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  fileType?: string;
  category?: string;
  instruction?: string;
  usedFor: string[];
};

export type PrimaryTeachingKitContent = {
  version: number;
  learningObjectives: KitLearningObjective[];
  vocabulary: string[];
  sequence: KitSequenceItem[];
  resources: KitResourceItem[];
  assessment: KitAssessmentBlock;
  homework: string;
  parentUpdate: string;
  homeworkSource?: "curated" | "template" | "resource" | "teacher-edited";
  parentUpdateSource?: "curated" | "template" | "resource" | "teacher-edited";
  objectivesSource?: "curated" | "template" | "resource" | "teacher-edited";
};

export type TeachingKit = {
  id: string;
  userId: string;
  context: PrimaryTeachingContext;
  title: string;
  resources: TeachingKitResource[];
  content?: PrimaryTeachingKitContent | null;
  lessonPlanId?: string;
  plannerActivityIds: string[];
  assessmentIds: string[];
  createdAt: string;
  updatedAt: string;
};

// TeachPad Primary. snake_case throughout, matching the backend's wire format
// and every other type in this file. (Sahil's originals were camelCase on
// responses and snake_case on payloads — the client sent one convention and
// expected the other. No endpoint existed to disagree, so it typechecked.)
//
// `PrimaryTeachingContext` (Title-Case levels, cached client-side teaching
// context used across the whole Primary UI for dropdowns/content-matching) is
// deliberately NOT redefined here to match the backend's snake_case
// PrimaryTeachingContextRead. It lives in lib/primary-context-helpers.ts and
// is out of this task's declared scope — unifying it would mean rewriting
// every level dropdown across Primary, not a mechanical rename. The backend
// DTO for PrimaryTodayRead.context is named PrimaryTeachingContextRead below
// to avoid colliding with it.
export type PrimaryLevel =
  | "nursery" | "lkg" | "ukg"
  | "class_1" | "class_2" | "class_3" | "class_4" | "class_5";

export type PrimaryStepType =
  | "warm_up" | "introduction" | "story_or_rhyme" | "picture_talk"
  | "classroom_activity" | "worksheet" | "assessment" | "movement" | "routine"
  | "circle_time" | "story" | "flashcards" | "craft" | "song" | "game"
  | "reflection" | "parent_note"
  | "arrival_routine" | "free_play" | "story_rhyme_picture_talk"
  | "concept_exploration" | "classroom_activity_game" | "practice"
  | "numeracy_time" | "meal_time" | "creative_time" | "literacy_time"
  | "outdoor_play" | "goodbye";

export type PrimaryAcademicYear = {
  id: string;
  name: string;
  starts_on: string;
  ends_on: string;
  is_active: boolean;
};

export type PrimaryCurriculumTopic = {
  id: string;
  theme_id: string;
  name: string;
  subtheme?: string | null;
  description?: string | null;
  position: number;
  keywords: string[];
  aliases: string[];
  is_active: boolean;
  has_published_lesson: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PrimaryResource = {
  id: string;
  title: string;
  category: string;
  file_url: string;
  thumbnail_url?: string | null;
  file_type: string;
  subjects: string[];
  levels: string[];
  themes: string[];
  keywords: string[];
  languages: string[];
  skills: string[];
  difficulty?: "beginner" | "intermediate" | "advanced" | null;
  is_active?: boolean;
  learning_outcome_id?: string | null;
  suitable_block?: string | null;
  is_digital: boolean;
  offline_alternative_id?: string | null;
  parent_resource_id?: string | null;
  variant_type?: string | null;
};

export type PrimaryResourceListResponse = {
  items: PrimaryResource[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
};

export type PrimaryCurriculumStep = {
  id: string;
  position: number;
  step_type: PrimaryStepType;
  title: string;
  instructions: string[];
  duration_minutes: number;
  objective_indexes: number[];
  resource_category?: string | null;
  resource_ids?: string[] | null;
  child_action?: string[] | null;
  observation_point?: string | null;
  transition?: string | null;
  required_resource_ids?: string[] | null;
  optional_resource_ids?: string[] | null;
  details?: Record<string, unknown>;
};

export type PrimaryCurriculumTheme = {
  id: string;
  name: string;
  subtheme?: string | null;
  language: string;
  subject: string;
  description?: string | null;
  emoji?: string | null;
  hero_image_url?: string | null;
  background_image_url?: string | null;
  illustration_pack: string[];
  color_palette: Record<string, string>;
  icon_map: Record<string, string>;
  decorations: Array<Record<string, unknown>>;
  keywords: string[];
  aliases: string[];
  topics: PrimaryCurriculumTopic[];
  is_active: boolean;
  /** False when no lesson is published for the requested level. The picker
   *  greys these out instead of letting a teacher choose one and get a 404. */
  has_published_lesson: boolean;
};

export type PrimaryLearningOutcome = {
  id: string;
  text: string;
  level: string;
  subject: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PrimaryCurriculumLesson = {
  id: string;
  theme_id: string;
  academic_year_id?: string | null;
  topic_id?: string | null;
  title?: string | null;
  daily_focus?: string | null;
  month?: number | null;
  week?: number | null;
  day?: number | null;
  level: PrimaryLevel;
  version: number;
  status: "draft" | "published" | "archived";
  objectives: string[];
  vocabulary: string[];
  assessment_questions: string[];
  homework?: string | null;
  parent_update?: string | null;
  steps: PrimaryCurriculumStep[];
  learning_outcomes?: PrimaryLearningOutcome[];
};

export type PrimaryStepFeedback = {
  step_id: string;
  lesson_id: string;
  theme_id: string;
  theme_name: string;
  level: PrimaryLevel;
  subject: string;
  language: string;
  step_type: PrimaryStepType;
  position: number;
  title: string;
  resource_category?: string | null;
  attempts: number;
  completed_count: number;
  partial_count: number;
  skipped_count: number;
  rescheduled_count: number;
  planned_count: number;
  resolved_attempts: number;
  distinct_teachers: number;
  /** Percent of resolved_attempts that were "skipped". null means no
   *  resolved attempts exist yet — never render that as "0%". */
  skip_rate: number | null;
};

export type PrimaryReflection = {
  worked_well?: string | null;
  needs_support?: string | null;
  continue_tomorrow?: string | null;
  /** Rendered by the UI since day one and written by nothing until now. */
  prep_needed?: string | null;
};

export type PrimaryTeachingDay = {
  id: string;
  user_id: string;
  date: string;
  section_id?: string | null;
  level: PrimaryLevel;
  subject?: string | null;
  language: string;
  theme_id?: string | null;
  topic_id?: string | null;
  lesson_id?: string | null;
  topic?: string | null;
  skill?: string | null;
  objectives: string[];
  vocabulary: string[];
  competencies: string[];
  materials: string[];
  assessment_questions: string[];
  homework?: string | null;
  parent_update?: string | null;
  home_connection?: string | null;
  teacher_notes?: string | null;
  reflection_json?: PrimaryReflection | null;
  daily_focus?: string | null;
  learning_outcomes?: PrimaryLearningOutcome[] | null;
  status: "not_started" | "in_progress" | "completed";
  created_at: string;
  updated_at: string;
};

export type PrimaryTeachingDayUpdatePayload = Partial<
  Pick<
    PrimaryTeachingDay,
    | "objectives" | "vocabulary" | "competencies" | "materials"
    | "assessment_questions" | "homework" | "parent_update"
    | "home_connection" | "teacher_notes" | "reflection_json" | "status"
  >
>;

export type PrimaryPlannerActivityStatus =
  | "planned" | "completed" | "partially completed" | "skipped" | "rescheduled";

export type PrimaryPlannerActivityContext = {
  level?: string;
  subject?: string;
  language?: string;
  theme_id?: string;
  topic_id?: string | null;
  instructions?: string[];
  child_action?: string[] | null;
  observation_point?: string | null;
  transition?: string | null;
  required_resource_ids?: string[] | null;
  optional_resource_ids?: string[] | null;
  objectives?: string[];
  [key: string]: unknown;
};

export type PrimaryPlannerActivity = {
  id: string;
  user_id: string;
  teaching_day_id: string;
  curriculum_step_id?: string | null;
  date: string;
  start_time?: string | null;
  duration_minutes: number;
  title: string;
  activity_type: string;
  context: PrimaryPlannerActivityContext;
  resource_ids: string[];
  component_key?: string | null;
  rescheduled_from_date?: string | null;
  notes?: string | null;
  observation?: string | null;
  status: PrimaryPlannerActivityStatus;
  created_at: string;
  updated_at: string;
};

export type PrimaryPlannerActivityCreatePayload = {
  date: string;
  start_time?: string | null;
  duration_minutes?: number;
  title: string;
  activity_type: string;
  context?: Record<string, unknown>;
  resource_ids?: string[];
  curriculum_step_id?: string | null;
  component_key?: string | null;
  rescheduled_from_date?: string | null;
  notes?: string | null;
  observation?: string | null;
  status?: PrimaryPlannerActivityStatus;
};

// Mirrors backend PrimaryPlannerActivityUpdate exactly. That schema is
// extra="forbid", so any field NOT listed here 422s the whole PATCH — notably
// `date` and, until recently, `activity_type`. Keep the two in lockstep.
export type PrimaryPlannerActivityUpdatePayload = Partial<
  Pick<
    PrimaryPlannerActivity,
    | "start_time" | "duration_minutes" | "title" | "activity_type"
    | "resource_ids" | "rescheduled_from_date" | "notes" | "observation"
    | "status"
  >
> & {
  /** Not a column — the backend merges this into the activity's `context`
   *  JSONB, leaving level/subject/language in place. Omit to leave the
   *  existing steps alone; [] clears them. */
  instructions?: string[];
};

// Backend wire format for a teacher's saved Primary teaching context, as
// returned inside PrimaryTodayRead.context. NOT the same type as the
// client-cached `PrimaryTeachingContext` (see file-header note above) — kept
// distinctly named so the two never collide.
export type PrimaryTeachingContextRead = {
  user_id: string;
  level: PrimaryLevel;
  subject?: string | null;
  theme?: string | null;
  theme_id?: string | null;
  topic?: string | null;
  topic_id?: string | null;
  skill?: string | null;
  language: string;
  version: number;
  /** Drives the cache reconciliation in lib/primary-teaching-context.tsx. */
  updated_at: string;
};

export type PrimaryTodayRead = {
  planner_activities: PrimaryPlannerActivity[];
  day_record: PrimaryTeachingDay | null;
  context: PrimaryTeachingContextRead | null;
};

// ─── Primary coverage (Spec C) ──────────────────────────────────────────────
// Read-only derived shapes from GET /primary/coverage and
// /primary/coverage/themes. Every `state` is computed server-side so the screen
// and the PDF export cannot disagree about what "taught" means.

export type PrimaryDayCoverage = {
  date: string;
  /** null means there is no primary_teaching_days row at all for this date. */
  teaching_day_id: string | null;
  level: PrimaryLevelKey | null;
  subject: string | null;
  language: string | null;
  theme_id: string | null;
  theme_name: string | null;
  lesson_id: string | null;
  /**
   * The teacher-set value. Nothing in the backend ever writes it, so it reads
   * "not_started" on a fully taught day — colour off `state`, not this.
   */
  day_status: "not_started" | "in_progress" | "completed" | null;
  total: number;
  planned: number;
  completed: number;
  partially_completed: number;
  skipped: number;
  rescheduled: number;
  minutes_planned: number;
  /** Only status === "completed". Partials are counted, never half-weighted. */
  minutes_completed: number;
  state: PrimaryCoverageDayState;
};

export type PrimaryCoverageTotals = {
  days_in_range: number;
  days_with_plan: number;
  days_without_plan: number;
  activities: number;
  planned: number;
  completed: number;
  partially_completed: number;
  skipped: number;
  rescheduled: number;
  minutes_planned: number;
  minutes_completed: number;
};

export type PrimaryCoverageReport = {
  start: string;
  end: string;
  /** Every date in the range, including the ones with nothing on them. */
  days: PrimaryDayCoverage[];
  totals: PrimaryCoverageTotals;
};

export type PrimaryThemeCoverage = {
  theme_id: string;
  theme_name: string;
  subject: string;
  language: string;
  emoji: string | null;
  level: PrimaryLevelKey;
  lesson_id: string | null;
  lesson_version: number | null;
  authored: boolean;
  steps_total: number;
  steps_taught: number;
  steps_partially_taught: number;
  steps_planned_only: number;
  steps_untouched: number;
  completion_pct: number;
  state: PrimaryThemeCoverageState;
};

export type PrimaryThemeCoverageReport = {
  level: PrimaryLevelKey;
  themes: PrimaryThemeCoverage[];
  themes_total: number;
  themes_authored: number;
  /** > 0 means TeachPad has content missing, not that the teacher skipped it. */
  themes_not_authored: number;
  themes_complete: number;
  themes_in_progress: number;
  themes_not_started: number;
  /** Authored themes only — the backlog never sits in the denominator. */
  steps_total: number;
  steps_taught: number;
  completion_pct: number;
};

export type PrimaryTodayGeneratePayload = {
  date: string;
  level: PrimaryLevel;
  subject: string;
  theme_id: string;
  topic_id?: string | null;
  language?: string;
  /** Clears the day's existing activities inside the same transaction. */
  replace?: boolean;
  /** Omitted means the section-less day — what every teacher gets today. */
  section_id?: string | null;
};

export type PrimaryTodayCopyPayload = {
  date: string;
  /** The class to copy FROM. Null means the section-less day. */
  from_section_id: string | null;
  /** The class to copy INTO. Null means the section-less day. */
  section_id: string | null;
  replace?: boolean;
};

export type PrimaryActivityEntityType =
  "resource" | "lesson_plan" | "planner_activity" | "ai_creation";
export type PrimaryActivityAction =
  "viewed" | "downloaded" | "created" | "edited" | "saved";

export type PrimaryActivityEvent = {
  id: string;
  user_id: string;
  entity_type: PrimaryActivityEntityType;
  entity_id: string;
  action: PrimaryActivityAction;
  client_event_id?: string | null;
  created_at: string;
};

export type PrimaryActivityEventCreatePayload = {
  entity_type: PrimaryActivityEntityType;
  entity_id: string;
  action: PrimaryActivityAction;
  client_event_id?: string;
};

export type SavedPrimaryResource = {
  id: string;
  user_id: string;
  resource_id: string;
  created_at: string;
  updated_at: string;
};

export type SavedPrimaryResourceCreatePayload = {
  resource_id: string;
};

// ─── Primary roster + observations (Spec D) ─────────────────────────────────
// snake_case, matching the backend wire format. `display_name` appears nowhere
// on purpose: the column exists but is reserved for a future consent flow, and
// no route returns it (see backend app/models/primary.py PrimaryStudent).

export type PrimarySection = {
  id: string;
  user_id: string;
  name: string;
  level: PrimaryLevel;
  is_active: boolean;
  /** Active children only — archived ones are excluded server-side. */
  student_count: number;
  created_at: string;
  updated_at: string;
};

export type PrimarySectionCreatePayload = {
  name: string;
  level: PrimaryLevel;
};

export type PrimarySectionUpdatePayload = Partial<{
  name: string;
  level: PrimaryLevel;
  is_active: boolean;
}>;

export type PrimaryStudent = {
  id: string;
  user_id: string;
  section_id: string;
  /** A code, initials or nickname the teacher chose. Never a real name. */
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PrimaryStudentCreatePayload = {
  section_id: string;
  code: string;
};

// No section_id: the backend refuses to move a child between sections, because
// it would break (section_id, code) uniqueness and strand their observations.
export type PrimaryStudentUpdatePayload = Partial<{
  code: string;
  is_active: boolean;
}>;

export type PrimaryObservation = {
  id: string;
  user_id: string;
  student_id: string;
  teaching_day_id: string;
  planner_activity_id?: string | null;
  date: string;
  skill?: string | null;
  rating: ObservationRating;
  note?: string | null;
  created_at: string;
  updated_at: string;
};

// Create-or-replace against the two partial unique indexes. No `date`: it is
// copied from the teaching day server-side.
export type PrimaryObservationUpsertPayload = {
  student_id: string;
  teaching_day_id: string;
  planner_activity_id?: string | null;
  skill?: string | null;
  rating: ObservationRating;
  note?: string | null;
};

export type PrimaryObservationUpdatePayload = Partial<{
  skill: string | null;
  rating: ObservationRating;
  note: string | null;
}>;

export type PrimarySkillSummary = {
  skill: string;
  observations: number;
  not_yet: number;
  emerging: number;
  secure: number;
  latest_rating: ObservationRating;
  /** First versus last rating in range — not an average. */
  trend: ObservationTrend;
};

export type PrimaryStudentProfile = {
  student: PrimaryStudent;
  section_name: string;
  start: string;
  end: string;
  observations_total: number;
  days_observed: number;
  activities_observed: number;
  not_yet: number;
  emerging: number;
  secure: number;
  secure_pct: number;
  skills: PrimarySkillSummary[];
  /** Chronological, oldest first. The profile renders it as a timeline. */
  observations: PrimaryObservation[];
};
