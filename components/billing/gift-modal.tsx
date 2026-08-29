"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, Sparkles, X } from "lucide-react";
import { backendApi } from "@/lib/api";
import { useBilling } from "@/lib/use-billing";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

/**
 * Shown once when gift.granted && !gift.acknowledged.
 * Dismiss button calls billingGiftAcknowledge() then refetches so it never
 * reappears (acknowledged becomes true on the server).
 */
export function GiftModal() {
  const { data, refetch } = useBilling();
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  // Open as soon as we have confirmed gift data.
  useEffect(() => {
    if (data?.gift.granted && !data.gift.acknowledged) {
      setVisible(true);
    }
  }, [data?.gift.granted, data?.gift.acknowledged]);

  const dismiss = useCallback(async () => {
    setDismissing(true);
    try {
      await backendApi.billingGiftAcknowledge();
      await refetch();
    } finally {
      setDismissing(false);
      setVisible(false);
    }
  }, [refetch]);

  if (!visible || !data?.gift.granted) return null;

  const expiryLabel = data.access_until
    ? new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(data.access_until))
    : null;

  return (
    <Modal
      open={visible}
      onOpenChange={(next) => {
        if (!next) void dismiss();
      }}
      title="You've been gifted Pro!"
      hideTitle
      showClose={false}
      className="overflow-hidden p-0"
    >
      <div className="relative">
        {/* Dismiss */}
        <button
          onClick={dismiss}
          disabled={dismissing}
          aria-label="Close gift notification"
          className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-control border border-teachpad-cardBorder bg-white text-teachpad-muted shadow-e1 transition-colors hover:bg-teachpad-tag hover:text-teachpad-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] px-6 py-8 text-center">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-white/5" />

          {/* Gift box */}
          <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-[24px] bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] ring-1 ring-white/20">
            <Gift className="h-10 w-10 text-white" />
          </div>

          <div className="relative mt-4 flex items-center justify-center gap-1.5">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <p aria-hidden="true" className="text-lead font-extrabold text-white">
              You&apos;ve been gifted Pro!
            </p>
            <Sparkles className="h-4 w-4 text-yellow-300" />
          </div>
          <p className="relative mt-1.5 text-sm font-semibold text-purple-200">
            30 days of TeachPad Pro — on us
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-center text-sm font-semibold leading-6 text-teachpad-muted">
            Your account has been upgraded to{" "}
            <span className="font-extrabold text-teachpad-ink">
              TeachPad Pro
            </span>{" "}
            with full access to Pro features, including presentations, exports,
            and a generous fair-use generation allowance.
          </p>

          {expiryLabel && (
            <div className="mt-5 rounded-[18px] border border-purple-100 bg-gradient-to-br from-purple-50 to-white px-4 py-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-purple-400">
                Active until
              </p>
              <p className="mt-1 text-base font-extrabold text-teachpad-ink">
                {expiryLabel}
              </p>
            </div>
          )}

          <Button
            className="mt-5 h-12 w-full bg-violet-600 text-base text-white hover:bg-violet-700"
            onClick={dismiss}
            loading={dismissing}
          >
            {dismissing ? "Just a moment..." : "Start using Pro"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
