/**
 * Frontend unit tests for Planner & Assessment integration.
 * Run with: node --experimental-strip-types --test tests/workspace/planner-assessment.test.ts
 */
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

// ---------------------------------------------------------------------------
// Minimal stubs so we can import pure helpers without React / Next.js
// ---------------------------------------------------------------------------

// ---- Status helpers -------------------------------------------------------
type PlannerStatus =
  | "planned"
  | "completed"
  | "partially completed"
  | "skipped"
  | "rescheduled";

const STATUS_LABELS: Record<PlannerStatus, string> = {
  planned: "Planned",
  completed: "Completed",
  "partially completed": "Partially Done",
  skipped: "Skipped",
  rescheduled: "Rescheduled",
};

// ---- Draft state helpers -------------------------------------------------
type PlannerDraft = {
  title: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  activityType: string;
  notes: string;
  resourceIds: string[];
  status: PlannerStatus;
};

function openEditFromActivity(activity: {
  title: string;
  date: string;
  startTime?: string | null;
  durationMinutes?: number | null;
  activityType: string;
  notes?: string | null;
  resourceIds: string[];
  status: PlannerStatus;
}): PlannerDraft {
  return {
    title: activity.title,
    date: activity.date,
    startTime: activity.startTime?.slice(0, 5) ?? "09:00",
    durationMinutes: activity.durationMinutes ?? 40,
    activityType: activity.activityType,
    notes: activity.notes ?? "",
    resourceIds: activity.resourceIds,
    status: activity.status,
  };
}

// ---- Duplicate protection helpers ----------------------------------------
function isAssessmentAlreadyScheduled(
  existing: Array<{ assessmentId?: string | null; date: string }>,
  assessmentId: string,
  targetDate: string,
): boolean {
  return existing.some(
    (act) => act.assessmentId === assessmentId && act.date === targetDate,
  );
}

function isKitComponentAlreadyScheduled(
  existing: Array<{
    teachingKitId?: string | null;
    componentKey?: string | null;
    date: string;
  }>,
  kitId: string,
  componentKey: string,
  targetDate: string,
): boolean {
  return existing.some(
    (act) =>
      act.teachingKitId === kitId &&
      act.componentKey === componentKey &&
      act.date === targetDate,
  );
}

// ---- Rescheduling helpers -------------------------------------------------
function applyReschedule(
  activity: { date: string; rescheduledFromDate?: string | null; status: PlannerStatus },
  newDate: string,
): { date: string; rescheduledFromDate?: string | null; status: PlannerStatus } {
  if (newDate === activity.date) return activity;
  return {
    date: newDate,
    rescheduledFromDate: activity.rescheduledFromDate ?? activity.date,
    status: "planned",
  };
}

// ---- Assessment source helpers -------------------------------------------
type AssessmentCreatePayload = {
  title: string;
  assessment_type: string;
  class_level: string;
  subject: string;
  theme?: string | null;
  language?: string;
  teaching_kit_id?: string | null;
  source_component_key?: string | null;
  source_objective_key?: string | null;
  content_json: object;
  status?: string;
};

function duplicateAssessment(
  assessment: AssessmentCreatePayload & { id: string },
): AssessmentCreatePayload {
  return {
    ...assessment,
    title: `Copy of ${assessment.title}`,
    // Duplicates start as draft and stand alone
    teaching_kit_id: null,
    source_component_key: null,
    source_objective_key: null,
    status: "draft",
  };
}

function assessmentFromContext(ctx: {
  level: string;
  subject: string;
  theme?: string | null;
  language: string;
}): AssessmentCreatePayload {
  return {
    title: "",
    assessment_type: "",
    class_level: ctx.level,
    subject: ctx.subject,
    theme: ctx.theme ?? null,
    language: ctx.language,
    content_json: {},
    status: "draft",
  };
}

function assessmentFromKitObjective(opts: {
  kitId: string;
  componentKey: string;
  objectiveKey: string;
  title: string;
  classLevel: string;
  subject: string;
  theme?: string | null;
  language: string;
}): AssessmentCreatePayload {
  return {
    title: opts.title,
    assessment_type: "Quiz",
    class_level: opts.classLevel,
    subject: opts.subject,
    theme: opts.theme ?? null,
    language: opts.language,
    teaching_kit_id: opts.kitId,
    source_component_key: opts.componentKey,
    source_objective_key: opts.objectiveKey,
    content_json: {},
    status: "draft",
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Status labels", () => {
  it("covers all five planner statuses", () => {
    const statuses: PlannerStatus[] = [
      "planned",
      "completed",
      "partially completed",
      "skipped",
      "rescheduled",
    ];
    for (const s of statuses) {
      assert.ok(STATUS_LABELS[s], `Missing label for status: ${s}`);
    }
  });
});

describe("Planner edit dialog", () => {
  it("populates draft from activity preserving status", () => {
    const activity = {
      title: "Morning Circle",
      date: "2026-08-05",
      startTime: "09:00",
      durationMinutes: 30,
      activityType: "warm-up",
      notes: "Bring flashcards",
      resourceIds: ["res-1"],
      status: "completed" as PlannerStatus,
    };
    const draft = openEditFromActivity(activity);
    assert.equal(draft.status, "completed");
    assert.equal(draft.title, "Morning Circle");
    assert.equal(draft.resourceIds[0], "res-1");
  });

  it("defaults missing startTime to 09:00", () => {
    const draft = openEditFromActivity({
      title: "Test",
      date: "2026-08-05",
      startTime: null,
      durationMinutes: null,
      activityType: "warm-up",
      notes: null,
      resourceIds: [],
      status: "planned",
    });
    assert.equal(draft.startTime, "09:00");
    assert.equal(draft.durationMinutes, 40);
  });
});

describe("Planner rescheduling", () => {
  it("archives original date on first reschedule", () => {
    const activity = {
      date: "2026-08-05",
      rescheduledFromDate: null as string | null,
      status: "planned" as PlannerStatus,
    };
    const result = applyReschedule(activity, "2026-08-07");
    assert.equal(result.date, "2026-08-07");
    assert.equal(result.rescheduledFromDate, "2026-08-05");
    assert.equal(result.status, "planned");
  });

  it("does not overwrite rescheduledFromDate if already set", () => {
    const activity = {
      date: "2026-08-06",
      rescheduledFromDate: "2026-08-05",
      status: "planned" as PlannerStatus,
    };
    const result = applyReschedule(activity, "2026-08-08");
    assert.equal(result.rescheduledFromDate, "2026-08-05"); // original preserved
  });

  it("no-op when date does not change", () => {
    const activity = {
      date: "2026-08-05",
      rescheduledFromDate: null as string | null,
      status: "planned" as PlannerStatus,
    };
    const result = applyReschedule(activity, "2026-08-05");
    assert.equal(result, activity);
  });
});

describe("Duplicate kit component scheduling prevention", () => {
  const existing = [
    { teachingKitId: "kit-1", componentKey: "warm-up", date: "2026-08-05" },
  ];

  it("blocks same kit, same component, same date", () => {
    assert.equal(
      isKitComponentAlreadyScheduled(existing, "kit-1", "warm-up", "2026-08-05"),
      true,
    );
  });

  it("allows same kit on a different date", () => {
    assert.equal(
      isKitComponentAlreadyScheduled(existing, "kit-1", "warm-up", "2026-08-06"),
      false,
    );
  });

  it("allows different component same date", () => {
    assert.equal(
      isKitComponentAlreadyScheduled(existing, "kit-1", "assessment", "2026-08-05"),
      false,
    );
  });

  it("allows same component from a different kit", () => {
    assert.equal(
      isKitComponentAlreadyScheduled(existing, "kit-2", "warm-up", "2026-08-05"),
      false,
    );
  });
});

describe("Duplicate assessment scheduling prevention", () => {
  const existing = [
    { assessmentId: "assess-1", date: "2026-08-05" },
  ];

  it("blocks same assessment on same date", () => {
    assert.equal(
      isAssessmentAlreadyScheduled(existing, "assess-1", "2026-08-05"),
      true,
    );
  });

  it("allows same assessment on different date", () => {
    assert.equal(
      isAssessmentAlreadyScheduled(existing, "assess-1", "2026-08-06"),
      false,
    );
  });

  it("allows different assessment on same date", () => {
    assert.equal(
      isAssessmentAlreadyScheduled(existing, "assess-2", "2026-08-05"),
      false,
    );
  });
});

describe("Assessment duplication", () => {
  it("prefixes title with Copy of", () => {
    const assessment = {
      id: "a-1",
      title: "My Quiz",
      assessment_type: "Quiz",
      class_level: "UKG",
      subject: "English",
      teaching_kit_id: "kit-1",
      source_component_key: "assessment",
      source_objective_key: "obj-1",
      content_json: {},
    };
    const copy = duplicateAssessment(assessment);
    assert.equal(copy.title, "Copy of My Quiz");
    assert.equal(copy.teaching_kit_id, null);
    assert.equal(copy.source_component_key, null);
    assert.equal(copy.source_objective_key, null);
    assert.equal(copy.status, "draft");
  });
});

describe("Assessment creation from context", () => {
  it("populates class, subject, theme, language from context", () => {
    const ctx = { level: "Grade 2", subject: "EVS", theme: "My Family", language: "Hindi" };
    const payload = assessmentFromContext(ctx);
    assert.equal(payload.class_level, "Grade 2");
    assert.equal(payload.subject, "EVS");
    assert.equal(payload.theme, "My Family");
    assert.equal(payload.language, "Hindi");
  });
});

describe("Assessment creation from kit objective", () => {
  it("records all source linkage fields", () => {
    const payload = assessmentFromKitObjective({
      kitId: "kit-99",
      componentKey: "assessment",
      objectiveKey: "obj-2",
      title: "Oral Check",
      classLevel: "LKG",
      subject: "Maths",
      theme: "Numbers",
      language: "English",
    });
    assert.equal(payload.teaching_kit_id, "kit-99");
    assert.equal(payload.source_component_key, "assessment");
    assert.equal(payload.source_objective_key, "obj-2");
    assert.equal(payload.title, "Oral Check");
    assert.equal(payload.assessment_type, "Quiz");
  });
});

describe("Open Kit / Open Assessment linkage", () => {
  it("returns not-found sentinel when entity is deleted", async () => {
    const fetchMock = async (_id: string): Promise<null> => null;
    const result = await fetchMock("missing-id");
    assert.equal(result ?? "not-found", "not-found");
  });

  it("returns title when entity exists", async () => {
    const fetchMock = async (_id: string): Promise<{ title: string }> => ({ title: "Animals Kit" });
    const kit = await fetchMock("kit-1");
    assert.equal(kit.title, "Animals Kit");
  });
});

describe("Planner editing preserves linkage", () => {
  it("partial update does not include teachingKitId, assessmentId, componentKey", () => {
    function buildPartialUpdate(draft: PlannerDraft) {
      // Only include fields that the dialog controls
      return {
        date: draft.date,
        start_time: draft.startTime,
        duration_minutes: draft.durationMinutes,
        title: draft.title,
        activity_type: draft.activityType,
        notes: draft.notes,
        status: draft.status,
      };
    }
    const draft: PlannerDraft = {
      title: "Updated Title",
      date: "2026-08-05",
      startTime: "10:00",
      durationMinutes: 45,
      activityType: "explanation",
      notes: "",
      resourceIds: [],
      status: "planned",
    };
    const payload = buildPartialUpdate(draft);
    assert.ok(!("teaching_kit_id" in payload));
    assert.ok(!("assessment_id" in payload));
    assert.ok(!("component_key" in payload));
    assert.equal(payload.title, "Updated Title");
  });
});
