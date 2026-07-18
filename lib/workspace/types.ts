import type {
  TeachingWorkspace,
  WorkspaceAttentionKind,
  WorkspaceHomeTopic,
  WorkspaceResource,
  WorkspaceResourceType,
  WorkspaceTopic,
} from "../api";

export type PreparationState =
  | "not_started"
  | "needs_preparation"
  | "almost_ready"
  | "ready"
  | "needs_attention"
  | "generating";

export type TeachingState = "not_taught" | "scheduled" | "taught";
export type AssessmentState = "not_started" | "prepared" | "reviewed";

export type PreparationSummary = {
  state: PreparationState;
  label: string;
  readyCount: number;
  requiredCount: number;
  missingCount: number;
  failedCount: number;
  generatingCount: number;
  skippedCount: number;
  ready: WorkspaceResource[];
  outstanding: WorkspaceResource[];
};

export type TopicRecommendation = {
  kind: "resource" | "mark_ready" | "mark_taught" | "reflection";
  title: string;
  description: string;
  actionLabel: string;
  href?: string;
  resourceType?: WorkspaceResourceType;
  resourceStatus?: WorkspaceResource["status"];
};

export type TopicContext = {
  workspace: TeachingWorkspace;
  topic: WorkspaceTopic;
};

export type HomeTopicContext = WorkspaceHomeTopic;

export type AttentionGroup = {
  kind: WorkspaceAttentionKind;
  label: string;
  count: number;
  priority: number;
};

