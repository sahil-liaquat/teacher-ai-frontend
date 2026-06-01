"use client";

import { useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Gift,
  Loader2,
  RotateCcw,
  Tag,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { backendApi } from "@/lib/api";
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
      });
    } catch (err) {
      toast({
        title: "Could not redeem code",
        description:
          err instanceof Error
            ? err.message
            : "Please check the code and try again.",
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
      });
    } catch (err) {
      toast({
        title: "Could not cancel subscription",
        description:
          err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setCancelLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5">
      <PageHeader
        title="Billing & subscription"
        description="Manage your TeachPad plan, redeem codes, and subscription settings."
        size="hero"
      />

      {isLoading && (
        <div className="grid place-items-center rounded-[24px] border border-teachpad-cardBorder bg-white py-16 shadow-[0_18px_45px_var(--teachpad-shadowCard)]">
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

            {/* Cancel subscription */}
            {data.is_pro && (
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

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  data,
  onUpgrade,
}: {
  data: ReturnType<typeof useBilling>["data"] & object;
  onUpgrade: () => void;
}) {
  const { is_pro, status, plan_code, access_until, days_left, gift } = data;

  const isPro = is_pro || gift.granted;
  const isGift = gift.granted;
  const isTrial = status === "trial";
  const statusLabel = isGift
    ? "Gift"
    : isTrial
      ? "Trial"
      : isPro
        ? "Active"
        : "Free";

  return (
    <div className="rounded-[24px] border border-teachpad-cardBorder bg-white p-5 shadow-[0_18px_45px_var(--teachpad-shadowCard)]">
      {/* Header */}
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "grid h-14 w-14 shrink-0 place-items-center rounded-[18px]",
            isGift
              ? "bg-purple-100 text-purple-600"
              : isPro
                ? "bg-[#dbeafe] text-teachpad-blue"
                : "bg-teachpad-tag text-teachpad-muted"
          )}
        >
          {isGift ? (
            <Gift className="h-7 w-7" />
          ) : isPro ? (
            <BadgeCheck className="h-7 w-7" />
          ) : (
            <Zap className="h-7 w-7" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black tracking-tight text-teachpad-ink">
              {isPro ? "TeachPad Pro" : "Free plan"}
            </h2>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide",
                isGift
                  ? "bg-purple-100 text-purple-700"
                  : isTrial
                    ? "bg-amber-100 text-amber-700"
                    : isPro
                      ? "bg-[#dbeafe] text-[#1e40af]"
                      : "bg-teachpad-tag text-teachpad-muted"
              )}
            >
              {statusLabel}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-teachpad-muted">
            {isPro
              ? isGift
                ? "Gifted Pro access — enjoy all features"
                : "Full access to all TeachPad AI features"
              : "Basic access with monthly generation limits"}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {/* Plan code */}
        {plan_code && plan_code !== "free" && (
          <InfoRow
            icon={<CreditCard className="h-4 w-4" />}
            label="Plan"
            value={
              plan_code === "pro_annual"
                ? "Pro — Annual (₹1,699/yr)"
                : plan_code === "pro_monthly"
                  ? "Pro — Monthly (₹199/mo)"
                  : plan_code
            }
          />
        )}

        {/* Status */}
        <InfoRow
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Status"
          value={statusLabel}
        />

        {/* Renewal / expiry */}
        {access_until && (
          <InfoRow
            icon={<CalendarDays className="h-4 w-4" />}
            label={
              status === "cancelled" || isTrial || isGift
                ? "Expires on"
                : "Renews on"
            }
            value={formatDate(access_until)}
          />
        )}

        {/* Days left */}
        {days_left !== null && days_left !== undefined && (
          <InfoRow
            icon={<CalendarDays className="h-4 w-4" />}
            label="Days remaining"
            value={`${days_left} day${days_left === 1 ? "" : "s"}`}
          />
        )}

        {/* Gift expiry */}
        {isGift && data.gift.until && (
          <InfoRow
            icon={<Gift className="h-4 w-4" />}
            label="Gift active until"
            value={formatDatetime(data.gift.until)}
          />
        )}
      </div>

      {/* Upgrade CTA for free users */}
      {!isPro && (
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
    <div className="rounded-[24px] border border-teachpad-cardBorder bg-white p-5 shadow-[0_18px_45px_var(--teachpad-shadowCard)]">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] bg-[#dffafa] text-teachpad-blue">
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
    <div className="rounded-[24px] border border-teachpad-cardBorder bg-gradient-to-br from-[#f8ffff] to-white p-5 shadow-[0_18px_45px_var(--teachpad-shadowCard)]">
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
                    : "bg-gradient-to-r from-teachpad-blue via-[#16c5d9] to-[#8ec63f]"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}

        {quota === null && (
          <p className="mt-2 text-sm font-semibold text-[#16a34a]">
            Unlimited generations
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
    <div className="rounded-[24px] border border-teachpad-cardBorder bg-white p-5 shadow-[0_18px_45px_var(--teachpad-shadowCard)]">
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
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-teachpad-cardBorder bg-[#f8ffff] px-3 py-2.5">
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
