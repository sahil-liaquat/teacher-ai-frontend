"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Eye,
  FileText,
  GripVertical,
  Link2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  type LessonReadinessCheck,
  type PrimaryAIOperation,
  type PrimaryAIProposalRequest,
  type PrimaryCurriculumLesson,
  type PrimaryCurriculumStep,
  type PrimaryCurriculumTheme,
  type PrimaryResource,
  type PrimaryStepType,
} from "@/lib/api";
import { curriculumAdminAdapter, type CurriculumAdminScope } from "@/lib/curriculum-admin-adapter";
import { STEP_TYPE_OPTIONS, stepDetailFields, type StepDetailField } from "@/lib/primary-step-fields";
import { primaryStepImage } from "@/lib/primary-step-images";
import { levelLabel, monthLabel, resourceCount } from "@/lib/school-admin-curriculum";
import {
  advisoryNotes,
  blockingIssues,
  dayStatus,
  focusTarget,
  isPublishable,
  satisfiedChecks,
} from "@/lib/curriculum-readiness";
import { applySelectionChange, topicOptions } from "@/lib/curriculum-day-draft";
import {
  addObjective,
  updateObjective,
  objectiveCoverage,
  objectivesOf,
  removeObjective,
  stepTeaches,
  toggleStepObjective,
  uncoveredObjectives,
} from "@/lib/curriculum-objectives";
import { getErrorMessage } from "@/lib/errors";
import { useSchoolLevels } from "@/lib/use-school-levels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { SchoolAdminPage } from "@/components/school-admin/shared/page-primitives";
import { ActionDialog } from "@/components/school-admin/shared/action-dialog";
import { StatusBadge } from "@/components/school-admin/shared/status-badge";
import { ResourcePicker } from "@/components/school-admin/day-editor/resource-picker";
import { AIProposalDialog } from "@/components/school-admin/ai/ai-proposal-dialog";
import { weekdayName, weekdayAbbr } from "@/lib/primary-teaching-week";

type EditableStep = PrimaryCurriculumStep & { id: string };
type PickerTarget = { stepIndex: number; detail?: { key: string; multi: boolean } };


export function SchoolDayEditor({
  lessonId,
  academicYearId,
  themes,
  initialBlockId,
  onBack,
  onLessonChanged,
  scope = "school",
}: {
  lessonId: string;
  academicYearId: string;
  themes: PrimaryCurriculumTheme[];
  initialBlockId?: string | null;
  onBack: () => void;
  onLessonChanged: (lessonId: string) => void;
  scope?: CurriculumAdminScope;
}) {
  const adapter = curriculumAdminAdapter(scope);
  const { labelFor: schoolLevelLabel } = useSchoolLevels();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [dailyFocus, setDailyFocus] = useState("");
  // Theme is editable HERE. It used to be derived from `lesson.theme_id` with no
  // control at all, so a day created with the old silent default could never be
  // corrected — and theme drives both the teacher's lookup and the resource
  // matcher's dominant facet.
  const [themeId, setThemeId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [objectives, setObjectives] = useState<string[]>([]);
  const [steps, setSteps] = useState<EditableStep[]>([]);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [newBlockType, setNewBlockType] = useState<PrimaryStepType>("circle_time");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [aiRequest, setAIRequest] = useState<PrimaryAIProposalRequest | null>(null);
  const [aiTitle, setAITitle] = useState("AI block proposal");
  const initialSnapshot = useRef<PrimaryCurriculumLesson | null>(null);

  const lessonQuery = useQuery<PrimaryCurriculumLesson>({
    queryKey: [adapter.queryRoot, "lesson", lessonId],
    queryFn: () => adapter.lesson(lessonId),
  });
  /**
   * ⚠ Resolve attachments BY ID, never out of a search page.
   *
   * This was `adapter.resources({ page_size: 100 })` against a title-ordered
   * catalog of ~861 rows, so any printable outside the first page rendered as
   * "Attached resource / Classroom resource" and the author could not tell what
   * was attached without reopening the picker. Raising the page size would not
   * have fixed it — it was the wrong query. The step already knows its ids.
   */
  const attachedResourceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const step of steps) {
      for (const id of allResourceIds(step)) ids.add(id);
    }
    return Array.from(ids).sort();
  }, [steps]);
  const resourcesQuery = useQuery({
    queryKey: [adapter.queryRoot, "resource-lookup", attachedResourceIds.join(",")],
    queryFn: () => adapter.lookupResources(attachedResourceIds),
    enabled: attachedResourceIds.length > 0,
  });

  useEffect(() => {
    if (!lessonQuery.data) return;
    const lesson = lessonQuery.data;
    setTitle(lesson.title ?? "");
    setDailyFocus(lesson.daily_focus ?? "");
    setThemeId(lesson.theme_id ?? "");
    setTopicId(lesson.topic_id ?? "");
    setObjectives(lesson.objectives ?? []);
    setSteps((lesson.steps ?? []).slice().sort((a, b) => a.position - b.position).map((step) => ({ ...step })));
    const initialIndex = (lesson.steps ?? []).slice().sort((a, b) => a.position - b.position).findIndex((step) => step.id === initialBlockId);
    if (initialIndex >= 0) setExpandedStep(initialIndex);
    setSaved(true);
    initialSnapshot.current = structuredClone(lesson);
  }, [initialBlockId, lessonQuery.data]);

  const lesson = lessonQuery.data;
  const isMaster = lesson?.scope === "platform";
  const isPublished = lesson?.status === "published";
  const readOnly = (scope === "school" && isMaster) || isPublished;
  const activeThemes = useMemo(() => themes.filter((item) => item.is_active), [themes]);
  const theme = activeThemes.find((item) => item.id === themeId || item.source_theme_id === themeId);
  const topics = topicOptions(activeThemes, { themeId, subthemeId: "" });
  const duration = steps.reduce((sum, step) => sum + (step.duration_minutes || 0), 0);
  const uncovered = uncoveredObjectives(objectives, steps);
  const coverage = objectiveCoverage(objectives, steps);
  const localLesson = lesson ? ({ ...lesson, title, daily_focus: dailyFocus, theme_id: themeId || lesson.theme_id, topic_id: topicId || null, objectives, steps } as PrimaryCurriculumLesson) : null;
  /**
   * ⚠ Issues come from the SERVER's verdict on the SAVED row — never from a
   * rule evaluated here. That second rule is what let a day show a green
   * *Ready* badge and then be refused on publish. The trade is that the panel
   * reflects the last save, which is why unsaved edits say so rather than
   * silently re-scoring against a rule the publish endpoint does not share.
   */
  const issues = blockingIssues(lesson);
  const notes = advisoryNotes(lesson);
  const passing = satisfiedChecks(lesson);
  // Picker selections are merged in so a freshly attached printable shows its
  // real title immediately, without waiting for the lookup to refetch.
  const [pickedResources, setPickedResources] = useState<Record<string, PrimaryResource>>({});
  const resourceMap = useMemo(() => {
    const map = new Map<string, PrimaryResource>();
    for (const resource of resourcesQuery.data ?? []) map.set(resource.id, resource);
    for (const resource of Object.values(pickedResources)) map.set(resource.id, resource);
    return map;
  }, [resourcesQuery.data, pickedResources]);

  function markChanged() {
    setSaved(false);
  }

  function updateStep(index: number, patch: Partial<EditableStep>) {
    setSteps((current) => current.map((step, position) => position === index ? { ...step, ...patch } : step));
    markChanged();
  }

  function moveStep(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    setSteps((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((step, position) => ({ ...step, position }));
    });
    setExpandedStep(target);
    markChanged();
  }

  function addBlock() {
    const label = STEP_TYPE_OPTIONS.find((item) => item.value === newBlockType)?.label ?? "Classroom Block";
    setSteps((current) => [...current, {
      id: `new-${Date.now()}`,
      position: current.length,
      step_type: newBlockType,
      title: label,
      instructions: [],
      duration_minutes: 20,
      objective_indexes: [],
      resource_category: null,
      resource_ids: [],
      child_action: [],
      required_resource_ids: [],
      optional_resource_ids: [],
      details: {},
    }]);
    setExpandedStep(steps.length);
    markChanged();
  }

  async function customizeDay() {
    if (!lesson) return;
    setSaving(true);
    try {
      const draft = await adapter.customizeLesson(lesson.id, academicYearId);
      await queryClient.invalidateQueries({ queryKey: [adapter.queryRoot] });
      onLessonChanged(draft.id);
      toast({ title: "School draft created", description: "TeachPad curriculum remains unchanged." });
    } catch (error: any) {
      toast({ title: "Could not customize this day", description: getErrorMessage(error, "Try again."), variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function createDraftFromPublished() {
    if (!lesson || lesson.status !== "published") return;
    setSaving(true);
    try {
      const draft = await adapter.duplicateLesson(lesson.id);
      await queryClient.invalidateQueries({ queryKey: [adapter.queryRoot] });
      onLessonChanged(draft.id);
      toast({ title: "New draft created", description: "The published version remains unchanged for teachers until you review and publish this draft." });
    } catch (error: any) {
      toast({ title: "Could not start a new draft", description: getErrorMessage(error, "Try again."), variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function saveDay(showToast = true): Promise<PrimaryCurriculumLesson | null> {
    if (!lesson || readOnly) return null;
    setSaving(true);
    try {
      await adapter.updateLesson(lesson.id, {
        title: title.trim() || null,
        daily_focus: dailyFocus.trim() || null,
        // Both halves of the pair travel together. The server validates the
        // RESULTING (theme, topic) combination, so sending one without the
        // other would be judged against whatever is still on the row.
        theme_id: themeId || lesson.theme_id,
        topic_id: topicId || null,
        objectives: objectives.filter((item) => item.trim()),
      });
      const updated = await adapter.replaceSteps(lesson.id, steps.map((step, position) => ({
        position,
        step_type: step.step_type,
        title: step.title,
        instructions: (step.instructions ?? []).filter((item) => item.trim()),
        duration_minutes: Number(step.duration_minutes) || 0,
        objective_indexes: step.objective_indexes ?? [],
        resource_category: step.resource_category || null,
        resource_ids: step.resource_ids ?? [],
        child_action: step.child_action ?? [],
        observation_point: step.observation_point ?? null,
        transition: step.transition ?? null,
        required_resource_ids: step.required_resource_ids ?? [],
        optional_resource_ids: step.optional_resource_ids ?? [],
        details: step.details ?? {},
      })));
      queryClient.setQueryData([adapter.queryRoot, "lesson", lesson.id], updated);
      await queryClient.invalidateQueries({ queryKey: [adapter.queryRoot, "lessons"] });
      setSteps(updated.steps.slice().sort((a, b) => a.position - b.position).map((step) => ({ ...step })));
      setSaved(true);
      if (showToast) toast({ title: "Teaching day saved" });
      return updated;
    } catch (error) {
      toast({ title: "Could not save this day", description: getErrorMessage(error, "Check the theme and topic and try again."), variant: "error" });
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function publishDay() {
    if (!lesson) return;
    // Save first, then judge the SAVED row. Gating on the pre-save verdict would
    // either refuse a day the author has just fixed, or attempt a publish the
    // server will refuse — the save response carries a fresh `readiness`, so
    // this is the only moment at which the two can be guaranteed to agree.
    const savedLesson = await saveDay(false);
    if (!savedLesson) return;
    if (!isPublishable(savedLesson)) {
      toast({
        title: "This day is not ready yet",
        description: blockingIssues(savedLesson)[0]?.detail ?? "Resolve the remaining issues and try again.",
        variant: "error",
      });
      return;
    }
    setSaving(true);
    try {
      const published = await adapter.publishLesson(lesson.id);
      queryClient.setQueryData([adapter.queryRoot, "lesson", lesson.id], published);
      await queryClient.invalidateQueries({ queryKey: [adapter.queryRoot, "lessons"] });
      setReviewOpen(false);
      toast({ title: "Published to teachers", description: "This school version is now available to your teachers." });
    } catch (error) {
      toast({ title: "Could not publish", description: getErrorMessage(error, "Resolve the remaining issues and try again."), variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  function attachResource(resource: PrimaryResource) {
    if (!pickerTarget) return;
    // Keep the row the picker already resolved. Without this the freshly
    // attached printable would show a placeholder until the lookup refetched.
    setPickedResources((current) => ({ ...current, [resource.id]: resource }));
    const step = steps[pickerTarget.stepIndex];
    if (pickerTarget.detail) {
      const { key, multi } = pickerTarget.detail;
      const current = step.details?.[key];
      updateStep(pickerTarget.stepIndex, {
        details: {
          ...(step.details ?? {}),
          [key]: multi ? Array.from(new Set([...(Array.isArray(current) ? current : []), resource.id])) : resource.id,
        },
      });
    } else {
      updateStep(pickerTarget.stepIndex, { resource_ids: Array.from(new Set([...(step.resource_ids ?? []), resource.id])) });
    }
    setPickerTarget(null);
  }

  async function openBlockAI(operation: PrimaryAIOperation, action: string, block: EditableStep) {
    if (!lesson) return;
    let persistedBlock = block;
    if (!saved || !isPersistedId(block.id)) {
      if (readOnly) {
        toast({ title: "This block is not ready for AI", description: "Create a school draft before generating changes.", variant: "error" });
        return;
      }
      const savedLesson = await saveDay(false);
      if (!savedLesson) return;
      const savedBlock = savedLesson.steps.find((item) => item.position === block.position);
      if (!savedBlock) {
        toast({ title: "Could not prepare this block", description: "Save the teaching day and try again.", variant: "error" });
        return;
      }
      persistedBlock = { ...savedBlock };
    }
    setAITitle(action);
    setAIRequest({
      operation, academic_year_id: academicYearId, level: lesson.level,
      month: lesson.month, week: lesson.week, day: lesson.day,
      lesson_id: lesson.id, step_id: persistedBlock.id, theme_id: lesson.theme_id,
      topic_id: lesson.topic_id,
    });
  }

  if (lessonQuery.isLoading) return <SchoolAdminPage><Skeleton className="h-28" /><Skeleton className="h-40" /><Skeleton className="h-[500px]" /></SchoolAdminPage>;
  if (lessonQuery.isError || !lesson || !localLesson) return <SchoolAdminPage><button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-blue-700"><ArrowLeft className="h-4 w-4" /> Back to curriculum</button><div className="rounded-2xl bg-rose-50 p-5 text-sm text-rose-800">This teaching day could not be loaded.</div></SchoolAdminPage>;

  const dayName = lesson.day ? weekdayName(lesson.day) : "Teaching day";
  const status = dayStatus(lesson);

  return (
    <SchoolAdminPage className="max-w-[1180px]">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4" /> Back to {lesson.month ? monthLabel(lesson.month) : "month"} curriculum</button>

      <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2"><StatusBadge status={status} /><span className="text-xs font-semibold text-slate-500">{isMaster ? "TeachPad curriculum" : "Customized for your school"}</span></div>
          <p className="text-sm font-semibold text-slate-500">{dayName} · Week {lesson.week ?? "—"}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.025em] text-slate-950 sm:text-3xl">{title || dailyFocus || "Untitled teaching day"}</h1>
          <p className="mt-2 text-sm text-slate-500">{schoolLevelLabel(lesson.level)}{theme ? ` · ${theme.name}` : ""} · {saved ? "All changes saved" : "Unsaved changes"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPreviewOpen(true)}><Eye className="h-4 w-4" /> Preview as Teacher</Button>
          {isMaster ? <Button onClick={() => void customizeDay()} disabled={saving}>Customize for your school</Button> : isPublished ? <Button onClick={() => void createDraftFromPublished()} disabled={saving}>Edit as a new draft</Button> : (
            <><Button variant="outline" onClick={() => void saveDay()} disabled={saving || saved}><Save className="h-4 w-4" /> {saving ? "Saving…" : "Save"}</Button><Button onClick={() => setReviewOpen(true)}>Review &amp; Publish</Button></>
          )}
        </div>
      </header>

      {isMaster ? (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <Link2 className="mt-0.5 h-4 w-4 shrink-0" /><p>This day comes from TeachPad. Customize it to create a school-owned draft before changing instructions, blocks, or resources. The master and other schools will remain unchanged.</p>
        </div>
      ) : isPublished ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <Check className="mt-0.5 h-4 w-4 shrink-0" /><p>This version is currently available to teachers. Start a new draft before editing so teachers keep the published version until your next review.</p>
        </div>
      ) : null}

      <section className="grid gap-5 rounded-3xl bg-white p-5 shadow-[0_10px_34px_rgba(15,23,42,0.05)] sm:p-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Curriculum context</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label id="field-theme" className="text-sm font-semibold text-slate-700">
                Theme
                <select
                  disabled={readOnly}
                  value={themeId}
                  onChange={(event) => {
                    // Clearing an invalidated topic happens in the same update as
                    // the theme change, so no render can observe a mismatched
                    // pair — and a fast Save in that window cannot send one.
                    const next = applySelectionChange(activeThemes, { themeId, subthemeId: "", topicId }, { themeId: event.target.value });
                    setThemeId(next.themeId);
                    setTopicId(next.topicId);
                    markChanged();
                  }}
                  className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold"
                >
                  <option value="">Select a theme…</option>
                  {activeThemes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label id="field-topic" className="text-sm font-semibold text-slate-700">
                Topic
                <select
                  disabled={readOnly || !themeId}
                  value={topicId}
                  onChange={(event) => { setTopicId(event.target.value); markChanged(); }}
                  className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold"
                >
                  <option value="">{themeId ? "Select a topic…" : "Pick a theme first"}</option>
                  {topics.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {schoolLevelLabel(lesson.level)} · {lesson.month ? monthLabel(lesson.month) : "month"} · week {lesson.week ?? "—"}, day {lesson.day ?? "—"}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-950">Learning</h2>
            <label id="field-daily_focus" className="mt-4 block text-sm font-semibold text-slate-700">
              Daily focus
              <Input disabled={readOnly} value={dailyFocus} onChange={(event) => { setDailyFocus(event.target.value); markChanged(); }} className="mt-2" placeholder="One clear focus for teachers" />
            </label>
            <label className="mt-4 block text-sm font-semibold text-slate-700">
              Day title
              <Input disabled={readOnly} value={title} onChange={(event) => { setTitle(event.target.value); markChanged(); }} className="mt-2" placeholder="What is this day about?" />
            </label>
            <div id="field-objectives" className="mt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Learning objectives</h3>
                {!readOnly ? <button type="button" onClick={() => { setObjectives((current) => addObjective(current)); markChanged(); }} className="text-xs font-bold text-blue-700">+ Add objective</button> : null}
              </div>
              <div className="mt-2 space-y-2">
                {objectivesOf(objectives).map((objective) => (
                  // Keyed on the objective's own key, not its array index: the
                  // list allows removal from the middle, and index keys made
                  // React reuse the wrong input's DOM node.
                  <div key={objective.key} className="flex items-center gap-2">
                    <span className="w-5 shrink-0 text-xs font-bold text-slate-400">{objective.index + 1}.</span>
                    <Input disabled={readOnly} value={objective.text} onChange={(event) => { setObjectives((current) => updateObjective(current, objective.index, event.target.value)); markChanged(); }} />
                    {!readOnly ? (
                      <button
                        type="button"
                        aria-label={`Remove objective ${objective.index + 1}`}
                        onClick={() => {
                          // ⚠ Objectives and steps change TOGETHER. Blocks index
                          // into this list by position, so a removal that did
                          // not reindex would silently repoint every block above
                          // it. `removeObjective` owns that pairing.
                          const next = removeObjective({ objectives, steps }, objective.index);
                          setObjectives(next.objectives);
                          setSteps(next.steps);
                          markChanged();
                        }}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      ><X className="h-4 w-4" /></button>
                    ) : null}
                  </div>
                ))}
                {!objectives.length ? (
                  <p className="text-sm text-slate-500">
                    No learning objectives yet. Add what children should be able to do by the end of this day.
                  </p>
                ) : null}
                {/* ⚠ Advisory, never a readiness rule. Readiness is the
                    server's single verdict and this must not become a second
                    one — an uncovered objective can be perfectly intentional. */}
                {uncovered.length ? (
                  <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900">
                    {uncovered.length === 1
                      ? "1 objective is not taught by any block yet."
                      : `${uncovered.length} objectives are not taught by any block yet.`}{" "}
                    Tick them inside the blocks that cover them.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <ReadinessPanel
          ready={isPublishable(lesson)}
          issues={issues}
          notes={notes}
          passing={passing}
          coverage={coverage}
          stale={!saved}
          blocks={steps.length}
          minutes={duration}
          onFocus={(target) => {
            if (target.startsWith("block:")) {
              setExpandedStep(Number(target.slice("block:".length)));
              document.getElementById(`block-${target.slice("block:".length)}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
              return;
            }
            document.getElementById(`field-${target.slice("field:".length)}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="text-lg font-semibold text-slate-950">Classroom flow</h2><p className="mt-1 text-sm text-slate-500">Blocks appear in the order teachers will use them.</p></div><span className="text-sm font-semibold text-slate-500">{steps.length} blocks · {duration} min</span></div>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <BlockCard
              key={step.id}
              step={step}
              index={index}
              objectives={objectives}
              expanded={expandedStep === index}
              readOnly={readOnly}
              resourceMap={resourceMap}
              blockIssues={issues.filter((check) => check.step_position === index)}
              onToggle={() => setExpandedStep(expandedStep === index ? null : index)}
              onUpdate={(patch) => updateStep(index, patch)}
              onMove={(direction) => moveStep(index, direction)}
              onRemove={() => { setSteps((current) => current.filter((_, position) => position !== index).map((item, position) => ({ ...item, position }))); setExpandedStep(null); markChanged(); }}
              onResource={(detail) => setPickerTarget({ stepIndex: index, detail })}
              onAI={(operation, action) => { void openBlockAI(operation, action, step); }}
              first={index === 0}
              last={index === steps.length - 1}
            />
          ))}
        </div>
        {!steps.length ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center"><p className="text-sm font-semibold text-slate-700">No classroom blocks yet</p><p className="mt-1 text-xs text-slate-500">Add the first part of the teaching day below.</p></div> : null}
        {!readOnly ? (
          <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-dashed border-slate-300 bg-white p-3 sm:flex-row sm:items-center">
            <select value={newBlockType} onChange={(event) => setNewBlockType(event.target.value as PrimaryStepType)} className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold">{STEP_TYPE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            <Button variant="outline" onClick={addBlock}><Plus className="h-4 w-4" /> Add classroom block</Button>
          </div>
        ) : null}
      </section>

      {pickerTarget ? <ResourcePicker scope={scope} blockType={steps[pickerTarget.stepIndex]?.step_type ?? ""} selectedIds={allResourceIds(steps[pickerTarget.stepIndex])} onSelect={attachResource} onClose={() => setPickerTarget(null)} /> : null}
      {previewOpen ? <DayPreview lesson={localLesson} resourceMap={resourceMap} onClose={() => setPreviewOpen(false)} /> : null}
      {reviewOpen ? <PublishReview lesson={localLesson} initial={initialSnapshot.current} issues={issues} saving={saving} onClose={() => setReviewOpen(false)} onPublish={() => void publishDay()} /> : null}
      <AIProposalDialog
        scope={scope}
        open={Boolean(aiRequest)}
        onOpenChange={(open) => { if (!open) setAIRequest(null); }}
        request={aiRequest}
        title={aiTitle}
        onApplied={async (draftLessonIds) => {
          await queryClient.invalidateQueries({ queryKey: [adapter.queryRoot] });
          const draftId = draftLessonIds[0];
          if (draftId && draftId !== lesson.id) onLessonChanged(draftId);
          else await lessonQuery.refetch();
          toast({ title: "AI suggestion applied to a school draft", description: "Teachers still see the current published version." });
        }}
      />
    </SchoolAdminPage>
  );
}


/**
 * The readiness checklist — the server's verdict, rendered.
 *
 * ⚠ Every entry here came from `lesson.readiness`. The panel adds presentation
 * and a jump target and decides nothing, which is what makes "Ready to publish"
 * here and "publish succeeds" the same claim.
 *
 * `stale` is honest rather than clever: readiness describes the SAVED row, so
 * while there are unsaved edits the panel says so instead of re-scoring against
 * a rule the publish endpoint does not share.
 */
function ReadinessPanel({ ready, issues, notes, passing, stale, blocks, minutes, coverage, onFocus }: {
  ready: boolean;
  issues: LessonReadinessCheck[];
  notes: LessonReadinessCheck[];
  passing: LessonReadinessCheck[];
  stale: boolean;
  blocks: number;
  minutes: number;
  /** Advisory only — see the note where it renders. */
  coverage: { total: number; covered: number; percent: number };
  onFocus: (target: string) => void;
}) {
  return (
    <aside className="h-fit rounded-2xl bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-950">
        {ready ? "Ready to publish" : `Needs attention`}
      </h3>
      <p className="mt-1 text-xs text-slate-500">{blocks} blocks · {minutes} minutes</p>
      {/* ⚠ Rendered BELOW the server's verdict and never folded into it.
          Objective coverage is the author's own signal about intent, not a
          publish criterion — the server decides readiness and this panel has
          exactly one job beyond rendering it. */}
      {coverage.total ? (
        <p className="mt-1 text-xs text-slate-500">
          {coverage.covered} of {coverage.total} objectives taught by a block
        </p>
      ) : null}

      {stale ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] font-semibold text-amber-800">
          Unsaved changes. Save to re-check.
        </p>
      ) : null}

      {issues.length ? (
        <>
          <p className="mt-4 text-xs font-bold text-rose-700">
            {issues.length} {issues.length === 1 ? "issue" : "issues"}
          </p>
          <ul className="mt-2 space-y-2">
            {issues.map((check) => {
              const target = focusTarget(check);
              return (
                <li key={check.key}>
                  <button
                    type="button"
                    onClick={() => target && onFocus(target)}
                    disabled={!target}
                    className="flex w-full items-start gap-2 rounded-lg p-1.5 text-left text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:hover:bg-transparent"
                  >
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{check.detail ?? check.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-700">
          <Check className="h-4 w-4" /> Every requirement is met.
        </p>
      )}

      {passing.length ? (
        <ul className="mt-4 space-y-1 border-t border-slate-200 pt-3">
          {passing.map((check) => (
            <li key={check.key} className="flex items-start gap-2 text-[11px] text-slate-500">
              <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
              <span>{check.label}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {notes.length ? (
        <div className="mt-4 border-t border-slate-200 pt-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Notes</p>
          <ul className="mt-1.5 space-y-1.5">
            {notes.map((check) => {
              const target = focusTarget(check);
              return (
                <li key={check.key}>
                  <button
                    type="button"
                    onClick={() => target && onFocus(target)}
                    disabled={!target}
                    className="w-full text-left text-[11px] text-slate-500 hover:text-slate-900"
                  >
                    {check.detail ?? check.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}

function isPersistedId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function BlockCard({ step, index, objectives, expanded, readOnly, resourceMap, blockIssues, onToggle, onUpdate, onMove, onRemove, onResource, onAI, first, last }: {
  step: EditableStep;
  index: number;
  objectives: string[];
  expanded: boolean;
  readOnly: boolean;
  resourceMap: Map<string, PrimaryResource>;
  blockIssues: LessonReadinessCheck[];
  onToggle: () => void;
  onUpdate: (patch: Partial<EditableStep>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  onResource: (detail?: { key: string; multi: boolean }) => void;
  onAI: (operation: PrimaryAIOperation, action: string) => void;
  first: boolean;
  last: boolean;
}) {
  // ⚠ Per-block issues arrive from the server's readiness verdict, filtered to
  // this block's position. Re-deriving them here would put a second rule back
  // in the browser — the exact split this work removed.
  const resources = step.resource_ids ?? [];
  const blockArt = primaryStepImage(step.step_type);
  const detailFields = stepDetailFields(step.step_type);
  return (
    <article id={`block-${index}`} className={`overflow-hidden rounded-2xl border bg-white transition ${expanded ? "border-blue-300 shadow-[0_12px_38px_rgba(37,99,235,0.08)]" : "border-slate-200"}`}>
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 p-4 text-left sm:p-5" aria-expanded={expanded}>
        <GripVertical className="hidden h-5 w-5 shrink-0 text-slate-300 sm:block" aria-hidden="true" />
        {/* The SAME artwork the teacher's block page shows. Migrated from the
            retired step-rows.tsx: an author previewing a block should see what
            a teacher will, and the mapping already existed. */}
        {blockArt ? (
          <img src={blockArt} alt="" aria-hidden="true" className="hidden h-9 w-9 shrink-0 rounded-lg object-cover sm:block" />
        ) : null}
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-bold text-white">{index + 1}</span>
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-950">{step.title || "Untitled block"}</span><span className="mt-1 block truncate text-xs text-slate-500">{step.instructions?.[0] || "Add teacher instructions"} · {step.duration_minutes} min</span></span>
        <span className={`hidden rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline-flex ${blockIssues.length ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{blockIssues.length ? `${blockIssues.length} to fix` : "Ready"}</span>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {expanded ? (
        <div className="border-t border-slate-200 px-4 py-5 sm:px-6 sm:py-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
            <div className="space-y-7">
              <div>
                <div className="grid gap-3 sm:grid-cols-[1fr_130px]">
                  <label className="text-sm font-semibold text-slate-700">Block name<Input disabled={readOnly} value={step.title} onChange={(event) => onUpdate({ title: event.target.value })} className="mt-2" /></label>
                  <label className="text-sm font-semibold text-slate-700">Duration<Input disabled={readOnly} type="number" min={0} value={step.duration_minutes} onChange={(event) => onUpdate({ duration_minutes: Number(event.target.value) })} className="mt-2" /></label>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-slate-950">What will the teacher do?</h3><p className="mt-1 text-xs text-slate-500">Keep instructions short, clear, and in teaching order.</p></div><button type="button" onClick={() => onAI(step.instructions.length ? "improve_block" : "generate_teacher_instructions", step.instructions.length ? "Improve teacher instructions with AI" : "Generate teacher instructions with AI")} className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700"><Sparkles className="h-3.5 w-3.5" /> {step.instructions.length ? "Improve" : "Generate"} with AI</button></div>
                <div className="mt-3 space-y-2">
                  {(step.instructions ?? []).map((instruction, instructionIndex) => <div key={instructionIndex} className="flex items-start gap-2"><span className="mt-2.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">{instructionIndex + 1}</span><textarea disabled={readOnly} value={instruction} onChange={(event) => onUpdate({ instructions: step.instructions.map((item, position) => position === instructionIndex ? event.target.value : item) })} rows={2} className="min-h-[64px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /><button disabled={readOnly} type="button" aria-label={`Remove instruction ${instructionIndex + 1}`} onClick={() => onUpdate({ instructions: step.instructions.filter((_, position) => position !== instructionIndex) })} className="mt-2 text-slate-400 hover:text-rose-600"><X className="h-4 w-4" /></button></div>)}
                  {!readOnly ? <button type="button" onClick={() => onUpdate({ instructions: [...(step.instructions ?? []), ""] })} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700"><Plus className="h-3.5 w-3.5" /> Add instruction</button> : null}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-950">What are children learning?</h3>
                <div className="mt-3 space-y-2">{objectivesOf(objectives).map((objective) => <label key={objective.key} className="flex items-start gap-2 text-sm text-slate-700"><input disabled={readOnly} type="checkbox" checked={stepTeaches(step, objective.index)} onChange={(event) => onUpdate({ objective_indexes: toggleStepObjective(step, objective.index, event.target.checked) })} className="mt-0.5 h-4 w-4 rounded border-slate-300" />{objective.text || <span className="italic text-slate-400">Untitled objective</span>}</label>)}{!objectives.length ? <p className="text-xs text-slate-500">Add objectives in the Day summary first.</p> : null}</div>
              </div>
              <div>
                <div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold text-slate-950">What will the teacher need?</h3><p className="mt-1 text-xs text-slate-500">Resources are attached directly to this classroom block.</p></div><button type="button" onClick={() => onAI("suggest_resources", "Suggest resources")} className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700"><Sparkles className="h-3.5 w-3.5" /> Find with AI</button></div>
                <div className="mt-3 space-y-2">{resources.map((resourceId) => { const resource = resourceMap.get(resourceId); return <div key={resourceId} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><FileText className="h-4 w-4 shrink-0 text-blue-700" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">{resource?.title ?? "Attached resource"}</span><span className="block text-xs text-slate-500">{resource?.category ?? "Classroom resource"}</span></span>{!readOnly ? <button type="button" onClick={() => onUpdate({ resource_ids: resources.filter((id) => id !== resourceId) })} className="text-xs font-bold text-rose-600">Remove</button> : null}</div>; })}{!resources.length ? <p className="text-xs text-slate-500">No resources attached.</p> : null}</div>
                {!readOnly ? <Button variant="outline" size="sm" className="mt-3" onClick={() => onResource()}><Plus className="h-3.5 w-3.5" /> Add resource</Button> : null}
              </div>
              {detailFields.length ? <div><h3 className="text-sm font-semibold text-slate-950">Additional {STEP_TYPE_OPTIONS.find((item) => item.value === step.step_type)?.label ?? "block"} content</h3><div className="mt-4 grid gap-4 sm:grid-cols-2">{detailFields.map((field) => <DetailField key={field.key} field={field} step={step} readOnly={readOnly} resourceMap={resourceMap} onUpdate={onUpdate} onResource={onResource} />)}</div></div> : null}
            </div>
            <aside className="space-y-2 border-t border-slate-200 pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Block actions</p>
              {["story", "story_or_rhyme", "story_rhyme_picture_talk", "circle_time", "literacy_time", "numeracy_time", "assessment", "reflection"].includes(step.step_type) ? <button type="button" onClick={() => onAI("generate_questions", `Generate questions for ${step.title}`)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50"><Sparkles className="h-4 w-4" /> Generate questions</button> : null}
              <button disabled={first} type="button" onClick={() => onMove(-1)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-35"><ArrowUp className="h-4 w-4" /> Move up</button>
              <button disabled={last} type="button" onClick={() => onMove(1)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-35"><ArrowDown className="h-4 w-4" /> Move down</button>
              {!readOnly ? <button type="button" onClick={onRemove} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /> Remove block</button> : null}
            </aside>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function DetailField({ field, step, readOnly, resourceMap, onUpdate, onResource }: { field: StepDetailField; step: EditableStep; readOnly: boolean; resourceMap: Map<string, PrimaryResource>; onUpdate: (patch: Partial<EditableStep>) => void; onResource: (detail: { key: string; multi: boolean }) => void }) {
  const value = step.details?.[field.key];
  const update = (next: unknown) => onUpdate({ details: { ...(step.details ?? {}), [field.key]: next } });
  if (field.type === "resource" || field.type === "resource_multi") {
    const ids = Array.isArray(value) ? value : typeof value === "string" && value ? [value] : [];
    return <div className="sm:col-span-2"><p className="text-xs font-semibold text-slate-700">{field.label}{field.optional ? <span className="ml-1 font-normal text-slate-400">Optional</span> : null}</p><div className="mt-2 flex flex-wrap gap-2">{ids.map((id) => <span key={id} className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700"><FileText className="h-3.5 w-3.5 text-blue-700" />{resourceMap.get(id)?.title ?? "Attached resource"}{!readOnly ? <button type="button" aria-label={`Remove ${field.label}`} onClick={() => update(field.type === "resource_multi" ? ids.filter((item) => item !== id) : null)}><X className="h-3 w-3" /></button> : null}</span>)}{!readOnly ? <button type="button" onClick={() => onResource({ key: field.key, multi: field.type === "resource_multi" })} className="text-xs font-bold text-blue-700">+ Choose {field.label.toLowerCase()}</button> : null}</div></div>;
  }
  if (field.type === "list") {
    const list = Array.isArray(value) ? value.join("\n") : "";
    return <label className="text-xs font-semibold text-slate-700">{field.label}<textarea disabled={readOnly} value={list} onChange={(event) => update(event.target.value.split("\n"))} rows={3} placeholder={field.placeholder ?? "One item per line"} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium outline-none focus:border-blue-500" /></label>;
  }
  if (field.type === "textarea") return <label className="text-xs font-semibold text-slate-700 sm:col-span-2">{field.label}<textarea disabled={readOnly} value={typeof value === "string" ? value : ""} onChange={(event) => update(event.target.value)} rows={3} placeholder={field.placeholder} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium outline-none focus:border-blue-500" /></label>;
  return <label className="text-xs font-semibold text-slate-700">{field.label}<Input disabled={readOnly} value={typeof value === "string" ? value : ""} onChange={(event) => update(event.target.value)} className="mt-2" placeholder={field.placeholder} /></label>;
}

function allResourceIds(step?: EditableStep): string[] {
  if (!step) return [];
  const detailIds = Object.values(step.details ?? {}).flatMap((value) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : typeof value === "string" ? [value] : []);
  return Array.from(new Set([...(step.resource_ids ?? []), ...detailIds]));
}

/**
 * Preview as Teacher — what the authored day will look like when delivered.
 *
 * ⚠ An authoring QA view, not the teacher's runtime. It mirrors
 * `services/primary_assembly.py::assemble_activities`: blocks in authored order,
 * each starting where the previous one ended, from DEFAULT_DAY_START (08:00).
 * Nothing about `/primary/today` changes — this shows the input to it.
 *
 * The one thing it deliberately cannot show is auto-matching. A block naming a
 * resource category with nothing attached gets its printable picked at
 * generation time, so the preview says that rather than inventing a resource
 * name or leaving a silent blank.
 */
const PREVIEW_DAY_START_MINUTES = 8 * 60;

function clockAt(minutesFromMidnight: number): string {
  const hours = Math.floor(minutesFromMidnight / 60) % 24;
  const minutes = minutesFromMidnight % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function DayPreview({ lesson, resourceMap, onClose }: { lesson: PrimaryCurriculumLesson; resourceMap: Map<string, PrimaryResource>; onClose: () => void }) {
  const ordered = lesson.steps.slice().sort((a, b) => a.position - b.position);
  let cursor = PREVIEW_DAY_START_MINUTES;
  const timed = ordered.map((step) => {
    const startsAt = cursor;
    cursor += step.duration_minutes || 0;
    return { step, startsAt };
  });
  const total = cursor - PREVIEW_DAY_START_MINUTES;

  return (
    <ActionDialog
      open
      onOpenChange={(next: boolean) => { if (!next) onClose(); }}
      size="lg"
      title={lesson.title || lesson.daily_focus || "Untitled teaching day"}
      description={`Preview as teacher · ${levelLabel(lesson.level)} · ${lesson.topic?.name ? `${lesson.topic.name} · ` : ""}${ordered.length} blocks · ${total} minutes`}
      footer={<Button variant="outline" onClick={onClose}>Close preview</Button>}
    >
      <div>

        {lesson.objectives.filter((item) => item.trim()).length ? (
          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Learning focus</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {lesson.objectives.filter((item) => item.trim()).map((objective) => <li key={objective}>{objective}</li>)}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          {timed.map(({ step, startsAt }) => {
            const attached = [...(step.required_resource_ids ?? []), ...(step.resource_ids ?? [])];
            const awaitingMatch = !attached.length && step.resource_category;
            return (
              <div key={step.id} className="flex gap-4">
                <span className="w-14 shrink-0 pt-0.5 text-sm font-bold tabular-nums text-slate-400">{clockAt(startsAt)}</span>
                <div className="min-w-0 flex-1 border-l-2 border-blue-200 pl-4 pb-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <h3 className="font-semibold text-slate-950">{step.title || "Untitled block"}</h3>
                    <span className="text-xs text-slate-400">{step.duration_minutes} min</span>
                  </div>
                  {step.instructions?.length ? (
                    <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-slate-600">
                      {step.instructions.map((instruction, index) => <li key={`${step.id}-${index}`}>{instruction}</li>)}
                    </ol>
                  ) : (
                    <p className="mt-2 text-sm italic text-rose-600">No teacher instructions yet.</p>
                  )}
                  {attached.length ? (
                    <p className="mt-2 text-xs font-semibold text-blue-700">
                      {attached.map((id) => resourceMap.get(id)?.title ?? "Attached resource").join(" · ")}
                    </p>
                  ) : awaitingMatch ? (
                    <p className="mt-2 text-xs text-slate-400">
                      TeachPad will match a {step.resource_category} printable when a teacher plans this day.
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
          {!ordered.length ? <p className="py-10 text-center text-sm text-slate-500">This day has no blocks yet, so a teacher would receive an empty timetable.</p> : null}
        </div>
      </div>
    </ActionDialog>
  );
}

function PublishReview({ lesson, initial, issues, saving, onClose, onPublish }: { lesson: PrimaryCurriculumLesson; initial: PrimaryCurriculumLesson | null; issues: LessonReadinessCheck[]; saving: boolean; onClose: () => void; onPublish: () => void }) {
  const changes: string[] = [];
  if (!initial || initial.title !== lesson.title || initial.daily_focus !== lesson.daily_focus) changes.push("Day topic or focus updated");
  if (!initial || JSON.stringify(initial.objectives) !== JSON.stringify(lesson.objectives)) changes.push("Learning objectives updated");
  lesson.steps.forEach((step, index) => { const before = initial?.steps[index]; if (!before) changes.push(`${step.title} added`); else if (JSON.stringify(before.instructions) !== JSON.stringify(step.instructions)) changes.push(`${step.title}: teacher instructions updated`); });
  if (!initial || resourceCount(initial) !== resourceCount(lesson)) changes.push(`${resourceCount(lesson)} resources now attached`);
  return (
    <ActionDialog
      open
      onOpenChange={(next: boolean) => { if (!next && !saving) onClose(); }}
      title="Review changes"
      description="Teachers will receive this school version only after you confirm."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Continue editing</Button>
          <Button disabled={Boolean(issues.length) || saving} onClick={onPublish}>
            {saving ? "Publishing…" : "Publish to teachers"}
          </Button>
        </>
      }
    >
      {issues.length ? (
        <div className="rounded-2xl bg-rose-50 p-4">
          <p className="text-sm font-semibold text-rose-800">Finish these items before publishing</p>
          <ul className="mt-2 space-y-1 text-sm text-rose-700">
            {issues.map((issue) => <li key={issue.key}>• {issue.detail ?? issue.label}</li>)}
          </ul>
        </div>
      ) : (
        <div>
          <p className="text-sm font-semibold text-slate-950">{changes.length} {changes.length === 1 ? "change" : "changes"}</p>
          <div className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
            {(changes.length ? changes : ["Curriculum reviewed with no unsaved content changes"]).map((change) => (
              <p key={change} className="py-3 text-sm text-slate-700">{change}</p>
            ))}
          </div>
        </div>
      )}
    </ActionDialog>
  );
}
