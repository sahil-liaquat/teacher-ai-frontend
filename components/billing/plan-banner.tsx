"use client";

import Link from "next/link";
import { ArrowRight, Crown, Gift, Zap } from "lucide-react";
import { useBilling } from "@/lib/use-billing";
import { Button } from "@/components/ui/button";
import { useUpgradeModal } from "@/components/billing/upgrade-modal";
import { cn } from "@/lib/utils";

/**
 * Thin contextual banner shown at the top of dashboard content.
 *
 * - Pro / active trial → "Pro — active until <date>" or "Trial: N days left"
 * - Gift active        → same as Pro but with a gift icon
 * - Free               → "{used}/{quota} generations this month" + Upgrade button
 * - Loading / error    → renders nothing (avoids layout shift)
 */
export function PlanBanner() {
  const { data, isLoading, isError } = useBilling();
  const { openUpgrade } = useUpgradeModal();

  if (isLoading || isError || !data) return null;

  const { is_pro, status, days_left, access_until, monthly_used, monthly_quota, gift } = data;

  // ── Pro / Gift / Trial ─────────────────────────────────────────────────────
  if (is_pro || gift.granted) {
    const accessLabel = access_until
      ? new Intl.DateTimeFormat(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(new Date(access_until))
      : null;

    const isGift = gift.granted;
    const isTrial = status === "trial" || (days_left !== null && days_left <= 7);

    return (
      <div
        className={cn(
          "mb-3 flex items-center justify-between gap-3 rounded-[18px] border px-4 py-2.5",
          isGift
            ? "border-purple-100 bg-gradient-to-r from-purple-50 to-white"
            : isTrial
              ? "border-amber-100 bg-gradient-to-r from-amber-50 to-white"
              : "border-blue-100 bg-gradient-to-r from-[#eff6ff] to-white"
        )}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-xl",
              isGift
                ? "bg-purple-100 text-purple-600"
                : isTrial
                  ? "bg-amber-100 text-amber-600"
                  : "bg-[#dbeafe] text-teachpad-blue"
            )}
          >
            {isGift ? (
              <Gift className="h-4 w-4" />
            ) : isTrial ? (
              <Zap className="h-4 w-4" />
            ) : (
              <Crown className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0">
            <p
              className={cn(
                "text-sm font-extrabold",
                isGift
                  ? "text-purple-800"
                  : isTrial
                    ? "text-amber-800"
                    : "text-[#1e40af]"
              )}
            >
              {isGift
                ? "Gift Pro active"
                : isTrial
                  ? days_left !== null
                    ? `Trial: ${days_left} day${days_left === 1 ? "" : "s"} left`
                    : "Trial active"
                  : "TeachPad Pro"}
            </p>
            {accessLabel && (
              <p
                className={cn(
                  "text-xs font-semibold",
                  isGift
                    ? "text-purple-500"
                    : isTrial
                      ? "text-amber-600"
                      : "text-teachpad-muted"
                )}
              >
                Active until {accessLabel}
              </p>
            )}
          </div>
        </div>

        <Link
          href="/dashboard/billing"
          className={cn(
            "flex shrink-0 items-center gap-1 text-xs font-bold transition-colors",
            isGift
              ? "text-purple-500 hover:text-purple-700"
              : isTrial
                ? "text-amber-600 hover:text-amber-800"
                : "text-teachpad-blue hover:text-blue-700"
          )}
        >
          Manage
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  // ── Free plan ──────────────────────────────────────────────────────────────
  const used = monthly_used ?? 0;
  const quota = monthly_quota ?? null;
  const nearLimit = quota !== null && used >= quota * 0.8;
  const atLimit = quota !== null && used >= quota;

  return (
    <div
      className={cn(
        "mb-3 flex items-center justify-between gap-3 rounded-[18px] border px-4 py-2.5",
        atLimit
          ? "border-red-100 bg-gradient-to-r from-red-50 to-white"
          : nearLimit
            ? "border-amber-100 bg-gradient-to-r from-amber-50 to-white"
            : "border-teachpad-cardBorder bg-gradient-to-r from-teachpad-tag to-white"
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-xl",
            atLimit
              ? "bg-red-100 text-red-500"
              : nearLimit
                ? "bg-amber-100 text-amber-600"
                : "bg-teachpad-tag text-teachpad-muted"
          )}
        >
          <Zap className="h-4 w-4" />
        </span>
        <p
          className={cn(
            "text-sm font-extrabold",
            atLimit
              ? "text-red-700"
              : nearLimit
                ? "text-amber-800"
                : "text-teachpad-ink"
          )}
        >
          Free plan
          {quota !== null && (
            <span className="ml-1.5 font-bold text-teachpad-muted">
              — {used}/{quota} generations this month
            </span>
          )}
        </p>
      </div>

      <Button
        size="sm"
        onClick={() => openUpgrade()}
        className={cn(
          "h-8 shrink-0 rounded-xl px-3 text-xs",
          atLimit || nearLimit
            ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_8px_18px_rgba(245,158,11,0.30)]"
            : ""
        )}
      >
        Upgrade
      </Button>
    </div>
  );
}
