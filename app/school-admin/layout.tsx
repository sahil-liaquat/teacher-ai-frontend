/**
 * The School Admin root layout — deliberately chrome-free.
 *
 * ⚠ The shell moved DOWN, into `(shell)/layout.tsx`. It used to live here and
 * wrapped every child, which meant guided setup rendered inside the full ERP
 * sidebar: a school on step 1, with no framework, no levels and no academic
 * year, was shown nine navigation items of which every single one led to an
 * empty state or a "create an academic year first" wall.
 *
 * A route group carries no URL segment, so `(shell)/page.tsx` is still
 * `/school-admin` and `(shell)/curriculum` is still `/school-admin/curriculum`.
 * Every existing link, bookmark and deep link is unchanged; only which layout
 * wraps `setup` is different.
 */
export default function SchoolAdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="primary-route-typography">{children}</div>;
}
