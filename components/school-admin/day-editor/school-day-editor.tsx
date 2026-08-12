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
  backendApi,
  type PrimaryAIOperation,
  type PrimaryAIProposalRequest,
  type PrimaryCurriculumLesson,
  type PrimaryCurriculumStep,
  type PrimaryCurriculumTheme,
  type PrimaryResource,
  type PrimaryStepType,
} from "@/lib/api";
import { STEP_TYPE_OPTIONS, stepDetailFields, type StepDetailField } from "@/lib/primary-step-fields";
import { lessonIssues, levelLabel, monthLabel, resourceCount, stepIssues } from "@/lib/school-admin-curriculum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { SchoolAdminPage } from "@/components/school-admin/shared/page-primitives";
import { StatusBadge } from "@/components/school-admin/shared/status-badge";
import { ResourcePicker } from "@/components/school-admin/day-editor/resource-picker";
import { AIProposalDialog } from "@/components/school-admin/ai/ai-proposal-dialog";

type EditableStep = PrimaryCurriculumStep & { id: string };
type PickerTarget = { stepIndex: number; detail?: { key: string; multi: boolean } };

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function SchoolDayEditor({
  lessonId,
  academicYearId,
  themes,
  initialBlockId,
  onBack,
  onLessonChanged,
}: {
  lessonId: string;
  academicYearId: string;
  themes: PrimaryCurriculumTheme[];
  initialBlockId?: string | null;
  onBack: () => void;
  onLessonChanged: (lessonId: string) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [dailyFocus, setDailyFocus] = useState("");
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
    queryKey: ["school-admin", "lesson", lessonId],
    queryFn: () => backendApi.adminPrimaryLesson(lessonId),
  });
  const resourcesQuery = useQuery({
    queryKey: ["school-admin", "day-resource-titles"],
    queryFn: () => backendApi.adminResources({ page_size: 100 }),
  });

  useEffect(() => {
    if (!lessonQuery.data) return;
    const lesson = lessonQuery.data;
    setTitle(lesson.title ?? "");
    setDailyFocus(lesson.daily_focus ?? "");
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
  const readOnly = isMaster || isPublished;
  const theme = themes.find((item) => item.id === lesson?.theme_id || item.source_theme_id === lesson?.theme_id);
  const topics = theme?.topics ?? [];
  const duration = steps.reduce((sum, step) => sum + (step.duration_minutes || 0), 0);
  const localLesson = lesson ? ({ ...lesson, title, daily_focus: dailyFocus, topic_id: topicId || null, objectives, steps } as PrimaryCurriculumLesson) : null;
  const issues = localLesson ? lessonIssues(localLesson) : [];
  const resourceMap = useMemo(() => new Map((resourcesQuery.data?.items ?? []).map((resource) => [resource.id, resource])), [resourcesQuery.data]);

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
      const draft = await backendApi.adminCustomizePrimaryLesson(lesson.id, academicYearId);
      await queryClient.invalidateQueries({ queryKey: ["school-admin"] });
      onLessonChanged(draft.id);
      toast({ title: "School draft created", description: "TeachPad curriculum remains unchanged." });
    } catch (error: any) {
      toast({ title: "Could not customize this day", description: error?.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function createDraftFromPublished() {
    if (!lesson || lesson.status !== "published") return;
    setSaving(true);
    try {
      const draft = await backendApi.adminDuplicatePrimaryLesson(lesson.id);
      await queryClient.invalidateQueries({ queryKey: ["school-admin"] });
      onLessonChanged(draft.id);
      toast({ title: "New draft created", description: "The published version remains unchanged for teachers until you review and publish this draft." });
    } catch (error: any) {
      toast({ title: "Could not start a new draft", description: error?.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function saveDay(showToast = true) {
    if (!lesson || readOnly) return false;
    setSaving(true);
    try {
      await backendApi.adminUpdatePrimaryLesson(lesson.id, {
        title: title.trim() || null,
        daily_focus: dailyFocus.trim() || null,
        topic_id: topicId || null,
        objectives: objectives.filter((item) => item.trim()),
      });
      const updated = await backendApi.adminReplacePrimarySteps(lesson.id, steps.map((step, position) => ({
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
      queryClient.setQueryData(["school-admin", "lesson", lesson.id], updated);
      await queryClient.invalidateQueries({ queryKey: ["school-admin", "lessons"] });
      setSaved(true);
      if (showToast) toast({ title: "Teaching day saved" });
      return true;
    } catch (error: any) {
      toast({ title: "Could not save this day", description: error?.message, variant: "error" });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function publishDay() {
    if (!lesson || issues.length) return;
    const didSave = await saveDay(false);
    if (!didSave) return;
    setSaving(true);
    try {
      const published = await backendApi.adminPublishPrimaryLesson(lesson.id);
      queryClient.setQueryData(["school-admin", "lesson", lesson.id], published);
      await queryClient.invalidateQueries({ queryKey: ["school-admin", "lessons"] });
      setReviewOpen(false);
      toast({ title: "Published to teachers", description: "This school version is now available to your teachers." });
    } catch (error: any) {
      toast({ title: "Could not publish", description: error?.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  function attachResource(resource: PrimaryResource) {
    if (!pickerTarget) return;
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

  function openBlockAI(operation: PrimaryAIOperation, action: string, block: EditableStep) {
    if (!lesson) return;
    if (!saved) {
      toast({ title: "Save this day first", description: "AI proposals use the latest saved curriculum so they cannot overwrite unsaved edits.", variant: "error" });
      return;
    }
    setAITitle(action);
    setAIRequest({
      operation, academic_year_id: academicYearId, level: lesson.level,
      month: lesson.month, week: lesson.week, day: lesson.day,
      lesson_id: lesson.id, step_id: block.id, theme_id: lesson.theme_id,
      topic_id: lesson.topic_id,
    });
  }

  if (lessonQuery.isLoading) return <SchoolAdminPage><Skeleton className="h-28" /><Skeleton className="h-40" /><Skeleton className="h-[500px]" /></SchoolAdminPage>;
  if (lessonQuery.isError || !lesson || !localLesson) return <SchoolAdminPage><button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-blue-700"><ArrowLeft className="h-4 w-4" /> Back to curriculum</button><div className="rounded-2xl bg-rose-50 p-5 text-sm text-rose-800">This teaching day could not be loaded.</div></SchoolAdminPage>;

  const dayName = lesson.day ? DAY_NAMES[lesson.day - 1] : "Teaching day";
  const status = lesson.status === "published" ? "published" : issues.length ? "needs_attention" : "ready";

  return (
    <SchoolAdminPage className="max-w-[1180px]">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4" /> Back to {lesson.month ? monthLabel(lesson.month) : "month"} curriculum</button>

      <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2"><StatusBadge status={status} /><span className="text-xs font-semibold text-slate-500">{isMaster ? "TeachPad curriculum" : "Customized for your school"}</span></div>
          <p className="text-sm font-semibold text-slate-500">{dayName} · Week {lesson.week ?? "—"}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.025em] text-slate-950 sm:text-3xl">{title || dailyFocus || "Untitled teaching day"}</h1>
          <p className="mt-2 text-sm text-slate-500">{levelLabel(lesson.level)}{theme ? ` · ${theme.name}` : ""} · {saved ? "All changes saved" : "Unsaved changes"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPreviewOpen(true)}><Eye className="h-4 w-4" /> Preview</Button>
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

      <section className="grid gap-5 rounded-3xl bg-white p-5 shadow-[0_10px_34px_rgba(15,23,42,0.05)] sm:p-6 lg:grid-cols-[1fr_280px]">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Day summary</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">Topic<Input disabled={readOnly} value={title} onChange={(event) => { setTitle(event.target.value); markChanged(); }} className="mt-2" placeholder="What is this day about?" /></label>
            <label className="text-sm font-semibold text-slate-700">Curriculum topic<select disabled={readOnly} value={topicId} onChange={(event) => { setTopicId(event.target.value); markChanged(); }} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold"><option value="">No linked topic</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label>
          </div>
          <label className="mt-4 block text-sm font-semibold text-slate-700">Daily focus<Input disabled={readOnly} value={dailyFocus} onChange={(event) => { setDailyFocus(event.target.value); markChanged(); }} className="mt-2" placeholder="One clear focus for teachers" /></label>
          <div className="mt-5">
            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-700">Learning objectives</h3>{!readOnly ? <button type="button" onClick={() => { setObjectives((current) => [...current, ""]); markChanged(); }} className="text-xs font-bold text-blue-700">+ Add objective</button> : null}</div>
            <div className="mt-2 space-y-2">
              {objectives.map((objective, index) => <div key={index} className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-600" /><Input disabled={readOnly} value={objective} onChange={(event) => { setObjectives((current) => current.map((item, position) => position === index ? event.target.value : item)); markChanged(); }} /></div>)}
              {!objectives.length ? <p className="text-sm text-slate-500">No learning objectives yet.</p> : null}
            </div>
          </div>
        </div>
        <aside className="rounded-2xl bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-950">Day readiness</h3>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{steps.filter((step) => !stepIssues(step).length).length} / {steps.length || 0}</p>
          <p className="text-xs text-slate-500">blocks complete · {duration} minutes total</p>
          <div className="mt-4 space-y-2">
            {issues.slice(0, 4).map((issue, index) => <button key={`${issue}-${index}`} type="button" onClick={() => { const blockIndex = steps.findIndex((step) => issue.includes(step.title)); if (blockIndex >= 0) setExpandedStep(blockIndex); }} className="flex w-full items-start gap-2 text-left text-xs font-medium text-rose-700"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{issue}</button>)}
            {!issues.length ? <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><Check className="h-4 w-4" /> Ready to review</p> : null}
          </div>
        </aside>
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
              onToggle={() => setExpandedStep(expandedStep === index ? null : index)}
              onUpdate={(patch) => updateStep(index, patch)}
              onMove={(direction) => moveStep(index, direction)}
              onRemove={() => { setSteps((current) => current.filter((_, position) => position !== index).map((item, position) => ({ ...item, position }))); setExpandedStep(null); markChanged(); }}
              onResource={(detail) => setPickerTarget({ stepIndex: index, detail })}
              onAI={(operation, action) => openBlockAI(operation, action, step)}
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

      {pickerTarget ? <ResourcePicker blockType={steps[pickerTarget.stepIndex]?.step_type ?? ""} selectedIds={allResourceIds(steps[pickerTarget.stepIndex])} onSelect={attachResource} onClose={() => setPickerTarget(null)} /> : null}
      {previewOpen ? <DayPreview lesson={localLesson} resourceMap={resourceMap} onClose={() => setPreviewOpen(false)} /> : null}
      {reviewOpen ? <PublishReview lesson={localLesson} initial={initialSnapshot.current} issues={issues} saving={saving} onClose={() => setReviewOpen(false)} onPublish={() => void publishDay()} /> : null}
      <AIProposalDialog
        open={Boolean(aiRequest)}
        onOpenChange={(open) => { if (!open) setAIRequest(null); }}
        request={aiRequest}
        title={aiTitle}
        onApplied={async (draftLessonIds) => {
          await queryClient.invalidateQueries({ queryKey: ["school-admin"] });
          const draftId = draftLessonIds[0];
          if (draftId && draftId !== lesson.id) onLessonChanged(draftId);
          else await lessonQuery.refetch();
          toast({ title: "AI suggestion applied to a school draft", description: "Teachers still see the current published version." });
        }}
      />
    </SchoolAdminPage>
  );
}

function BlockCard({ step, index, objectives, expanded, readOnly, resourceMap, onToggle, onUpdate, onMove, onRemove, onResource, onAI, first, last }: {
  step: EditableStep;
  index: number;
  objectives: string[];
  expanded: boolean;
  readOnly: boolean;
  resourceMap: Map<string, PrimaryResource>;
  onToggle: () => void;
  onUpdate: (patch: Partial<EditableStep>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  onResource: (detail?: { key: string; multi: boolean }) => void;
  onAI: (operation: PrimaryAIOperation, action: string) => void;
  first: boolean;
  last: boolean;
}) {
  const blockIssues = stepIssues(step);
  const resources = step.resource_ids ?? [];
  const detailFields = stepDetailFields(step.step_type);
  return (
    <article className={`overflow-hidden rounded-2xl border bg-white transition ${expanded ? "border-blue-300 shadow-[0_12px_38px_rgba(37,99,235,0.08)]" : "border-slate-200"}`}>
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 p-4 text-left sm:p-5" aria-expanded={expanded}>
        <GripVertical className="hidden h-5 w-5 shrink-0 text-slate-300 sm:block" aria-hidden="true" />
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
                <div className="mt-3 space-y-2">{objectives.map((objective, objectiveIndex) => <label key={objectiveIndex} className="flex items-start gap-2 text-sm text-slate-700"><input disabled={readOnly} type="checkbox" checked={(step.objective_indexes ?? []).includes(objectiveIndex)} onChange={(event) => onUpdate({ objective_indexes: event.target.checked ? [...(step.objective_indexes ?? []), objectiveIndex] : (step.objective_indexes ?? []).filter((value) => value !== objectiveIndex) })} className="mt-0.5 h-4 w-4 rounded border-slate-300" />{objective}</label>)}{!objectives.length ? <p className="text-xs text-slate-500">Add objectives in the Day summary first.</p> : null}</div>
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

function DayPreview({ lesson, resourceMap, onClose }: { lesson: PrimaryCurriculumLesson; resourceMap: Map<string, PrimaryResource>; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="day-preview-title"><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl sm:p-7"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">Teacher preview</p><h2 id="day-preview-title" className="mt-1 text-xl font-semibold text-slate-950">{lesson.title || lesson.daily_focus}</h2><p className="mt-1 text-sm text-slate-500">{levelLabel(lesson.level)} · {lesson.steps.length} blocks · {lesson.steps.reduce((sum, step) => sum + step.duration_minutes, 0)} minutes</p></div><button type="button" aria-label="Close preview" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="mt-6 space-y-4">{lesson.steps.map((step, index) => <div key={step.id} className="border-l-2 border-blue-200 pl-4"><p className="text-xs font-bold text-slate-400">{index + 1} · {step.duration_minutes} min</p><h3 className="mt-1 font-semibold text-slate-950">{step.title}</h3><ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-slate-600">{step.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol>{step.resource_ids?.length ? <p className="mt-2 text-xs font-semibold text-blue-700">{step.resource_ids.map((id) => resourceMap.get(id)?.title ?? "Attached resource").join(" · ")}</p> : null}</div>)}</div></div></div>;
}

function PublishReview({ lesson, initial, issues, saving, onClose, onPublish }: { lesson: PrimaryCurriculumLesson; initial: PrimaryCurriculumLesson | null; issues: string[]; saving: boolean; onClose: () => void; onPublish: () => void }) {
  const changes: string[] = [];
  if (!initial || initial.title !== lesson.title || initial.daily_focus !== lesson.daily_focus) changes.push("Day topic or focus updated");
  if (!initial || JSON.stringify(initial.objectives) !== JSON.stringify(lesson.objectives)) changes.push("Learning objectives updated");
  lesson.steps.forEach((step, index) => { const before = initial?.steps[index]; if (!before) changes.push(`${step.title} added`); else if (JSON.stringify(before.instructions) !== JSON.stringify(step.instructions)) changes.push(`${step.title}: teacher instructions updated`); });
  if (!initial || resourceCount(initial) !== resourceCount(lesson)) changes.push(`${resourceCount(lesson)} resources now attached`);
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="publish-review-title"><div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">Safe publishing</p><h2 id="publish-review-title" className="mt-1 text-xl font-semibold text-slate-950">Review changes</h2><p className="mt-2 text-sm text-slate-600">Teachers will receive this school version only after you confirm.</p></div><button type="button" aria-label="Close publish review" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100"><X className="h-5 w-5" /></button></div>{issues.length ? <div className="mt-6 rounded-2xl bg-rose-50 p-4"><p className="text-sm font-semibold text-rose-800">Finish these items before publishing</p><ul className="mt-2 space-y-1 text-sm text-rose-700">{issues.map((issue) => <li key={issue}>• {issue}</li>)}</ul></div> : <div className="mt-6"><p className="text-sm font-semibold text-slate-950">{changes.length} {changes.length === 1 ? "change" : "changes"}</p><div className="mt-3 divide-y divide-slate-200 border-y border-slate-200">{(changes.length ? changes : ["Curriculum reviewed with no unsaved content changes"]).map((change) => <p key={change} className="py-3 text-sm text-slate-700">{change}</p>)}</div></div>}<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="outline" onClick={onClose}>Continue editing</Button><Button disabled={Boolean(issues.length) || saving} onClick={onPublish}>{saving ? "Publishing…" : "Publish to teachers"}</Button></div></div></div>;
}
