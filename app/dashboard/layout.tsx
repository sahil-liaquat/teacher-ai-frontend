import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { DashboardBillingShell } from "@/components/billing/dashboard-billing-shell";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <DashboardBillingShell>{children}</DashboardBillingShell>
    </AppShell>
  );
}
