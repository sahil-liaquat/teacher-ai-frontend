"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight, CalendarDays, CalendarOff, ChevronRight, Clock, Loader2,
  RefreshCw, Settings2, Sparkles, Star, UsersRound,
  Users, Blocks, Puzzle, Utensils, Music, BookOpen, Palette, Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import { backendApi, CURRENT_USER_QUERY_KEY, getCurrentUser, type ApiUser, type PrimaryPlannerActivity } from "@/lib/api";
import { adaptApiResource, type PrimaryResource } from "@/lib/primary-resource-adapter";
import { activityDisplayName, activityHref, timeAgo, usePrimaryActivityHistory } from "@/lib/primary-activity";
import { buildGeneratePayload, PRIMARY_LANGUAGES, PRIMARY_LEVELS, PRIMARY_LEVEL_TO_API } from "@/lib/primary-context-helpers";
import { usePrimaryTeachingContext, type PrimaryTeachingContext } from "@/lib/primary-teaching-context";
import { illustrationFor, primaryThemeVisuals } from "@/lib/primary-theme-engine";
import { getErrorMessage } from "@/lib/errors";
import { primaryStepImage } from "@/lib/primary-step-images";
import { usePrimarySection } from "@/lib/use-primary-section";
import { isNonTeachingDay, teachingDayNotice } from "@/lib/primary-teaching-day";
import PrimaryPlanSetupModal, { type PrimaryPlanSetup } from "./primary-plan-setup-modal";

const activityEmoji: Record<string, string> = {
  circle_time: "👋", warm_up: "👋", routine: "🌞", story: "📖", story_or_rhyme: "📖",
  flashcards: "🃏", picture_talk: "🖼️", worksheet: "✏️", craft: "✂️",
  classroom_activity: "🎨", movement: "🏃", song: "🎵", game: "🎲",
  assessment: "✅", reflection: "✨", parent_note: "💌",
};

const CARD_THEMES = [
  {
    bg: "bg-[#fdfaf3] border-[#f5e6c4] hover:border-[#ebd29a] hover:bg-[#fcf7ec]",
    timeBg: "bg-[#fef0cd] text-[#b45309]",
    iconBg: "bg-[#fef0cd] text-[#b45309]",
    chevronBg: "bg-[#fef0cd] text-[#b45309]",
    icon: "Users",
  },
  {
    bg: "bg-[#faf8fd] border-[#ebdfff] hover:border-[#dbcafe] hover:bg-[#f7f3fc]",
    timeBg: "bg-[#ede9fe] text-[#6d28d9]",
    iconBg: "bg-[#ede9fe] text-[#6d28d9]",
    chevronBg: "bg-[#ede9fe] text-[#6d28d9]",
    icon: "Blocks",
  },
  {
    bg: "bg-[#fafcf9] border-[#e2f0e8] hover:border-[#c5e2d1] hover:bg-[#f5faf3]",
    timeBg: "bg-[#dcfce7] text-[#047857]",
    iconBg: "bg-[#dcfce7] text-[#047857]",
    chevronBg: "bg-[#dcfce7] text-[#047857]",
    icon: "Puzzle",
  },
  {
    bg: "bg-[#fdf8f5] border-[#f9dfd5] hover:border-[#f4c8b8] hover:bg-[#fcf4ef]",
    timeBg: "bg-[#fee2e2] text-[#b91c1c]",
    iconBg: "bg-[#fee2e2] text-[#b91c1c]",
    chevronBg: "bg-[#fee2e2] text-[#b91c1c]",
    icon: "Utensils",
  },
  {
    bg: "bg-[#f6f9fe] border-[#dae7fc] hover:border-[#bcccf9] hover:bg-[#f0f5fc]",
    timeBg: "bg-[#dbeafe] text-[#1d4ed8]",
    iconBg: "bg-[#dbeafe] text-[#1d4ed8]",
    chevronBg: "bg-[#dbeafe] text-[#1d4ed8]",
    icon: "Music",
  },
  {
    bg: "bg-[#fcf7fb] border-[#fbe0f0] hover:border-[#f8c5e3] hover:bg-[#faf0f7]",
    timeBg: "bg-[#fce7f3] text-[#be185d]",
    iconBg: "bg-[#fce7f3] text-[#be185d]",
    chevronBg: "bg-[#fce7f3] text-[#be185d]",
    icon: "BookOpen",
  },
  {
    bg: "bg-[#fefbf4] border-[#fceec9] hover:border-[#f9dfa0] hover:bg-[#fdf8e9]",
    timeBg: "bg-[#fef9c3] text-[#a16207]",
    iconBg: "bg-[#fef9c3] text-[#a16207]",
    chevronBg: "bg-[#fef9c3] text-[#a16207]",
    icon: "Palette",
  },
  {
    bg: "bg-[#f5f9fa] border-[#d5ecf0] hover:border-[#b8dee4] hover:bg-[#edf5f7]",
    timeBg: "bg-[#ccfbf1] text-[#0f766e]",
    iconBg: "bg-[#ccfbf1] text-[#0f766e]",
    chevronBg: "bg-[#ccfbf1] text-[#0f766e]",
    icon: "Pencil",
  },
];

function getCardIcon(iconName: string) {
  switch (iconName) {
    case "Users": return Users;
    case "Blocks": return Blocks;
    case "Puzzle": return Puzzle;
    case "Utensils": return Utensils;
    case "Music": return Music;
    case "BookOpen": return BookOpen;
    case "Palette": return Palette;
    case "Pencil": return Pencil;
    default: return Users;
  }
}

function getActivityTheme(activityType?: string | null) {
  const type = activityType || "";
  if (type === "circle_time" || type === "arrival_routine") {
    return CARD_THEMES[1]; // Purple (matches purple background of circle-time.webp)
  }
  if (type === "free_play" || type === "game" || type === "outdoor_play") {
    return CARD_THEMES[2]; // Green (matches green background of game.webp)
  }
  if (type === "story" || type === "story_or_rhyme" || type === "story_rhyme_picture_talk") {
    return CARD_THEMES[6]; // Yellow (matches yellow background of story.webp)
  }
  if (type === "concept_exploration" || type === "introduction") {
    return CARD_THEMES[4]; // Blue (matches blue background of introduction.webp)
  }
  if (type === "meal_time" || type === "routine") {
    return CARD_THEMES[3]; // Peach (matches peach background of routine.webp)
  }
  if (type === "craft" || type === "classroom_activity" || type === "classroom_activity_game" || type === "creative_time") {
    return CARD_THEMES[5]; // Pink (matches pink background of craft.webp)
  }
  if (type === "practice" || type === "worksheet" || type === "numeracy_time" || type === "literacy_time" || type === "assessment") {
    return CARD_THEMES[7]; // Teal (matches teal background of worksheet.webp)
  }
  if (type === "movement") {
    return CARD_THEMES[2]; // Green / playground
  }
  return CARD_THEMES[0]; // Fallback to Amber
}

const cardTints = ["#eef5ff", "#f6efff", "#fff8df", "#ecf9f1", "#fff0f5", "#fff7e7"];
const resourceFallbacks = [
  { label: "Flashcards", type: "flashcards", subtitle: "Picture cards" },
  { label: "Story", type: "story", subtitle: "Read aloud" },
  { label: "Song", type: "song", subtitle: "Sing together" },
  { label: "Worksheet", type: "worksheet", subtitle: "Practice sheet" },
  { label: "Craft", type: "craft", subtitle: "Creative activity" },
  { label: "Assessment", type: "assessment", subtitle: "Quick check" },
] as const;

function toLocalISODate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function timeLabel(activity: PrimaryPlannerActivity, index: number) {
  if (activity.start_time) return activity.start_time.slice(0, 5);
  const base = 9 * 60 + index * 20;
  const hour = Math.floor(base / 60);
  return `${hour}:${String(base % 60).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

function resourceForActivity(activity: PrimaryPlannerActivity, resources: Map<string, PrimaryResource>) {
  for (const id of activity.resource_ids) {
    const resource = resources.get(id);
    if (resource) return resource;
  }
  return undefined;
}

export default function PrimaryHomePage({ notify }: { notify: (message: string) => void }) {
  const queryClient = useQueryClient();
  const { context, isLoading: contextLoading, updateContext } = usePrimaryTeachingContext();
  const { sectionId, setSectionId, hasChosen } = usePrimarySection();
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const [draftLevel, setDraftLevel] = useState<PrimaryTeachingContext["level"]>(context.level);
  const [draftThemeId, setDraftThemeId] = useState("");
  const [draftSubtheme, setDraftSubtheme] = useState("");
  const [draftTopicId, setDraftTopicId] = useState("");
  const today = useMemo(toLocalISODate, []);
  const hasClassroom = Boolean(context.themeId && context.topicId);

  const { data: currentUser } = useQuery<ApiUser>({ queryKey: CURRENT_USER_QUERY_KEY, queryFn: () => getCurrentUser(), staleTime: Infinity });
  const teacherName = (currentUser?.full_name || currentUser?.name || "Teacher").split(" ")[0];
  const sections = useQuery({
    queryKey: ["primary-sections", false],
    queryFn: () => backendApi.primarySections(),
  });

  useEffect(() => {
    if (!sections.isSuccess) return;
    if (sectionId && !sections.data.some((section) => section.id === sectionId)) {
      setSectionId(null);
    }
  }, [sectionId, sections.data, sections.isSuccess, setSectionId]);

  useEffect(() => {
    if (!sections.isSuccess || hasChosen || sectionId) return;
    const first = sections.data.find((section) => section.is_active) ?? sections.data[0];
    if (first) setSectionId(first.id, false);
  }, [hasChosen, sectionId, sections.data, sections.isSuccess, setSectionId]);

  const themes = useQuery({
    queryKey: ["primary-curriculum-themes", context.level, context.subject, context.language],
    queryFn: () => backendApi.primaryCurriculumThemes({
      level: PRIMARY_LEVEL_TO_API[context.level],
      subject: context.subject || undefined,
      language: context.language || undefined,
    }),
    enabled: !contextLoading && !!context.level && !!context.subject,
  });

  const setupThemesQuery = useQuery({
    queryKey: ["primary-curriculum-themes", "inline-setup", draftLevel],
    queryFn: () => backendApi.primaryCurriculumThemes({ level: PRIMARY_LEVEL_TO_API[draftLevel] }),
    enabled: !contextLoading && !hasClassroom && !!draftLevel,
  });
  const setupThemes = useMemo(
    () => (setupThemesQuery.data ?? []).filter((theme) => (
      theme.is_active
      && theme.has_published_lesson
      && theme.topics.some((topic) => topic.is_active && topic.has_published_lesson)
    )),
    [setupThemesQuery.data],
  );
  const selectedSetupTheme = setupThemes.find((theme) => theme.id === draftThemeId);
  const setupSubthemes = useMemo(() => {
    const set = new Set<string>();
    for (const topic of selectedSetupTheme?.topics ?? []) {
      if (topic.is_active && topic.has_published_lesson && topic.subtheme) set.add(topic.subtheme);
    }
    return Array.from(set);
  }, [selectedSetupTheme]);
  const setupTopics = (selectedSetupTheme?.topics ?? []).filter(
    (topic) => topic.is_active && topic.has_published_lesson && (draftSubtheme === "" || topic.subtheme === draftSubtheme),
  );
  const selectedSetupTopic = setupTopics.find((topic) => topic.id === draftTopicId);

  const activeTheme = useMemo(
    () => hasClassroom
      ? (themes.data ?? []).find((theme) => theme.id === context.themeId)
        ?? (themes.data ?? []).find((theme) => theme.name === context.theme)
        ?? null
      : null,
    [hasClassroom, themes.data, context.themeId, context.theme],
  );
  const activeTopic = activeTheme?.topics.find((topic) => topic.id === context.topicId)
    ?? activeTheme?.topics.find((topic) => topic.name === context.topic)
    ?? null;
  const visuals = useMemo(() => primaryThemeVisuals(activeTheme), [activeTheme]);

  const todayQuery = useQuery({
    queryKey: ["primary-today-workspace", today, sectionId],
    queryFn: () => backendApi.getTodayWorkspace(today, sectionId ?? undefined),
    enabled: !contextLoading && hasClassroom,
    retry: 1,
  });
  const day = todayQuery.data?.day_record;
  const activities = todayQuery.data?.planner_activities ?? [];
  // What the school calendar says today is. The dashboard used to have no way
  // to know — the only signal a weekend produced was a 400 from generate.
  const teachingStatus = todayQuery.data?.teaching_status ?? null;
  const closedForTeaching = isNonTeachingDay(teachingStatus);
  const teachingNotice = useMemo(
    () => teachingDayNotice(teachingStatus, today),
    [teachingStatus, today],
  );
  const resourceIds = useMemo(
    () => Array.from(new Set(activities.flatMap((activity) => activity.resource_ids))).slice(0, 12),
    [activities],
  );
  const resourceQueries = useQueries({
    queries: resourceIds.map((id) => ({
      queryKey: ["primary-resource", id],
      queryFn: async () => {
        try {
          return await adaptApiResource(await backendApi.primaryResource(id));
        } catch {
          return null;
        }
      },
      staleTime: 60_000,
      retry: 0,
    })),
  });
  const resources = useMemo(() => {
    const map = new Map<string, PrimaryResource>();
    resourceQueries.forEach((query) => { if (query.data) map.set(query.data.id, query.data); });
    return map;
  }, [resourceQueries]);
  const recommended = Array.from(resources.values()).slice(0, 6);
  const { events: recentEvents } = usePrimaryActivityHistory(6);

  useEffect(() => {
    if (!contextLoading && !hasClassroom) setDraftLevel(context.level);
  }, [context.level, contextLoading, hasClassroom]);

  async function handleSetupSubmit(setup: PrimaryPlanSetup) {
    setSetupSubmitting(true);
    const resolvedContext: PrimaryTeachingContext = {
      ...context,
      level: setup.level,
      subject: setup.subject,
      theme: setup.themeName,
      themeId: setup.themeId,
      topic: setup.topicName,
      topicId: setup.topicId,
      language: (PRIMARY_LANGUAGES as readonly string[]).includes(setup.language)
        ? setup.language as PrimaryTeachingContext["language"]
        : context.language,
    };
    try {
      const saved = await updateContext(resolvedContext);
      if (!saved) notify("Your classroom is ready, but the teaching context could not be saved for next time.");
      // ⚠ EXPLICIT. This is "Change classroom" → "Set up today's plan": the
      // teacher chose the class, theme, sub-theme and topic themselves and
      // pressed Generate. The school calendar governs what is DELIVERED
      // automatically, not what a teacher may CREATE — so a Sunday no longer
      // turns this into "No teaching scheduled today." and an empty screen.
      const payload = buildGeneratePayload(
        resolvedContext, setup.themeId, today, true, setup.topicId, "explicit",
      );
      if (!payload) throw new Error("The selected curriculum is incomplete.");
      payload.section_id = sectionId;
      const result = await backendApi.generatePrimaryToday(payload);
      setSetupOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["primary-today-workspace", today] }),
        queryClient.invalidateQueries({ queryKey: ["primary-curriculum-themes"] }),
      ]);
      // `generated: false` can still happen — an older backend, or a state the
      // server declines for its own reasons. It is a success, not a failure, so
      // the server's own sentence is the honest thing to show.
      notify(
        result.generated
          ? `${setup.topicName} classroom is ready ✨`
          : result.teaching_status.headline,
      );
    } catch (error) {
      notify(getErrorMessage(error, "We couldn't prepare this classroom. Please try again."));
    } finally {
      setSetupSubmitting(false);
    }
  }

  function openClassroomSetup() {
    if (hasClassroom) {
      setSetupOpen(true);
      return;
    }
    document.getElementById("primary-focus")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handleInlineSetup() {
    if (!selectedSetupTheme || !selectedSetupTopic || setupSubmitting) return;
    void handleSetupSubmit({
      level: draftLevel,
      subject: selectedSetupTheme.subject,
      themeId: selectedSetupTheme.id,
      themeName: selectedSetupTheme.name,
      topicId: selectedSetupTopic.id,
      topicName: selectedSetupTopic.name,
      language: selectedSetupTheme.language,
    });
  }

  const objectives = (day?.objectives?.length ? day.objectives : activities.map((item) => item.title)).slice(0, 3);
  const totalMinutes = activities.reduce((total, item) => total + item.duration_minutes, 0);
  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="primary-workspace-page space-y-6" style={{ ...visuals.style, color: "var(--primary-theme-text)" }}>
      <section
        className={cn(
          "relative overflow-hidden rounded-2xl sm:rounded-[32px] border border-[#e8e7fb] p-4 sm:p-8 min-h-[110px] sm:min-h-[180px] flex flex-col justify-center shadow-sm transition-all duration-300 primary-home-banner",
          visuals.heroImage ? "has-hero" : visuals.backgroundImage ? "has-bg" : "no-images"
        )}
        style={{
          backgroundColor: visuals.surface || "#ffffff",
          "--banner-bg": visuals.surface || "#ffffff",
          "--hero-image": visuals.heroImage ? `url(${visuals.heroImage})` : "none",
          "--bg-image": visuals.backgroundImage ? `url(${visuals.backgroundImage})` : "none",
          "--banner-primary": visuals.primary || "#1677ff",
        } as React.CSSProperties}
      >
        <div className="relative z-10 max-w-xl">
          <p className="text-xs font-black uppercase tracking-widest text-blue-500">Good morning, {teacherName}! 👋</p>
          <h1 className="mt-1.5 text-2xl sm:text-3.5xl font-black tracking-tight text-[#171747]">Let&apos;s make today amazing!</h1>
          
          {hasClassroom ? (
            <div className="mt-3.5 inline-flex flex-wrap items-center gap-2 rounded-xl bg-white/60 border border-white/50 px-3 py-1.5 text-[10px] font-black text-slate-700 shadow-xs backdrop-blur-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Theme</span>
                <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 font-extrabold text-blue-600">{activeTheme?.name || context.theme}</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Sub-theme</span>
                <span className="rounded-md bg-indigo-500/10 px-1.5 py-0.5 font-extrabold text-indigo-600">{activeTopic?.subtheme || "General"}</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Topic</span>
                <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 font-extrabold text-amber-600">{activeTopic?.name || context.topic}</span>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm font-semibold text-[#4f5680]">You&apos;re all set to create joyful learning experiences.</p>
          )}
        </div>
        {!visuals.heroImage && (
          illustrationFor(visuals, 0) ? (
            <img className="hidden md:block absolute right-6 bottom-0 max-h-[90%] w-auto object-contain pointer-events-none" src={illustrationFor(visuals, 0)} alt="" />
          ) : (
            <div className="hidden sm:block absolute right-8 bottom-[-10px] text-8xl opacity-20 pointer-events-none" aria-hidden="true">{activeTheme?.emoji || "🌈"}</div>
          )
        )}
      </section>

      {/* Today's Classroom Plan */}
      <section className="rounded-[28px] border border-[#e8e7fb] bg-white p-5 shadow-sm sm:p-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-500 shadow-sm">
              <CalendarDays className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-black text-[#171747]">Today&apos;s Classroom Plan</h2>
          </div>
          {hasClassroom ? (
            <button 
              type="button"
              onClick={() => setSetupOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-black text-blue-500 hover:text-blue-600 transition sm:ml-auto cursor-pointer"
            >
              <Settings2 className="h-3.5 w-3.5" /> Change classroom
            </button>
          ) : (
            <button 
              type="button"
              onClick={() => setSetupOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-black text-blue-500 hover:text-blue-600 transition sm:ml-auto cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" /> Setup classroom
            </button>
          )}
        </header>
        
        {todayQuery.isLoading ? (
          <div className="flex items-center justify-center p-12 text-xs font-bold text-slate-400 gap-2"><Loader2 className="h-4 w-4 animate-spin text-blue-500" /> Preparing today&apos;s plan…</div>
        ) : activities.length ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {activities.slice(0, 8).map((activity, index) => {
                const resource = resourceForActivity(activity, resources);
                const stepArt = primaryStepImage(activity.activity_type);
                const theme = getActivityTheme(activity.activity_type);
                return (
                  <Link
                    key={activity.id}
                    href={`/primary/today/activity/${activity.id}?date=${today}`}
                    className={cn(
                      "group relative flex flex-col justify-between rounded-[20px] border p-3 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer",
                      theme.bg
                    )}
                  >
                    <div>
                      {/* Header Row: Duration Pill and Chevron Icon */}
                      <div className="flex items-center justify-between mb-2">
                        <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold tracking-wide", theme.timeBg)}>
                          <Clock className="h-3 w-3 shrink-0 stroke-[2.5]" />
                          <span>{activity.duration_minutes} min</span>
                        </div>
                        <div className={cn("grid h-6 w-6 place-items-center rounded-full shadow-xs shrink-0 transition-transform duration-200 group-hover:scale-105 active:scale-95", theme.chevronBg)}>
                          <ChevronRight className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-xs font-black text-[#171747] leading-tight line-clamp-2 h-9 mb-2 group-hover:text-blue-500 transition">
                        {activity.title}
                      </h3>
                    </div>

                    {/* Image */}
                    <div className="aspect-[3/2] rounded-[14px] flex items-center justify-center overflow-hidden">
                      {stepArt ? (
                        <img src={stepArt} alt="" className="h-full w-full object-cover group-hover:scale-103 transition duration-250" />
                      ) : resource?.thumbnailUrl ? (
                        <img src={resource.thumbnailUrl} alt="" className="h-full w-full object-cover group-hover:scale-103 transition duration-250" />
                      ) : illustrationFor(visuals, index + 2) ? (
                        <img src={illustrationFor(visuals, index + 2)} alt="" className="h-full w-full object-cover group-hover:scale-103 transition duration-250" />
                      ) : (
                        <span className="text-3xl filter drop-shadow-sm group-hover:scale-108 transition duration-250">{activityEmoji[activity.activity_type] || "🎨"}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
            
            <div className="flex justify-center pt-1.5">
              <Link href="/primary/today" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black text-[#171747] shadow-sm hover:bg-slate-50 transition duration-150 cursor-pointer">
                View full schedule <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
        ) : closedForTeaching ? (
          /* ⚠ A calm state, not a red one, and not an invitation to generate a
             day the calendar has already said does not exist. The dashboard is
             where a teacher lands, so this is the surface the bug was reported
             against. */
          <div className="rounded-2xl border border-[#e8e7fb] bg-white p-8 text-center flex flex-col items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff4ff] text-blue-500">
              <CalendarOff className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-black text-[#171747]">
              {teachingNotice?.headline ?? "No teaching scheduled today."}
            </h3>
            <p className="mt-1 text-xs font-bold text-slate-400">{teachingNotice?.dateLabel}</p>
            {teachingNotice?.detail && (
              <p className="mt-2 max-w-sm text-xs text-[#596083]">{teachingNotice.detail}</p>
            )}
            {teachingNotice?.nextDate && (
              <>
                <p className="mt-5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Next teaching day
                </p>
                <p className="mt-1 text-sm font-black text-[#171747]">{teachingNotice.nextDateLabel}</p>
                <Link
                  href={`/primary/today?date=${teachingNotice.nextDate}`}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-500 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-blue-500/15 transition duration-150 hover:-translate-y-0.5 hover:bg-blue-600 cursor-pointer"
                >
                  {teachingNotice.nextActionLabel} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
            {/* ⚠ The closed day still lets a teacher prepare. "Change
                classroom" in this card's header does the same thing; this is
                the affordance for someone who has read the empty state and is
                looking for what they CAN do. */}
            <button
              type="button"
              onClick={() => setSetupOpen(true)}
              className="mt-5 inline-flex items-center gap-1.5 text-xs font-black text-blue-500 transition hover:text-blue-600 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" /> Set up today&apos;s plan anyway
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#cfc8ef] bg-[#faf9ff] p-8 text-center flex flex-col items-center justify-center">
            <span className="text-4xl">{activeTheme?.emoji || "✨"}</span>
            <h3 className="mt-3 text-sm font-black text-[#171747]">Your guided classroom starts here</h3>
            <p className="mt-1 text-xs text-[#596083] max-w-sm mb-5">Select a class, theme and topic. TeachPad will prepare the complete sequence automatically.</p>
            <button 
              type="button" 
              onClick={openClassroomSetup}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500 px-5 py-2.5 text-xs font-black text-white hover:bg-blue-600 hover:-translate-y-0.5 shadow-md shadow-blue-500/15 transition duration-150 cursor-pointer"
            >
              Prepare classroom <Sparkles className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* Today's Recommended Resources */}
      <section className="rounded-[28px] border border-[#e8e7fb] bg-white p-5 shadow-sm sm:p-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-500 shadow-sm">
              <Star className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-black text-[#171747]">Today&apos;s Recommended Resources</h2>
          </div>
          <Link href="/primary/library" className="inline-flex items-center gap-1 text-xs font-black text-blue-500 hover:text-blue-600 transition sm:ml-auto">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </header>
        <div className="primary-resource-grid">
          {recommended.length ? recommended.map((resource, index) => (
            <Link key={resource.id} href={`/primary/library?search=${encodeURIComponent(resource.title)}`}>
              <div>{resource.thumbnailUrl ? <img src={resource.thumbnailUrl} alt="" /> : <span>{activityEmoji[activities[index]?.activity_type] || "📄"}</span>}</div>
              <b>{resource.category}</b><small>{resource.title}</small>
            </Link>
          )) : null}
          {resourceFallbacks.slice(0, Math.max(0, 6 - recommended.length)).map((fallback) => (
            <button key={fallback.label} type="button" onClick={openClassroomSetup}>
              <div><img src={primaryStepImage(fallback.type)} alt="" /></div>
              <b>{fallback.label}</b><small>{fallback.subtitle}</small>
            </button>
          ))}
        </div>
      </section>



      <PrimaryPlanSetupModal
        open={setupOpen}
        initialLevel={context.level}
        initialSubject={context.subject}
        initialTheme={context.theme || ""}
        submitting={setupSubmitting}
        onClose={() => setSetupOpen(false)}
        onSubmit={(setup) => void handleSetupSubmit(setup)}
      />
    </div>
  );
}
