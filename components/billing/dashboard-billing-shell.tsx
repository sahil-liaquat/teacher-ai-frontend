"use client";

/**
 * Client wrapper that mounts billing-specific UI into the dashboard:
 *  - UpgradeModalProvider: context for the upgrade modal (used across all pages)
 *  - GiftModal: one-time celebratory modal for gifted Pro accounts
 *  - PlanBanner: persistent thin banner showing plan/usage status
 *
 * This lives here so the dashboard layout (a server component) stays clean.
 */

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { UpgradeModalProvider } from "@/components/billing/upgrade-modal";
import { GiftModal } from "@/components/billing/gift-modal";
import { PlanBanner } from "@/components/billing/plan-banner";
import { ProfileCompletionModal } from "@/components/profile/profile-completion-modal";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { FeedbackPromptModal } from "@/components/feedback/feedback-prompt-modal";

export function DashboardBillingShell({ children }: { children: ReactNode }) {
  return (
    <UpgradeModalProvider>
      <GiftModal />
      <ProfileCompletionModal />
      <OnboardingWizard />
      <FeedbackPromptModal />
      <PlanBannerAtTop />
      <div className="flex min-h-full flex-col">
        {children}
      </div>
    </UpgradeModalProvider>
  );
}

function PlanBannerAtTop() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.getElementById("dashboard-plan-banner-slot"));
  }, []);

  return target ? createPortal(<PlanBanner />, target) : null;
}
