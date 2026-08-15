"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Copy,
  XCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  RefreshCw,
  Eye,
  Save,
} from "lucide-react";
import { primaryStepImage } from "@/lib/primary-step-images";
import { backendApi } from "@/lib/api";
import { usePrimaryTeachingContext, type PrimaryTeachingContext } from "@/lib/primary-teaching-context";
import { usePrimarySection } from "@/lib/use-primary-section";
import { PRIMARY_LEVELS } from "@/lib/primary-theme-content";
import { buildGeneratePayload, PRIMARY_LANGUAGES, PRIMARY_LEVEL_TO_API } from "@/lib/primary-context-helpers";
import { getErrorCode, getErrorMessage } from "@/lib/errors";
import { primaryTodayViewState } from "@/lib/primary-today-view-state";
import { schoolContextLabel, usePrimaryTeacherMode } from "@/lib/use-primary-teacher-mode";
import { authoredSections, provenanceLabel, stalenessNotice } from "@/lib/primary-day-content";
import { ReportIssueControl } from "./report-issue-control";
import { useUpgradeModal } from "@/components/billing/upgrade-modal";
import PrimaryPlanSetupModal, { type PrimaryPlanSetup } from "./primary-plan-setup-modal";
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

// The section-less day has no id, so it needs a stand-in value to be selectable
// in a <select> alongside real section ids.
const NO_SECTION = "__no_section__";

const ACTIVITY_TYPES_CONFIG: Record<
  string,
  {
    label: string;
    dotBg: string;
    iconBg: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    emoji: string;
    cardBg: string;
    cardBorder: string;
  }
> = {
  routine: {
    label: "Routine",
    dotBg: "bg-[#059669]",
    iconBg: "bg-[#dcfce7] text-[#047857]",
    badgeBg: "bg-[#dcfce7]",
    badgeText: "text-[#047857]",
    badgeBorder: "border-[#b4e6c4]",
    cardBg: "bg-[#fafcf9]",
    cardBorder: "border-[#e2f0e8] hover:border-[#c5e2d1] hover:bg-[#f5faf3]",
    emoji: "🎒",
  },
  rhyme: {
    label: "Rhyme",
    dotBg: "bg-[#2563eb]",
    iconBg: "bg-[#dbeafe] text-[#1d4ed8]",
    badgeBg: "bg-[#dbeafe]",
    badgeText: "text-[#1d4ed8]",
    badgeBorder: "border-[#a3c9ff]",
    cardBg: "bg-[#f6f9fe]",
    cardBorder: "border-[#dae7fc] hover:border-[#bcccf9] hover:bg-[#f0f5fc]",
    emoji: "🎵",
  },
  "core activity": {
    label: "Core Activity",
    dotBg: "bg-[#d97706]",
    iconBg: "bg-[#fef0cd] text-[#b45309]",
    badgeBg: "bg-[#fef0cd]",
    badgeText: "text-[#b45309]",
    badgeBorder: "border-[#f9da8d]",
    cardBg: "bg-[#fdfaf3]",
    cardBorder: "border-[#f5e6c4] hover:border-[#ebd29a] hover:bg-[#fcf7ec]",
    emoji: "🍎",
  },
  movement: {
    label: "Movement",
    dotBg: "bg-[#7c3aed]",
    iconBg: "bg-[#ede9fe] text-[#6d28d9]",
    badgeBg: "bg-[#ede9fe]",
    badgeText: "text-[#6d28d9]",
    badgeBorder: "border-[#cbbeff]",
    cardBg: "bg-[#faf8fd]",
    cardBorder: "border-[#ebdfff] hover:border-[#dbcafe] hover:bg-[#f7f3fc]",
    emoji: "🏃",
  },
  practice: {
    label: "Practice",
    dotBg: "bg-[#0d9488]",
    iconBg: "bg-[#ccfbf1] text-[#0f766e]",
    badgeBg: "bg-[#ccfbf1]",
    badgeText: "text-[#0f766e]",
    badgeBorder: "border-[#9be6df]",
    cardBg: "bg-[#f5f9fa]",
    cardBorder: "border-[#d5ecf0] hover:border-[#b8dee4] hover:bg-[#edf5f7]",
    emoji: "✏️",
  },
  story: {
    label: "Story",
    dotBg: "bg-[#db2777]",
    iconBg: "bg-[#fce7f3] text-[#be185d]",
    badgeBg: "bg-[#fce7f3]",
    badgeText: "text-[#be185d]",
    badgeBorder: "border-[#ffb7d5]",
    cardBg: "bg-[#fcf7fb]",
    cardBorder: "border-[#fbe0f0] hover:border-[#f8c5e3] hover:bg-[#faf0f7]",
    emoji: "📖",
  },
  reflection: {
    label: "Reflection",
    dotBg: "bg-[#4f46e5]",
    iconBg: "bg-[#e0e7ff] text-[#4338ca]",
    badgeBg: "bg-[#e0e7ff]",
    badgeText: "text-[#4338ca]",
    badgeBorder: "border-[#c7d2fe]",
    cardBg: "bg-[#f8f9ff]",
    cardBorder: "border-[#e0e3ff] hover:border-[#c5ccff] hover:bg-[#f2f4ff]",
    emoji: "✨",
  },
};

const TIMELINE_THEMES = [
  {
    cardBg: "bg-white",
    cardBorder: "border-[#ecebf7] hover:border-[#f97316]/40",
    dotBg: "bg-orange-500",
    badgeText: "text-orange-600",
    badgeBg: "bg-orange-50",
    badgeBorder: "border-orange-200",
  },
  {
    cardBg: "bg-white",
    cardBorder: "border-[#ecebf7] hover:border-[#8b5cf6]/40",
    dotBg: "bg-purple-500",
    badgeText: "text-purple-600",
    badgeBg: "bg-purple-50",
    badgeBorder: "border-purple-200",
  },
  {
    cardBg: "bg-white",
    cardBorder: "border-[#ecebf7] hover:border-[#10b981]/40",
    dotBg: "bg-emerald-500",
    badgeText: "text-emerald-600",
    badgeBg: "bg-emerald-50",
    badgeBorder: "border-emerald-200",
  },
  {
    cardBg: "bg-white",
    cardBorder: "border-[#ecebf7] hover:border-[#f43f5e]/40",
    dotBg: "bg-rose-500",
    badgeText: "text-rose-600",
    badgeBg: "bg-rose-50",
    badgeBorder: "border-rose-200",
  },
  {
    cardBg: "bg-white",
    cardBorder: "border-[#ecebf7] hover:border-[#3b82f6]/40",
    dotBg: "bg-blue-500",
    badgeText: "text-blue-600",
    badgeBg: "bg-blue-50",
    badgeBorder: "border-blue-200",
  },
  {
    cardBg: "bg-white",
    cardBorder: "border-[#ecebf7] hover:border-[#d946ef]/40",
    dotBg: "bg-fuchsia-500",
    badgeText: "text-fuchsia-600",
    badgeBg: "bg-fuchsia-50",
    badgeBorder: "border-fuchsia-200",
  },
  {
    cardBg: "bg-white",
    cardBorder: "border-[#ecebf7] hover:border-[#d97706]/40",
    dotBg: "bg-amber-500",
    badgeText: "text-amber-700",
    badgeBg: "bg-amber-50",
    badgeBorder: "border-amber-200",
  },
  {
    cardBg: "bg-white",
    cardBorder: "border-[#ecebf7] hover:border-[#14b8a6]/40",
    dotBg: "bg-teal-500",
    badgeText: "text-teal-600",
    badgeBg: "bg-teal-50",
    badgeBorder: "border-teal-200",
  },
];

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
  const searchParams = useSearchParams();
  const { context, updateContext, isLoading: contextLoading } = usePrimaryTeachingContext();
  const { openUpgrade } = useUpgradeModal();

  const [selectedDate, setSelectedDate] = useState(() => searchParams.get("date") || toLocalISODate(new Date()));
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  // "" = nothing picked yet; NO_SECTION = the section-less day.
  const [copyFrom, setCopyFrom] = useState("");
  const [copying, setCopying] = useState(false);

  const { sectionId, setSectionId, hasChosen } = usePrimarySection();
  // ⚠ The one source of truth for who this teacher is. Resolving also bridges
  // each school assignment to a PrimarySection, which is why the sections query
  // below is invalidated once it lands — otherwise an org teacher's classes
  // would not appear until the next page load.
  const teacherMode = usePrimaryTeacherMode();
  const sections = useQuery({
    queryKey: ["primary-sections", false],
    queryFn: () => backendApi.primarySections(),
  });

  // An organization teacher's classes are materialised by the context resolver,
  // so the section list has to be re-read once it reports assignments. Keyed on
  // the assignment ids so this fires once per real change, not every render.
  const bridgedSectionKey = teacherMode.assignedSectionIds.join(",");
  const activeAssignment = teacherMode.assignments.find(
    (item) => item.primary_section_id === sectionId,
  ) ?? null;
  const schoolLine = schoolContextLabel(teacherMode.context, activeAssignment);
  useEffect(() => {
    if (!bridgedSectionKey) return;
    void queryClient.invalidateQueries({ queryKey: ["primary-sections"] });
  }, [bridgedSectionKey, queryClient]);

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

  // A teacher who has built a roster expects to be planning for one of their
  // classes. Landing on the section-less day instead gives them two places to
  // plan with no sign which is which — they plan in one, open their real class,
  // and find it empty. Default to the first class; `hasChosen` keeps this from
  // overriding anyone who deliberately picked "All children".
  useEffect(() => {
    if (!sections.isSuccess || hasChosen || sectionId) return;
    const first = sections.data.find((section) => section.is_active) ?? sections.data[0];
    if (first) setSectionId(first.id, false);
  }, [sections.isSuccess, sections.data, sectionId, hasChosen, setSectionId]);

  const { data, isLoading, isError, isFetching, error, refetch } = useQuery({
    queryKey: ["primary-today-workspace", selectedDate, sectionId],
    queryFn: () => backendApi.getTodayWorkspace(selectedDate, sectionId ?? undefined),
  });

  const plannerActivities = data?.planner_activities ?? [];
  const dayRecord = data?.day_record ?? null;
  // Authored content the admin wrote, plus where it came from and whether a
  // newer version has since been published.
  const authored = useMemo(() => authoredSections(dayRecord), [dayRecord]);
  const provenanceText = provenanceLabel(data?.curriculum);
  const staleness = stalenessNotice(data?.curriculum);

  // Today's Plan editable summary — Class, Theme, Sub Theme and Topic pickers,
  // driven by the published curriculum so subtheme/topic resolve to real rows.
  const [selLevel, setSelLevel] = useState<string>(context.level || "");
  const [selTheme, setSelTheme] = useState(context.theme || "");
  const [selSubtheme, setSelSubtheme] = useState("");
  const [selTopicId, setSelTopicId] = useState("");
  const [savingContext, setSavingContext] = useState(false);

  const pickerThemesQuery = useQuery({
    queryKey: ["primary-curriculum-themes", selLevel, context.subject, context.language],
    queryFn: () =>
      backendApi.primaryCurriculumThemes({
        level: PRIMARY_LEVEL_TO_API[selLevel as keyof typeof PRIMARY_LEVEL_TO_API],
        subject: context.subject || undefined,
        language: context.language ?? undefined,
      }),
    enabled: !!selLevel && !!context.subject,
  });
  const pickerThemes = useMemo(() => {
    const fromCurriculum = pickerThemesQuery.data ?? [];
    if (!selTheme) return fromCurriculum;
    // Keep the currently selected theme visible even when it isn't in the
    // curriculum list for the picked class/subject (e.g. mid-switch).
    return fromCurriculum.some((t) => t.name === selTheme)
      ? fromCurriculum
      : [{ name: selTheme, topics: [] } as { name: string; topics: Array<{ id: string; name: string; subtheme: string | null; is_active: boolean; has_published_lesson: boolean }> }, ...fromCurriculum];
  }, [pickerThemesQuery.data, selTheme]);
  const selectedPickerTheme = useMemo(
    () => pickerThemes.find((t) => t.name === selTheme) ?? null,
    [pickerThemes, selTheme]
  );
  const subthemeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const topic of selectedPickerTheme?.topics ?? []) {
      if (topic.is_active && topic.has_published_lesson && topic.subtheme) set.add(topic.subtheme);
    }
    return Array.from(set);
  }, [selectedPickerTheme]);
  const topicOptions = useMemo(
    () => (selectedPickerTheme?.topics ?? []).filter(
      (t) => t.is_active && t.has_published_lesson && (selSubtheme === "" || t.subtheme === selSubtheme)
    ),
    [selectedPickerTheme, selSubtheme]
  );
  const canViewPlan = !!(selLevel && context.subject && selTheme && selTopicId);

  const handleLevelChange = (level: string) => {
    setSelLevel(level);
    setSelTheme("");
    setSelSubtheme("");
    setSelTopicId("");
  };
  const handleThemeChange = (theme: string) => {
    setSelTheme(theme);
    setSelSubtheme("");
    setSelTopicId("");
  };
  const handleSubthemeChange = (subtheme: string) => {
    setSelSubtheme(subtheme);
    setSelTopicId("");
  };

  const todayDateStr = useMemo(
    () => new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
    []
  );

  // The teacher's selected theme name resolved to its curriculum row. The
  // server matches on theme_id, so the picker's display string is not enough.
  const { data: themes = [] } = useQuery({
    queryKey: ["primary-curriculum-themes", context.level, context.subject, context.language],
    queryFn: () =>
      backendApi.primaryCurriculumThemes({
        level: PRIMARY_LEVEL_TO_API[context.level],
        subject: context.subject ?? undefined,
        language: context.language ?? undefined,
      }),
    enabled: !!context.level && !!context.subject,
  });

  const selectedThemeId = useMemo(
    () => themes.find((t) => t.name === context.theme)?.id ?? "",
    [themes, context.theme]
  );

  const runGenerate = async (options: {
    /** Context to generate for, when it differs from the saved one. */
    context?: PrimaryTeachingContext;
    date?: string;
    /** A theme id already resolved by the caller — skips the name lookup below. */
    themeId?: string;
    topicId?: string;
    replace?: boolean;
  } = {}) => {
    const { context: overrideContext, date: overrideDate, replace = false } = options;
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
    let themeId = options.themeId ?? "";
    if (!themeId) {
      themeId = overrideContext
        ? (
            await queryClient.fetchQuery({
              queryKey: ["primary-curriculum-themes", ctx.level, ctx.subject, ctx.language],
              queryFn: () =>
                backendApi.primaryCurriculumThemes({
                  level: PRIMARY_LEVEL_TO_API[ctx.level],
                  subject: ctx.subject ?? undefined,
                  language: ctx.language ?? undefined,
                }),
            })
          ).find((t) => t.name === ctx.theme)?.id ?? ""
        : themes.find((t) => t.name === ctx.theme)?.id ?? selectedThemeId;
    }

    const payload = buildGeneratePayload(ctx, themeId, date, replace, options.topicId);
    // Nothing to generate from — either the context is incomplete, or its theme
    // name has no curriculum row behind it. A teacher can't tell those apart
    // from an error line, and the second one looks like a lie when the pickers
    // above are visibly filled in. Open the setup modal and let them choose
    // from themes that actually exist.
    if (!payload) {
      setGenerateError(null);
      setSetupOpen(true);
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
      if (getErrorCode(err) === "TRIAL_MANDATE_REQUIRED") {
        setGenerating(false);
        openUpgrade("You've used your free Primary day. Add a payment method to generate more — or try your other tools free.");
        return;
      }
      setGenerateError(getErrorMessage(err, "We couldn't generate a plan. Try again or add an activity manually."));
    } finally {
      setGenerating(false);
    }
  };

  const handleViewFullPlan = async () => {
    if (!canViewPlan) return;
    const themeRow = pickerThemesQuery.data?.find((t) => t.name === selTheme) ?? null;
    const topicRow = themeRow?.topics.find((t) => t.id === selTopicId) ?? null;
    const resolvedContext: PrimaryTeachingContext = {
      ...context,
      level: selLevel as PrimaryTeachingContext["level"],
      subject: context.subject,
      theme: selTheme,
      themeId: themeRow?.id,
      topic: topicRow?.name ?? selTheme,
      topicId: topicRow?.id,
    };
    setSavingContext(true);
    try {
      const todayDate = toLocalISODate(new Date());
      const saved = await updateContext(resolvedContext);
      if (!saved) notify("We couldn't save this class for next time, but today's plan will use it.");
      setSelectedDate(todayDate);
      await runGenerate({ context: resolvedContext, date: todayDate, themeId: themeRow?.id, topicId: topicRow?.id });
    } finally {
      setSavingContext(false);
    }
  };

  const handleSetupSubmit = async (setup: PrimaryPlanSetup) => {
    setSetupSubmitting(true);
    try {
      const resolvedContext: PrimaryTeachingContext = {
        ...context,
        level: setup.level,
        subject: setup.subject,
        theme: setup.themeName,
        themeId: setup.themeId,
        topic: setup.topicName,
        topicId: setup.topicId,
        // Curriculum themes are authored per language, so generating a Hindi
        // theme's day in English would narrate content the lesson isn't written
        // in. Follow the theme, but only to a language the context can hold.
        language: (PRIMARY_LANGUAGES as readonly string[]).includes(setup.language)
          ? (setup.language as PrimaryTeachingContext["language"])
          : context.language,
      };
      const saved = await updateContext(resolvedContext);
      if (!saved) notify("We couldn't save this class for next time, but today's plan will use it.");
      setSetupOpen(false);
      // The modal picked a real curriculum row, so hand its id straight to the
      // generator rather than round-tripping through a name lookup.
      await runGenerate({ context: resolvedContext, themeId: setup.themeId, topicId: setup.topicId });
    } finally {
      setSetupSubmitting(false);
    }
  };

  // Every other group the same date could already be planned for. The backend
  // is the authority on whether one actually has a plan — it 404s with a plain
  // sentence — so this list doesn't try to pre-check each one.
  const copySources = useMemo(() => {
    const groups: Array<{ value: string; label: string }> = [
      { value: NO_SECTION, label: "Not assigned to a class" },
      ...(sections.data || []).map((section) => ({ value: section.id, label: section.name })),
    ];
    return groups.filter((group) => group.value !== (sectionId ?? NO_SECTION));
  }, [sections.data, sectionId]);

  const handleCopyDay = async () => {
    if (!copyFrom) return;
    setCopying(true);
    setGenerateError(null);
    try {
      await backendApi.copyPrimaryToday({
        date: selectedDate,
        from_section_id: copyFrom === NO_SECTION ? null : copyFrom,
        section_id: sectionId,
      });
      notify("Plan copied ✨");
      await queryClient.invalidateQueries({
        queryKey: ["primary-today-workspace", selectedDate],
      });
    } catch (err) {
      console.error("Failed to copy plan:", err);
      setGenerateError(getErrorMessage(err, "We couldn't copy that plan. Try generating one instead."));
    } finally {
      setCopying(false);
    }
  };

  const handlePrevDay = () => setSelectedDate(toLocalISODate(addDays(parseLocalISODate(selectedDate), -1)));
  const handleNextDay = () => setSelectedDate(toLocalISODate(addDays(parseLocalISODate(selectedDate), 1)));
  const handleGoToToday = () => setSelectedDate(toLocalISODate(new Date()));

  const formattedDate = useMemo(
    () => parseLocalISODate(selectedDate).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short", year: "numeric" }),
    [selectedDate]
  );

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
    } catch (err) {
      // The backend's own sentence matters here: the commonest failure is a
      // 404 "There's no plan for that day yet", which tells the teacher exactly
      // what to do — generate the day first.
      notify(getErrorMessage(err, "Couldn't save your reflection. Please try again."));
    } finally {
      setSavingReflection(false);
    }
  };

  const viewState = primaryTodayViewState({
    contextLoading,
    dayLoading: isLoading,
    dayFailed: isError,
    generating,
    activityCount: plannerActivities.length,
  });

  // Format time as 12-hour AM/PM
  const format12h = (timeStr?: string | null) => {
    if (!timeStr) return "—";
    const [h, m] = timeStr.slice(0, 5).split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  return (
    <div className="primary-workspace-page space-y-6">
      {/* Header */}
      <div className="primary-page-header relative pb-5 border-b border-[#e8e7fb] overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-[#171747]">Today's Plan ☀️</h2>
            <p className="text-xs font-semibold text-[#596083] mt-1">
              Your daily teaching plan at a glance. Stay prepared, teach with confidence! 🌟
            </p>
          </div>
          {/* Decorative illustration */}
          <div className="hidden sm:flex items-end gap-1 shrink-0 select-none pointer-events-none" aria-hidden>
            <span className="text-4xl">🌳</span>
            <span className="text-5xl">🏠</span>
            <span className="text-3xl">👦</span>
            <span className="text-3xl">👧</span>
            <span className="text-3xl">🌸</span>
          </div>
        </div>
      </div>

      {/* Today's Plan Selector Card */}
      <div className="rounded-2xl border border-[#e8e7fb] bg-white p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Title and Date Section */}
        <div className="flex items-center gap-3 shrink-0 lg:border-r lg:border-[#e8e7fb] lg:pr-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c5dff] to-[#5a39eb] text-white shadow-md shadow-[#6e41f5]/15">
            <Calendar className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#6e41f5] leading-none">Today&apos;s Plan</p>
            <p className="text-[11px] font-bold text-slate-400 mt-1">{todayDateStr}</p>
          </div>
        </div>

        {/* Middle: Grid of Selectors */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 flex-1">
          {/* Class */}
          <div className="relative w-full">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-xl px-3.5 py-2.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 shrink-0">Class</span>
              <select
                value={selLevel}
                onChange={(e) => handleLevelChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#171747] outline-none cursor-pointer w-full pr-5 appearance-none"
              >
                <option value="">Select...</option>
                {PRIMARY_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Theme */}
          <div className="relative w-full">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-xl px-3.5 py-2.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 shrink-0">Theme</span>
              <select
                value={selTheme}
                onChange={(e) => handleThemeChange(e.target.value)}
                disabled={pickerThemes.length === 0}
                className="bg-transparent text-xs font-bold text-[#171747] outline-none cursor-pointer w-full pr-5 appearance-none disabled:opacity-50"
              >
                <option value="">{pickerThemes.length === 0 ? "Select theme…" : "Select theme…"}</option>
                {pickerThemes.map((t) => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Sub Theme */}
          <div className="relative w-full">
            <div className="flex items-center gap-2 bg-slate-50 border border-[#ecebf7] rounded-xl px-3.5 py-2.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 shrink-0">Subtheme</span>
              <select
                value={selSubtheme}
                onChange={(e) => handleSubthemeChange(e.target.value)}
                disabled={subthemeOptions.length === 0}
                className="bg-transparent text-xs font-bold text-[#171747] outline-none cursor-pointer w-full pr-5 appearance-none disabled:opacity-50"
              >
                <option value="">{subthemeOptions.length === 0 ? "All subthemes" : "Select sub theme…"}</option>
                {subthemeOptions.map((subtheme) => (
                  <option key={subtheme} value={subtheme}>{subtheme}</option>
                ))}
              </select>
            </div>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Topic */}
          <div className="relative w-full">
            <div className="flex items-center gap-2 bg-slate-50 border border-[#ecebf7] rounded-xl px-3.5 py-2.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 shrink-0">Topic</span>
              <select
                value={selTopicId}
                onChange={(e) => setSelTopicId(e.target.value)}
                disabled={topicOptions.length === 0}
                className="bg-transparent text-xs font-bold text-[#171747] outline-none cursor-pointer w-full pr-5 appearance-none disabled:opacity-50"
              >
                <option value="">{!selTheme ? "Pick theme first" : selSubtheme && topicOptions.length === 0 ? "No topics" : topicOptions.length === 0 ? "No topics" : "Select topic…"}</option>
                {topicOptions.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Right: View Button */}
        <div className="shrink-0 lg:self-center flex justify-end w-full lg:w-auto">
          <button
            onClick={() => void handleViewFullPlan()}
            disabled={!canViewPlan || savingContext}
            title={canViewPlan ? undefined : "Select a class, theme and topic first"}
            className="w-full lg:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7c5dff] to-[#5a39eb] hover:from-[#6e41f5] hover:to-[#4e29db] px-5 py-2.5 text-xs font-black text-white shadow-md shadow-[#6e41f5]/20 hover:shadow-lg hover:shadow-[#6e41f5]/25 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
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

      {/* School context — one line, existing type scale. Present only for an
          organization teacher; an independent teacher has no school to name. */}
      {schoolLine && (
        <p className="mt-3 text-[11px] font-bold text-[#596083]">
          {schoolLine}
          {teacherMode.context?.academic_year_name ? ` · ${teacherMode.context.academic_year_name}` : ""}
        </p>
      )}

      {/* ⚠ An organization teacher whose school has not assigned them a class.
          NOT the independent experience: offering them "create a class" would
          invite a parallel classroom their school already models. They are
          waiting on an administrator who genuinely exists. */}
      {teacherMode.isUnassigned && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-black text-amber-900">You haven't been assigned to a class yet</p>
          <p className="mt-1 text-[11px] font-semibold text-amber-800">
            {teacherMode.context?.organization_name
              ? `${teacherMode.context.organization_name} needs to assign you a class or section before you can begin teaching.`
              : "Your school needs to assign you a class or section before you can begin teaching."}
          </p>
        </div>
      )}

      {sections.isError && (
        <p className="mt-4 text-xs font-bold text-rose-600">
          We couldn't load your classes, so this is the day that isn't assigned to one.{" "}
          <button type="button" onClick={() => void sections.refetch()} className="underline hover:text-rose-800">
            Retry
          </button>
        </p>
      )}


      {/* ⚠ A notice, not an action. The day carries this teacher's notes,
          reflection, completion state and the observations recorded against it,
          and no automatic update can merge those — so it says what changed and
          leaves the decision (regenerate, or carry on) with the teacher. */}
      {staleness && viewState !== "generating" && (
        <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
          <p className="text-xs font-bold text-sky-900">{staleness}</p>
          <p className="mt-1 text-[11px] font-semibold text-sky-800">
            Your plan, notes and reflections are untouched. Regenerate this day if you want the update.
          </p>
        </div>
      )}

      {generateError && viewState !== "generating" && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-xs font-bold text-rose-700">{generateError}</p>
        </div>
      )}

      {viewState === "loading" ? (
        <div className="flex h-72 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#6e41f5]" />
        </div>
      ) : viewState === "generating" ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[28px] border border-dashed border-[#cfc8ef] bg-[#faf9ff] p-14 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#6e41f5]" />
          <p className="text-sm font-bold text-[#6e41f5]">
            Building today's plan for {context.level} • {context.subject} • {context.theme}…
          </p>
        </div>
      ) : viewState === "error" ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-10 text-center">
          <p className="text-base font-extrabold text-rose-700">We couldn't load this day</p>
          <p className="mt-1 text-sm font-semibold text-rose-600">
            {getErrorMessage(error, "Check your connection and try again.")}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-black text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-50 disabled:opacity-60 cursor-pointer"
          >
            {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Try again
          </button>
        </div>
      ) : viewState === "empty" ? (
        <div className="rounded-[28px] border border-dashed border-[#cfc8ef] bg-[#faf9ff] p-10 text-center">
          <p className="text-sm font-semibold text-slate-400">No activities planned for this day yet.</p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setSetupOpen(true)}
              disabled={generating}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#6e41f5] px-5 py-2.5 text-xs font-black text-white hover:bg-[#5731d8] transition shadow-md shadow-[#6e41f5]/15 disabled:opacity-60 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" /> Generate plan
            </button>
          </div>

          {copySources.length > 0 && (
            <div className="mt-6 border-t border-[#ecebf7] pt-5">
              <p className="text-[11px] font-bold text-slate-400">
                Already planned this day for another class?
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <div className="relative">
                  <select
                    value={copyFrom}
                    onChange={(event) => setCopyFrom(event.target.value)}
                    aria-label="Copy this day's plan from"
                    className="appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2 pr-8 text-xs font-bold text-[#171747] focus:border-[#6e41f5] focus:outline-none"
                  >
                    <option value="">Copy from…</option>
                    {copySources.map((group) => (
                      <option key={group.value} value={group.value}>
                        {group.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
                <button
                  type="button"
                  onClick={() => void handleCopyDay()}
                  disabled={!copyFrom || copying}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8e7fb] bg-white px-4 py-2.5 text-xs font-black text-[#6e41f5] hover:bg-[#faf9ff] transition disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  {copying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy here
                </button>
              </div>
              <p className="mt-2 text-[10px] font-semibold text-slate-400">
                Copies the plan only — reflections and each child&rsquo;s progress stay with that class.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Timeline journey */}
          <div className="rounded-[28px] border border-[#e8e7fb] bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
              <h3 className="text-lg font-black text-[#171747] flex items-center gap-1.5">
                Today's Journey <span className="text-[#6e41f5]">✨</span>
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-xs text-[#596083] font-semibold">
                  Total Time: <strong className="text-[#171747] font-black">{totalDuration} min</strong>
                </span>
                <span className="text-xs text-[#596083] font-semibold">
                  Progress: <strong className="text-[#171747] font-black">{completedCount}/{plannerActivities.length}</strong>
                </span>
                <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(completedCount / plannerActivities.length) * 100}%` }} />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm("This will overwrite your current schedule edits with the latest curriculum. Continue?")) {
                      const themeRow = pickerThemesQuery.data?.find((t) => t.name === context.theme) ?? null;
                      await runGenerate({
                        context,
                        date: selectedDate,
                        themeId: themeRow?.id,
                        topicId: context.topicId || undefined,
                        replace: true
                      });
                    }
                  }}
                  disabled={generating}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8e7fb] bg-white px-3 py-1.5 text-[11px] font-black text-[#6e41f5] hover:bg-[#faf9ff] transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", generating && "animate-spin")} />
                  Sync from Curriculum
                </button>
              </div>
            </div>

            <div className="primary-today-timeline relative space-y-3 border-l-2 border-dashed border-[#e8e7fb] pl-8 ml-3">
              {plannerActivities.map((act, index) => {
                const config = getActivityConfig(act.activity_type);
                const stepImg = primaryStepImage(act.activity_type);
                const theme = TIMELINE_THEMES[index % TIMELINE_THEMES.length];
                return (
                  <div
                    key={act.id}
                    className="primary-today-activity-card relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#ecebf7] bg-white px-4 py-3.5 shadow-sm hover:border-[#6e41f5]/30 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
                  >
                    {/* Timeline dot */}
                    <span className={cn("absolute -left-[41px] top-1/2 -translate-y-1/2 h-4 w-4 rounded-full ring-[4px] ring-white shadow-md transition-transform duration-200 group-hover:scale-110", theme.dotBg)} />

                    {/* Time column */}
                    <div className="w-20 shrink-0">
                      <span className={cn("block text-xs font-black whitespace-nowrap", theme.badgeText)}>{format12h(act.start_time)}</span>
                      <span className="block text-[10px] text-slate-500 font-bold mt-0.5">{act.duration_minutes || 10} min</span>
                    </div>

                    {/* Step image + title */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white bg-white shadow-sm flex items-center justify-center">
                        {stepImg ? (
                          <img src={stepImg} alt={config.label} className="h-full w-full object-cover" />
                        ) : (
                          <div className={cn("h-full w-full flex items-center justify-center text-xl rounded-lg", theme.badgeBg, theme.badgeText)}>
                            {config.emoji}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-[#171747] truncate transition">{act.title}</h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-normal line-clamp-1 mt-0.5">
                          {act.notes || config.label}
                        </p>
                      </div>
                    </div>

                    {/* Right side: badge + status + view button */}
                    <div className="primary-today-activity-actions flex items-center gap-2 shrink-0">
                      <span className={cn("hidden sm:inline-flex rounded-lg border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider", theme.badgeBg, theme.badgeText, theme.badgeBorder)}>
                        {config.label}
                      </span>

                      {act.status === "completed" && (
                        <span className="inline-flex items-center rounded-lg bg-emerald-50 border border-emerald-100 px-2 py-1 text-[9px] font-black text-emerald-700 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Done
                        </span>
                      )}
                      {act.status === "partially completed" && (
                        <span className="inline-flex items-center rounded-lg bg-amber-50 border border-amber-100 px-2 py-1 text-[9px] font-black text-amber-700 gap-1">
                          <AlertTriangle className="h-3 w-3" /> Partial
                        </span>
                      )}
                      {act.status === "skipped" && (
                        <span className="inline-flex items-center rounded-lg bg-rose-50 border border-rose-100 px-2 py-1 text-[9px] font-black text-rose-700 gap-1">
                          <XCircle className="h-3 w-3" /> Skipped
                        </span>
                      )}

                      <Link
                        href={`/primary/today/activity/${act.id}?date=${selectedDate}${sectionId ? `&section_id=${sectionId}` : ""}`}
                        className="primary-today-view-activity inline-flex items-center gap-1.5 rounded-xl border border-[#6e41f5]/30 bg-white px-3 py-1.5 text-[11px] font-black text-[#6e41f5] hover:bg-[#6e41f5]/5 hover:border-[#6e41f5]/60 transition shadow-sm cursor-pointer whitespace-nowrap"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Activity
                      </Link>

                      {/* Report an issue with this block, inline. Routed to the
                          school admin for an organization teacher and to the
                          platform for an independent one — resolved server-side. */}
                      <ReportIssueControl activityId={act.id} notify={notify} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Authored curriculum content.
              ⚠ The generator has always copied these onto the teaching day and
              nothing rendered them, so an admin's objectives, vocabulary,
              homework and parent update reached no teacher. Same card shell,
              type scale and spacing as the blocks above — only sections with
              content are rendered, because an empty heading reads as a broken
              feature rather than an absent field. */}
          {authored.length > 0 && (
            <div className="rounded-[28px] border border-[#e8e7fb] bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4">
                <h3 className="text-sm font-black text-[#171747]">Lesson details 📘</h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  {provenanceText ? `From ${provenanceText}` : "From your curriculum"}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {authored.map((section) => (
                  <div key={section.key} className="rounded-2xl border border-[#f0eff9] bg-[#fbfbfe]/60 p-4">
                    <h4 className="text-xs font-black text-[#171747]">{section.label}</h4>
                    {section.kind === "list" ? (
                      <ul className="mt-2 space-y-1.5">
                        {section.items.map((item, index) => (
                          <li key={`${section.key}-${index}`} className="flex gap-2 text-xs font-medium text-slate-600">
                            <span className="text-[#6e41f5]">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600">{section.body}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Reflection */}
          <div className="rounded-[28px] border border-[#e8e7fb] bg-white p-5 shadow-sm sm:p-6">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-black text-[#171747] flex items-center gap-1.5">
                  Daily Reflection &amp; Handover 🌱
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">Capture notes for tomorrow.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Worked Well */}
              <label className="space-y-1.5 flex flex-col">
                <span className="flex items-center gap-1.5 text-xs font-black text-[#171747]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 text-[10px]">☀️</span>
                  What worked well today?
                </span>
                <textarea
                  value={reflection.workedWell}
                  onChange={(event) => setReflection((current) => ({ ...current, workedWell: event.target.value }))}
                  placeholder="What engaged learners or went smoothly?"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-[#fbfbfe]/50 px-3.5 py-3 text-xs font-medium text-slate-700 placeholder:text-slate-400/70 focus:bg-white focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition duration-200 resize-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                />
              </label>

              {/* Needs Support */}
              <label className="space-y-1.5 flex flex-col">
                <span className="flex items-center gap-1.5 text-xs font-black text-[#171747]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-50 text-amber-600 text-[10px]">🔍</span>
                  What could improve?
                </span>
                <textarea
                  value={reflection.needsSupport}
                  onChange={(event) => setReflection((current) => ({ ...current, needsSupport: event.target.value }))}
                  placeholder="What needs a different approach next time?"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-[#fbfbfe]/50 px-3.5 py-3 text-xs font-medium text-slate-700 placeholder:text-slate-400/70 focus:bg-white focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition duration-200 resize-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                />
              </label>

              {/* Continue Tomorrow */}
              <label className="space-y-1.5 flex flex-col">
                <span className="flex items-center gap-1.5 text-xs font-black text-[#171747]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 text-blue-600 text-[10px]">📋</span>
                  What should happen tomorrow?
                </span>
                <textarea
                  value={reflection.continueTomorrow}
                  onChange={(event) => setReflection((current) => ({ ...current, continueTomorrow: event.target.value }))}
                  placeholder="Capture follow-up or support needed."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-[#fbfbfe]/50 px-3.5 py-3 text-xs font-medium text-slate-700 placeholder:text-slate-400/70 focus:bg-white focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition duration-200 resize-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                />
              </label>
            </div>

            {/* Save button area */}
            <div className="flex items-center justify-end mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={handleSaveReflection}
                disabled={savingReflection}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6e41f5] to-indigo-600 px-5 py-2 text-xs font-black text-white shadow-md shadow-indigo-500/15 hover:from-[#5731d8] hover:to-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] hover:-translate-y-0.5 transition duration-150 disabled:opacity-50 cursor-pointer"
              >
                {savingReflection ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                <span>{savingReflection ? "Saving..." : "Save Daily Reflection"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <PrimaryPlanSetupModal
        open={setupOpen}
        initialLevel={context.level || ""}
        initialSubject={context.subject || ""}
        initialTheme={context.theme || ""}
        submitting={setupSubmitting}
        onClose={() => setSetupOpen(false)}
        onSubmit={(setup) => void handleSetupSubmit(setup)}
      />

    </div>
  );
}
