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
import { useQuery } from "@tanstack/react-query";
import { CURRENT_USER_QUERY_KEY, getCurrentUser, type ApiUser } from "@/lib/api";
import { UpgradeModalProvider } from "@/components/billing/upgrade-modal";
import { GiftModal } from "@/components/billing/gift-modal";
import { PlanBanner } from "@/components/billing/plan-banner";
import { ProfileCompletionModal } from "@/components/profile/profile-completion-modal";
import { PhoneAsk } from "@/components/profile/phone-ask";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { StartRedirect } from "@/components/onboarding/start-redirect";
import { FeedbackPromptModal } from "@/components/feedback/feedback-prompt-modal";

export function DashboardBillingShell({ children }: { children: ReactNode }) {
  const { data: user } = useQuery<ApiUser>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => getCurrentUser({ redirectOnUnauthorized: false }),
    staleTime: Infinity,
    retry: false
  });
  // The two blocking modals are retired behind FIRST_RUN_V2_ENABLED; /start and
  // the post-artifact phone card replace them. Both replacements self-gate on
  // the same flag, so with it off nothing below changes.
  const firstRunV2 = user?.first_run_v2 === true;

  return (
    <UpgradeModalProvider>
      <GiftModal />
      {!firstRunV2 && <ProfileCompletionModal />}
      {!firstRunV2 && <OnboardingWizard />}
      <StartRedirect />
      <PhoneAsk />
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
