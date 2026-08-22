"use client";

import { useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CreditCard,
  Gift,
  Loader2,
  RotateCcw,
  Tag,
  Zap,
} from "lucide-react";
import { DashboardBannerHeader } from "@/components/dashboard-banner-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { backendApi } from "@/lib/api";
import type { BillingMe } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { useBilling } from "@/lib/use-billing";
import { useUpgradeModal } from "@/components/billing/upgrade-modal";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function formatDatetime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { data, isLoading, isError, refetch } = useBilling();
  const { openUpgrade } = useUpgradeModal();
  const { toast } = useToast();

  const [redeemCode, setRedeemCode] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);

  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // ── Redeem ────────────────────────────────────────────────────────────────

  async function handleRedeem() {
    const trimmed = redeemCode.trim();
    if (!trimmed) return;

    setRedeemLoading(true);
    try {
      await backendApi.billingRedeem(trimmed);
      await refetch();
      setRedeemCode("");
      toast({
        title: "Code redeemed!",
        description: "Your plan has been updated successfully.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Could not redeem code",
        description: getErrorMessage(err, "Please check the code and try again."),
        variant: "error",
      });
    } finally {
      setRedeemLoading(false);
    }
  }

  // ── Cancel ────────────────────────────────────────────────────────────────

  async function handleCancel() {
    if (!cancelConfirm) {
      setCancelConfirm(true);
      return;
    }

    setCancelLoading(true);
    try {
      await backendApi.billingCancel();
      await refetch();
      setCancelConfirm(false);
      toast({
        title: "Subscription cancelled",
        description:
          "Your Pro access will remain active until the current period ends.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Could not cancel subscription",
        description: getErrorMessage(err, "Please try again."),
        variant: "error",
      });
    } finally {
      setCancelLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-8 px-4 py-4">
      <DashboardBannerHeader
        titleTop="Billing &"
        titleHighlight="subscription"
        imageSrc="/landing/rocket-3d-v2.png"
        imageClassName="object-center"
      />

      {isLoading && (
        <div className="grid place-items-center rounded-[22px] border border-white/70 bg-white/86 py-16 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-teachpad-blue" />
          <p className="mt-3 text-sm font-semibold text-teachpad-muted">
            Loading billing info...
          </p>
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-4 rounded-[24px] border border-red-200 bg-red-50 px-5 py-5 shadow-sm">
          <AlertTriangle className="h-6 w-6 shrink-0 text-red-500" />
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-red-700">
              Could not load billing info
            </p>
            <p className="mt-1 text-sm font-semibold text-red-500">
              Please refresh the page or try again later.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RotateCcw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && data && (
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          {/* ── Left column ─────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Failed recurring payment — top of the page, above everything,
                because nothing else here matters until it's cleared. */}
            {data.past_due && <PastDueBanner pastDue={data.past_due} />}

            {/* Influencer-comp auto-convert nudge — add a card now, charged at comp-end */}
            {data.can_setup_mandate && (
              <MandateNudge
                until={data.access_until}
                onSetup={() =>
                  openUpgrade(
                    "Add a payment method so your Pro access continues after your free period.",
                  )
                }
              />
            )}

            {/* Current plan card */}
            <PlanCard data={data} onUpgrade={() => openUpgrade()} />

            {/* Redeem code */}
            <RedeemCard
              code={redeemCode}
              onChange={setRedeemCode}
              onRedeem={handleRedeem}
              loading={redeemLoading}
            />
          </div>

          {/* ── Right column ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Account / usage details */}
            <UsageCard data={data} />

            {/* Cancel subscription — only when there's a live paid subscription
                left to cancel (never for comp/gift/trial grants). */}
            {data.can_cancel && (
              <CancelCard
                confirm={cancelConfirm}
                loading={cancelLoading}
                onCancel={handleCancel}
                onAbort={() => setCancelConfirm(false)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Past-due banner (failed recurring payment) ───────────────────────────────

/**
 * The full account of a failed recurring payment: what happened, what it means
 * for access right now, and the one-tap way out.
 *
 * Only rendered when `past_due` is present — never derived from `is_pro`, which
 * is equally false for an ordinary expired trial.
 */
function PastDueBanner({ pastDue }: { pastDue: NonNullable<BillingMe["past_due"]> }) {
  const amount = pastDue.amount_inr != null ? `₹${pastDue.amount_inr.toLocaleString("en-IN")}` : null;
  const inGrace = pastDue.in_grace;

  return (
    <div
      className={cn(
        "rounded-[22px] border p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]",
        inGrace ? "border-amber-200 bg-amber-50/80" : "border-rose-200 bg-rose-50/80"
      )}
    >
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-[16px]",
            inGrace ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-[#eb3b5a]"
          )}
        >
          <AlertTriangle className="h-6 w-6" />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className={cn("text-base font-extrabold", inGrace ? "text-amber-900" : "text-rose-900")}>
            {inGrace ? "Your renewal payment failed" : "Your plan is paused"}
          </h3>

          <p className={cn("mt-1 text-sm font-medium leading-5", inGrace ? "text-amber-800" : "text-rose-800")}>
            {inGrace ? (
              <>
                We couldn&apos;t collect {amount ? <>your {amount} renewal</> : "your renewal"}. You still
                have full access until{" "}
                <span className="font-bold">{formatDate(pastDue.grace_until)}</span> — clear the
                payment before then and nothing changes.
              </>
            ) : (
              <>
                We couldn&apos;t collect {amount ? <>your {amount} renewal</> : "your renewal"} after{" "}
                {pastDue.attempts > 1 ? `${pastDue.attempts} attempts` : "a failed attempt"}, so
                generation is paused. Everything you&apos;ve made is still saved and waiting.
              </>
            )}
          </p>

          {pastDue.last_error && (
            <p className={cn("mt-1.5 text-xs font-semibold", inGrace ? "text-amber-700" : "text-rose-700")}>
              Reason from your bank: {pastDue.last_error}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {pastDue.invoice_url ? (
              <a
                href={pastDue.invoice_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-teachpad-blue px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <CreditCard className="h-4 w-4" />
                {amount ? `Pay ${amount} now` : "Pay pending amount"}
              </a>
            ) : (
              <p className="text-xs font-semibold text-teachpad-muted">
                Your bank will retry automatically. Make sure your account has
                enough balance, or cancel below and start a fresh subscription.
              </p>
            )}
            {pastDue.since && (
              <span className="text-xs font-medium text-teachpad-muted">
                First failed on {formatDate(pastDue.since)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mandate nudge (influencer comp → add a card to auto-convert) ─────────────

function MandateNudge({
  until,
  onSetup,
}: {
  until: string | null;
  onSetup: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[22px] border border-white/70 bg-gradient-to-br from-[#eff6ff] via-white to-[#f8fbff] px-5 py-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm">
      <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-teachpad-blue" />
      <div className="min-w-0 flex-1">
        <p className="font-extrabold text-teachpad-ink">Keep your access uninterrupted</p>
        <p className="mt-1 text-sm font-medium text-teachpad-muted">
          Your free access ends {formatDate(until)}. Add a payment method now and you
          won&apos;t be charged until then — your Pro plan simply continues.
        </p>
        <Button size="sm" className="mt-3" onClick={onSetup}>
          <CreditCard className="h-4 w-4" />
          Add payment method
        </Button>
      </div>
    </div>
  );
}

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  data,
  onUpgrade,
}: {
  data: ReturnType<typeof useBilling>["data"] & object;
  onUpgrade: () => void;
}) {
  const { is_pro, status, plan_code, price_inr, access_until, gift, paid_starts_at, past_due } = data;

  // gift.granted is a permanent historical marker on the backend, not "still
  // active" — gate on is_pro here too so an expired gift doesn't hide the
  // upgrade CTA or paint the plan card as active Pro.
  const isGift = gift.granted && is_pro;
  const isTrial = status === "trialing";
  const hasUpgraded = Boolean(paid_starts_at);
  // A subscriber mid-payment-failure still HAS a plan — it's the charge that
  // failed. Without this they'd read as "Free plan / Upgrade" directly under a
  // banner explaining their Pro renewal bounced.
  const isPastDue = Boolean(past_due);
  // An un-upgraded trial is presented purely as an upgrade surface: no trial
  // badge, no expiry, no days-remaining — only the value prop + Upgrade button.
  const trialPending = isTrial && !hasUpgraded;
  const isActivePaid = is_pro && !isTrial && !isGift && !isPastDue;
  // Show the upgrade CTA for free/expired users AND during an active (un-upgraded)
  // trial — but never while past due: the banner above owns that action, and it
  // settles the existing mandate instead of opening a second one.
  const showUpgrade = !isPastDue && (trialPending || (!is_pro && !isGift));
  // "Pro" visual treatment for genuine paid access, a scheduled upgrade, or a gift.
  const proLook = isActivePaid || hasUpgraded || isGift;

  const title = isPastDue
    ? "TeachPad Pro"
    : isGift
    ? "TeachPad Pro"
    : trialPending
      ? "Upgrade to TeachPad Pro"
      : proLook
        ? "TeachPad Pro"
        : "Free plan";

  const subtitle = isPastDue
    ? past_due?.in_grace
      ? "Renewal payment pending — access continues for now"
      : "Paused until your renewal payment clears"
    : isGift
    ? "Gifted Pro access — enjoy all features"
      : hasUpgraded
        ? "You're all set — Pro is scheduled to begin"
      : trialPending
        ? "Get Pro access with a generous fair-use allowance"
        : isActivePaid
          ? "Full access to all TeachPad AI features"
          : "Basic access with monthly generation limits";

  return (
    <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white via-violet-50/55 to-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "grid h-14 w-14 shrink-0 place-items-center rounded-[18px]",
            isGift
              ? "bg-[#f6f1ff] text-[#8b5cf6]"
              : proLook
                ? "bg-[#dbeafe] text-teachpad-blue"
                : "bg-teachpad-tag text-teachpad-muted"
          )}
        >
          {isGift ? (
            <Gift className="h-7 w-7" />
          ) : proLook ? (
            <BadgeCheck className="h-7 w-7" />
          ) : (
            <Zap className="h-7 w-7" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black tracking-tight text-teachpad-ink">
              {title}
            </h2>
            {/* Badge: only gift or genuine active paid — never reveals trial status */}
            {isGift ? (
              <span className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide text-[#1e40af]">
                Gift
              </span>
            ) : isActivePaid ? (
              <span className="rounded-full bg-[#dbeafe] px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide text-[#1e40af]">
                Active
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm font-semibold text-teachpad-muted">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {/* Plan code — only for a real paid plan the user is committed to */}
        {(isActivePaid || hasUpgraded) && plan_code && plan_code !== "free" && (
          <InfoRow
            icon={<CreditCard className="h-4 w-4" />}
            label="Plan"
            value={
              plan_code === "pro_annual"
                ? "Pro — Annual (₹1,699/yr)"
                : plan_code === "pro_monthly"
                  ? `Pro — Monthly (₹${price_inr ?? 299}/mo)`
                  : plan_code
            }
          />
        )}

        {/* Scheduled first payment (upgraded during trial) */}
        {hasUpgraded && (
          <InfoRow
            icon={<CalendarDays className="h-4 w-4" />}
            label="First payment on"
            value={formatDate(paid_starts_at)}
          />
        )}

        {/* Renews on — active paying subscribers only; an upgraded-during-trial
            user sees "First payment on" above instead of this date. */}
        {isActivePaid && access_until && (
          <InfoRow
            icon={<CalendarDays className="h-4 w-4" />}
            label="Renews on"
            value={formatDate(access_until)}
          />
        )}

        {/* Gift expiry */}
        {isGift && gift.until && (
          <InfoRow
            icon={<Gift className="h-4 w-4" />}
            label="Gift active until"
            value={formatDatetime(gift.until)}
          />
        )}
      </div>

      {/* Upgrade CTA */}
      {showUpgrade && (
        <Button className="mt-5 h-11 w-full rounded-[14px] text-sm" onClick={onUpgrade}>
          <Zap className="h-4 w-4" />
          Upgrade to Pro
        </Button>
      )}
    </div>
  );
}

// ─── Redeem card ──────────────────────────────────────────────────────────────

function RedeemCard({
  code,
  onChange,
  onRedeem,
  loading,
}: {
  code: string;
  onChange: (v: string) => void;
  onRedeem: () => void;
  loading: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white via-amber-50/60 to-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] bg-[#fff6df] text-[#f0a22f] ring-1 ring-amber-100">
          <Tag className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-black tracking-tight text-teachpad-ink">
            Redeem a code
          </h3>
          <p className="text-sm font-semibold text-teachpad-muted">
            Have a promo or gift code? Enter it below.
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Input
          value={code}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. TEACH30FREE"
          disabled={loading}
          onKeyDown={(e) => e.key === "Enter" && !loading && onRedeem()}
          className="flex-1 font-mono tracking-wider uppercase"
        />
        <Button
          onClick={onRedeem}
          disabled={loading || !code.trim()}
          className="h-10 shrink-0 rounded-xl px-4 text-sm"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Apply"
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Usage card ───────────────────────────────────────────────────────────────

function UsageCard({
  data,
}: {
  data: ReturnType<typeof useBilling>["data"] & object;
}) {
  const { monthly_used, monthly_quota } = data;
  const used = monthly_used ?? 0;
  const quota = monthly_quota;
  const pct =
    quota !== null && quota !== undefined
      ? Math.min(100, Math.round((used / quota) * 100))
      : 0;
  const nearLimit = quota !== null && quota !== undefined && used >= quota * 0.8;
  const atLimit = quota !== null && quota !== undefined && used >= quota;

  return (
    <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white via-emerald-50/60 to-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm">
      <h3 className="text-base font-black tracking-tight text-teachpad-ink">
        Monthly usage
      </h3>
      <p className="mt-0.5 text-sm font-semibold text-teachpad-muted">
        Generation activity for the current billing period.
      </p>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <span
            className={cn(
              "text-3xl font-black",
              atLimit
                ? "text-red-600"
                : nearLimit
                  ? "text-amber-600"
                  : "text-teachpad-ink"
            )}
          >
            {used}
          </span>
          {quota !== null && quota !== undefined && (
            <span className="text-sm font-bold text-teachpad-muted">
              / {quota} generations
            </span>
          )}
        </div>

        {quota !== null && quota !== undefined && (
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-teachpad-tag">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                atLimit
                  ? "bg-gradient-to-r from-red-400 to-red-500"
                  : nearLimit
                    ? "bg-gradient-to-r from-amber-400 to-orange-500"
                  : "bg-gradient-to-r from-[#3b82f6] to-[#2563eb]"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}

        {quota === null && (
          <p className="mt-2 text-sm font-semibold text-[#16a34a]">
            Fair-use generation allowance included
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Cancel card ──────────────────────────────────────────────────────────────

function CancelCard({
  confirm,
  loading,
  onCancel,
  onAbort,
}: {
  confirm: boolean;
  loading: boolean;
  onCancel: () => void;
  onAbort: () => void;
}) {
  return (
    <div className="rounded-[22px] border border-white/70 bg-gradient-to-br from-white via-rose-50/55 to-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm">
      <h3 className="text-base font-black tracking-tight text-teachpad-ink">
        Cancel subscription
      </h3>
      <p className="mt-1 text-sm font-semibold leading-5 text-teachpad-muted">
        Your Pro access stays active until the end of your current billing
        period. You won&apos;t be charged again.
      </p>

      {confirm ? (
        <>
          <div className="mt-4 flex items-start gap-3 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">
              Are you sure? This will end your Pro subscription at the next
              renewal date.
            </p>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              variant="danger"
              className="flex-1 h-10 rounded-xl text-sm"
              disabled={loading}
              onClick={onCancel}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Yes, cancel"
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-10 rounded-xl text-sm"
              disabled={loading}
              onClick={onAbort}
            >
              Keep Pro
            </Button>
          </div>
        </>
      ) : (
        <Button
          variant="outline"
          className="mt-4 h-10 w-full rounded-xl border-red-200 text-sm text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
          onClick={onCancel}
        >
          Cancel subscription
        </Button>
      )}
    </div>
  );
}

// ─── Shared row ───────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-gradient-to-br from-white via-[#f8fbff] to-white px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-teachpad-blue shadow-[0_6px_14px_var(--teachpad-shadowToolCard)]">
          {icon}
        </span>
        <span className="text-sm font-extrabold text-teachpad-ink">{label}</span>
      </div>
      <span className="truncate text-right text-sm font-bold text-teachpad-muted">
        {value}
      </span>
    </div>
  );
}
