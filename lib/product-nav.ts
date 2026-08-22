/**
 * Product-level navigation — the School Excellence OS module layer.
 *
 * ⚠ THIS IS A LAYER OVER THE EXISTING NAVIGATION, NOT A REPLACEMENT. TeachPad
 * School Admin becomes the **Academic** module of a larger product. The change
 * is that an administrator can now see there are other modules; it is not that
 * anything they already use has moved.
 *
 * ⚠ ACADEMIC'S ITEMS ARE IMPORTED, NEVER RESTATED. `SCHOOL_ADMIN_NAV` stays the
 * single definition of what Academic contains — this module reads it. A second
 * hand-maintained copy would drift the first time someone added a School Admin
 * page, and the sidebar would start disagreeing with itself.
 *
 * ⚠ NO EXISTING URL MOVES. Academic keeps `/school-admin/*` exactly as it is,
 * including every deep link, bookmark and cross-surface href. The new modules
 * take a fresh `/school/*` namespace.
 *
 * ⚠ WHY `/school/*` AND NOT `/excellence/*`. `/school-excellence` is already the
 * public marketing landing page. An org-admin module at `/excellence` would sit
 * one hyphen away from an unauthenticated marketing route — confusing in
 * analytics, in support conversations and in a browser history. `/school/*`
 * groups the product and collides with nothing.
 */
import {
  BarChart3,
  ClipboardList,
  Compass,
  FileText,
  GraduationCap,
  Home,
  Lightbulb,
  Target,
} from "lucide-react";

// ⚠ RELATIVE AND `.ts`-SUFFIXED, NOT `@/lib/...`. This module is executed
// directly by `node --experimental-strip-types --test`, which resolves neither
// the `@/*` path alias nor an extensionless relative specifier — the same
// constraint documented on `lib/primary-coverage.ts`. Either form makes the
// whole suite fail to load with a bare ERR_MODULE_NOT_FOUND rather than a
// useful assertion. `allowImportingTsExtensions` is on, and this is the shape
// `curriculum-bulk-publish.ts` and `primary-day-templates.ts` already use.
import { SCHOOL_ADMIN_NAV, isNavItemActive, type SchoolAdminNavItem } from "./school-admin-nav.ts";

/** A module's own navigation item. Same shape as School Admin's, deliberately. */
export type ProductNavItem = SchoolAdminNavItem;

export type ProductModuleKey =
  | "home"
  | "academic"
  | "excellence"
  | "improvement"
  | "insights"
  | "leadership"
  | "reports";

export type ProductModule = {
  key: ProductModuleKey;
  label: string;
  /** Where the module switcher sends you. */
  href: string;
  icon: typeof Home;
  /** The one-line answer this module exists to give. Shown in the switcher. */
  question: string;
  /** The module's own sidebar items. Empty means the module is a single page. */
  items: readonly ProductNavItem[];
  /** Marks a module whose surfaces are scaffolding, so nobody mistakes an
   *  honest empty screen for a broken one. */
  status?: "foundation";
};

/**
 * The modules, in dependency order — which is also the order a school
 * experiences them: teach, measure, diagnose, fix, lead.
 *
 * ⚠ The order is information, not decoration. Insights depends on Academic,
 * Excellence on Insights, Improvement on Excellence, Leadership on all of them.
 * A switcher that sorted these alphabetically would hide the product's thesis.
 */
export const PRODUCT_MODULES: readonly ProductModule[] = [
  {
    key: "home",
    label: "Home",
    href: "/school",
    icon: Home,
    question: "What needs my attention?",
    items: [],
    status: "foundation",
  },
  {
    key: "academic",
    label: "Academic",
    href: "/school-admin",
    icon: GraduationCap,
    question: "What are we planning and delivering?",
    // ⚠ Imported. School Admin owns this list; this module only groups it.
    items: SCHOOL_ADMIN_NAV,
  },
  {
    key: "insights",
    label: "Insights",
    href: "/school/insights",
    icon: BarChart3,
    question: "What is actually happening?",
    items: [
      { href: "/school/insights", label: "Academic health", icon: BarChart3 },
      { href: "/school/insights/teacher-preparation", label: "Teacher preparation", icon: ClipboardList },
      { href: "/school/insights/curriculum-progress", label: "Curriculum progress", icon: Compass },
    ],
  },
  {
    key: "excellence",
    label: "School Excellence",
    href: "/school/excellence",
    icon: Compass,
    question: "Where are we weak, and why?",
    items: [
      { href: "/school/excellence", label: "Overview", icon: Compass },
      { href: "/school/excellence/reviews", label: "Reviews", icon: ClipboardList },
      { href: "/school/excellence/evidence", label: "Evidence", icon: FileText },
      { href: "/school/excellence/observations", label: "Observations", icon: GraduationCap },
      { href: "/school/excellence/findings", label: "Findings", icon: Lightbulb },
      { href: "/school/excellence/priorities", label: "Priorities", icon: Target },
    ],
    status: "foundation",
  },
  {
    key: "improvement",
    label: "Improvement",
    href: "/school/improvement",
    icon: Target,
    question: "What are we doing about it?",
    items: [
      { href: "/school/improvement", label: "Programme", icon: Target },
      { href: "/school/improvement/goals", label: "Goals", icon: BarChart3 },
      { href: "/school/improvement/tasks", label: "Tasks", icon: ClipboardList },
      { href: "/school/improvement/progress", label: "Progress", icon: Compass },
    ],
    status: "foundation",
  },
  {
    key: "leadership",
    label: "Leadership",
    href: "/school/leadership",
    icon: Lightbulb,
    question: "What should I do this week?",
    items: [],
    status: "foundation",
  },
  {
    key: "reports",
    label: "Reports",
    href: "/school/reports",
    icon: FileText,
    question: "How do we communicate it?",
    items: [],
    status: "foundation",
  },
] as const;

/** Academic, resolved once so callers never re-find it by string key. */
export const ACADEMIC_MODULE = PRODUCT_MODULES.find((m) => m.key === "academic")!;

/**
 * Which module a pathname belongs to.
 *
 * ⚠ Academic is matched on `/school-admin`, which is NOT a prefix of `/school`
 * — but `/school` IS a prefix of `/school-admin` as a plain string. Matching
 * has to be segment-aware or every Academic page resolves to Home. This is the
 * exact bug the longest-match scan in `school-admin-nav.ts` exists to avoid,
 * one level up.
 */
export function activeModule(pathname: string): ProductModule {
  if (pathname === "/school-admin" || pathname.startsWith("/school-admin/")) {
    return ACADEMIC_MODULE;
  }
  const candidates = PRODUCT_MODULES.filter(
    (module) =>
      module.key !== "academic" &&
      module.key !== "home" &&
      (pathname === module.href || pathname.startsWith(`${module.href}/`)),
  );
  // Longest match wins, so /school/insights/teacher-preparation resolves to
  // Insights rather than to whichever module was declared first.
  const best = candidates.sort((a, b) => b.href.length - a.href.length)[0];
  return best ?? PRODUCT_MODULES[0];
}

/**
 * The sidebar items to render for a pathname.
 *
 * ⚠ For every `/school-admin/*` path this returns `SCHOOL_ADMIN_NAV` unchanged,
 * which is what keeps the Academic sidebar byte-identical to what shipped.
 */
export function productNavFor(pathname: string): readonly ProductNavItem[] {
  return activeModule(pathname).items;
}

/** Whether a module switcher entry should read as current. */
export function isModuleActive(module: ProductModule, pathname: string): boolean {
  return activeModule(pathname).key === module.key;
}

/**
 * Whether a sidebar item should read as current.
 *
 * ⚠ ACADEMIC DELEGATES, AND THAT IS THE POINT. School Admin's rule is not a
 * prefix match — it resolves a path through `SCHOOL_ADMIN_SUBNAV` so that
 * `/school-admin/themes` lights "Curriculum" rather than nothing. Re-deriving
 * that here would be a second rule that disagrees with the first the next time
 * a page is relocated. New modules have no sub-navigation yet, so they get a
 * plain longest-match, which is the correct answer for a flat list.
 */
export function isProductNavItemActive(href: string, pathname: string): boolean {
  const module = activeModule(pathname);
  if (module.key === "academic") return isNavItemActive(href, pathname);

  const matches = module.items
    .map((item) => item.href)
    .filter((candidate) => pathname === candidate || pathname.startsWith(`${candidate}/`));
  if (!matches.length) return false;
  const longest = matches.sort((a, b) => b.length - a.length)[0];
  return href === longest;
}
