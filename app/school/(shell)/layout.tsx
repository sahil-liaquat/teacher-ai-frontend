import { ProductShell } from "@/components/school-admin/school-admin-shell";

/**
 * Every new-module surface, behind the same shell as Academic.
 *
 * ⚠ `ProductShell` IS `SchoolAdminShell`. One session check, one onboarding
 * gate, one sign-out, one sidebar — see the note on the export. The module
 * switcher and the sidebar items are resolved from the pathname, so this layout
 * needs no configuration and cannot drift from Academic's.
 */
export default function SchoolProductShellLayout({ children }: { children: React.ReactNode }) {
  return <ProductShell>{children}</ProductShell>;
}
