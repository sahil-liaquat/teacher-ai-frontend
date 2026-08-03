"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { backendApi, type PrimaryPlannerActivity } from "@/lib/api";
import { usePrimaryTeachingContext, type PrimaryTeachingContext } from "@/lib/primary-teaching-context";
import { usePrimarySection } from "@/lib/use-primary-section";
import { themesForSubject, subjectsForClass, PRIMARY_LEVELS } from "@/lib/primary-theme-content";
import { buildGeneratePayload, PRIMARY_LEVEL_TO_API } from "@/lib/primary-context-helpers";
import { getErrorMessage } from "@/lib/errors";
import { adaptApiResource } from "@/lib/primary-resource-adapter";
import ActivityDrawer from "./activity_drawer";
import { cn } from "@/lib/utils";

const toLocalISODate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const parseLocalISODate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
};
const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const ACTIVITY_TYPES_CONFIG: Record<
  string,
  { label: string; dotBg: string; iconBg: string; badgeBg: string; badgeText: string; badgeBorder: string; emoji: string }
> = {
  routine: { label: "Routine", dotBg: "bg-emerald-500", iconBg: "bg-emerald-50 border border-emerald-100/50", badgeBg: "bg-emerald-50/50", badgeText: "text-emerald-700", badgeBorder: "border-emerald-200/50", emoji: "🎒" },
  rhyme: { label: "Rhyme", dotBg: "bg-blue-500", iconBg: "bg-blue-50 border border-blue-100/50", badgeBg: "bg-blue-50/50", badgeText: "text-blue-700", badgeBorder: "border-blue-200/50", emoji: "🎵" },
  "core activity": { label: "Core Activity", dotBg: "bg-amber-500", iconBg: "bg-amber-50 border border-amber-100/50", badgeBg: "bg-amber-50/50", badgeText: "text-amber-700", badgeBorder: "border-amber-200/50", emoji: "🍎" },
  movement: { label: "Movement", dotBg: "bg-violet-500", iconBg: "bg-violet-50 border border-violet-100/50", badgeBg: "bg-violet-50/50", badgeText: "text-violet-700", badgeBorder: "border-violet-200/50", emoji: "🏃" },
  practice: { label: "Practice", dotBg: "bg-emerald-500", iconBg: "bg-emerald-50 border border-emerald-100/50", badgeBg: "bg-emerald-50/50", badgeText: "text-emerald-700", badgeBorder: "border-emerald-200/50", emoji: "✏️" },
  story: { label: "Story", dotBg: "bg-pink-500", iconBg: "bg-pink-50 border border-pink-100/50", badgeBg: "bg-pink-50/50", badgeText: "text-pink-700", badgeBorder: "border-pink-200/50", emoji: "📖" },
  reflection: { label: "Reflection", dotBg: "bg-indigo-500", iconBg: "bg-indigo-50 border border-indigo-100/50", badgeBg: "bg-indigo-50/50", badgeText: "text-indigo-700", badgeBorder: "border-indigo-200/50", emoji: "✨" },
};

function getActivityConfig(type: string) {
  const clean = type.toLowerCase();
  if (clean.includes("routine") || clean.includes("welcome")) return ACTIVITY_TYPES_CONFIG.routine;
  if (clean.includes("rhyme") || clean.includes("song")) return ACTIVITY_TYPES_CONFIG.rhyme;
  if (clean.includes("core") || clean.includes("teach") || clean.includes("explore")) return ACTIVITY_TYPES_CONFIG["core activity"];
  if (clean.includes("move") || clean.includes("break") || clean.includes("play")) return ACTIVITY_TYPES_CONFIG.movement;
  if (clean.includes("practice") || clean.includes("worksheet")) return ACTIVITY_TYPES_CONFIG.practice;
  if (clean.includes("story")) return ACTIVITY_TYPES_CONFIG.story;
  if (clean.includes("reflection") || clean.includes("wrap")) return ACTIVITY_TYPES_CONFIG.reflection;
  return ACTIVITY_TYPES_CONFIG.routine;
}

export default function PrimaryTodayPage({ notify }: { notify: (s: string) => void }) {
  const queryClient = useQueryClient();
  const { context, updateContext, isLoading: contextLoading } = usePrimaryTeachingContext();

  const [selectedDate, setSelectedDate] = useState(() => toLocalISODate(new Date()));
  const [selectedActivity, setSelectedActivity] = useState<PrimaryPlannerActivity | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const attemptedRef = useRef<string | null>(null);

  const { sectionId, setSectionId } = usePrimarySection();
  const sections = useQuery({
    queryKey: ["primary-sections", false],
    queryFn: () => backendApi.primarySections(),
  });

  // A section that gets deleted (allowed once it has zero children/days)
  // leaves its id stranded in localStorage. Once the sections list has
  // loaded, if that id is no longer present, clear it — otherwise every
  // subsequent request scoped to it 404s with no picker on screen to recover
  // from (the picker only renders when there's at least one section).
  useEffect(() => {
    if (!sections.isSuccess) return;
    if (sectionId && !sections.data.some((section) => section.id === sectionId)) {
      setSectionId(null);
    }
  }, [sections.isSuccess, sections.data, sectionId, setSectionId]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["primary-today-workspace", selectedDate, sectionId],
    queryFn: () => backendApi.getTodayWorkspace(selectedDate, sectionId ?? undefined),
  });

  const plannerActivities = data?.planner_activities ?? [];
  const dayRecord = data?.day_record ?? null;
  const isToday = selectedDate === toLocalISODate(new Date());

  // Today's Plan selector — mirrors the Home page card so context can be changed here too.
  const [selLevel, setSelLevel] = useState<string>(context.level || "");
  const [selSubject, setSelSubject] = useState(context.subject || "");
  const [selTheme, setSelTheme] = useState(context.theme || "");
  const [savingContext, setSavingContext] = useState(false);

  useEffect(() => {
    setSelLevel(context.level || "");
    setSelSubject(context.subject || "");
    setSelTheme(context.theme || "");
  }, [context.level, context.subject, context.theme]);

  const subjectOptions = useMemo(() => (selLevel ? subjectsForClass(selLevel as any) : []), [selLevel]);
  const themeOptions = useMemo(() => (selSubject ? themesForSubject(selSubject) : []), [selSubject]);
  const canViewPlan = !!(selLevel && selSubject && selTheme);

  const handleLevelChange = (level: string) => {
    setSelLevel(level);
    setSelSubject("");
    setSelTheme("");
  };
  const handleSubjectChange = (subject: string) => {
    setSelSubject(subject);
    setSelTheme("");
  };

  const todayDateStr = useMemo(
    () => new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
    []
  );

  // The teacher's selected theme name resolved to its curriculum row. The
  // server matches on theme_id, so the picker's display string is not enough.
  const { data: themes = [] } = useQuery({
    queryKey: ["primary-curriculum-themes", context.level, context.subject],
    queryFn: () =>
      backendApi.primaryCurriculumThemes({
        level: PRIMARY_LEVEL_TO_API[context.level],
        subject: context.subject ?? undefined,
      }),
    enabled: !!context.level && !!context.subject,
  });

  const selectedThemeId = useMemo(
    () => themes.find((t) => t.name === context.theme)?.id ?? "",
    [themes, context.theme]
  );

  const runGenerate = async (
    overrideContext?: PrimaryTeachingContext,
    overrideDate?: string,
    replace = false
  ) => {
    const ctx = overrideContext ?? context;
    const date = overrideDate ?? selectedDate;

    // `themes`/`selectedThemeId` above are scoped to THIS render's
    // `context.level`/`context.subject`. When called with an overrideContext
    // (the quick-select "View full plan" path), `updateContext()` is async —
    // React hasn't necessarily re-rendered with the new context yet, so those
    // would still reflect the OLD level/subject. Looking a theme name up
    // against the wrong subject's theme list can resolve to a real theme id
    // for a DIFFERENT subject (the backend does not cross-validate
    // payload.subject against the resolved theme's actual subject), silently
    // generating a day with a mismatched subject/theme pairing. Fetch the
    // theme list freshly scoped to the actual ctx being generated for instead
    // of trusting render state — this is correct regardless of render timing.
    // Same queryKey/queryFn shape as the useQuery above, so when ctx matches
    // the current render it's just a cache hit, not an extra request.
    const themeId = overrideContext
      ? (
          await queryClient.fetchQuery({
            queryKey: ["primary-curriculum-themes", ctx.level, ctx.subject],
            queryFn: () =>
              backendApi.primaryCurriculumThemes({
                level: PRIMARY_LEVEL_TO_API[ctx.level],
                subject: ctx.subject ?? undefined,
              }),
          })
        ).find((t) => t.name === ctx.theme)?.id ?? ""
      : themes.find((t) => t.name === ctx.theme)?.id ?? selectedThemeId;

    const payload = buildGeneratePayload(ctx, themeId, date, replace);
    if (!payload) {
      setGenerateError("Pick a level, subject and theme before generating a plan.");
      return;
    }
    payload.section_id = sectionId;

    setGenerateError(null);
    setGenerating(true);
    try {
      // One atomic server call. It resolves the published lesson, upserts the
      // day, matches a printable per step and writes the activities in a single
      // transaction — which is why regenerating no longer duplicates a day.
      await backendApi.generatePrimaryToday(payload);
      notify("Plan ready ✨");
      await queryClient.invalidateQueries({
        queryKey: ["primary-today-workspace", date],
      });
    } catch (err) {
      console.error("Failed to generate plan:", err);
      setGenerateError(getErrorMessage(err, "We couldn't generate a plan. Try again or add an activity manually."));
    } finally {
      setGenerating(false);
    }
  };

  const handleViewFullPlan = async () => {
    if (!canViewPlan) return;
    setSavingContext(true);
    try {
      const resolvedContext: PrimaryTeachingContext = {
        ...context,
        level: selLevel as PrimaryTeachingContext["level"],
        subject: selSubject,
        theme: selTheme,
        topic: selTheme,
      };
      const todayDate = toLocalISODate(new Date());
      // Mark this combination as already attempted before updateContext re-renders the page,
      // so the auto-generate effect below doesn't race us with a second, concurrent generation.
      attemptedRef.current = `${todayDate}|${resolvedContext.level}|${resolvedContext.subject}|${resolvedContext.theme}`;
      await updateContext(resolvedContext);
      setSelectedDate(todayDate);
      await runGenerate(resolvedContext, todayDate);
    } finally {
      setSavingContext(false);
    }
  };

  // Arriving here from Home with an empty "today" builds the plan automatically,
  // so the full details show right away without an extra click.
  useEffect(() => {
    if (contextLoading || isLoading || generating || !isToday) return;
    if (plannerActivities.length > 0) return;
    const key = `${selectedDate}|${context.level}|${context.subject}|${context.theme}`;
    if (attemptedRef.current === key) return;
    attemptedRef.current = key;
    void runGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextLoading, isLoading, generating, isToday, plannerActivities.length, selectedDate, context.level, context.subject, context.theme]);

  const handlePrevDay = () => setSelectedDate(toLocalISODate(addDays(parseLocalISODate(selectedDate), -1)));
  const handleNextDay = () => setSelectedDate(toLocalISODate(addDays(parseLocalISODate(selectedDate), 1)));
  const handleGoToToday = () => setSelectedDate(toLocalISODate(new Date()));

  const formattedDate = useMemo(
    () => parseLocalISODate(selectedDate).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short", year: "numeric" }),
    [selectedDate]
  );

  const objectivesList = useMemo(() => {
    if (dayRecord?.objectives && dayRecord.objectives.length > 0) return dayRecord.objectives;
    return plannerActivities.map((activity) => activity.title).filter(Boolean).slice(0, 4);
  }, [dayRecord, plannerActivities]);

  const materialIds = useMemo(
    () => Array.from(new Set(plannerActivities.flatMap((activity) => activity.resource_ids))),
    [plannerActivities]
  );
  const materialResourceQueries = useQueries({
    queries: materialIds.map((id) => ({
      queryKey: ["primary-resource", id],
      queryFn: async () => {
        try {
          return adaptApiResource(await backendApi.primaryResource(id));
        } catch {
          return null;
        }
      },
      enabled: !(dayRecord?.materials && dayRecord.materials.length > 0),
      staleTime: 60_000,
      retry: 0,
    })),
  });
  const materialsList = useMemo(() => {
    if (dayRecord?.materials && dayRecord.materials.length > 0) return dayRecord.materials;
    return materialResourceQueries
      .map((q) => q.data?.title)
      .filter((title): title is string => Boolean(title))
      .slice(0, 4);
  }, [dayRecord, materialResourceQueries]);

  const overview = useMemo(() => {
    const titles = plannerActivities.map((activity) => activity.title).filter(Boolean).slice(0, 3);
    return titles.length > 0 ? `Today's plan includes ${titles.join(", ")}.` : "Generate a plan or add an activity to build today's schedule.";
  }, [plannerActivities]);

  const totalDuration = useMemo(() => plannerActivities.reduce((sum, act) => sum + (act.duration_minutes || 0), 0), [plannerActivities]);
  const completedCount = useMemo(
    () => plannerActivities.filter((activity) => activity.status === "completed" || activity.status === "skipped").length,
    [plannerActivities]
  );

  // Daily reflection & handover
  const [reflection, setReflection] = useState({ workedWell: "", needsSupport: "", continueTomorrow: "" });
  const [savingReflection, setSavingReflection] = useState(false);

  useEffect(() => {
    setReflection({
      workedWell: dayRecord?.reflection_json?.worked_well || "",
      needsSupport: dayRecord?.reflection_json?.needs_support || "",
      continueTomorrow: dayRecord?.reflection_json?.continue_tomorrow || "",
    });
  }, [selectedDate, dayRecord]);

  const handleSaveReflection = async () => {
    setSavingReflection(true);
    try {
      await backendApi.updateTodayDayRecord(
        selectedDate,
        {
          reflection_json: {
            worked_well: reflection.workedWell,
            needs_support: reflection.needsSupport,
            continue_tomorrow: reflection.continueTomorrow,
          },
        },
        sectionId ?? undefined,
      );
      notify("Daily reflection saved!");
      queryClient.invalidateQueries({ queryKey: ["primary-today-workspace", selectedDate] });
    } catch {
      notify("Failed to save reflection.");
    } finally {
      setSavingReflection(false);
    }
  };

  const showLoading = contextLoading || isLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-5">
        <h2 className="text-[28px] font-black tracking-tight text-[#1e1e4f]">Today's Plan</h2>
        <p className="text-[13px] font-semibold text-slate-400 mt-1">
          Your daily teaching plan at a glance. Stay prepared, teach with confidence! 🌟
        </p>
      </div>

      {/* Today's Plan selector card — same as Home */}
      <div className="rounded-[22px] border border-white/70 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.04)] ring-1 ring-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c5dff] to-[#5a39eb] text-white shadow-md shadow-indigo-100">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">TODAY'S PLAN</p>
              <p className="text-xs font-bold text-slate-400">{todayDateStr}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Class</label>
            <div className="relative">
              <select
                value={selLevel}
                onChange={(e) => handleLevelChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 pr-8 text-sm font-bold text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200 transition"
              >
                <option value="">Select class…</option>
                {PRIMARY_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="flex-1 space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Subject</label>
            <div className="relative">
              <select
                value={selSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                disabled={subjectOptions.length === 0}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 pr-8 text-sm font-bold text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200 transition disabled:opacity-50"
              >
                <option value="">{subjectOptions.length === 0 ? "Pick class first" : "Select subject…"}</option>
                {subjectOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="flex-1 space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Theme / Topic</label>
            <div className="relative">
              <select
                value={selTheme}
                onChange={(e) => setSelTheme(e.target.value)}
                disabled={themeOptions.length === 0}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 pr-8 text-sm font-bold text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200 transition disabled:opacity-50"
              >
                <option value="">{themeOptions.length === 0 ? "Pick subject first" : "Select theme…"}</option>
                {themeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <button
            onClick={() => void handleViewFullPlan()}
            disabled={!canViewPlan || savingContext}
            title={canViewPlan ? undefined : "Select a class, subject and theme first"}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#6e41f5] px-5 py-2.5 text-xs font-black text-white shadow-md shadow-violet-100 transition hover:bg-[#5b32d3] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {savingContext ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Opening…
              </>
            ) : (
              <>
                View full plan <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {(sections.data || []).length > 0 && (
        <label className="mt-4 block text-xs font-bold text-slate-600">
          Group
          <select
            value={sectionId || ""}
            onChange={(event) => setSectionId(event.target.value || null)}
            className="mt-1 block w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="">All children (no class)</option>
            {(sections.data || []).map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {/* Date navigation strip */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 p-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <button onClick={handlePrevDay} className="rounded-xl p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-sm transition" aria-label="Previous day">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={handleGoToToday} className="rounded-xl px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-sm transition">
            Today
          </button>
          <button onClick={handleNextDay} className="rounded-xl p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-sm transition" aria-label="Next day">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <b className="text-sm font-black text-slate-800">{formattedDate}</b>
        <div className="flex items-center gap-2">
          {plannerActivities.length > 0 && (
            <button
              onClick={() => void runGenerate(undefined, undefined, true)}
              disabled={generating}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#6e41f5] px-4 py-2 text-xs font-black text-white hover:bg-[#5b32d3] transition shadow-md shadow-violet-100 disabled:opacity-60"
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Regenerate
            </button>
          )}
        </div>
      </div>

      {showLoading ? (
        <div className="flex h-72 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        </div>
      ) : generating ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[22px] border border-dashed border-indigo-200 bg-indigo-50/30 p-14 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-bold text-indigo-700">
            Building today's plan for {context.level} • {context.subject} • {context.theme}…
          </p>
        </div>
      ) : plannerActivities.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/30 p-10 text-center">
          <p className="text-sm font-semibold text-slate-400">No activities planned for this day yet.</p>
          {generateError && <p className="mt-2 text-xs font-bold text-rose-600">{generateError}</p>}
          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => void runGenerate()}
              disabled={generating}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#6e41f5] px-4 py-2 text-xs font-black text-white disabled:opacity-60"
            >
              <Sparkles className="h-3.5 w-3.5" /> Generate plan
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[22px] border border-blue-100 bg-blue-50/20 p-5 shadow-sm">
              <span className="flex items-center gap-1.5 text-xs font-black text-blue-600">📖 Day Overview</span>
              <h4 className="mt-3 text-base font-black text-[#1e1e4f]">{context.theme || "Today's learning"}</h4>
              <p className="mt-2 text-xs font-semibold text-slate-400 leading-normal">{overview}</p>
            </div>

            <div className="rounded-[22px] border border-amber-100 bg-amber-50/10 p-5 shadow-sm">
              <span className="flex items-center gap-1.5 text-xs font-black text-amber-700">🎯 Learning Objectives</span>
              <div className="mt-3 space-y-2">
                {objectivesList.map((obj, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs font-semibold text-slate-700">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span>{obj}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-purple-100 bg-purple-50/10 p-5 shadow-sm">
              <span className="flex items-center gap-1.5 text-xs font-black text-purple-700">🧰 Materials</span>
              <ul className="mt-3 list-disc pl-4 space-y-1.5 text-xs font-semibold text-slate-700">
                {materialsList.length > 0 ? (
                  materialsList.map((mat, i) => <li key={i}>{mat}</li>)
                ) : (
                  <li>Add resources to activities to see materials here.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-lg font-black text-[#1e1e4f] flex items-center gap-1">
                Today's Journey <span className="text-[#6e41f5]">✨</span>
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-xs text-slate-400 font-semibold">
                  Total Time: <strong className="text-slate-800 font-extrabold">{totalDuration} min</strong>
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  Progress: <strong className="text-slate-800 font-extrabold">{completedCount}/{plannerActivities.length}</strong>
                </span>
                <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(completedCount / plannerActivities.length) * 100}%` }} />
                </div>
              </div>
            </div>

            <div className="relative space-y-2 border-l border-dashed border-slate-200 pl-5 sm:pl-7">
              {plannerActivities.map((act) => {
                const config = getActivityConfig(act.activity_type);
                return (
                  <div
                    key={act.id}
                    className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-transparent p-4 transition hover:bg-slate-50/50"
                  >
                    <span className={cn("absolute -left-[25px] top-6 h-2 w-2 rounded-full ring-4 ring-white shadow-xs", config.dotBg)} />

                    <div className="w-24 shrink-0">
                      <span className="block text-xs font-black text-slate-800">{act.start_time ? act.start_time.slice(0, 5) : "—"}</span>
                      <span className="block text-[10px] text-slate-400 font-bold mt-0.5">{act.duration_minutes || 10} min</span>
                    </div>

                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full text-base", config.iconBg)}>
                        <span>{config.emoji}</span>
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <h4 className="text-sm font-extrabold text-slate-900 truncate">{act.title}</h4>
                        <p className="text-xs text-slate-400 font-medium leading-normal line-clamp-1">
                          {act.notes || "No activity notes configured."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center">
                      <span className={cn("rounded-lg border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider", config.badgeBg, config.badgeText, config.badgeBorder)}>
                        {config.label}
                      </span>
                      {act.status === "completed" && (
                        <span className="inline-flex items-center rounded-lg bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Done
                        </span>
                      )}
                      {act.status === "partially completed" && (
                        <span className="inline-flex items-center rounded-lg bg-amber-50 border border-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-700 gap-1">
                          <AlertTriangle className="h-3 w-3" /> Partial
                        </span>
                      )}
                      {act.status === "skipped" && (
                        <span className="inline-flex items-center rounded-lg bg-rose-50 border border-rose-100 px-2 py-0.5 text-[9px] font-black text-rose-700 gap-1">
                          <XCircle className="h-3 w-3" /> Skipped
                        </span>
                      )}
                      <button
                        onClick={() => setSelectedActivity(act)}
                        className="rounded-xl border border-[#eeeeff] bg-white px-4 py-1.5 text-xs font-black text-[#6e41f5] hover:bg-[#6e41f5]/5 transition shadow-xs"
                      >
                        View Activity
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily reflection */}
          <div className="space-y-4 rounded-[22px] border border-slate-100 bg-slate-50/50 p-5 shadow-sm">
            <div>
              <h3 className="text-base font-black text-[#1e1e4f]">Daily Reflection & Handover</h3>
              <p className="text-xs font-semibold text-slate-400">Capture notes for tomorrow.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {(
                [
                  ["workedWell", "What worked well today?", "What engaged learners or went smoothly?"],
                  ["needsSupport", "What could improve?", "What needs a different approach next time?"],
                  ["continueTomorrow", "What should happen tomorrow?", "Capture follow-up, preparation, or support needed."],
                ] as const
              ).map(([field, label, placeholder]) => (
                <label key={field} className="space-y-1 text-xs font-black text-slate-700">
                  {label}
                  <textarea
                    value={reflection[field]}
                    onChange={(event) => setReflection((current) => ({ ...current, [field]: event.target.value }))}
                    placeholder={placeholder}
                    className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </label>
              ))}
            </div>
            <button
              onClick={handleSaveReflection}
              disabled={savingReflection}
              className="w-fit rounded-xl bg-[#6e41f5] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#5b32d3] disabled:opacity-50"
            >
              {savingReflection ? "Saving Reflection..." : "Save Daily Reflection"}
            </button>
          </div>
        </div>
      )}

      {selectedActivity && (
        <ActivityDrawer
          activity={selectedActivity}
          onClose={() => {
            setSelectedActivity(null);
            void refetch();
          }}
          notify={notify}
        />
      )}
    </div>
  );
}
