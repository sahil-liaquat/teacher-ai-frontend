/**
 * The School Excellence OS root layout — deliberately chrome-free.
 *
 * Mirrors `app/school-admin/layout.tsx`: the shell lives one level down in the
 * `(shell)` route group so a future unshelled surface (a setup wizard, a public
 * report link) can sit beside it without inheriting the sidebar. A route group
 * carries no URL segment, so `(shell)/excellence` is `/school/excellence`.
 */
export default function SchoolProductLayout({ children }: { children: React.ReactNode }) {
  return <div className="primary-route-typography">{children}</div>;
}
