"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight, BookOpen, CalendarDays, ChevronRight, Clock3, Loader2,
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
    <div className="primary-theme-dashboard" style={visuals.style}>
      <section
        className="primary-theme-hero"
        style={{
          backgroundImage: visuals.heroImage
            ? `linear-gradient(90deg, rgba(255,255,255,.94) 0%, rgba(255,255,255,.78) 34%, rgba(255,255,255,.08) 58%, rgba(255,255,255,0) 100%), url(${visuals.heroImage})`
            : visuals.backgroundImage
            ? `linear-gradient(90deg, rgba(255,255,255,.96), rgba(255,255,255,.15)), url(${visuals.backgroundImage})`
            : `linear-gradient(115deg, ${visuals.surface}, #ffffff 52%, color-mix(in srgb, ${visuals.primary} 14%, white))`,
        }}
      >
        <div className="relative z-10 max-w-xl">
          <p className="text-sm font-extrabold text-slate-500">Good morning, {teacherName}! 👋</p>
          <h1>Let&apos;s make today amazing!</h1>
          <p>You&apos;re all set to create joyful learning experiences.</p>
          <p className="primary-hero-summary">{dateLabel} <span /> {activities.length} activities · {totalMinutes} min</p>
        </div>
        {!visuals.heroImage && (
          illustrationFor(visuals, 0) ? (
            <img className="primary-theme-hero-art" src={illustrationFor(visuals, 0)} alt="" />
          ) : (
            <div className="primary-theme-hero-fallback" aria-hidden="true">{activeTheme?.emoji || "🌈"}</div>
          )
        )}
      </section>

      <section id="primary-focus" className="primary-dashboard-section primary-focus-card">
        <header><span className="section-icon"><Sparkles /></span><h2>Today&apos;s Focus</h2></header>
        {!hasClassroom ? (
          <div className="primary-focus-setup">
            <div className="primary-focus-setup-copy">
              <span>✨</span>
              <div>
                <h3>Prepare today&apos;s classroom</h3>
                <p>Select a class, theme and topic. TeachPad will build the complete teaching sequence for you.</p>
              </div>
            </div>
            <div className="primary-focus-fields">
              <label>
                <span>Class</span>
                <select
                  value={draftLevel}
                  onChange={(event) => {
                    setDraftLevel(event.target.value as PrimaryTeachingContext["level"]);
                    setDraftThemeId("");
                    setDraftSubtheme("");
                    setDraftTopicId("");
                  }}
                >
                  {PRIMARY_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                </select>
              </label>
              <label>
                <span>Theme</span>
                <select
                  value={draftThemeId}
                  onChange={(event) => {
                    setDraftThemeId(event.target.value);
                    setDraftSubtheme("");
                    setDraftTopicId("");
                  }}
                  disabled={setupThemesQuery.isFetching || setupThemes.length === 0}
                >
                  <option value="">{setupThemesQuery.isFetching ? "Loading themes…" : setupThemes.length ? "Select theme…" : "No published themes"}</option>
                  {setupThemes.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.emoji ? `${theme.emoji} ` : ""}{theme.name} · {theme.subject}{theme.language !== "English" ? ` · ${theme.language}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Subtheme</span>
                <select
                  value={draftSubtheme}
                  onChange={(event) => {
                    setDraftSubtheme(event.target.value);
                    setDraftTopicId("");
                  }}
                  disabled={!selectedSetupTheme}
                >
                  <option value="">All subthemes</option>
                  {setupSubthemes.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span>Topic</span>
                <select
                  value={draftTopicId}
                  onChange={(event) => setDraftTopicId(event.target.value)}
                  disabled={!selectedSetupTheme || setupTopics.length === 0}
                >
                  <option value="">{selectedSetupTheme ? (draftSubtheme && setupTopics.length === 0 ? "No topics in this subtheme" : setupTopics.length ? "Select topic…" : "No published topics") : "Select a theme first"}</option>
                  {setupTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
                </select>
              </label>
              <button
                type="button"
                onClick={handleInlineSetup}
                disabled={!selectedSetupTheme || !selectedSetupTopic || setupSubmitting}
              >
                {setupSubmitting ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {setupSubmitting ? "Preparing…" : "Prepare classroom"}
              </button>
            </div>
            {setupThemesQuery.isError && (
              <p className="primary-focus-setup-error">{getErrorMessage(setupThemesQuery.error, "We couldn't load the curriculum. Please try again.")}</p>
            )}
          </div>
        ) : (
          <div className="primary-focus-grid">
            <div>
              <span className="eyebrow">Theme</span>
              <h3>{activeTheme?.name || context.theme || "Choose a theme"}</h3>
              <p className="mt-1 text-sm font-bold text-slate-500">{activeTopic?.name || context.topic || "Choose a topic"}</p>
              {activeTopic?.subtheme && (
                <p className="mt-0.5 text-xs font-bold text-[#6e41f5]">Sub Theme: {activeTopic.subtheme}</p>
              )}
            </div>
            <div className="primary-focus-illustration">
              {illustrationFor(visuals, 1) ? <img src={illustrationFor(visuals, 1)} alt="" /> : <span>{activeTheme?.emoji || "📚"}</span>}
            </div>
            <div>
              <span className="eyebrow">Today&apos;s focus</span>
              {day?.daily_focus ? (
                <p className="mt-1 rounded-lg bg-indigo-50/70 px-2.5 py-1.5 text-xs font-bold text-indigo-700">
                  {day.daily_focus}
                </p>
              ) : null}
              <span className="eyebrow mt-2">Today&apos;s objectives</span>
              <div className="primary-objectives">
                {objectives.length ? objectives.map((objective, index) => (
                  <div key={`${objective}-${index}`}><b>{["●", "123", "Aa"][index] || "✓"}</b><span>{objective}</span></div>
                )) : <p className="text-sm font-semibold text-slate-500">Today&apos;s objectives are being prepared.</p>}
              </div>
            </div>
            <div className="primary-focus-context">
              <div><UsersRound /><span><small>Class</small><b>{context.level}</b></span></div>
              <div><BookOpen /><span><small>Subject</small><b>{context.subject}</b></span></div>
              <button type="button" onClick={() => setSetupOpen(true)}>Change classroom <Settings2 /></button>
            </div>
          </div>
        )}
      </section>

      <section className="primary-dashboard-section">
        <header>
          <span className="section-icon"><CalendarDays /></span><h2>Today&apos;s Classroom Plan</h2>
          <Link href="/primary/today">View full schedule <ArrowRight /></Link>
        </header>
        {todayQuery.isLoading ? (
          <div className="primary-loading"><Loader2 className="animate-spin" /> Preparing today&apos;s classroom…</div>
        ) : activities.length ? (
          <div className="primary-plan-scroll">
            {activities.slice(0, 8).map((activity, index) => {
              const resource = resourceForActivity(activity, resources);
              const stepArt = primaryStepImage(activity.activity_type);
              return (
                <Link key={activity.id} href={`/primary/today/activity/${activity.id}?date=${today}`} className="primary-plan-card" style={{ background: cardTints[index % cardTints.length] }}>
                  <span className="primary-plan-dot" style={{ backgroundColor: cardTints[index % cardTints.length] }} />
                  <p className="primary-plan-time"><Clock3 /> {timeLabel(activity, index)}</p>
                  <h3>{activity.title}</h3>
                  <div className="primary-plan-art">
                    {stepArt ? <img src={stepArt} alt="" />
                      : resource?.thumbnailUrl ? <img src={resource.thumbnailUrl} alt="" />
                      : illustrationFor(visuals, index + 2) ? <img src={illustrationFor(visuals, index + 2)} alt="" />
                      : <span>{activityEmoji[activity.activity_type] || "🎨"}</span>}
                  </div>
                  <footer><span><Clock3 /> {activity.duration_minutes} min</span><ChevronRight /></footer>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="primary-empty-plan">
            <span>{activeTheme?.emoji || "✨"}</span>
            <div><h3>Your guided classroom starts here</h3><p>Select a class, theme and topic. TeachPad will prepare the complete sequence automatically.</p></div>
            <button type="button" onClick={openClassroomSetup}>Prepare classroom <Sparkles /></button>
          </div>
        )}
      </section>

      <section className="primary-dashboard-section">
        <header><span className="section-icon"><Star /></span><h2>Today&apos;s Recommended Resources</h2><Link href="/primary/library">View all <ArrowRight /></Link></header>
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

      {recentEvents.length > 0 && (
        <section className="primary-dashboard-section primary-recent">
          <header><span className="section-icon"><RefreshCw /></span><h2>Recently Used</h2></header>
          <div>{recentEvents.map((event) => (
            <Link key={event.id} href={activityHref(event)}>
              <span>{event.entity_type === "resource" ? "📄" : "✨"}</span>
              <b>{activityDisplayName(event.entity_type, event.entity_id)}</b><small>{timeAgo(event.created_at)}</small>
            </Link>
          ))}</div>
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
