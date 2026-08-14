import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Same typography wrapper School Admin and the Primary teacher app use:
  // Baloo 2 for headings, Nunito Sans for body (components/primary/primary.css,
  // already imported globally). Admin was the only surface still falling back
  // to the system stack, so a platform admin moving between /admin and
  // /school-admin saw the product change typeface mid-session.
  return (
    <div className="primary-route-typography">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
