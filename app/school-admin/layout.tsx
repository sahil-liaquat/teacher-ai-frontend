import { SchoolAdminShell } from "@/components/school-admin/school-admin-shell";

export default function SchoolAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="primary-route-typography">
      <SchoolAdminShell>{children}</SchoolAdminShell>
    </div>
  );
}
