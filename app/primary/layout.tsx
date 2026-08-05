import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { DashboardBillingShell } from "@/components/billing/dashboard-billing-shell";

export const metadata: Metadata = {
  title: "TeachPad Primary",
  robots: {
    index: false,
    follow: false
  }
};

export default function PrimaryLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <DashboardBillingShell>
        <div className="primary-embedded">{children}</div>
      </DashboardBillingShell>
    </AppShell>
  );
}
