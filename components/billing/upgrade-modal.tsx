"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import { Check, Sparkles, X, Zap } from "lucide-react";
import { backendApi } from "@/lib/api";
import { useBilling } from "@/lib/use-billing";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

// ─── Context ──────────────────────────────────────────────────────────────────

type UpgradeModalContextValue = {
  openUpgrade: (contextLine?: string) => void;
  closeUpgrade: () => void;
};

const UpgradeModalContext = createContext<UpgradeModalContextValue | null>(null);

export function useUpgradeModal() {
  const ctx = useContext(UpgradeModalContext);
  if (!ctx) throw new Error("useUpgradeModal must be used inside UpgradeModalProvider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UpgradeModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [contextLine, setContextLine] = useState<string | undefined>();

  const openUpgrade = useCallback((line?: string) => {
    setContextLine(line);
    setOpen(true);
  }, []);

  const closeUpgrade = useCallback(() => {
    setOpen(false);
    setContextLine(undefined);
  }, []);

  return (
    <UpgradeModalContext.Provider value={{ openUpgrade, closeUpgrade }}>
      {children}
      {open && <UpgradeModalUI onClose={closeUpgrade} contextLine={contextLine} />}
    </UpgradeModalContext.Provider>
  );
}

// ─── Plans ────────────────────────────────────────────────────────────────────

type PlanOption = {
  id: "pro_monthly" | "pro_annual";
  label: string;
  price: string;
  period: string;
  badge?: string;
  perMonth?: string;
};

const PLANS: PlanOption[] = [
  {
    id: "pro_monthly",
    label: "Pro Monthly",
    price: "₹199",
    period: "/month",
  },
  {
    id: "pro_annual",
    label: "Pro Annual",
    price: "₹1,699",
    period: "/year",
    badge: "Best value",
    perMonth: "≈ ₹141/mo",
  },
];

const PRO_FEATURES = [
  "Unlimited lesson plans & worksheets",
  "Presentation generator",
  "Export to PDF, DOCX & PPTX",
  "RAG-grounded textbook AI",
  "Priority generation queue",
];

// ─── Modal UI ─────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

// Cache the in-flight (or already-resolved) load promise at module scope so
// repeated opens never append a second <script> tag.
let razorpayScriptPromise: Promise<boolean> | null = null;

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  // Check if a <script> tag was already added (e.g. by a previous render).
  const existing = document.querySelector<HTMLScriptElement>(
    'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
  );
  if (existing) {
    razorpayScriptPromise = new Promise((resolve) => {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
    });
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => { razorpayScriptPromise = null; resolve(false); };
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
}

function UpgradeModalUI({
  onClose,
  contextLine,
}: {
  onClose: () => void;
  contextLine?: string;
}) {
  const { toast } = useToast();
  const { refetch } = useBilling();
  const [selected, setSelected] = useState<"pro_monthly" | "pro_annual">("pro_annual");
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    // Tracks whether we successfully handed off to Razorpay. If true, loading
    // is reset by rzp's ondismiss callback (user closed the sheet). If false,
    // we reset loading in the finally block so the button is never permanently
    // stuck.
    let handedOff = false;
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast({ title: "Payment unavailable", description: "Could not load payment gateway. Please check your connection and try again." });
        return;
      }

      const checkout = await backendApi.billingCheckout({ plan_code: selected });

      const rzp = new window.Razorpay({
        key: checkout.key_id,
        subscription_id: checkout.razorpay_subscription_id,
        name: "TeachPad",
        description: selected === "pro_annual" ? "TeachPad Pro — Annual" : "TeachPad Pro — Monthly",
        theme: { color: "#1677ff" },
        handler: () => {
          // Razorpay does not await this callback — wrap async work in a
          // fire-and-forget so any rejection is caught and swallowed here.
          refetch()
            .then(() => {
              toast({ title: "Welcome to TeachPad Pro!", description: "Your subscription is now active." });
              onClose();
            })
            .catch((err) => {
              console.error("Billing refetch after payment failed:", err);
              // Still close the modal; the user paid successfully.
              toast({ title: "Welcome to TeachPad Pro!", description: "Your subscription is now active." });
              onClose();
            });
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      });

      handedOff = true;
      rzp.open();
      // Loading is owned by Razorpay from here: ondismiss resets it.
    } catch (err) {
      toast({
        title: "Could not start checkout",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      // Only reset loading when we did NOT hand off to Razorpay. If we did,
      // ondismiss (or onClose) will reset it.
      if (!handedOff) {
        setLoading(false);
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-teachpad-ink/30 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-[28px] border border-teachpad-cardBorder bg-white shadow-[0_32px_80px_rgba(22,119,255,0.18)]">
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close upgrade dialog"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-xl border border-teachpad-cardBorder bg-white text-teachpad-muted shadow-sm transition-all hover:bg-teachpad-tag hover:text-teachpad-ink"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="relative overflow-hidden rounded-t-[28px] bg-gradient-to-br from-[#1677ff] to-[#0040d9] px-6 py-7">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 left-1/2 h-20 w-20 -translate-x-1/2 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/20 shadow-inner">
              <Sparkles className="h-6 w-6 text-white" />
            </span>
            <div>
              <h2 id="upgrade-modal-title" className="text-xl font-extrabold text-white">
                Upgrade to Pro
              </h2>
              <p className="mt-0.5 text-sm font-medium text-blue-100">
                Unlock the full power of TeachPad AI
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Context line (e.g. "Presentations require a Pro plan") */}
          {contextLine && (
            <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <Zap className="h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm font-semibold text-amber-800">{contextLine}</p>
            </div>
          )}

          {/* Feature list */}
          <ul className="mb-5 space-y-2">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#dbeafe]">
                  <Check className="h-3 w-3 text-teachpad-blue" />
                </span>
                <span className="text-sm font-semibold text-teachpad-ink">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Plan cards */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelected(plan.id)}
                className={cn(
                  "relative rounded-[18px] border-2 p-4 text-left transition-all duration-200",
                  selected === plan.id
                    ? "border-teachpad-blue bg-gradient-to-br from-[#eff6ff] to-white shadow-[0_8px_24px_var(--teachpad-shadowBlue)]"
                    : "border-teachpad-cardBorder bg-white hover:border-blue-200 hover:bg-[#f8fbff]"
                )}
              >
                {plan.badge && (
                  <span className="absolute -right-1 -top-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
                    {plan.badge}
                  </span>
                )}
                <p className="text-xs font-bold uppercase tracking-wide text-teachpad-muted">{plan.label}</p>
                <p className="mt-1 text-2xl font-extrabold text-teachpad-ink">
                  {plan.price}
                  <span className="text-sm font-semibold text-teachpad-muted">{plan.period}</span>
                </p>
                {plan.perMonth && (
                  <p className="mt-0.5 text-xs font-semibold text-teachpad-blue">{plan.perMonth}</p>
                )}
              </button>
            ))}
          </div>

          {/* CTA */}
          <Button
            className="h-12 w-full rounded-[14px] text-base"
            disabled={loading}
            onClick={handleUpgrade}
          >
            <Sparkles className="h-4 w-4" />
            {loading ? "Opening payment..." : "Continue to payment"}
          </Button>

          <p className="mt-3 text-center text-xs font-medium leading-5 text-teachpad-muted">
            Secure payment via Razorpay. Cancel anytime from billing settings. By
            continuing you agree to our{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-teachpad-blue underline underline-offset-2"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href="/refund"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-teachpad-blue underline underline-offset-2"
            >
              Refund Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
