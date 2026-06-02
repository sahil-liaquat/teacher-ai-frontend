"use client";

/**
 * Client wrapper that mounts billing-specific UI into the dashboard:
 *  - UpgradeModalProvider: context for the upgrade modal (used across all pages)
 *  - GiftModal: one-time celebratory modal for gifted Pro accounts
 *  - PlanBanner: persistent thin banner showing plan/usage status
 *
 * This lives here so the dashboard layout (a server component) stays clean.
 */

import type { ReactNode } from "react";
import { UpgradeModalProvider } from "@/components/billing/upgrade-modal";
import { GiftModal } from "@/components/billing/gift-modal";
import { PlanBanner } from "@/components/billing/plan-banner";
import { ProfileCompletionModal } from "@/components/profile/profile-completion-modal";

export function DashboardBillingShell({ children }: { children: ReactNode }) {
  return (
    <UpgradeModalProvider>
      <GiftModal />
      <ProfileCompletionModal />
      <div className="flex min-h-full flex-col">
        <PlanBanner />
        {children}
      </div>
    </UpgradeModalProvider>
  );
}
