"use client";

import { FormEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CopyPlus, PencilLine, Plus, Save, Send, Sparkles } from "lucide-react";
import { backendApi, type PrimaryCurriculumLesson, type PrimaryCurriculumTheme, type PrimaryCurriculumTopic, type PrimaryLevel } from "@/lib/api";
import { parseLines, sanitizeStepsForSubmit, validateSteps, type StepDraft } from "@/lib/primary-authoring";
import { AdminPanel, LoadingState, StatusPill } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/errors";
import { StepRows } from "@/components/admin/primary-curriculum/step-rows";
import { ADMIN_PRIMARY_THEMES_QUERY_KEY, LEVEL_OPTIONS } from "@/components/admin/primary-curriculum/theme-list";

type FormState = {
  lessonId: string | null;
  status: PrimaryCurriculumLesson["status"] | null;
  version: number | null;
  title: string;
  academicYearId: string;
  month: string;
  week: string;
  day: string;
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
  title: "",
  academicYearId: "",
  month: "",
  week: "",
  day: "",
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
    title: lesson.title ?? "",
    academicYearId: lesson.academic_year_id ?? "",
    month: lesson.month?.toString() ?? "",
    week: lesson.week?.toString() ?? "",
    day: lesson.day?.toString() ?? "",
    objectives: lesson.objectives.join("\n"),
    vocabulary: lesson.vocabulary.join("\n"),
    assessmentQuestions: lesson.assessment_questions.join("\n"),
    homework: lesson.homework ?? "",
    parentUpdate: lesson.parent_update ?? "",
    steps: lesson.steps,
  };
}

export function LessonEditor({
  theme,
  level,
  onTopicCreated,
}: {
  theme: PrimaryCurriculumTheme;
  level: PrimaryLevel;
  onTopicCreated: (topic: PrimaryCurriculumTopic) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [starting, setStarting] = useState(false);
  const [topicId, setTopicId] = useState(theme.topics.find((topic) => topic.is_active)?.id ?? "");
  const [topicName, setTopicName] = useState("");
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState("");

  const years = useQuery({ queryKey: ["admin-primary-academic-years"], queryFn: backendApi.adminPrimaryAcademicYears });

  const lessons = useQuery({
    queryKey: ["admin-primary-lessons", theme.id, level, topicId],
    queryFn: () => backendApi.adminPrimaryLessons({ theme_id: theme.id, level, topic_id: topicId }),
    enabled: !!topicId,
  });

  useEffect(() => {
    if (!lessons.data) return;
    const newestFirst = [...lessons.data].sort((a, b) => b.version - a.version);
    const selected = newestFirst.find((lesson) => lesson.id === selectedLessonId)
      ?? newestFirst.find((lesson) => lesson.status === "draft")
      ?? newestFirst.find((lesson) => lesson.status === "published")
      ?? newestFirst[0];
    if (selected) {
      setSelectedLessonId(selected.id);
      setForm(toFormState(selected));
    } else {
      setSelectedLessonId("");
      setForm(emptyForm);
    }
  }, [lessons.data, selectedLessonId]);

  useEffect(() => {
    setForm(emptyForm);
    setSelectedLessonId("");
  }, [topicId]);

  const isDraft = form.status === "draft";
  const isPublished = form.status === "published";
  const isArchived = form.status === "archived";
  const isEmpty = form.lessonId === null;

  // Computed on every render from current form state — not just at submit
  // time — so the inline field errors in StepRows and the Save/Publish
  // disabled state always agree with what's on screen.
  const stepErrors = validateSteps(form.steps);
  const hasStepErrors = stepErrors.length > 0;

  async function createTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = topicName.trim();
    if (!name) return;
    setCreatingTopic(true);
    try {
      const created = await backendApi.adminCreatePrimaryTopic(theme.id, {
        name,
        description: null,
        position: theme.topics.length,
        keywords: [],
        aliases: [],
        is_active: true,
      });
      onTopicCreated(created);
      setTopicName("");
      setTopicId(created.id);
      await queryClient.invalidateQueries({ queryKey: [ADMIN_PRIMARY_THEMES_QUERY_KEY] });
      toast({ title: "Topic created", description: `${created.name} is selected. You can start its class lesson now.` });
    } catch (error) {
      toast({ title: "Couldn't create topic", description: getErrorMessage(error, "Try again."), variant: "error" });
    } finally {
      setCreatingTopic(false);
    }
  }

  function chooseLesson(lessonId: string) {
    const lesson = (lessons.data ?? []).find((item) => item.id === lessonId);
    setSelectedLessonId(lessonId);
    if (lesson) setForm(toFormState(lesson));
  }

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
        title: form.title.trim() || null,
        academic_year_id: form.academicYearId || null,
        month: form.month ? Number(form.month) : null,
        week: form.week ? Number(form.week) : null,
        day: form.day ? Number(form.day) : null,
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
      await queryClient.invalidateQueries({ queryKey: ["admin-primary-lessons", theme.id, level, topicId] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-primary-lessons", theme.id, level, topicId] });
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
        topic_id: topicId,
        academic_year_id: form.academicYearId || null,
        title: form.title.trim() || null,
        month: form.month ? Number(form.month) : null,
        week: form.week ? Number(form.week) : null,
        day: form.day ? Number(form.day) : null,
        level,
        objectives: [],
        vocabulary: [],
        assessment_questions: [],
        homework: null,
        parent_update: null,
        steps: [],
      });
      setForm(toFormState(lesson));
      setSelectedLessonId(lesson.id);
      await queryClient.invalidateQueries({ queryKey: ["admin-primary-lessons", theme.id, level, topicId] });
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
      setSelectedLessonId(lesson.id);
      await queryClient.invalidateQueries({ queryKey: ["admin-primary-lessons", theme.id, level, topicId] });
      toast({ title: "New draft version created", description: `Version ${lesson.version} — edit and publish when ready.` });
    } catch (error) {
      toast({ title: "Couldn't create a new version", description: getErrorMessage(error, "Try again."), variant: "error" });
    } finally {
      setDuplicating(false);
    }
  }

  const readOnly = !isDraft;

  return (
    <AdminPanel
      title="2. Choose topic & author lesson"
      description={`${theme.emoji || "🎨"} ${theme.name} · ${LEVEL_OPTIONS.find((item) => item.value === level)?.label ?? level}`}
      actions={
        form.status ? (
          <StatusPill status={isPublished ? "success" : isDraft ? "info" : "neutral"}>
            {isPublished ? `Published · v${form.version}` : isDraft ? `Draft · v${form.version}` : `Archived · v${form.version}`}
          </StatusPill>
        ) : null
      }
    >
      <div className="mb-5 space-y-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Topic">
            <Select value={topicId} onChange={(event) => setTopicId(event.target.value)}>
              <option value="">Select a topic</option>
              {theme.topics.filter((topic) => topic.is_active).map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
            </Select>
          </Field>
          <form onSubmit={createTopic}>
            <Field label={theme.topics.some((topic) => topic.is_active) ? "Or create another topic" : "Create the first topic"}>
              <div className="flex gap-2">
                <Input
                  value={topicName}
                  onChange={(event) => setTopicName(event.target.value)}
                  placeholder="e.g. Cow, Road Safety, Rainy Season"
                />
                <Button type="submit" variant="outline" disabled={!topicName.trim() || creatingTopic}>
                  <Plus className="h-4 w-4" />
                  {creatingTopic ? "Creating…" : "Add topic"}
                </Button>
              </div>
            </Field>
          </form>
        </div>
        <p className="text-xs text-gray-500">Each topic can have a completely different lesson for every class. New topics are available here immediately.</p>
      </div>
      {!topicId ? (
        <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-5 py-8 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-amber-600" />
          <h3 className="mt-2 text-sm font-bold text-amber-950">Choose or create a topic</h3>
          <p className="mt-1 text-xs text-amber-800">The lesson editor will open as soon as a topic is selected.</p>
        </div>
      ) : null}

      {lessons.isLoading ? <LoadingState label="Loading lesson versions" /> : null}

      {lessons.isError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {getErrorMessage(lessons.error, "Couldn't load this lesson.")}
        </p>
      ) : null}

      {topicId && !lessons.isLoading && !lessons.isError && isEmpty ? (
        <div className="space-y-4">
          <p className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-800">
            This topic has no lesson for {LEVEL_OPTIONS.find((item) => item.value === level)?.label ?? level} yet.
            Start a draft, add the daily sequence, then publish it for teachers.
          </p>
          <Button type="button" onClick={handleStartAuthoring} disabled={starting}>
            <Sparkles className="h-4 w-4" />
            {starting ? "Starting..." : "Start lesson draft"}
          </Button>
        </div>
      ) : null}

      {form.lessonId ? (
        <div className="space-y-5">
          {(lessons.data ?? []).length > 1 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <Field label="Version history">
                <Select value={selectedLessonId} onChange={(event) => chooseLesson(event.target.value)}>
                  {[...(lessons.data ?? [])].sort((a, b) => b.version - a.version).map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      Version {lesson.version} · {lesson.status === "published" ? "Published" : lesson.status === "draft" ? "Draft" : "Archived"}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          ) : null}
          {isPublished ? (
            <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              This version is published and live for teachers. Editing it here would silently rewrite lesson content
              on days teachers have already taught with it. Create a new version to make changes — it starts as a
              draft copy you can edit and publish separately.
            </p>
          ) : null}
          {isArchived ? (
            <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              This is an older archived version. It is read-only, but you can create a new editable version from it.
            </p>
          ) : null}

          <div className="grid gap-4 rounded-xl border border-gray-200 p-4 sm:grid-cols-5">
            <Field label="Lesson title"><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} disabled={readOnly} /></Field>
            <Field label="Academic year"><Select value={form.academicYearId} onChange={(event) => setForm({ ...form, academicYearId: event.target.value })} disabled={readOnly}><option value="">Not assigned</option>{(years.data ?? []).filter((year) => year.is_active).map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}</Select></Field>
            <Field label="Month"><Input type="number" min={1} max={12} value={form.month} onChange={(event) => setForm({ ...form, month: event.target.value })} disabled={readOnly} /></Field>
            <Field label="Week"><Input type="number" min={1} max={6} value={form.week} onChange={(event) => setForm({ ...form, week: event.target.value })} disabled={readOnly} /></Field>
            <Field label="Day"><Input type="number" min={1} max={7} value={form.day} onChange={(event) => setForm({ ...form, day: event.target.value })} disabled={readOnly} /></Field>
          </div>

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
            {!isDraft ? (
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
