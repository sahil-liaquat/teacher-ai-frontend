"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CopyPlus, PencilLine, Save, Send, Sparkles } from "lucide-react";
import { backendApi, type PrimaryCurriculumLesson, type PrimaryCurriculumTheme, type PrimaryLevel } from "@/lib/api";
import { parseLines, sanitizeStepsForSubmit, validateSteps, type StepDraft } from "@/lib/primary-authoring";
import { AdminPanel, LoadingState, StatusPill } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/errors";
import { StepRows } from "@/components/admin/primary-curriculum/step-rows";
import { ADMIN_PRIMARY_THEMES_QUERY_KEY } from "@/components/admin/primary-curriculum/theme-list";

type FormState = {
  lessonId: string | null;
  status: PrimaryCurriculumLesson["status"] | null;
  version: number | null;
  objectives: string;
  vocabulary: string;
  assessmentQuestions: string;
  homework: string;
  parentUpdate: string;
  steps: StepDraft[];
};

const emptyForm: FormState = {
  lessonId: null,
  status: null,
  version: null,
  objectives: "",
  vocabulary: "",
  assessmentQuestions: "",
  homework: "",
  parentUpdate: "",
  steps: [],
};

function toFormState(lesson: PrimaryCurriculumLesson): FormState {
  return {
    lessonId: lesson.id,
    status: lesson.status,
    version: lesson.version,
    objectives: lesson.objectives.join("\n"),
    vocabulary: lesson.vocabulary.join("\n"),
    assessmentQuestions: lesson.assessment_questions.join("\n"),
    homework: lesson.homework ?? "",
    parentUpdate: lesson.parent_update ?? "",
    steps: lesson.steps,
  };
}

/**
 * The admin API has no "find the draft for this theme+level" lookup — only
 * lookup-by-lesson-id. So this editor can only ever discover a *published*
 * lesson for a theme+level (via the teacher-facing endpoint, which admins can
 * also call). A half-finished draft from an earlier session is not
 * recoverable from here; "Start authoring" / "New version" always creates a
 * fresh draft version rather than resuming one. Documented, not fixed — fixing
 * it means a new backend route, out of this task's scope.
 */
export function LessonEditor({ theme, level }: { theme: PrimaryCurriculumTheme; level: PrimaryLevel }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [starting, setStarting] = useState(false);

  const published = useQuery({
    queryKey: ["admin-primary-lesson", theme.id, level],
    queryFn: () => backendApi.primaryCurriculumLesson(theme.id, level),
    retry: false,
  });

  const notFound = published.isError && (published.error as { status?: number })?.status === 404;
  const otherError = published.isError && !notFound;

  // The parent remounts this component (via a `key` on theme+level) whenever
  // the selection changes, so `form` always starts fresh here — no reset
  // effect needed for that. This effect only syncs in the published lesson
  // once the query resolves.
  useEffect(() => {
    if (published.data) setForm(toFormState(published.data));
  }, [published.data]);

  const isDraft = form.status === "draft";
  const isPublished = form.status === "published";
  const isEmpty = form.lessonId === null;

  // Computed on every render from current form state — not just at submit
  // time — so the inline field errors in StepRows and the Save/Publish
  // disabled state always agree with what's on screen.
  const stepErrors = validateSteps(form.steps);
  const hasStepErrors = stepErrors.length > 0;

  /**
   * Two independent try/catches, not one wrapped around both calls. If the
   * lesson-level update lands but the steps replace then fails (easy to
   * trigger before the validation above existed — see review), the old code
   * left local `form` state unsynced and told the user "Couldn't save draft"
   * with no indication that half the save actually landed, implying a full
   * retry was needed. Now: the lesson-level fields sync into `form`
   * immediately after they're confirmed persisted, and a steps-only failure
   * throws a distinguishable `STEPS_SAVE_FAILED` error so the caller's toast
   * can say exactly that.
   */
  async function saveDraft(): Promise<PrimaryCurriculumLesson | null> {
    if (!form.lessonId) return null;
    if (hasStepErrors) {
      throw Object.assign(
        new Error("Fix the highlighted step issues before saving."),
        { code: "STEP_VALIDATION" }
      );
    }
    setSaving(true);
    try {
      const updated = await backendApi.adminUpdatePrimaryLesson(form.lessonId, {
        objectives: parseLines(form.objectives),
        vocabulary: parseLines(form.vocabulary),
        assessment_questions: parseLines(form.assessmentQuestions),
        homework: form.homework.trim() || null,
        parent_update: form.parentUpdate.trim() || null,
      });
      // Confirmed persisted — sync the lesson-level fields now, independent
      // of whether the steps call below succeeds. `steps` is left alone: it
      // still shows whatever the admin has pending.
      setForm((prev) => ({
        ...prev,
        objectives: updated.objectives.join("\n"),
        vocabulary: updated.vocabulary.join("\n"),
        assessmentQuestions: updated.assessment_questions.join("\n"),
        homework: updated.homework ?? "",
        parentUpdate: updated.parent_update ?? "",
        version: updated.version,
        status: updated.status,
      }));
    } catch (error) {
      setSaving(false);
      throw error; // nothing persisted — the caller's generic message is accurate
    }

    try {
      const steps = sanitizeStepsForSubmit(form.steps).map((step) => ({
        position: step.position,
        step_type: step.step_type,
        title: step.title,
        instructions: step.instructions,
        duration_minutes: step.duration_minutes,
        objective_indexes: step.objective_indexes,
        resource_category: step.resource_category,
      }));
      const lesson = await backendApi.adminReplacePrimarySteps(form.lessonId, steps);
      setForm(toFormState(lesson));
      return lesson;
    } catch (error) {
      throw Object.assign(
        new Error(
          "Objectives, vocabulary, homework and parent update saved. The steps didn't — fix the issue and save again."
        ),
        { code: "STEPS_SAVE_FAILED" }
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDraft() {
    try {
      await saveDraft();
      toast({ title: "Draft saved" });
    } catch (error) {
      toast({
        title: "Couldn't save draft",
        description: getErrorMessage(error, "Try again.", {
          STEP_VALIDATION: "Fix the highlighted step issues, then save again.",
        }),
        variant: "error",
      });
    }
  }

  async function handlePublish() {
    if (!form.lessonId) return;
    setPublishing(true);
    try {
      await saveDraft();
    } catch (error) {
      // Named as a save failure, not a publish failure — publish was never
      // attempted, so "Couldn't publish" would misattribute where this broke.
      toast({
        title: "Couldn't save before publishing",
        description: getErrorMessage(error, "Try again.", {
          STEP_VALIDATION: "Fix the highlighted step issues, then publish again.",
          STEPS_SAVE_FAILED:
            "Objectives, vocabulary, homework and parent update saved — the steps didn't. Fix the issue and try publishing again.",
        }),
        variant: "error",
      });
      setPublishing(false);
      return;
    }
    try {
      const lesson = await backendApi.adminPublishPrimaryLesson(form.lessonId);
      setForm(toFormState(lesson));
      toast({ title: "Lesson published", description: `Live for ${theme.name} at this level.` });
      queryClient.invalidateQueries({ queryKey: [ADMIN_PRIMARY_THEMES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["admin-primary-lesson", theme.id, level] });
    } catch (error) {
      toast({
        title: "Couldn't publish",
        description: getErrorMessage(error, "Try again.", {
          PRIMARY_LESSON_HAS_NO_STEPS: "This lesson has no steps yet. Add at least one step, then publish.",
        }),
        variant: "error",
      });
    } finally {
      setPublishing(false);
    }
  }

  async function handleStartAuthoring() {
    setStarting(true);
    try {
      const lesson = await backendApi.adminCreatePrimaryLesson({
        theme_id: theme.id,
        level,
        objectives: [],
        vocabulary: [],
        assessment_questions: [],
        homework: null,
        parent_update: null,
        steps: [],
      });
      setForm(toFormState(lesson));
      toast({ title: "Draft started", description: "Fill in the lesson below, then save." });
    } catch (error) {
      toast({ title: "Couldn't start a draft", description: getErrorMessage(error, "Try again."), variant: "error" });
    } finally {
      setStarting(false);
    }
  }

  async function handleNewVersion() {
    if (!form.lessonId) return;
    setDuplicating(true);
    try {
      const lesson = await backendApi.adminDuplicatePrimaryLesson(form.lessonId);
      setForm(toFormState(lesson));
      toast({ title: "New draft version created", description: `Version ${lesson.version} — edit and publish when ready.` });
    } catch (error) {
      toast({ title: "Couldn't create a new version", description: getErrorMessage(error, "Try again."), variant: "error" });
    } finally {
      setDuplicating(false);
    }
  }

  const readOnly = isPublished;

  return (
    <AdminPanel
      title={theme.name}
      description={`${theme.subject} · ${theme.language}`}
      actions={
        form.status ? (
          <StatusPill status={isPublished ? "success" : "info"}>
            {isPublished ? `Published · v${form.version}` : `Draft · v${form.version}`}
          </StatusPill>
        ) : null
      }
    >
      {published.isLoading ? <LoadingState label="Checking for a published lesson" /> : null}

      {otherError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {getErrorMessage(published.error, "Couldn't load this lesson.")}
        </p>
      ) : null}

      {!published.isLoading && notFound && isEmpty ? (
        <div className="space-y-4">
          <p className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-800">
            {theme.name} has no published lesson for this level yet. Start authoring to create the first draft.
            {" "}This screen can only find <em>published</em> lessons — if this theme+level was half-authored in an
            earlier session and never published, that draft can&apos;t be found or resumed here, and starting again
            creates a separate new draft rather than continuing it.
          </p>
          <Button onClick={handleStartAuthoring} disabled={starting}>
            <Sparkles className="h-4 w-4" />
            {starting ? "Starting..." : "Start authoring"}
          </Button>
        </div>
      ) : null}

      {form.lessonId ? (
        <div className="space-y-5">
          {isPublished ? (
            <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              This version is published and live for teachers. Editing it here would silently rewrite lesson content
              on days teachers have already taught with it. Create a new version to make changes — it starts as a
              draft copy you can edit and publish separately.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Objectives (one per line)">
              <Textarea
                rows={4}
                value={form.objectives}
                onChange={(event) => setForm({ ...form, objectives: event.target.value })}
                disabled={readOnly}
              />
            </Field>
            <Field label="Vocabulary (one per line)">
              <Textarea
                rows={4}
                value={form.vocabulary}
                onChange={(event) => setForm({ ...form, vocabulary: event.target.value })}
                disabled={readOnly}
              />
            </Field>
            <Field label="Assessment questions (one per line)">
              <Textarea
                rows={4}
                value={form.assessmentQuestions}
                onChange={(event) => setForm({ ...form, assessmentQuestions: event.target.value })}
                disabled={readOnly}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Homework">
              <Textarea
                rows={2}
                value={form.homework}
                onChange={(event) => setForm({ ...form, homework: event.target.value })}
                disabled={readOnly}
              />
            </Field>
            <Field label="Parent update">
              <Textarea
                rows={2}
                value={form.parentUpdate}
                onChange={(event) => setForm({ ...form, parentUpdate: event.target.value })}
                disabled={readOnly}
              />
            </Field>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold text-gray-900">Steps</h3>
            <StepRows
              steps={form.steps}
              onChange={(steps) => setForm({ ...form, steps })}
              disabled={readOnly}
              errors={stepErrors}
            />
          </div>

          {!readOnly && hasStepErrors ? (
            <p className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Fix {stepErrors.length} step issue{stepErrors.length === 1 ? "" : "s"} above before saving or
              publishing — a blank title or an out-of-range duration gets rejected by the server for the whole
              lesson, not just that step.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-4">
            {!readOnly ? (
              <>
                <Button variant="outline" onClick={handleSaveDraft} disabled={saving || publishing || hasStepErrors}>
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save draft"}
                </Button>
                <Button onClick={handlePublish} disabled={saving || publishing || hasStepErrors}>
                  <Send className="h-4 w-4" />
                  {publishing ? "Publishing..." : "Publish"}
                </Button>
              </>
            ) : null}
            {isPublished ? (
              <Button variant="secondary" onClick={handleNewVersion} disabled={duplicating}>
                <CopyPlus className="h-4 w-4" />
                {duplicating ? "Creating..." : "New version"}
              </Button>
            ) : null}
            {isDraft ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <PencilLine className="h-3.5 w-3.5" />
                Editing draft version {form.version}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </AdminPanel>
  );
}
