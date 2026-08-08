"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight, CalendarDays, ChevronRight, Clock3, Loader2,
  RefreshCw, Settings2, Sparkles, Star, UsersRound,
} from "lucide-react";
import { backendApi, CURRENT_USER_QUERY_KEY, getCurrentUser, type ApiUser, type PrimaryPlannerActivity } from "@/lib/api";
import { adaptApiResource, type PrimaryResource } from "@/lib/primary-resource-adapter";
import { activityDisplayName, activityHref, timeAgo, usePrimaryActivityHistory } from "@/lib/primary-activity";
import { buildGeneratePayload, PRIMARY_LANGUAGES, PRIMARY_LEVELS, PRIMARY_LEVEL_TO_API } from "@/lib/primary-context-helpers";
import { usePrimaryTeachingContext, type PrimaryTeachingContext } from "@/lib/primary-teaching-context";
import { illustrationFor, primaryThemeVisuals } from "@/lib/primary-theme-engine";
import { getErrorMessage } from "@/lib/errors";
import { primaryStepImage } from "@/lib/primary-step-images";
import { usePrimarySection } from "@/lib/use-primary-section";
import PrimaryPlanSetupModal, { type PrimaryPlanSetup } from "./primary-plan-setup-modal";

const activityEmoji: Record<string, string> = {
  circle_time: "👋", warm_up: "👋", routine: "🌞", story: "📖", story_or_rhyme: "📖",
  flashcards: "🃏", picture_talk: "🖼️", worksheet: "✏️", craft: "✂️",
  classroom_activity: "🎨", movement: "🏃", song: "🎵", game: "🎲",
  assessment: "✅", reflection: "✨", parent_note: "💌",
};

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
      const payload = buildGeneratePayload(resolvedContext, setup.themeId, today, true, setup.topicId);
      if (!payload) throw new Error("The selected curriculum is incomplete.");
      payload.section_id = sectionId;
      await backendApi.generatePrimaryToday(payload);
      setSetupOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["primary-today-workspace", today] }),
        queryClient.invalidateQueries({ queryKey: ["primary-curriculum-themes"] }),
      ]);
      notify(`${setup.topicName} classroom is ready ✨`);
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
    <div className="space-y-6 p-4 sm:p-6" style={{ ...visuals.style, color: "var(--primary-theme-text)" }}>
      <section
        className="relative overflow-hidden rounded-[32px] border border-[#e8e7fb] p-6 sm:p-8 min-h-[180px] flex flex-col justify-center shadow-sm"
        style={{
          background: visuals.heroImage
            ? `linear-gradient(90deg, rgba(255,255,255,.96) 0%, rgba(255,255,255,.82) 40%, rgba(255,255,255,.1) 70%, rgba(255,255,255,0) 100%), url(${visuals.heroImage}) center right/cover no-repeat`
            : visuals.backgroundImage
            ? `linear-gradient(90deg, rgba(255,255,255,.98) 0%, rgba(255,255,255,.3) 100%), url(${visuals.backgroundImage}) center right/cover no-repeat`
            : `linear-gradient(135deg, ${visuals.surface || "#f5f3ff"} 0%, #ffffff 50%, color-mix(in srgb, ${visuals.primary || "#6e41f5"} 8%, white) 100%)`,
        }}
      >
        <div className="relative z-10 max-w-xl">
          <p className="text-xs font-black uppercase tracking-widest text-[#6e41f5]">Good morning, {teacherName}! 👋</p>
          <h1 className="mt-2 text-2xl sm:text-3.5xl font-black tracking-tight text-[#171747]">Let&apos;s make today amazing!</h1>
          <p className="mt-1 text-sm font-semibold text-[#4f5680]">You&apos;re all set to create joyful learning experiences.</p>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/95 bg-white/80 px-3.5 py-1.5 text-[10px] font-black text-[#596083] shadow-sm backdrop-blur-sm">
            <span>{dateLabel}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#6e41f5]" />
            <span>{activities.length} activities</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#6e41f5]" />
            <span>{totalMinutes} min</span>
          </div>
        </div>
        {!visuals.heroImage && (
          illustrationFor(visuals, 0) ? (
            <img className="hidden md:block absolute right-6 bottom-0 max-h-[90%] w-auto object-contain pointer-events-none" src={illustrationFor(visuals, 0)} alt="" />
          ) : (
            <div className="absolute right-8 bottom-[-10px] text-8xl opacity-20 pointer-events-none" aria-hidden="true">{activeTheme?.emoji || "🌈"}</div>
          )
        )}
      </section>

      <section id="primary-focus" className="rounded-[28px] border border-[#e8e7fb] bg-white p-5 shadow-sm sm:p-6">
        <header className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f5f1ff] text-[#6e41f5] shadow-sm">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-black text-[#171747]">Today&apos;s Focus</h2>
          </div>
          {hasClassroom && (
            <button 
              type="button" 
              onClick={() => setSetupOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8e7fb] bg-white px-3.5 py-1.5 text-xs font-black text-[#6e41f5] hover:bg-[#faf9ff] transition cursor-pointer shadow-sm"
            >
              <Settings2 className="h-4 w-4" /> Change classroom
            </button>
          )}
        </header>

        {!hasClassroom ? (
          <div className="rounded-2xl border border-dashed border-[#cfc8ef] bg-[#faf9ff] p-5 lg:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-2xl shadow-sm border border-[#e8e7fb]">✨</span>
              <div>
                <h3 className="text-base font-black text-[#171747]">Prepare today&apos;s classroom</h3>
                <p className="text-xs font-semibold text-[#596083] mt-1 max-w-md">Select a class, theme and topic. TeachPad will build the complete teaching sequence for you.</p>
              </div>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5 items-end w-full lg:max-w-4xl lg:flex-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block w-full">
                Class
                <select
                  value={draftLevel}
                  onChange={(event) => {
                    setDraftLevel(event.target.value as PrimaryTeachingContext["level"]);
                    setDraftThemeId("");
                    setDraftSubtheme("");
                    setDraftTopicId("");
                  }}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-[#171747] outline-none focus:border-[#6e41f5]"
                >
                  {PRIMARY_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                </select>
              </label>
              
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block w-full">
                Theme
                <select
                  value={draftThemeId}
                  onChange={(event) => {
                    setDraftThemeId(event.target.value);
                    setDraftSubtheme("");
                    setDraftTopicId("");
                  }}
                  disabled={setupThemesQuery.isFetching || setupThemes.length === 0}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-[#171747] outline-none focus:border-[#6e41f5]"
                >
                  <option value="">{setupThemesQuery.isFetching ? "Loading themes…" : setupThemes.length ? "Select theme…" : "No published themes"}</option>
                  {setupThemes.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.emoji ? `${theme.emoji} ` : ""}{theme.name} · {theme.subject}{theme.language !== "English" ? ` · ${theme.language}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block w-full">
                Subtheme
                <select
                  value={draftSubtheme}
                  onChange={(event) => {
                    setDraftSubtheme(event.target.value);
                    setDraftTopicId("");
                  }}
                  disabled={!selectedSetupTheme}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-[#171747] outline-none focus:border-[#6e41f5]"
                >
                  <option value="">All subthemes</option>
                  {setupSubthemes.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block w-full">
                Topic
                <select
                  value={draftTopicId}
                  onChange={(event) => setDraftTopicId(event.target.value)}
                  disabled={!selectedSetupTheme || setupTopics.length === 0}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-[#171747] outline-none focus:border-[#6e41f5]"
                >
                  <option value="">{selectedSetupTheme ? (draftSubtheme && setupTopics.length === 0 ? "No topics in this subtheme" : setupTopics.length ? "Select topic…" : "No published topics") : "Select theme first"}</option>
                  {setupTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
                </select>
              </label>
              
              <button
                type="button"
                onClick={handleInlineSetup}
                disabled={!selectedSetupTheme || !selectedSetupTopic || setupSubmitting}
                className="w-full inline-flex h-[42px] items-center justify-center gap-1.5 rounded-xl bg-[#6e41f5] px-5 text-xs font-black text-white shadow-md shadow-[#6e41f5]/20 hover:bg-[#5731d8] hover:-translate-y-0.5 transition duration-150 disabled:opacity-50 cursor-pointer"
              >
                {setupSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {setupSubmitting ? "Preparing…" : "Prepare classroom"}
              </button>
            </div>
            {setupThemesQuery.isError && (
              <p className="text-rose-600 font-bold text-xs mt-2 block">{getErrorMessage(setupThemesQuery.error, "We couldn't load the curriculum. Please try again.")}</p>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-12 items-start">
            {/* Left side focus block */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center gap-4">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#faf9ff] border border-[#e8e7fb] text-4xl shadow-sm">{activeTheme?.emoji || "📚"}</span>
                <div>
                  <small className="text-[10px] font-black uppercase tracking-wider text-[#6e41f5]">{activeTopic?.subtheme || "Theme Theme"}</small>
                  <h3 className="text-xl font-black text-[#171747]">{activeTheme?.name || context.theme || "Curriculum Theme"}</h3>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">{activeTopic?.name || context.topic}</p>
                </div>
              </div>
              
              <div className="rounded-2xl border border-violet-100 bg-[#faf9ff]/50 p-4">
                <small className="text-[9px] font-black uppercase tracking-wider text-violet-700">Today&apos;s focus</small>
                <p className="mt-1 text-xs font-semibold text-[#4f5680] leading-relaxed">{day?.daily_focus || "Today's focus is being prepared."}</p>
              </div>
            </div>

            {/* Right side: Today's objectives in 3 vertical box rows */}
            <div className="md:col-span-5 space-y-3 md:border-l border-slate-100 md:pl-6">
              <small className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Today&apos;s objectives</small>
              {objectives.length ? objectives.map((objective, index) => (
                <div key={`${objective}-${index}`} className="flex items-center gap-3 rounded-xl border border-[#ecebf7] bg-[#fbfbfe] p-3 shadow-sm hover:border-[#6e41f5]/25 transition duration-150">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white border border-[#ecebf7] text-[#6e41f5] text-xs font-black shadow-xs">
                    {["●", "★", "✓"][index] || "✓"}
                  </span>
                  <span className="text-xs font-semibold text-[#263252] leading-snug">{objective}</span>
                </div>
              )) : (
                <p className="text-xs font-semibold text-slate-400 italic">Objectives are being prepared.</p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Today's Classroom Plan */}
      <section className="rounded-[28px] border border-[#e8e7fb] bg-[#fbfbfe] p-5 shadow-sm sm:p-6">
        <header className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f5f1ff] text-[#6e41f5] shadow-sm">
              <CalendarDays className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-black text-[#171747]">Today&apos;s Classroom Plan</h2>
          </div>
          <Link href="/primary/today" className="inline-flex items-center gap-1 text-xs font-black text-[#6e41f5] hover:text-[#5731d8] transition">
            View full schedule <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </header>
        
        {todayQuery.isLoading ? (
          <div className="flex items-center justify-center p-12 text-xs font-bold text-slate-400 gap-2"><Loader2 className="h-4 w-4 animate-spin text-[#6e41f5]" /> Preparing today&apos;s plan…</div>
        ) : activities.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activities.slice(0, 8).map((activity, index) => {
              const resource = resourceForActivity(activity, resources);
              const stepArt = primaryStepImage(activity.activity_type);
              const bgTone = cardTints[index % cardTints.length];
              return (
                <Link 
                  key={activity.id} 
                  href={`/primary/today/activity/${activity.id}?date=${today}`} 
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:border-[#6e41f5]/30 hover:-translate-y-1 hover:shadow-md transition duration-200"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400"><Clock3 className="h-3 w-3 text-slate-400" /> {timeLabel(activity, index)}</p>
                      <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: bgTone }} />
                    </div>
                    <h3 className="mt-2 text-sm font-black text-[#171747] leading-tight group-hover:text-[#6e41f5] transition line-clamp-2 min-h-[40px]">{activity.title}</h3>
                  </div>

                  <div className="my-4 aspect-[4/3] rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                    {stepArt ? (
                      <img src={stepArt} alt="" className="h-full w-full object-cover group-hover:scale-105 transition duration-200" />
                    ) : resource?.thumbnailUrl ? (
                      <img src={resource.thumbnailUrl} alt="" className="h-full w-full object-cover group-hover:scale-105 transition duration-200" />
                    ) : illustrationFor(visuals, index + 2) ? (
                      <img src={illustrationFor(visuals, index + 2)} alt="" className="h-full w-full object-cover group-hover:scale-105 transition duration-200" />
                    ) : (
                      <span className="text-4xl filter drop-shadow-sm group-hover:scale-110 transition duration-200">{activityEmoji[activity.activity_type] || "🎨"}</span>
                    )}
                  </div>

                  <footer className="flex items-center justify-between mt-1 pt-2 border-t border-slate-50">
                    <span className="text-[10px] font-bold text-slate-500">{activity.duration_minutes} min</span>
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[#faf9ff] border border-slate-100 text-[#6e41f5] shadow-xs group-hover:bg-[#6e41f5] group-hover:text-white transition duration-200">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </footer>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#cfc8ef] bg-[#faf9ff] p-8 text-center flex flex-col items-center justify-center">
            <span className="text-4xl">{activeTheme?.emoji || "✨"}</span>
            <h3 className="mt-3 text-sm font-black text-[#171747]">Your guided classroom starts here</h3>
            <p className="mt-1 text-xs text-[#596083] max-w-sm mb-5">Select a class, theme and topic. TeachPad will prepare the complete sequence automatically.</p>
            <button 
              type="button" 
              onClick={openClassroomSetup}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#6e41f5] px-5 py-2.5 text-xs font-black text-white hover:bg-[#5731d8] hover:-translate-y-0.5 shadow-md shadow-[#6e41f5]/15 transition duration-150 cursor-pointer"
            >
              Prepare classroom <Sparkles className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* Today's Recommended Resources */}
      <section className="primary-dashboard-section">
        <header>
          <span className="section-icon"><Star /></span>
          <h2>Today&apos;s Recommended Resources</h2>
          <Link href="/primary/library">View all <ArrowRight /></Link>
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

      {/* Recently Used */}
      {recentEvents.length > 0 && (
        <section className="rounded-[28px] border border-[#e8e7fb] bg-white p-5 shadow-sm sm:p-6">
          <header className="flex items-center gap-2.5 mb-4">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f5f1ff] text-[#6e41f5] shadow-sm">
              <RefreshCw className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-black text-[#171747]">Recently Used</h2>
          </header>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {recentEvents.map((event) => (
              <Link 
                key={event.id} 
                href={activityHref(event)}
                className="flex items-center gap-3 shrink-0 min-w-[200px] border border-slate-100 bg-[#fbfbfe] rounded-2xl p-3 hover:border-[#6e41f5]/30 transition duration-155"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white border border-slate-100 text-2xl shadow-xs">
                  {event.entity_type === "resource" ? "📄" : "✨"}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-xs font-black text-[#171747]">{activityDisplayName(event.entity_type, event.entity_id)}</h4>
                  <small className="block text-[10px] font-semibold text-slate-400 mt-0.5">{timeAgo(event.created_at)}</small>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

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
