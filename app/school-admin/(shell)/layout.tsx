import { SchoolAdminShell } from "@/components/school-admin/school-admin-shell";

/**
 * Everything that belongs to the running school.
 *
 * `setup/` is deliberately NOT in this group — see the note in the parent
 * layout. The shell also gates on onboarding: a school that has not finished
 * setup is sent to the wizard rather than dropped into an ERP it cannot use.
 */
export default function SchoolAdminShellLayout({ children }: { children: React.ReactNode }) {
  return <SchoolAdminShell>{children}</SchoolAdminShell>;
}
