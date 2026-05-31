import { AppShell } from "@/components/app-shell";
import { DashboardBillingShell } from "@/components/billing/dashboard-billing-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <DashboardBillingShell>{children}</DashboardBillingShell>
    </AppShell>
  );
}
