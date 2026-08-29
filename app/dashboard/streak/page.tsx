"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, CalendarDays, Check, ChevronLeft, ChevronRight, Eye, Flame, Gift, Lock, RotateCcw, ShieldCheck, Share2, Trophy, X } from "lucide-react";
import { backendApi, CURRENT_USER_QUERY_KEY, getCurrentUser, type StreakMonth, type StreakReward } from "@/lib/api";
import { cn } from "@/lib/utils";
import { BoyAvatar } from "@/components/profile-avatar";
import { CertificateModal, RewardArtwork, shareAchievementCard, TeachingBadge } from "@/components/streak/reward-artifacts";

const resourceLabels: Record<string, string> = {
  lesson_plan: "Lesson plan",
  worksheet: "Worksheet",
  presentation: "Presentation",
  notes: "Teaching notes",
  activity: "Classroom activity",
};

const calendarMilestones = {
  3: { label: "Bronze badge", artwork: "/assets/streak/bronze-badge.webp" },
  7: { label: "Silver badge", artwork: "/assets/streak/silver-badge.webp" },
  14: { label: "Gold badge", artwork: "/assets/streak/gold-badge.webp" },
  30: { label: "Champion badge", artwork: "/assets/streak/champion-certificate.webp" },
} as const;

export default function TeachingJourneyPage() {
  const queryClient = useQueryClient();
  const tracked = useRef(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarTarget, setCalendarTarget] = useState<{ year: number; month: number } | null>(null);
  const [certificateReward, setCertificateReward] = useState<StreakReward | null>(null);
  const [recognitionMilestone, setRecognitionMilestone] = useState<number | null>(null);
  const [artifactMessage, setArtifactMessage] = useState<string | null>(null);
  const summary = useQuery({ queryKey: ["teaching-streak", "summary"], queryFn: backendApi.streakSummary });
  const month = useQuery({
    queryKey: ["teaching-streak", "month", calendarTarget?.year ?? "current", calendarTarget?.month ?? "current"],
    queryFn: () => backendApi.streakMonth(calendarTarget?.year, calendarTarget?.month),
    placeholderData: (previousData) => previousData,
  });
  const rewards = useQuery({ queryKey: ["teaching-streak", "rewards"], queryFn: backendApi.streakRewards });
  const currentUser = useQuery({ queryKey: CURRENT_USER_QUERY_KEY, queryFn: () => getCurrentUser({ redirectOnUnauthorized: false }), staleTime: Infinity });
  const recognition = useQuery({
    queryKey: ["teaching-streak", "recognition", recognitionMilestone],
    queryFn: () => backendApi.streakRecognitionProfile(recognitionMilestone!),
    enabled: recognitionMilestone != null,
  });
  const claim = useMutation({
    mutationFn: (milestone: number) => backendApi.claimStreakReward(milestone),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["teaching-streak"] }),
  });
  const consent = useMutation({
    mutationFn: ({ milestone, approved }: { milestone: number; approved: boolean }) => backendApi.updateStreakRecognition(milestone, approved),
    onSuccess: (data) => {
      setArtifactMessage(data.message);
      setRecognitionMilestone(null);
      void queryClient.invalidateQueries({ queryKey: ["teaching-streak"] });
    },
  });

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    void backendApi.trackStreakEvent({ event_name: "full_journey_viewed" }).catch(() => undefined);
  }, []);

  const selected = month.data?.days.find((day) => day.date === selectedDate) ?? null;
  const isLoading = summary.isLoading || month.isLoading || rewards.isLoading;
  const hasError = summary.isError || month.isError || rewards.isError;

  if (isLoading) return <JourneySkeleton />;
  if (hasError || !summary.data || !month.data || !rewards.data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-[24px] border border-teachpad-red bg-gradient-to-br from-white to-rose-50 p-8 text-center shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
          <h1 className="text-xl font-black text-fg">Could not load your teaching journey</h1>
          <p className="mt-2 text-sm text-slate-500">Your progress is safe. Try loading it again.</p>
          <button type="button" onClick={() => { void summary.refetch(); void month.refetch(); void rewards.refetch(); }} className="mx-auto mt-5 inline-flex h-10 items-center gap-2 rounded-card bg-gradient-to-r from-brand to-blue-600 px-4 text-sm font-bold text-white shadow-[0_10px_22px_rgba(22,119,255,0.18)] hover:-translate-y-0.5">
            <RotateCcw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const nextReward = rewards.data.items.find((item) => item.status === "unlocked" && item.reward_type !== "badge") ?? summary.data.next_reward;
  const unlocked = [...rewards.data.items].reverse().find((item) => item.status === "unlocked");
  const earnedBadges = rewards.data.items.filter((item) => item.status === "unlocked" || item.status === "claimed");
  const recognitionReward = [...rewards.data.items].reverse().find((item) => item.recognition_eligible && (item.status === "unlocked" || item.status === "claimed") && item.recognition_consent !== true);
  const teacherName = currentUser.data?.full_name || currentUser.data?.name || "TeachPad Teacher";

  async function openCertificate(reward: StreakReward) {
    if (!reward.has_certificate) return;
    if (reward.status === "unlocked") {
      const result = await claim.mutateAsync(reward.milestone_days);
      setCertificateReward(result.reward);
      return;
    }
    setCertificateReward(reward);
  }

  async function shareReward(reward: StreakReward) {
    const result = await shareAchievementCard(teacherName, reward);
    if (result !== "cancelled") setArtifactMessage(result === "shared" ? "Achievement shared" : "Achievement card downloaded");
  }

  function changeCalendarMonth(offset: number) {
    if (!month.data) return;
    const nextMonth = new Date(month.data.year, month.data.month - 1 + offset, 1);
    setSelectedDate(null);
    setCalendarTarget({ year: nextMonth.getFullYear(), month: nextMonth.getMonth() + 1 });
  }

  return (
    <div className="relative mx-auto w-full min-w-0 max-w-[1180px] space-y-4 px-0 py-3 min-[390px]:px-1 sm:space-y-6 sm:px-4 sm:py-7">
      <header className="reveal-card relative min-h-[190px] overflow-hidden rounded-[22px] border border-blue-200 bg-[linear-gradient(120deg,#ffffff_0%,#ffffff_58%,#f0f7ff_100%)] px-4 py-5 shadow-[0_16px_40px_rgba(37,99,235,0.07)] min-[390px]:px-5 sm:min-h-[224px] sm:rounded-[28px] sm:px-8 sm:py-6 lg:px-10">
        <div className="relative z-10 flex min-h-[148px] flex-col justify-center sm:min-h-[160px] lg:pr-[310px]">
          <p className="text-micro font-black uppercase tracking-[0.2em] text-pink-500">Teaching streak</p>
          <h1 className="mt-2 text-h2 font-black leading-[1.08] tracking-tight text-fg min-[390px]:text-h1 sm:text-display"><span className="block">Your Teaching</span><span className="text-brand">Journey</span></h1>
          <p className="mt-2 max-w-xl text-xs font-semibold leading-5 text-fg-muted min-[390px]:text-sm sm:mt-3 sm:leading-6">Small teaching habits. Meaningful recognition.</p>
          <div className="mt-3 inline-flex w-fit items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-700 shadow-[0_8px_20px_rgba(245,158,11,0.12)] min-[390px]:px-4 min-[390px]:py-2 min-[390px]:text-sm sm:mt-4">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white shadow-sm" aria-hidden="true">🔥</span>{summary.data.current_streak > 0 ? `${summary.data.current_streak}-day streak` : "Start your streak"}
          </div>
        </div>
        <img src="/avatars/elif-celebrate.png" alt="" aria-hidden="true" className="pointer-events-none absolute -bottom-14 right-2 hidden h-[250px] w-[250px] object-contain drop-shadow-[0_24px_34px_rgba(40,78,130,0.16)] sm:block lg:-bottom-16 lg:right-8 lg:h-[292px] lg:w-[292px]" />
        <span className="pointer-events-none absolute right-[31%] top-10 hidden text-2xl font-black text-blue-300 lg:block">*</span>
        <span className="pointer-events-none absolute right-[27%] top-24 hidden h-2 w-2 rounded-full bg-pink-300 lg:block" />
      </header>

      {unlocked && (
        <section className="relative overflow-hidden rounded-[22px] border border-teachpad-mint bg-gradient-to-r from-emerald-50 via-white to-blue-50 px-5 py-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <span className="absolute right-5 top-3 animate-pulse text-xl" aria-hidden="true">✨</span>
          <p className="text-sm font-black text-emerald-900">🎉 You reached a {unlocked.milestone_days}-day teaching streak!</p>
          <p className="mt-1 text-sm text-emerald-800">You unlocked {unlocked.reward_label}.</p>
          {unlocked.has_certificate ? (
            <button type="button" onClick={() => void openCertificate(unlocked)} disabled={claim.isPending} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-card bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 text-xs font-bold text-white shadow-[0_8px_18px_rgba(36,183,122,0.18)] hover:-translate-y-0.5 disabled:opacity-60 min-[390px]:h-9 min-[390px]:w-auto"><Eye className="h-3.5 w-3.5" />{claim.isPending ? "Preparing…" : "View certificate"}</button>
          ) : (
            <button type="button" onClick={() => void shareReward(unlocked)} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-card bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 text-xs font-bold text-white shadow-[0_8px_18px_rgba(36,183,122,0.18)] hover:-translate-y-0.5 min-[390px]:h-9 min-[390px]:w-auto"><Share2 className="h-3.5 w-3.5" />Share achievement</button>
          )}
          {claim.isSuccess && <p className="mt-2 text-xs font-bold text-emerald-700">{claim.data.message}</p>}
        </section>
      )}

      {earnedBadges.length > 0 && (
        <section className="rounded-[22px] border border-white/70 bg-gradient-to-r from-amber-50 via-white to-violet-50 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black text-slate-900">Your TeachPad profile badges</p><p className="mt-1 text-xs text-slate-500">These stay on your profile once unlocked.</p></div><div className="flex flex-wrap gap-2">{earnedBadges.map((reward) => <TeachingBadge key={reward.id} tier={reward.badge_tier} label={reward.badge_tier === "champion" ? "Champion Teacher" : `${reward.badge_tier[0].toUpperCase()}${reward.badge_tier.slice(1)} Teacher`} />)}</div></div>
        </section>
      )}

      {recognitionReward && (
        <section className="rounded-[22px] border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-violet-50 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:flex sm:items-center sm:justify-between sm:gap-5">
          <div><p className="flex items-center gap-2 text-sm font-black text-violet-950"><ShieldCheck className="h-4 w-4" /> Eligible for recognition</p><p className="mt-1 text-xs leading-5 text-violet-800">Would you like to be featured on the TeachPad Teachers page? Nothing is published without your approval.</p></div>
          <button type="button" onClick={() => setRecognitionMilestone(recognitionReward.milestone_days)} className="mt-3 h-10 w-full shrink-0 rounded-card bg-violet-600 px-4 text-xs font-bold text-white hover:bg-violet-700 sm:mt-0 sm:h-9 sm:w-auto">Review profile</button>
        </section>
      )}

      {artifactMessage && <p className="rounded-card bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700" role="status">{artifactMessage}</p>}

      <section className="grid grid-cols-2 gap-2 min-[390px]:gap-3 lg:grid-cols-4">
        <SummaryCard label="Current streak" value={`${summary.data.current_streak} ${summary.data.current_streak === 1 ? "day" : "days"}`} icon={Flame} tone="orange" />
        <SummaryCard label="Best streak" value={`${summary.data.best_streak} ${summary.data.best_streak === 1 ? "day" : "days"}`} icon={Trophy} tone="blue" />
        <SummaryCard label="Teaching days this month" value={String(summary.data.current_month_teaching_days)} icon={CalendarDays} tone="green" />
        <SummaryCard label="Next reward" value={nextReward ? nextReward.status === "unlocked" ? "Unlocked" : `${nextReward.days_remaining} ${nextReward.days_remaining === 1 ? "day" : "days"} left` : "Complete"} icon={Gift} tone="violet" />
      </section>

      <section className="min-w-0 rounded-[20px] border border-white/70 bg-gradient-to-br from-white via-blue-50 to-violet-50 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm min-[390px]:p-4 sm:rounded-[24px] sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
          <h2 className="text-lg font-black text-fg">Rewards roadmap</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Each milestone unlocks once. Badges are available instantly.</p>
          </div>
          <p className="hidden text-micro font-bold uppercase tracking-[0.14em] text-fg-muted sm:block lg:hidden">Swipe to explore</p>
        </div>
        <div className="-mx-3 mt-4 overflow-x-auto overscroll-x-contain px-3 pb-2 [scrollbar-width:thin] min-[390px]:-mx-4 min-[390px]:px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0">
          <div className="grid grid-flow-col auto-cols-[minmax(240px,320px)] gap-3 lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-4 lg:gap-4">
            {rewards.data.items.map((reward, index) => (
              <RewardRoadmapItem key={reward.id} reward={reward} last={index === rewards.data.items.length - 1} onOpenCertificate={() => void openCertificate(reward)} onShare={() => void shareReward(reward)} onRecognition={() => setRecognitionMilestone(reward.milestone_days)} busy={claim.isPending} />
            ))}
          </div>
        </div>
      </section>

      <section className="min-w-0 rounded-[20px] border border-white/70 bg-white/90 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm min-[390px]:p-4 sm:rounded-[24px] sm:p-6">
        <div className="flex flex-col gap-2 min-[390px]:flex-row min-[390px]:items-start min-[390px]:justify-between min-[390px]:gap-4">
          <div>
            <h2 className="text-lg font-black text-fg">{monthName(month.data.year, month.data.month)}</h2>
            <p className="mt-1 text-xs text-slate-500">Badge stickers show when you will unlock each reward if your streak continues.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => changeCalendarMonth(-1)} disabled={month.isFetching} aria-label="Previous month" className="grid h-8 w-8 place-items-center rounded-control border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
            <span className="w-fit shrink-0 rounded-full bg-blue-50 px-3 py-1 text-micro font-bold text-brand ring-1 ring-blue-100 min-[390px]:text-xs">{month.data.days.length} teaching days</span>
            <button type="button" onClick={() => changeCalendarMonth(1)} disabled={month.isFetching} aria-label="Next month" className="grid h-8 w-8 place-items-center rounded-control border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
        <MonthCalendar data={month.data} selectedDate={selectedDate} onSelect={setSelectedDate} />
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-micro font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1.5"><span className="inline-flex rounded-full bg-orange-100 px-1 py-0.5 text-micro ring-1 ring-orange-200" aria-hidden="true">🔥1</span>Active streak day</span><span className="inline-flex items-center gap-1.5"><CalendarRewardBadge milestone={3} compact projected />Projected reward date</span><Legend color="bg-emerald-500" label="Completed" /><Legend color="bg-orange-200 ring-2 ring-orange-100" label="Today pending" /><Legend color="bg-slate-200" label="Missed" />
        </div>
        {selected && (
          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4" aria-live="polite">
            <div className="flex flex-col gap-1 min-[390px]:flex-row min-[390px]:items-center min-[390px]:justify-between min-[390px]:gap-3">
              <p className="text-sm font-black text-slate-900">{formatDate(selected.date)}</p>
              <span className="text-xs font-bold text-blue-700">{selected.resource_count} {selected.resource_count === 1 ? "resource" : "resources"}</span>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-600">{selected.resource_types.map((type) => resourceLabels[type] ?? type).join(" · ")}</p>
            {selected.streak_day && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-700 ring-1 ring-orange-200">
                <span aria-hidden="true">🔥</span> Day {selected.streak_day} of your current active streak
              </p>
            )}
            {selected.reward_milestone && (
              <p className="ml-0 mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-black text-violet-700 shadow-sm ring-1 ring-violet-100 min-[390px]:ml-2">
                <CalendarRewardBadge milestone={selected.reward_milestone} compact />
                {calendarMilestones[selected.reward_milestone].label} milestone reached with an uninterrupted {selected.reward_milestone}-day streak
              </p>
            )}
          </div>
        )}
      </section>
      <CertificateModal reward={certificateReward ?? rewards.data.items[1]} teacherName={teacherName} open={certificateReward != null} onClose={() => setCertificateReward(null)} />
      {recognitionMilestone != null && <RecognitionConsentModal loading={recognition.isLoading} data={recognition.data} onClose={() => setRecognitionMilestone(null)} onDecision={(approved) => consent.mutate({ milestone: recognitionMilestone, approved })} busy={consent.isPending} />}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Flame; tone: "orange" | "blue" | "green" | "violet" }) {
  const styles = {
    orange: { card: "from-amber-50 via-orange-50 to-white", icon: "bg-white text-amber-500 ring-amber-100 shadow-[0_12px_24px_rgba(240,162,47,0.18)]" },
    blue: { card: "from-blue-50 via-blue-50 to-white", icon: "bg-white text-brand ring-blue-100 shadow-[0_12px_24px_rgba(59,130,246,0.18)]" },
    green: { card: "from-emerald-50 via-emerald-50 to-white", icon: "bg-white text-emerald-600 ring-emerald-100 shadow-[0_12px_24px_rgba(36,183,122,0.17)]" },
    violet: { card: "from-violet-50 via-violet-50 to-white", icon: "bg-white text-violet-500 ring-violet-100 shadow-[0_12px_24px_rgba(139,92,246,0.16)]" },
  };
  return <div className={cn("min-w-0 rounded-[16px] border border-white/70 bg-gradient-to-br p-3 shadow-[0_14px_34px_rgba(15,23,42,0.06)] min-[390px]:rounded-[20px] min-[390px]:p-4", styles[tone].card)}><div className={cn("grid h-9 w-9 place-items-center rounded-[13px] ring-1 min-[390px]:h-11 min-[390px]:w-11 min-[390px]:rounded-[15px]", styles[tone].icon)}><Icon className="h-4 w-4 min-[390px]:h-5 min-[390px]:w-5" /></div><p className="mt-3 text-micro font-bold leading-4 text-fg-muted min-[390px]:mt-4 min-[390px]:text-xs">{label}</p><p className="mt-0.5 break-words text-base font-black leading-5 tracking-tight text-fg min-[390px]:mt-1 min-[390px]:text-xl min-[390px]:leading-6">{value}</p></div>;
}

function MonthCalendar({ data, selectedDate, onSelect }: { data: StreakMonth; selectedDate: string | null; onSelect: (date: string) => void }) {
  const activity = useMemo(() => new Map(data.days.map((day) => [day.date, day])), [data.days]);
  const projections = useMemo(() => new Map((data.projected_rewards ?? []).map((reward) => [reward.date, reward.milestone_days] as const)), [data.projected_rewards]);
  const firstWeekday = (new Date(data.year, data.month - 1, 1).getDay() + 6) % 7;
  const totalDays = new Date(data.year, data.month, 0).getDate();
  const cells = Array.from({ length: firstWeekday + totalDays }, (_, index) => index < firstWeekday ? null : index - firstWeekday + 1);
  return (
    <div className="mt-5">
      <div className="grid grid-cols-7 gap-0.5 text-center text-micro font-black uppercase tracking-wide text-slate-400 min-[390px]:gap-1 min-[390px]:text-micro min-[390px]:tracking-wider">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="mt-2 grid grid-cols-7 gap-0.5 min-[390px]:gap-1 sm:gap-1.5">
        {cells.map((day, index) => {
          if (day == null) return <span key={`blank-${index}`} className="aspect-square" />;
          const dateValue = `${data.year}-${String(data.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const record = activity.get(dateValue);
          const isToday = dateValue === data.today;
          const isFuture = dateValue > data.today;
          const isMissed = !record && !isToday && !isFuture;
          const streakDay = record?.streak_day ?? null;
          const projectedMilestone = projections.get(dateValue) ?? null;
          const displayedMilestone = record?.reward_milestone ?? projectedMilestone;
          const milestone = displayedMilestone ? calendarMilestones[displayedMilestone] : null;
          const isProjected = projectedMilestone != null && record?.reward_milestone == null;
          return (
            <button
              key={dateValue}
              type="button"
              onClick={() => record && onSelect(dateValue)}
              disabled={!record}
              aria-label={`${formatDate(dateValue)}${record ? `, ${record.resource_count} resources generated${streakDay ? `, day ${streakDay} of your current active streak` : ""}${record.reward_milestone && milestone ? `, ${milestone.label} milestone reached for a ${record.reward_milestone}-day streak` : ""}` : isToday ? ", today pending" : isFuture ? ", future" : ", no teaching activity"}${isProjected && milestone ? `, ${milestone.label} projected if your streak continues` : ""}`}
              className={cn(
                "relative aspect-square min-w-0 overflow-visible rounded-[8px] border text-micro font-bold transition focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand min-[390px]:rounded-[10px] min-[390px]:text-xs sm:rounded-[13px]",
                record && "cursor-pointer border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                streakDay && "border-amber-200 bg-gradient-to-br from-amber-50 via-emerald-50 to-white ring-2 ring-amber-50",
                milestone && "border-violet-300 bg-gradient-to-br from-violet-50 to-white text-violet-600 ring-2 ring-violet-100",
                selectedDate === dateValue && "border-brand ring-2 ring-blue-100",
                isToday && !record && "border-amber-200 bg-amber-50 text-orange-700 ring-2 ring-amber-50",
                isMissed && "border-slate-100 bg-teachpad-tag text-fg-muted",
                isFuture && "border-slate-100 bg-white text-slate-300",
                isProjected && "border-dashed border-violet-300 bg-gradient-to-br from-violet-50 to-white text-violet-600 ring-2 ring-violet-100",
              )}
            >
              <span className={cn((streakDay || milestone) && "absolute left-1 top-0.5 min-[390px]:left-1.5 min-[390px]:top-1")}>{day}</span>
              {streakDay && (
                <span className="absolute right-0.5 top-0.5 inline-flex items-center gap-0.5 rounded-full border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-100 px-1 py-0.5 text-micro font-black leading-none text-orange-700 shadow-sm min-[390px]:right-1 min-[390px]:top-1 min-[390px]:text-micro sm:right-1.5 sm:top-1.5 sm:px-1.5 sm:py-1 sm:text-micro" aria-hidden="true">
                  <span>🔥</span><span className="hidden sm:inline">Day</span><span>{streakDay}</span>
                </span>
              )}
              {milestone && displayedMilestone ? (
                <CalendarRewardBadge milestone={displayedMilestone} projected={isProjected} />
              ) : record ? (
                <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-emerald-500" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CalendarRewardBadge({ milestone, compact = false, projected = false }: { milestone: 3 | 7 | 14 | 30; compact?: boolean; projected?: boolean }) {
  const badge = calendarMilestones[milestone];
  if (badge.artwork) {
    return (
      <span aria-hidden="true" className={cn("relative grid shrink-0 place-items-center", compact ? "h-5 w-5" : "absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2")}>
        <img src={badge.artwork} alt="" className={cn("h-full w-full object-contain drop-shadow-[0_3px_3px_rgba(15,23,42,0.25)]", projected && "opacity-55 grayscale saturate-0")} />
        {projected && (
          <span className={cn("absolute grid place-items-center rounded-full border border-white bg-slate-700 text-white shadow-md", compact ? "-bottom-1 -right-1 h-3 w-3" : "bottom-[6%] right-[3%] h-[30%] w-[30%]")}>
            <Lock className={compact ? "h-2 w-2" : "h-[55%] w-[55%]"} />
          </span>
        )}
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={cn("grid place-items-center rounded-full bg-gradient-to-br from-violet-500 to-amber-400 text-white shadow-[0_3px_6px_rgba(124,58,237,0.3)] ring-1 ring-white", compact ? "h-5 w-5" : "absolute bottom-1 right-1 h-[55%] w-[55%]")}>
      <Award className={compact ? "h-3 w-3" : "h-[58%] w-[58%]"} />
    </span>
  );
}

function RewardRoadmapItem({ reward, last, onOpenCertificate, onShare, onRecognition, busy }: { reward: StreakReward; last: boolean; onOpenCertificate: () => void; onShare: () => void; onRecognition: () => void; busy: boolean }) {
  const tones = {
    bronze: { card: "border-amber-200 bg-gradient-to-br from-amber-50 to-white", node: "border-amber-400 bg-amber-50 text-orange-700", line: "bg-amber-200" },
    silver: { card: "border-slate-200 bg-gradient-to-br from-blue-50 to-white", node: "border-slate-300 bg-white text-slate-500", line: "bg-slate-200" },
    gold: { card: "border-amber-200 bg-gradient-to-br from-amber-50 to-white", node: "border-amber-500 bg-amber-50 text-amber-700", line: "bg-amber-200" },
    champion: { card: "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-orange-50", node: "border-violet-400 bg-violet-100 text-violet-600", line: "bg-violet-200" },
  }[reward.badge_tier];
  return (
    <div className="relative flex min-w-0 flex-col">
      <div className="flex items-center px-1">
        <span className={cn("relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border text-micro font-black shadow-sm min-[390px]:h-9 min-[390px]:w-9 min-[390px]:text-xs", tones.node, reward.status === "claimed" && "border-emerald-600 bg-emerald-600 text-white", reward.status === "unlocked" && "ring-4 ring-white", reward.status === "in_progress" && "border-brand bg-blue-50 text-brand")}>
          {reward.status === "claimed" ? <Check className="h-4 w-4" /> : reward.milestone_days}
        </span>
        {!last && <span className={cn("ml-2 h-px flex-1", tones.line)} />}
      </div>
      <div className={cn("mt-2 flex min-w-0 flex-1 flex-col rounded-[15px] border p-3 shadow-[0_8px_22px_rgba(15,23,42,0.035)] min-[390px]:rounded-[18px] min-[390px]:p-3.5", tones.card)}>
        <div className="flex min-w-0 items-start justify-between gap-2">
          <p className="text-xs font-black text-fg min-[390px]:text-sm">{reward.milestone_days} teaching days</p>
          <StatusLabel reward={reward} />
        </div>
        <p className="mt-1 min-h-8 break-words text-micro font-semibold leading-4 text-fg-muted min-[390px]:text-xs">{reward.reward_label}</p>
        <RewardArtwork tier={reward.badge_tier} muted={reward.status === "locked" || reward.status === "expired"} className="mt-3 !aspect-auto !h-28 min-[390px]:!h-32" />
        {(reward.status === "unlocked" || reward.status === "claimed") && <div className="mt-3 flex flex-col gap-2">{reward.has_certificate ? <button type="button" onClick={onOpenCertificate} disabled={busy} className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] bg-gradient-to-r from-brand to-blue-600 px-3 text-xs font-bold text-white shadow-[0_8px_16px_rgba(22,119,255,0.18)] hover:-translate-y-0.5 disabled:opacity-60"><Eye className="h-3.5 w-3.5" />View certificate</button> : <button type="button" onClick={onShare} className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] bg-gradient-to-r from-brand to-blue-600 px-3 text-xs font-bold text-white shadow-[0_8px_16px_rgba(22,119,255,0.18)] hover:-translate-y-0.5"><Share2 className="h-3.5 w-3.5" />Share card</button>}{reward.recognition_eligible && <button type="button" onClick={onRecognition} className="inline-flex h-9 w-full items-center justify-center rounded-[10px] border border-violet-200 bg-white px-3 text-xs font-bold text-violet-600 hover:bg-violet-50">{reward.recognition_consent ? "Feature approved" : "Review recognition"}</button>}</div>}
      </div>
    </div>
  );
}

function RecognitionConsentModal({ loading, data, onClose, onDecision, busy }: { loading: boolean; data: Awaited<ReturnType<typeof backendApi.streakRecognitionProfile>> | undefined; onClose: () => void; onDecision: (approved: boolean) => void; busy: boolean }) {
  return (
    <div className="fixed inset-0 z-[105] flex items-center justify-center bg-fg/55 p-2 backdrop-blur-sm min-[390px]:p-4" role="dialog" aria-modal="true" aria-labelledby="recognition-title">
      <div className="max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-[20px] border border-white/70 bg-white shadow-[0_28px_80px_rgba(7,27,73,0.24)] min-[390px]:max-h-[calc(100dvh-2rem)] min-[390px]:rounded-[26px]">
        <div className="relative border-b border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-4 min-[390px]:p-5 sm:p-6">
          <div className="pr-12"><p className="text-micro font-black uppercase tracking-[0.18em] text-pink-500">Privacy review</p><h2 id="recognition-title" className="mt-2 text-xl font-black leading-7 text-fg">Would you like to be featured on the TeachPad Teachers page?</h2></div>
          <button type="button" onClick={onClose} aria-label="Close" className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-card bg-white/90 text-fg-muted shadow-sm ring-1 ring-white hover:bg-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 min-[390px]:p-5 sm:p-6">
          {loading || !data?.profile ? <div className="h-40 animate-pulse rounded-[18px] bg-teachpad-tag" /> : <><p className="text-sm font-semibold leading-6 text-fg-muted">Review exactly what will be public. Only this approved snapshot will be shown.</p><div className="mt-4 rounded-[20px] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="h-14 w-14 overflow-hidden rounded-full bg-white ring-4 ring-blue-100"><BoyAvatar avatarKey={data.profile.avatar_key} alt="" /></div><div><p className="font-black text-fg">{data.profile.display_name}</p><p className="text-xs font-semibold text-brand">{data.profile.current_streak}-day teaching streak</p></div></div><dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2"><div><dt className="font-bold text-fg-muted">School</dt><dd className="mt-1 font-semibold text-gray-600">{data.profile.school || "Not provided"}</dd></div><div><dt className="font-bold text-fg-muted">District</dt><dd className="mt-1 font-semibold text-gray-600">{data.profile.district || "Not provided"}</dd></div></dl></div></>}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={busy} onClick={() => onDecision(false)} className="h-10 rounded-card border border-gray-200 bg-white px-4 text-sm font-bold text-fg-muted hover:bg-teachpad-input disabled:opacity-60">Not now</button><button type="button" disabled={busy || loading || !data?.profile} onClick={() => onDecision(true)} className="h-10 rounded-card bg-gradient-to-r from-brand to-blue-600 px-4 text-sm font-bold text-white shadow-[0_10px_22px_rgba(22,119,255,0.18)] hover:-translate-y-0.5 disabled:opacity-60">Yes, feature my profile</button></div>
        </div>
      </div>
    </div>
  );
}

function StatusLabel({ reward }: { reward: StreakReward }) {
  const recognitionReady = reward.recognition_eligible && (reward.status === "unlocked" || reward.status === "claimed") && reward.recognition_consent !== true;
  const copy = recognitionReady ? "Eligible for recognition" : reward.recognition_consent === true ? "Approved" : reward.status === "claimed" ? "Claimed" : reward.status === "unlocked" ? "Unlocked" : reward.status === "in_progress" ? `${reward.days_remaining} days left` : reward.status === "expired" ? "Expired" : "Locked";
  return <span className={cn("max-w-full shrink-0 whitespace-normal rounded-full px-2 py-1 text-left text-micro font-black leading-3 ring-1 ring-white min-[390px]:text-micro", reward.status === "claimed" && "bg-emerald-100 text-emerald-700", reward.status === "unlocked" && "bg-amber-50 text-orange-700", reward.status === "in_progress" && "bg-blue-100 text-brand", (reward.status === "locked" || reward.status === "expired") && "bg-slate-100 text-fg-muted")}>{copy}</span>;
}

function Legend({ color, label }: { color: string; label: string }) { return <span className="inline-flex items-center gap-1.5"><span className={cn("h-2.5 w-2.5 rounded-full", color)} />{label}</span>; }
function monthName(year: number, month: number) { return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1)); }
function formatDate(value: string) { const [year, month, day] = value.split("-").map(Number); return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(year, month - 1, day)); }
function JourneySkeleton() { return <div className="mx-auto max-w-[1180px] space-y-6 px-4 py-7"><div className="h-52 animate-pulse rounded-[28px] bg-gradient-to-r from-blue-50 to-teachpad-input" /><div className="grid gap-3 sm:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-[20px] bg-teachpad-tag" />)}</div><div className="grid gap-6 lg:grid-cols-2"><div className="h-[520px] animate-pulse rounded-[24px] bg-teachpad-tag" /><div className="h-[520px] animate-pulse rounded-[24px] bg-teachpad-tag" /></div></div>; }
