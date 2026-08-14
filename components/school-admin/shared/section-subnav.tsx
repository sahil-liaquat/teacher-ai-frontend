"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SCHOOL_ADMIN_SUBNAV, activeTopLevel } from "@/lib/school-admin-nav";
import { cn } from "@/lib/utils";

/**
 * Sub-navigation for a top-level School Admin section.
 *
 * Renders nothing when the active section has no children, so a page can mount
 * it unconditionally without a placeholder appearing. This is where Themes and
 * Academic Years surface after leaving the sidebar — the routes are unchanged,
 * only their position in the information architecture moved.
 */
export function SectionSubnav() {
  const pathname = usePathname();
  const parent = activeTopLevel(pathname);
  const items = SCHOOL_ADMIN_SUBNAV[parent];
  if (!items || items.length < 2) return null;

  return (
    <nav
      aria-label="Section"
      className="mb-5 flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1"
    >
      {items.map((item) => {
        const Icon = item.icon;
        // Exact match for the parent route, prefix match for children — so
        // "Teaching days" does not stay lit while you are on Themes.
        const active =
          item.href === parent ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
              active
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
