import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  // Hiding the nav item is not enough — without this, anyone typing /primary
  // walks straight into a workspace whose backend does not exist yet.
  if (process.env.NEXT_PUBLIC_PRIMARY_ENABLED !== "true") notFound();

  return (
    <AppShell>
      <DashboardBillingShell>
        <div className="primary-embedded">{children}</div>
      </DashboardBillingShell>
    </AppShell>
  );
}
