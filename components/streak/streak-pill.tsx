"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Gift, RotateCcw, X } from "lucide-react";
import {
  backendApi,
  GENERATION_COMPLETED_EVENT,
  type StreakReward,
  type StreakSummary,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export const STREAK_SUMMARY_QUERY_KEY = ["teaching-streak", "summary"] as const;

export function StreakPill({ mobile = false }: { mobile?: boolean }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const viewed = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeDrawer = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);
  const summary = useQuery({
    queryKey: STREAK_SUMMARY_QUERY_KEY,
    queryFn: backendApi.streakSummary,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!summary.data || viewed.current) return;
    viewed.current = true;
    void backendApi.trackStreakEvent({
      event_name: "streak_pill_viewed",
      current_streak: summary.data.current_streak,
    }).catch(() => undefined);
  }, [summary.data]);

  useEffect(() => {
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ["teaching-streak"] });
    };
    window.addEventListener(GENERATION_COMPLETED_EVENT, refresh);
    return () => window.removeEventListener(GENERATION_COMPLETED_EVENT, refresh);
  }, [queryClient]);

  const label = summary.isLoading
    ? "🔥 Streak"
    : summary.data && summary.data.current_streak > 0
      ? `🔥 ${summary.data.current_streak}-day streak`
      : "🔥 Start streak";
  function openDrawer() {
    setOpen(true);
    void backendApi.trackStreakEvent({
      event_name: "streak_pill_clicked",
      current_streak: summary.data?.current_streak,
    }).catch(() => undefined);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openDrawer}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "inline-flex h-9 items-center justify-center rounded-full border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-3 text-xs font-extrabold text-orange-700 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:from-orange-100 hover:to-amber-100 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 active:translate-y-px",
          mobile && "h-8 min-w-8 px-1.5 text-[11px] min-[390px]:px-2.5",
          summary.isLoading && "animate-pulse",
        )}
      >
        {mobile ? <span aria-hidden="true">🔥</span> : label}
      </button>
      <StreakDrawer
        open={open}
        onClose={closeDrawer}
        summary={summary.data}
      />
    </>
  );
}

function StreakDrawer({ open, onClose, summary }: { open: boolean; onClose: () => void; summary?: StreakSummary }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const week = useQuery({
    queryKey: ["teaching-streak", "week"],
    queryFn: backendApi.streakWeek,
    enabled: open,
  });
  const rewards = useQuery({
    queryKey: ["teaching-streak", "rewards"],
    queryFn: backendApi.streakRewards,
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    void backendApi.trackStreakEvent({
      event_name: "streak_drawer_opened",
      current_streak: summary?.current_streak,
    }).catch(() => undefined);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open, summary?.current_streak]);

  if (!open) return null;
  const unlocked = rewards.data?.items.find((reward) => reward.status === "unlocked" && reward.reward_type !== "badge");
  const nextReward = unlocked ?? summary?.next_reward;

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      <button className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]" onClick={onClose} aria-label="Close teaching streak" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="streak-drawer-title"
        className="absolute right-0 top-0 flex h-[100dvh] w-full max-w-full flex-col border-l border-[#d9e5f3] bg-[linear-gradient(180deg,#f4f9ff_0%,#ffffff_210px)] shadow-2xl sm:w-[420px]"
      >
        <header className="relative flex min-h-[96px] items-start justify-between overflow-hidden border-b border-[#dbeafe] px-4 py-4 min-[390px]:min-h-[108px] min-[390px]:px-5 min-[390px]:py-5 sm:px-6">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f45f98]">Keep showing up</p>
            <h2 id="streak-drawer-title" className="mt-1 text-xl font-black text-[#071b49]">Your Teaching Streak</h2>
            <span className="mt-2 block h-1 w-12 rounded-full bg-gradient-to-r from-[#1677ff] to-[#16a9b6]" />
          </div>
          <img src="/avatars/elif-celebrate.png" alt="" aria-hidden="true" className="pointer-events-none absolute -bottom-10 right-11 hidden h-28 w-28 object-contain opacity-95 min-[350px]:block min-[390px]:-bottom-12 min-[390px]:right-12 min-[390px]:h-32 min-[390px]:w-32" />
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="relative z-10 grid h-9 w-9 place-items-center rounded-xl bg-white/80 text-[#6d6f78] shadow-sm ring-1 ring-white transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ff]">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 min-[390px]:px-5 min-[390px]:py-5 sm:px-6">
          {!summary ? <DrawerSkeleton /> : (
            <>
              <section className="rounded-[22px] border border-white/80 bg-gradient-to-br from-[#fffaf0] via-white to-[#eff6ff] p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
                <p className="text-4xl font-black tracking-tight text-[#071b49]">🔥 {summary.current_streak} {summary.current_streak === 1 ? "day" : "days"}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#6d6f78]">{drawerCopy(summary)}</p>
                <p className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-[#126de8] shadow-sm ring-1 ring-[#dbeafe]">Best streak: {summary.best_streak} {summary.best_streak === 1 ? "day" : "days"}</p>
              </section>

              <section className="mt-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">This week</h3>
                    <p className="mt-1 text-xs text-slate-500">Monday to Sunday</p>
                  </div>
                  {week.data && <span className="text-xs font-bold text-blue-600">{week.data.completed_count} of 7</span>}
                </div>
                {week.isLoading ? <div className="mt-4 h-20 animate-pulse rounded-2xl bg-slate-100" /> : week.isError ? (
                  <RetryState label="Could not load this week" onRetry={() => void week.refetch()} />
                ) : week.data ? (
                  <>
                    <div className="mt-4 grid grid-cols-7 gap-1.5">
                      {week.data.days.map((day) => <WeekDay key={day.date} day={day} />)}
                    </div>
                    <p className="mt-4 text-xs font-semibold text-slate-600">{week.data.completed_count} of 7 teaching days completed this week</p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" aria-label={`${week.data.completed_count} of 7 teaching days completed`}>
                      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${(week.data.completed_count / 7) * 100}%` }} />
                    </div>
                  </>
                ) : null}
              </section>

              <section className={cn("mt-6 rounded-[22px] border p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]", unlocked ? "border-[#c7f7ed] bg-gradient-to-br from-[#ecfff6] to-white" : "border-[#dbeafe] bg-gradient-to-br from-[#eff6ff] to-white")}>
                <div className="flex items-center gap-2 text-sm font-black text-slate-900"><Gift className="h-4 w-4 text-blue-600" /> Next reward</div>
                {rewards.isError ? <RetryState label="Could not load rewards" onRetry={() => void rewards.refetch()} /> : nextReward ? (
                  <div className="mt-3">
                    <p className="text-lg font-black text-slate-950">{nextReward.status === "unlocked" ? "Reward unlocked" : remainingCopy(nextReward)}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">🎁 Unlock {nextReward.reward_label}</p>
                    {nextReward.status === "unlocked" ? (
                      <Link href="/dashboard/streak" onClick={onClose} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#24b77a] to-[#159565] px-4 text-sm font-bold text-white shadow-[0_10px_22px_rgba(36,183,122,0.18)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24b77a] focus-visible:ring-offset-2">View certificate <ArrowRight className="h-4 w-4" /></Link>
                    ) : (
                      <Link
                        href="/dashboard/classroom-tools"
                        onClick={() => {
                          onClose();
                          void backendApi.trackStreakEvent({ event_name: "streak_cta_clicked", current_streak: summary.current_streak, milestone: nextReward.milestone_days }).catch(() => undefined);
                        }}
                        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1677ff] to-[#0969e8] px-4 text-sm font-bold text-white shadow-[0_10px_22px_rgba(22,119,255,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(22,119,255,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ff] focus-visible:ring-offset-2"
                      >
                        {summary.has_started ? "Create today’s resource" : "Create your first resource"}<ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                ) : <p className="mt-3 text-sm text-slate-600">You’ve completed the current reward roadmap.</p>}
              </section>
            </>
          )}
        </div>

        <footer className="shrink-0 border-t border-[#edf2f8] bg-white/90 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur min-[390px]:px-5 min-[390px]:pb-[calc(1rem+env(safe-area-inset-bottom))] min-[390px]:pt-4 sm:px-6">
          <Link
            href="/dashboard/streak"
            onClick={() => {
              onClose();
            }}
            className="flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-bold text-[#126de8] transition hover:bg-[#eef6ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ff]"
          >
            View full journey <ArrowRight className="h-4 w-4" />
          </Link>
        </footer>
      </aside>
    </div>
  );
}

function WeekDay({ day }: { day: { date: string; label: string; status: "completed" | "pending" | "future" | "missed" } }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-bold text-slate-500">{day.label}</p>
      <div className={cn(
        "mx-auto mt-2 grid h-8 w-8 place-items-center rounded-full border text-xs font-black",
        day.status === "completed" && "border-emerald-500 bg-emerald-500 text-white",
        day.status === "pending" && "border-orange-300 bg-orange-50 text-orange-600 ring-2 ring-orange-100",
        day.status === "future" && "border-slate-200 bg-white text-slate-300",
        day.status === "missed" && "border-slate-100 bg-slate-100 text-slate-400",
      )}>
        {day.status === "completed" ? <Check className="h-4 w-4" /> : "—"}
      </div>
    </div>
  );
}

function DrawerSkeleton() {
  return <div className="space-y-5"><div className="h-36 animate-pulse rounded-2xl bg-slate-100" /><div className="h-28 animate-pulse rounded-2xl bg-slate-100" /><div className="h-40 animate-pulse rounded-2xl bg-slate-100" /></div>;
}

function RetryState({ label, onRetry }: { label: string; onRetry: () => void }) {
  return <button type="button" onClick={onRetry} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-white"><RotateCcw className="h-3.5 w-3.5" />{label}. Retry</button>;
}

function drawerCopy(summary: StreakSummary) {
  if (!summary.has_started) return "Create your first classroom resource to begin your teaching streak.";
  if (summary.current_streak === 0) return "Create a classroom resource today to begin a new teaching streak.";
  if (summary.current_streak === 1) return "Great start. Come back on your next teaching day to continue your streak.";
  return `You’ve used TeachPad on ${summary.total_teaching_days} teaching days.`;
}

function remainingCopy(reward: StreakReward) {
  return `${reward.days_remaining} more teaching ${reward.days_remaining === 1 ? "day" : "days"}`;
}
