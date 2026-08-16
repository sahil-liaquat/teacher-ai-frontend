"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Link2, Loader2, Paperclip, RefreshCw, Save, Search, Sparkles, X } from "lucide-react";
import { backendApi } from "@/lib/api";
import type { PrimaryCurriculumLesson, PrimaryResource } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { LEVEL_OPTIONS } from "./theme-list";
import { RESOURCE_CATEGORY_OPTIONS } from "./resource-panel";
import { cn } from "@/lib/utils";
import { WEEK_ROWS, authoringDays, weekdayAbbr } from "@/lib/primary-teaching-week";

const MONTH_OPTIONS = [
  { value: 6, label: "June" }, { value: 7, label: "July" }, { value: 8, label: "August" },
  { value: 9, label: "September" }, { value: 10, label: "October" }, { value: 11, label: "November" },
  { value: 12, label: "December" }, { value: 1, label: "January" }, { value: 2, label: "February" },
  { value: 3, label: "March" }, { value: 4, label: "April" }, { value: 5, label: "May" }
];

type StepDraft = {
  id?: string;
  position: number;
  step_type: string;
  title: string;
  instructions: string[];
  duration_minutes: number;
  objective_indexes: number[];
  resource_category?: string | null;
  resource_ids: string[];
  child_action?: string[] | null;
  observation_point?: string | null;
  transition?: string | null;
  required_resource_ids?: string[] | null;
  optional_resource_ids?: string[] | null;
};

function lessonStatusLabel(lesson: PrimaryCurriculumLesson | undefined) {
  if (!lesson) return { label: "Empty", dot: "bg-slate-200 border border-dashed border-slate-300", text: "text-slate-400" };
  const hasMissing = lesson.steps?.some((s) => s.resource_category && (!s.resource_ids || s.resource_ids.length === 0));
  if (lesson.status === "published") return { label: "Published", dot: "bg-emerald-500", text: "text-emerald-600" };
  if (hasMissing) return { label: "Missing Resource", dot: "bg-rose-500", text: "text-rose-600" };
  return { label: "Draft", dot: "bg-amber-500", text: "text-amber-600" };
}

// TeachPad's own master curriculum is authored Monday–Friday, and this panel
// has no academic year in scope to ask. Reading the shape through the shared
// helper rather than inlining `[1,2,3,4,5]` keeps this surface honest about
// WHY it is five wide — it is the default, not a rule — and gives it the right
// answer for free if the master week ever changes.
const MASTER_DAYS = authoringDays(null);
const MASTER_WEEKS = Array.from({ length: WEEK_ROWS }, (_, index) => index + 1);

export function ResourceMappingPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [level, setLevel] = useState<string>("lkg");
  const [month, setMonth] = useState<number>(8);
  const [week, setWeek] = useState<number>(1);
  const [day, setDay] = useState<number>(1);
  const [lessonId, setLessonId] = useState<string>("");

  const [steps, setSteps] = useState<StepDraft[]>([]);
  const [lessonTitle, setLessonTitle] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Picker state
  const [pickerStep, setPickerStep] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  // Lesson list for the selected level
  const { data: lessons = [], isLoading: loadingLessons } = useQuery<PrimaryCurriculumLesson[]>({
    queryKey: ["admin-primary-lessons", level],
    queryFn: () => backendApi.adminPrimaryLessons({ level }),
    enabled: !!level,
  });

  const monthLessons = lessons.filter((l) => l.month === month && l.status !== "archived");

  // Fresh lesson detail when a day is selected
  useEffect(() => {
    if (!lessonId) {
      setSteps([]);
      setLessonTitle("");
      setDirty(false);
      return;
    }
    let cancelled = false;
    backendApi.adminPrimaryLesson(lessonId)
      .then((lesson) => {
        if (cancelled) return;
        setLessonTitle(lesson.title || `Day ${lesson.day} Lesson`);
        setSteps((lesson.steps || []).map((s) => ({
          id: s.id,
          position: s.position,
          step_type: s.step_type,
          title: s.title,
          instructions: s.instructions || [],
          duration_minutes: s.duration_minutes || 10,
          objective_indexes: s.objective_indexes || [],
          resource_category: s.resource_category || null,
          resource_ids: s.resource_ids || [],
          child_action: s.child_action || [],
          observation_point: s.observation_point || null,
          transition: s.transition || null,
          required_resource_ids: s.required_resource_ids || [],
          optional_resource_ids: s.optional_resource_ids || [],
        })).sort((a, b) => a.position - b.position));
        setDirty(false);
      })
      .catch((err) => {
        if (!cancelled) toast({ title: "Failed to load lesson", description: err.message, variant: "error" });
      });
    return () => { cancelled = true; };
  }, [lessonId, toast]);

  // Auto-select the day's lesson when day/week/month changes
  function selectLesson(id: string) {
    if (dirty && !window.confirm("You have unsaved mapping changes. Discard them and switch day?")) return;
    setPickerStep(null);
    setLessonId(id);
  }

  useEffect(() => {
    const found = monthLessons.find((l) => l.week === week && l.day === day);
    if (found && found.id !== lessonId) {
      setLessonId(found.id);
    } else if (!found && lessonId) {
      setLessonId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthLessons, week, day]);

  // Catalog picker query — level filter uses the catalog's display string
  const catalogLevelLabel = LEVEL_OPTIONS.find((o) => o.value === level)?.label;
  const { data: catalogData, isLoading: loadingCatalog } = useQuery({
    queryKey: ["admin-primary-resources", search, category, catalogLevelLabel],
    queryFn: () => backendApi.adminResources({
      search, category: category || undefined, level: catalogLevelLabel,
      page_size: 60,
    }),
    enabled: pickerStep !== null,
  });
  const catalog = catalogData?.items || [];

  function attachResource(resource: PrimaryResource) {
    if (pickerStep === null) return;
    const step = steps[pickerStep];
    if (!step) return;
    const attached = step.resource_ids || [];
    if (attached.includes(resource.id)) return;
    const next = steps.map((s, i) => i === pickerStep ? { ...s, resource_ids: [...attached, resource.id] } : s);
    setSteps(next);
    setDirty(true);
    toast({ title: "Resource attached", description: `"${resource.title}" added to "${step.title}".` });
  }

  function detachResource(stepIndex: number, resourceId: string) {
    const step = steps[stepIndex];
    const next = steps.map((s, i) => i === stepIndex ? { ...s, resource_ids: (step.resource_ids || []).filter((id) => id !== resourceId) } : s);
    setSteps(next);
    setDirty(true);
  }

  async function saveMapping() {
    if (!lessonId) return;
    setSaving(true);
    try {
      const payload = steps.map((s, idx) => ({
        position: idx,
        step_type: s.step_type,
        title: s.title.trim(),
        instructions: (s.instructions || []).map((line) => line.trim()).filter(Boolean),
        duration_minutes: s.duration_minutes,
        objective_indexes: s.objective_indexes || [],
        resource_category: s.resource_category || null,
        resource_ids: s.resource_ids || [],
        child_action: s.child_action || [],
        observation_point: s.observation_point || null,
        transition: s.transition || null,
        required_resource_ids: s.required_resource_ids || [],
        optional_resource_ids: s.optional_resource_ids || [],
      }));
      await backendApi.adminReplacePrimarySteps(lessonId, payload);
      setDirty(false);
      await queryClient.invalidateQueries({ queryKey: ["admin-primary-lessons", level] });
      toast({ title: "Resource mapping saved", description: `"${lessonTitle}" now uses ${steps.reduce((a, s) => a + (s.resource_ids?.length || 0), 0)} printable(s).` });
    } catch (err: any) {
      toast({ title: "Failed to save mapping", description: err.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  const stepPill = (step: StepDraft) => (
    <span className="text-[9px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full uppercase shrink-0">
      {step.step_type.replace("_", " ")}
    </span>
  );

  const resourceById = useMemo(() => {
    const map = new Map<string, PrimaryResource>();
    catalog.forEach((r) => map.set(r.id, r));
    return map;
  }, [catalog]);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_1fr_360px] xl:items-start">
      {/* Left: lesson picker */}
      <div className="border border-slate-100 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3 space-y-3">
          <h3 className="text-sm font-extrabold text-slate-800">1. Pick a teaching day</h3>
          <select
            value={level}
            onChange={(e) => { setLevel(e.target.value); setWeek(1); setDay(1); }}
            className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
          >
            {LEVEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={month}
              onChange={(e) => { setMonth(Number(e.target.value)); setWeek(1); setDay(1); }}
              className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
            >
              {MONTH_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select
              value={week}
              onChange={(e) => { setWeek(Number(e.target.value)); setDay(1); }}
              className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
            >
              {MASTER_WEEKS.map((w) => <option key={w} value={w}>Week {w}</option>)}
            </select>
          </div>
        </div>

        <div className="p-3 space-y-2 max-h-[560px] overflow-y-auto">
          {loadingLessons ? <div className="py-8 text-center text-xs text-slate-400"><Loader2 className="mx-auto h-5 w-5 animate-spin" />Loading lessons...</div> : null}
          {MASTER_DAYS.map((d) => {
            const lesson = monthLessons.find((l) => l.week === week && l.day === d);
            const status = lessonStatusLabel(lesson);
            const active = lesson?.id === lessonId;
            return (
              <button
                key={d}
                type="button"
                disabled={!lesson}
                onClick={() => lesson && selectLesson(lesson.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition",
                  active ? "border-blue-400 bg-blue-50" : lesson ? "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40" : "border-dashed border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
                )}
              >
                <span className="w-10 shrink-0 text-[10px] font-black text-slate-400">{weekdayAbbr(d)}</span>
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", status.dot)} />
                <span className="min-w-0 flex-1">
                  <span className={cn("block truncate text-xs font-bold", lesson ? "text-slate-800" : status.text)}>
                    {lesson ? (lesson.title || `Day ${d} Lesson`) : "Empty slot"}
                  </span>
                  {lesson && (
                    <span className={cn("block text-[10px] font-bold", status.text)}>{status.label} · {lesson.steps?.length || 0} steps</span>
                  )}
                </span>
              </button>
            );
          })}
          {!loadingLessons && monthLessons.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-[11px] text-slate-400">
              No lessons for this class & month yet. Design the curriculum in Step 2 first.
            </p>
          )}
        </div>
      </div>

      {/* Middle: steps of selected lesson */}
      <div className="border border-slate-100 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-slate-800 truncate">
              {lessonId ? (lessonTitle || "Teaching Day") : "2. No day selected"}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {lessonId ? `${LEVEL_OPTIONS.find((o) => o.value === level)?.label} · ${MONTH_OPTIONS.find((m) => m.value === month)?.label} · Week ${week} · Day ${day}` : "Choose a day on the left to attach printables to its steps."}
            </p>
          </div>
          {lessonId && (
            <div className="flex items-center gap-2 shrink-0">
              {dirty ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-2 py-1">
                  Unsaved changes
                </span>
              ) : null}
              <Button size="sm" onClick={saveMapping} disabled={!lessonId || !dirty || saving} className="rounded-xl font-bold text-xs">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save mapping
              </Button>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4 max-h-[620px] overflow-y-auto">
          {!lessonId ? (
            <div className="py-14 text-center">
              <Link2 className="mx-auto h-10 w-10 text-slate-200" />
              <p className="mt-3 text-sm font-bold text-slate-600">Pick a teaching day</p>
              <p className="mt-1 text-xs text-slate-400">Its classroom steps will appear here, ready for printables.</p>
            </div>
          ) : null}

          {lessonId && steps.length === 0 ? (
            <div className="py-14 text-center">
              <Sparkles className="mx-auto h-10 w-10 text-slate-200" />
              <p className="mt-3 text-sm font-bold text-slate-600">This day has no steps yet</p>
              <p className="mt-1 text-xs text-slate-400">Open the day in Step 2 (Curriculum) and add classroom activities first.</p>
            </div>
          ) : null}

          {steps.map((step, idx) => (
            <div key={step.id ?? `step-${idx}`} className="rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-teachpad-blue">{idx + 1}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-slate-800">{step.title}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      {stepPill(step)}
                      <span className="text-[10px] font-bold text-slate-400">{step.duration_minutes}m</span>
                      {step.resource_category ? <span className="text-[10px] font-bold text-violet-500">{step.resource_category}</span> : null}
                    </span>
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={pickerStep === idx ? "default" : "outline"}
                  onClick={() => { setPickerStep(pickerStep === idx ? null : idx); setSearch(""); setCategory(step.resource_category || ""); }}
                  className="rounded-xl font-bold text-xs shrink-0"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  {pickerStep === idx ? "Close picker" : "Attach"}
                </Button>
              </div>

              {/* Attached resources */}
              <div className="flex flex-wrap gap-2">
                {(step.resource_ids || []).map((rid) => {
                  const res = resourceById.get(rid);
                  return (
                    <span key={rid} className="flex items-center gap-1.5 bg-slate-50 border rounded-lg pl-2 pr-1 py-1 text-[10px]">
                      <span className="font-bold text-slate-700 truncate max-w-[180px]">{res ? res.title : rid}</span>
                      <button
                        type="button"
                        onClick={() => detachResource(idx, rid)}
                        className="text-slate-400 hover:text-rose-600 rounded p-0.5"
                        title="Detach resource"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
                {(!step.resource_ids || step.resource_ids.length === 0) && (
                  <span className="text-[10px] text-slate-400 italic">
                    {step.resource_category ? `No printable attached for "${step.resource_category}".` : "No printable category set — edit the step in the day editor first."}
                  </span>
                )}
              </div>

              {/* Inline catalog picker */}
              {pickerStep === idx && (
                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search printables..."
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="">All categories</option>
                      {RESOURCE_CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {loadingCatalog ? (
                    <div className="py-6 text-center text-xs text-slate-400"><Loader2 className="mx-auto h-5 w-5 animate-spin" />Loading catalog...</div>
                  ) : (
                    <div className="grid gap-2 max-h-64 overflow-y-auto pr-1 sm:grid-cols-2">
                      {catalog.map((res) => {
                        const attached = (step.resource_ids || []).includes(res.id);
                        return (
                          <button
                            key={res.id}
                            type="button"
                            onClick={() => attachResource(res)}
                            className={cn(
                              "flex items-center gap-2.5 rounded-xl border p-2 text-left transition",
                              attached ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                            )}
                          >
                            <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-100 overflow-hidden">
                              {(res.thumbnail_url || res.file_url) ? (
                                <img src={res.thumbnail_url || res.file_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                              ) : (
                                <div className="grid h-full w-full place-items-center text-[8px] text-slate-300 font-black">{res.file_type.toUpperCase()}</div>
                              )}
                            </div>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[11px] font-bold text-slate-800">{res.title}</span>
                              <span className="block text-[9px] text-slate-400 truncate">{res.category}</span>
                            </span>
                            {attached ? <Check className="h-4 w-4 shrink-0 text-emerald-500" /> : null}
                          </button>
                        );
                      })}
                      {catalog.length === 0 && (
                        <p className="col-span-full py-6 text-center text-xs text-slate-400">No printables match. Try another search or category.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right: quick guide */}
      <div className="border border-slate-100 bg-gradient-to-b from-blue-50/60 to-white rounded-2xl shadow-sm p-5 space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-800">How mapping works</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">Attach catalog printables to each classroom step. Teachers see them on the day&apos;s plan and can open them in one tap.</p>
        </div>
        <ol className="space-y-3 text-xs text-slate-600">
          {[
            "1. Pick the class, month, week and teaching day on the left.",
            "2. Click Attach on any step to open the printable catalog.",
            "3. Tap a printable to attach it (tap again from the step chip to remove).",
            "4. Hit Save mapping — changes go live for teachers immediately."
          ].map((line) => (
            <li key={line} className="flex items-start gap-2 leading-relaxed">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
              {line}
            </li>
          ))}
        </ol>
        {lessonId && steps.length > 0 ? (
          <div className="rounded-xl border border-blue-100 bg-white p-3 text-xs space-y-1.5">
            <div className="flex justify-between"><span className="text-slate-400 font-bold">Steps with picker</span><span className="font-black text-slate-700">{steps.length}</span></div>
            <div className="flex justify-between"><span className="text-slate-400 font-bold">Attached printables</span><span className="font-black text-slate-700">{steps.reduce((a, s) => a + (s.resource_ids?.length || 0), 0)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400 font-bold">Missing printables</span><span className="font-black text-rose-600">{steps.filter((s) => s.resource_category && (!s.resource_ids || s.resource_ids.length === 0)).length}</span></div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => { setDirty(false); setLessonId(""); setSteps([]); }}
          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-600"
        >
          <RefreshCw className="h-3 w-3" /> Start over
        </button>
      </div>
    </div>
  );
}
