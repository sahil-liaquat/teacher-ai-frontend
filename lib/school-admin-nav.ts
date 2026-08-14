/**
 * School Admin navigation — one definition, read by the shell and the tests.
 *
 * The ordering is the product argument, not alphabetical and not historical.
 * It walks the academic operating loop a school actually runs:
 *
 *     Overview            what needs attention
 *     Curriculum          what we teach
 *     Calendar            when we teach it
 *     Classes & Sections  who we teach
 *     Teachers            who teaches
 *     Resources           what we teach with
 *     Assessments         how we check
 *     Progress            how it is going
 *     Settings            how this school works
 *
 * ⚠ The rule that decides what belongs here: **things the school actively works
 * with go in the main navigation; things it configures once go in Settings.**
 * Themes and Academic Years used to be top-level items and are not any more —
 * not because they were removed, but because a theme is part of authoring
 * curriculum and an academic year is part of running a calendar. They live as
 * sub-navigation under their operational parent, which is where an admin was
 * already going to look for them.
 *
 * ⚠ Nothing here is a permission check. The shell still gates the whole surface
 * on `role === "org_admin"`; this module only decides what is *shown*.
 */
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
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
  { href: "/school-admin/curriculum", label: "Curriculum", icon: BookOpen },
  { href: "/school-admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/school-admin/classes", label: "Classes & Sections", icon: School },
  { href: "/school-admin/teachers", label: "Teachers", icon: Users },
  { href: "/school-admin/resources", label: "Resources", icon: Library },
  { href: "/school-admin/assessments", label: "Assessments", icon: ClipboardCheck, status: "foundation" },
  { href: "/school-admin/progress", label: "Progress", icon: BarChart3, status: "foundation" },
  { href: "/school-admin/settings", label: "Settings", icon: Settings },
] as const;

/**
 * Sub-navigation, keyed by the top-level route that owns it.
 *
 * This is where Themes and Academic Years went. Keeping the routes alive
 * matters: they are deep-linked from the curriculum workspace, from settings
 * and from existing bookmarks, and deleting a working authoring surface to
 * tidy a sidebar would be a regression wearing a redesign's clothes.
 */
export const SCHOOL_ADMIN_SUBNAV: Readonly<Record<string, readonly SchoolAdminNavItem[]>> = {
  // The three stages of one workflow, in the order they are worked: build the
  // building blocks, plan the days, then ship them. Review & Publish is a real
  // surface rather than a modal over the grid, so it is reachable, linkable and
  // carries the same year/level/month context.
  "/school-admin/curriculum": [
    { href: "/school-admin/themes", label: "Themes & Topics", icon: Palette },
    { href: "/school-admin/curriculum", label: "Teaching days", icon: BookOpen },
    { href: "/school-admin/curriculum/review", label: "Review & Publish", icon: ShieldCheck },
  ],
  "/school-admin/calendar": [
    { href: "/school-admin/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/school-admin/academic-years", label: "Academic years", icon: CalendarRange },
  ],
};

/** Which top-level item a pathname belongs under, including moved children. */
export function activeTopLevel(pathname: string): string {
  for (const [parent, children] of Object.entries(SCHOOL_ADMIN_SUBNAV)) {
    if (children.some((child) => child.href !== parent && pathname.startsWith(child.href))) {
      return parent;
    }
  }
  const match = [...SCHOOL_ADMIN_NAV]
    .filter((item) => item.href !== "/school-admin")
    .find((item) => pathname.startsWith(item.href));
  return match ? match.href : "/school-admin";
}

export function isNavItemActive(href: string, pathname: string): boolean {
  return href === "/school-admin"
    ? pathname === href
    : activeTopLevel(pathname) === href;
}
