"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Award, ArrowRight } from "lucide-react";
import { backendApi } from "@/lib/api";
import { TeachingBadge } from "@/components/streak/reward-artifacts";

export function ProfileTeachingBadges() {
  const rewards = useQuery({ queryKey: ["teaching-streak", "rewards"], queryFn: backendApi.streakRewards });
  const earned = rewards.data?.items.filter((reward) => reward.status === "unlocked" || reward.status === "claimed") ?? [];
  if (rewards.isLoading) return <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />;
  return (
    <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-violet-50 p-4">
      <div className="flex flex-col items-start gap-2 min-[390px]:flex-row min-[390px]:justify-between min-[390px]:gap-3"><div><p className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><Award className="h-4 w-4 text-amber-600" /> Teaching badges</p><p className="mt-1 text-xs text-slate-500">Recognition earned through consistent teaching.</p></div><Link href="/dashboard/streak" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">Journey <ArrowRight className="h-3.5 w-3.5" /></Link></div>
      {earned.length ? <div className="mt-3 flex flex-wrap gap-2">{earned.map((reward) => <TeachingBadge key={reward.id} tier={reward.badge_tier} label={reward.badge_tier === "champion" ? "Champion Teacher" : `${reward.badge_tier[0].toUpperCase()}${reward.badge_tier.slice(1)} Teacher`} />)}</div> : <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-xs font-semibold text-slate-500">Complete a 3-day teaching streak to unlock your Bronze badge.</p>}
    </div>
  );
}
