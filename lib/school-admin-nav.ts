/**
 * School Admin navigation — one definition, read by the shell and the tests.
 *
 * ⚠ FIVE TOP-LEVEL ITEMS, AND THAT IS THE POINT. The sidebar used to carry
 * nine, one per database concept: Curriculum, Calendar, Classes & Sections,
 * Teachers, Resources, Assessments, Progress, Settings. An administrator had to
 * know TeachPad's internal shape before they could find anything, and building
 * one curriculum meant navigating between four unrelated top-level destinations.
 *
 * Navigation now names JOBS, not tables:
 *
 *     Overview     what needs attention
 *     Curriculum   what we teach, and when
 *     Teaching     how delivery is going
 *     People       who teaches what
 *     Settings     how this school is configured
 *
 * ⚠ The rule that decides top level vs sub-navigation: **a top-level item is a
 * job an administrator arrives wanting to do.** Themes, Academic Years,
 * Resources and the Calendar are not jobs — they are things you touch *while*
 * building curriculum, which is why they are sub-navigation under it.
 *
 * ⚠ URLS ARE DELIBERATELY UNCHANGED. Restructuring navigation is not the same
 * as migrating routes: `/school-admin/themes` is linked from six places, and
 * from bookmarks this module cannot see. The information architecture moved;
 * the addresses did not. Where a URL genuinely had to move — the duplicated
 * class management — a redirect covers the old one.
 *
 * ⚠ Nothing here is a permission check. The shell still gates the whole surface
 * on `role === "org_admin"`; this module only decides what is *shown*.
 */
import {
  BarChart3,
  LayoutDashboard,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  GraduationCap,
  Home,
  Library,
  Palette,
  School,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

export type SchoolAdminNavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  /** Shown on the item when the surface is foundation-only, so nobody mistakes
   *  an empty screen for a broken one. */
  status?: "foundation";
};

export const SCHOOL_ADMIN_NAV: readonly SchoolAdminNavItem[] = [
  { href: "/school-admin", label: "Overview", icon: Home },
  // ⚠ Lands on the overview, not the grid. `/school-admin/curriculum` remains
  // the teaching-days workspace because it is what `curriculumHref()` builds
  // and what every cross-surface deep link already points at — the sidebar
  // destination and the deep-link target are allowed to differ.
  { href: "/school-admin/curriculum/overview", label: "Curriculum", icon: BookOpen },
  { href: "/school-admin/teaching", label: "Teaching", icon: GraduationCap },
  { href: "/school-admin/people", label: "People", icon: Users },
  { href: "/school-admin/settings", label: "Settings", icon: Settings },
] as const;

/**
 * Sub-navigation, keyed by the top-level route that owns it.
 *
 * ⚠ Ordered by the sequence the work is actually done, not alphabetically and
 * not by how the tables relate. Curriculum reads: build the blocks, plan the
 * days, attach the material, place it in time, then ship it.
 */
export const SCHOOL_ADMIN_SUBNAV: Readonly<Record<string, readonly SchoolAdminNavItem[]>> = {
  "/school-admin/curriculum/overview": [
    { href: "/school-admin/curriculum/overview", label: "Overview", icon: LayoutDashboard },
    { href: "/school-admin/themes", label: "Structure", icon: Palette },
    { href: "/school-admin/curriculum", label: "Teaching days", icon: BookOpen },
    { href: "/school-admin/resources", label: "Resources", icon: Library },
    { href: "/school-admin/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/school-admin/curriculum/review", label: "Review & Publish", icon: ShieldCheck },
    { href: "/school-admin/planning", label: "Schedule", icon: CalendarClock },
  ],
  // Delivery and how it went. Both are foundation-only today and say so on the
  // page; grouping them here is what stops two empty screens occupying two
  // top-level slots each.
  "/school-admin/teaching": [
    { href: "/school-admin/teaching", label: "Coverage", icon: BarChart3 },
    { href: "/school-admin/assessments", label: "Assessments", icon: ClipboardCheck },
  ],
  // ⚠ ONE home for class management. `ClassManager` used to render both at
  // /school-admin/classes and at the foot of the Teachers workspace — two doors
  // into the same CRUD, with the Classes page telling you to go to Teachers to
  // assign. The Teachers copy is gone; this is where classes live.
  "/school-admin/people": [
    { href: "/school-admin/people", label: "Classes & Sections", icon: School },
    { href: "/school-admin/teachers", label: "Teachers", icon: Users },
  ],
  "/school-admin/settings": [
    { href: "/school-admin/settings", label: "School settings", icon: Settings },
    { href: "/school-admin/academic-years", label: "Academic years", icon: CalendarRange },
  ],
};

/**
 * Which top-level item a pathname belongs under, including moved children.
 *
 * ⚠ Longest match wins. `/school-admin/curriculum/review` must resolve to
 * Curriculum, and it is a prefix of nothing else — but `/school-admin/teaching`
 * is both a parent and its own first child, so a naive first-match scan over an
 * unordered map picks whichever key happened to be declared first.
 */
export function activeTopLevel(pathname: string): string {
  let best: string | null = null;
  for (const [parent, children] of Object.entries(SCHOOL_ADMIN_SUBNAV)) {
    for (const child of children) {
      if (pathname === child.href || pathname.startsWith(`${child.href}/`)) {
        if (best === null || child.href.length > best.length) best = parent;
      }
    }
  }
  if (best) return best;

  const match = [...SCHOOL_ADMIN_NAV]
    .filter((item) => item.href !== "/school-admin")
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return match ? match.href : "/school-admin";
}

export function isNavItemActive(href: string, pathname: string): boolean {
  return href === "/school-admin"
    ? pathname === href
    : activeTopLevel(pathname) === href;
}

/**
 * Old top-level routes that became sub-navigation, and where they now sit.
 *
 * Used by the tests to prove nothing became unreachable. The URLs still work —
 * this maps a route to the section whose sub-navigation now contains it.
 */
export const RELOCATED_ROUTES: Readonly<Record<string, string>> = {
  "/school-admin/themes": "/school-admin/curriculum/overview",
  "/school-admin/resources": "/school-admin/curriculum/overview",
  "/school-admin/calendar": "/school-admin/curriculum/overview",
  "/school-admin/curriculum": "/school-admin/curriculum/overview",
  "/school-admin/planning": "/school-admin/curriculum/overview",
  "/school-admin/academic-years": "/school-admin/settings",
  "/school-admin/assessments": "/school-admin/teaching",
  "/school-admin/teachers": "/school-admin/people",
};
