"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Clock3, Sparkles } from "lucide-react";
import type { ComponentType } from "react";

import { useBilling } from "@/lib/use-billing";
import { cn } from "@/lib/utils";

type Tone = "info" | "warn" | "danger";

const TONE: Record<Tone, string> = {
  info: "border-blue-100 bg-blue-50/80 text-teachpad-blue",
  warn: "border-amber-200/80 bg-amber-50/90 text-amber-700",
  danger: "border-rose-200/80 bg-rose-50/90 text-[#eb3b5a]",
};

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

/**
 * A persistent, low-key reminder of the user's trial / access state, rendered in
 * the app shell on every teacher page (except the billing page itself, which is
 * the full surface). It keeps the "you're on a trial — you'll need to upgrade"
 * fact visible and one tap from checkout. Hidden for active paying subscribers,
 * and silent while billing is loading / disabled / errored.
 *
 * Drives off the real backend `BillingMe` values: status is one of
 * trialing|active|comped|past_due|canceled|free (NOT "trial"/"cancelled").
 */
export function TrialStatusPill({ placement = "content" }: { placement?: "content" | "header" }) {
  const pathname = usePathname();
  const { data, isLoading, isError } = useBilling();

  if (pathname?.startsWith("/dashboard/billing")) return null;
  if (isLoading || isError || !data) return null;

  const { status, is_pro, days_left, gift, paid_starts_at } = data;
  const days = days_left ?? 0;
  const hasUpgraded = Boolean(paid_starts_at);

  if (gift.granted) return null;

  let tone: Tone = "info";
  let Icon: ComponentType<{ className?: string }> = Sparkles;
  let label = "";
  let cta = "Upgrade";

  if (status === "trialing" && !hasUpgraded) {
    Icon = Sparkles;
    if (days_left != null && days_left <= 2) {
      tone = "warn";
      label = `Trial ends in ${plural(days, "day")}`;
      cta = "Upgrade now";
    } else {
      label = `Free trial · ${plural(days, "day")} left`;
    }
  } else if (!is_pro) {
    Icon = Clock3;
    tone = "danger";
    label = "Your trial has ended";
    cta = "Upgrade to continue";
  } else {
    // Active paid subscriber (or admin-comped) — no nudge needed.
    return null;
  }

  return (
    <div className={cn(placement === "content" && "mb-4 flex justify-end")}>
      <Link
        href="/dashboard/billing"
        aria-label={`${label}. ${cta}.`}
        className={cn(
          "group inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-sm backdrop-blur-sm transition-all hover:-translate-y-px hover:shadow-md",
          TONE[tone]
        )}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span>{label}</span>
        <span className="ml-0.5 inline-flex items-center gap-0.5 font-bold">
          {cta}
          <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </Link>
    </div>
  );
}
