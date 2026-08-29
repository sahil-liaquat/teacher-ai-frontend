"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  BookmarkCheck,
  BookMarked,
  BookOpen,
  Clock,
  HandCoins,
  CreditCard,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  PanelsTopLeft,
  Pin,
  PinOff,
  Settings,
  Shield,
  Sparkles,
  Users,
  X,
  Calendar
} from "lucide-react";
import { CURRENT_USER_QUERY_KEY, clearToken, ensureSession, getCurrentUser, hasStoredAuthTokens, logout as logoutSession, refreshSession, type ApiUser } from "@/lib/api";
import { cn } from "@/lib/utils";
import { BoyAvatar } from "@/components/profile-avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrialStatusPill } from "@/components/billing/trial-status-pill";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { StreakPill } from "@/components/streak/streak-pill";

// Nine flat items read as one long undifferentiated run. The groups below are
// display-only and never reorder anything — the existing array order already
// clusters correctly, which matters because MobileBottomNav renders
// nav.slice(0, 5) and must keep showing the same five tabs.
type NavGroup = "teach" | "library" | "account";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  group?: NavGroup;
};

const NAV_GROUP_LABELS: Record<NavGroup, string> = {
  teach: "Teach",
  library: "Library",
  account: "Account"
};

/**
 * Split a nav into its labelled groups, preserving array order. A nav whose
 * items carry no group (admin, which has no obvious clusters) comes back as a
 * single unlabelled run, so it renders exactly as it did before.
 */
function groupNav(nav: NavItem[]): { key: string; label: string | null; items: NavItem[] }[] {
  if (!nav.some((item) => item.group)) return [{ key: "all", label: null, items: nav }];
  const order: NavGroup[] = ["teach", "library", "account"];
  return order
    .map((group) => ({
      key: group,
      label: NAV_GROUP_LABELS[group],
      items: nav.filter((item) => item.group === group)
    }))
    .filter((group) => group.items.length > 0);
}

const teacherNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home, group: "teach" },
  { href: "/dashboard/my-workspace", label: "Workspace", icon: PanelsTopLeft, group: "teach" },
  { href: "/dashboard/classroom-tools", label: "AI Tools", icon: Sparkles, group: "teach" },
  { href: "/dashboard/workshops", label: "Growth Hub", icon: Calendar, group: "teach" },
  { href: "/dashboard/recent-generations", label: "Recent", icon: Clock, group: "library" },
  { href: "/dashboard/resources", label: "Saved", icon: BookmarkCheck, group: "library" },
  { href: "/dashboard/textbooks", label: "Books", icon: BookMarked, group: "library" },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard, group: "account" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, group: "account" }
];

const influencerWorkspaceNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home, group: "teach" },
  { href: "/dashboard/my-workspace", label: "Workspace", icon: PanelsTopLeft, group: "teach" },
  { href: "/influencer", label: "Influencer", icon: HandCoins, group: "teach" },
  { href: "/dashboard/classroom-tools", label: "AI Tools", icon: Sparkles, group: "teach" },
  { href: "/dashboard/workshops", label: "Growth Hub", icon: Calendar, group: "teach" },
  { href: "/dashboard/recent-generations", label: "Recent", icon: Clock, group: "library" },
  { href: "/dashboard/resources", label: "Saved", icon: BookmarkCheck, group: "library" },
  { href: "/dashboard/textbooks", label: "Books", icon: BookMarked, group: "library" },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard, group: "account" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, group: "account" }
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Overview", icon: Home },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/curriculum", label: "Curriculum", icon: GraduationCap },
  { href: "/admin/textbooks", label: "Textbooks", icon: BookOpen },
  { href: "/admin/system", label: "System", icon: Shield }
];

const SESSION_REFRESH_INTERVAL_MS = 50 * 60 * 1000;

export function AppShell({ children, admin = false, role }: { children: ReactNode; admin?: boolean; role?: "teacher" | "influencer" }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sessionState, setSessionState] = useState<"checking" | "present" | "missing">("checking");
  const requiredRole = role ?? null;
  const allowsAdminWorkshopPreview =
    !admin && pathname.startsWith("/dashboard/workshops/");
  const { data: currentUser, isError, isLoading } = useQuery<ApiUser>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: async () => {
      const hasSession = await ensureSession();
      if (!hasSession) throw new Error("No active session");
      return getCurrentUser({ redirectOnUnauthorized: false });
    },
    gcTime: Infinity,
    enabled: sessionState === "present",
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity
  });
  const usesInfluencerWorkspace = role === "influencer" || currentUser?.role === "influencer";
  const nav = admin ? adminNav : usesInfluencerWorkspace ? influencerWorkspaceNav : teacherNav;
  const homeHref = admin ? "/admin" : role === "influencer" ? "/influencer" : "/dashboard";
  const isHomeDashboard = pathname === homeHref;
  const profileHref = "/dashboard/settings?section=account";
  const [sidebarLayout, setSidebarLayout] = useState<"floating" | "expanded">("expanded");
  // Whether the compact rail is pinned open. Starts false on both server and
  // client and is only raised from localStorage in an effect, so the first
  // client render matches the HTML we sent.
  const [railPinned, setRailPinned] = useState(false);
  // Pinning is the one rail state that reflows the page, so the content column
  // follows it as well as the layout preference.
  const sidebarWide = sidebarLayout === "expanded" || railPinned;

  useEffect(() => {
    if (hasStoredAuthTokens()) {
      setSessionState("present");
      return;
    }

    setSessionState("missing");
    const next = `${window.location.pathname}${window.location.search}`;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [router]);

  useEffect(() => {
    const updateLayout = () => {
      const stored = localStorage.getItem("teachpad_sidebar_layout");
      setSidebarLayout(stored === "floating" ? "floating" : "expanded");
    };
    updateLayout();
    window.addEventListener("teachpad_sidebar_layout_changed", updateLayout);
    window.addEventListener("storage", updateLayout);
    return () => {
      window.removeEventListener("teachpad_sidebar_layout_changed", updateLayout);
      window.removeEventListener("storage", updateLayout);
    };
  }, []);

  useEffect(() => {
    try {
      setRailPinned(localStorage.getItem("teachpad_sidebar_pinned") === "1");
    } catch {
      // Private mode / blocked site data — an unpinned rail is a fine default.
    }
  }, []);

  const toggleRailPin = useCallback(() => {
    setRailPinned((wasPinned) => {
      const pinned = !wasPinned;
      try {
        localStorage.setItem("teachpad_sidebar_pinned", pinned ? "1" : "0");
      } catch {
        // Preference just won't survive the reload.
      }
      return pinned;
    });
  }, []);

  useEffect(() => {
    // Cmd/Ctrl + \ is the pin toggle. Ignored while typing so it can never
    // fire from inside a lesson-plan prompt or any other field.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "\\" || !(e.metaKey || e.ctrlKey)) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      e.preventDefault();
      toggleRailPin();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleRailPin]);

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshSession();
    }, SESSION_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isError) {
      clearToken();
      queryClient.clear();
      const next = typeof window === "undefined" ? "/dashboard" : `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [isError, queryClient, router]);

  useEffect(() => {
    if (admin && currentUser && currentUser.role !== "admin") {
      router.replace("/dashboard");
    }
    if (!admin && !requiredRole && currentUser?.role === "admin" && !allowsAdminWorkshopPreview) {
      router.replace("/admin");
    }
    if (requiredRole && currentUser && currentUser.role !== requiredRole) {
      router.replace(currentUser.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [admin, allowsAdminWorkshopPreview, currentUser?.role, requiredRole, router]);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  function logout() {
    setShowLogoutConfirm(true);
    setMobileOpen(false);
  }

  async function handleConfirmLogout() {
    await logoutSession();
    clearToken();
    queryClient.clear();
    router.replace("/login");
  }

  if (sessionState !== "present" || isLoading || isError || !currentUser || (admin && currentUser.role !== "admin") || (!admin && !requiredRole && currentUser.role === "admin" && !allowsAdminWorkshopPreview) || (role && currentUser.role !== role)) {
    return <AuthCheckingScreen />;
  }

  return (
    <div className="min-h-screen bg-transparent text-teachpad-ink overflow-x-hidden max-w-full">
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-teachpad-cardBorder bg-white/80 px-4 shadow-[0_10px_28px_var(--teachpad-shadowCard)] backdrop-blur-xl lg:hidden">
        <button onClick={() => setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-2xl border border-teachpad-cardBorder bg-white/90 text-teachpad-muted shadow-md backdrop-blur-sm transition-all hover:bg-white hover:text-teachpad-blue">
          <Menu className="h-5 w-5" />
        </button>
        {isHomeDashboard ? (
          <>
            <Brand compact href={homeHref} />
            <div className="flex items-center gap-2">
              {!admin && role !== "influencer" && <StreakPill mobile />}
              <NotificationCenter mobile />
              <Link href={profileHref} aria-label="Open account" className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border-2 border-white bg-white shadow-sm ring-4 ring-blue-100 transition-all hover:-translate-y-0.5 hover:ring-blue-200">
                <BoyAvatar avatarKey={currentUser.avatar_key} />
              </Link>
            </div>
          </>
        ) : (
          <span aria-hidden="true" className="h-10 w-10" />
        )}
      </header>

      {mobileOpen && (
        <>
          <button aria-label="Close sidebar overlay" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-teachpad-ink/20 backdrop-blur-sm lg:hidden" />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col overflow-hidden rounded-r-3xl border-r border-teachpad-cardBorder bg-white/95 p-5 shadow-2xl lg:hidden">
            <div className="flex items-center justify-between">
              <Brand href={homeHref} />
              <button onClick={() => setMobileOpen(false)} className="grid h-9 w-9 place-items-center rounded-card border border-teachpad-cardBorder bg-white/90 text-teachpad-muted shadow-sm transition-all hover:bg-white hover:text-teachpad-blue">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="mt-6 min-h-0 flex-1 space-y-1.5 [@media(max-height:680px)]:mt-4 [@media(max-height:680px)]:space-y-0">
              {nav.map((item) => (
                <MobileNavItem key={item.href} item={item} active={isActive(item.href, pathname)} onClick={() => setMobileOpen(false)} />
              ))}
            </nav>

            {!admin && (
              <a
                href="https://chat.whatsapp.com/CSZrJFz6sMpJuSmAB87tq7?s=sw&p=i&ilr=1&amv=0"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Join the TeachPad WhatsApp community"
                onClick={() => setMobileOpen(false)}
                className="mt-4 flex h-12 shrink-0 items-center gap-3 rounded-2xl px-4 text-sm font-bold text-teachpad-muted transition-all hover:bg-emerald-50 hover:text-emerald-700 [@media(max-height:680px)]:mt-2 [@media(max-height:680px)]:h-9 [@media(max-height:680px)]:px-3 [@media(max-height:680px)]:text-sm"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-card bg-emerald-50 text-[#20bd63] [@media(max-height:680px)]:h-8 [@media(max-height:680px)]:w-8">
                  <WhatsAppIcon className="h-5 w-5" />
                </span>
                Join Now
              </a>
            )}

            <button onClick={logout} className="mt-2 flex h-12 w-full shrink-0 items-center gap-3 rounded-2xl px-4 text-sm font-semibold text-rose-500 transition-all hover:bg-teachpad-red [@media(max-height:680px)]:h-9 [@media(max-height:680px)]:px-3 [@media(max-height:680px)]:text-sm">
              <span className="grid h-10 w-10 place-items-center rounded-card bg-rose-50 [@media(max-height:680px)]:h-8 [@media(max-height:680px)]:w-8"><LogOut className="h-5 w-5 [@media(max-height:680px)]:h-4 [@media(max-height:680px)]:w-4" /></span>
              Logout
            </button>
          </aside>
        </>
      )}

      {sidebarLayout === "expanded" ? (
        <ExpandedSidebar
          nav={nav}
          activePath={pathname}
          onNavigate={() => {}}
          onLogout={logout}
          homeHref={homeHref}
          showCommunity={!admin}
        />
      ) : (
        <FloatingSidebar
          nav={nav}
          activePath={pathname}
          onNavigate={() => {}}
          onLogout={logout}
          pinned={railPinned}
          onTogglePin={toggleRailPin}
        />
      )}

      <div className="hidden lg:block">
        <div className={cn(
          "mx-auto w-full max-w-[1480px] px-6 pt-3",
          sidebarWide ? "pl-[260px]" : "pl-24"
        )}>
          <div className="mx-auto w-full max-w-[1240px] px-4">
            <div id="dashboard-plan-banner-slot" />
            {!admin && role !== "influencer" && (
              <div className="flex justify-center pb-2">
                <TrialStatusPill placement="header" />
              </div>
            )}
            {isHomeDashboard && (
              <div className="flex h-12 items-center justify-between">
                <div>
                  {sidebarLayout !== "expanded" && <Brand compact href={homeHref} />}
                </div>
                <div className="flex items-center gap-2.5">
                  {!admin && role !== "influencer" && <StreakPill />}
                  <NotificationCenter />
                  <Link
                    href={profileHref}
                    aria-label="Open account"
                    className="grid h-11 w-11 place-items-center overflow-hidden rounded-full border-2 border-white bg-white shadow-sm ring-4 ring-blue-100 transition hover:-translate-y-0.5 hover:ring-blue-200"
                  >
                    <BoyAvatar avatarKey={currentUser.avatar_key} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="min-h-screen pb-20 pt-16 lg:pb-0 lg:pt-0">
        <div className={cn(
          "mx-auto w-full max-w-[1480px] px-4 py-4 sm:px-5 lg:px-6 xl:py-5",
          sidebarWide ? "lg:pl-[260px]" : "lg:pl-24"
        )}>
          {!admin && role !== "influencer" && <div className="lg:hidden"><TrialStatusPill /></div>}
          {children}
        </div>
      </main>
      {!admin && <MobileBottomNav nav={usesInfluencerWorkspace ? influencerWorkspaceNav : teacherNav} activePath={pathname} />}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800">Log Out?</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-500">
              Are you sure you want to log out of your account? You will need to sign in again to access TeachPad.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <Button
                variant="ghost"
                onClick={() => setShowLogoutConfirm(false)}
                className="h-10 px-4 text-sm font-bold rounded-card text-slate-500 border border-slate-200 bg-white hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmLogout}
                className="h-10 px-4 text-sm font-bold rounded-card text-white"
              >
                Log Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const navIconColors: Record<string, string> = {
  Home: "text-blue-500",
  "My Workspace": "text-green-500",
  Workspace: "text-green-500",
  "AI Tools": "animate-ai-glow",
  "Growth Hub": "text-lime-500",
  Recent: "text-yellow-500",
  Saved: "text-red-500",
  Books: "text-sky-400",
  Billing: "text-pink-500",
  Settings: "text-gray-400",
  Overview: "text-blue-500",
  Users: "text-red-500",
  Curriculum: "text-blue-500",
  Textbooks: "text-sky-400",
  System: "text-gray-400",
  Dashboard: "text-blue-500",
  Commissions: "text-red-500",
  Payouts: "text-red-500",
  Influencer: "text-red-500",
};


/**
 * Desktop-only (lg:) icon rail that widens to reveal labels on hover, focus, or
 * when pinned. It overlays the page rather than pushing it, so the content
 * column never reflows as the pointer crosses the rail — only pinning, which is
 * deliberate and sticky, shifts the layout.
 *
 * Nothing here is shared with the phone experience: mobile navigates through the
 * header drawer and MobileBottomNav, which are untouched.
 */
function FloatingSidebar({
  nav,
  activePath,
  onNavigate,
  onLogout,
  pinned,
  onTogglePin
}: {
  nav: NavItem[];
  activePath: string;
  onNavigate: () => void;
  onLogout: () => void;
  pinned: boolean;
  onTogglePin: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const open = pinned || hovered;
  const groups = groupNav(nav);

  const logout = (e: React.MouseEvent) => {
    e.preventDefault();
    onLogout();
  };

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // Keyboard users get the same reveal: focus entering the rail opens it,
      // and it closes only once focus leaves the subtree entirely (relatedTarget
      // is null when focus leaves the document, which should not collapse it).
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={(e) => {
        if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) setHovered(false);
      }}
      className={cn(
        "fixed bottom-3 left-3 top-3 z-40 hidden overflow-hidden rounded-sheet border border-teachpad-cardBorder bg-white/92 shadow-e3 backdrop-blur-md transition-[width] duration-200 ease-out lg:flex lg:flex-col",
        open ? "w-60" : "w-16"
      )}
    >
      <TooltipProvider delayDuration={0} skipDelayDuration={0}>
        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
          {groups.map((group, index) => (
            <div key={group.key} className="flex flex-col gap-1">
              {/* Open, a group announces itself by name. Collapsed, there is no
                  room for a word, so it becomes a hairline between runs — and
                  the first group needs neither. */}
              {group.label && open ? (
                <div className="flex h-7 items-center px-2">
                  <span className="truncate text-micro font-black uppercase tracking-wider text-teachpad-muted">
                    {group.label}
                  </span>
                </div>
              ) : null}
              {group.label && !open && index > 0 ? (
                <div className="flex h-7 items-center px-2">
                  <span className="h-px w-full bg-teachpad-cardBorder" />
                </div>
              ) : null}
              {group.items.map((item) => (
                <FloatingNavItem
                  key={item.href}
                  item={item}
                  active={isActive(item.href, activePath)}
                  onClick={onNavigate}
                  open={open}
                />
              ))}
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-teachpad-cardBorder p-2">
          <RailButton
            open={open}
            label="Logout"
            icon={LogOut}
            onClick={logout}
            className="text-rose-600 hover:bg-rose-50"
          />
          <RailButton
            open={open}
            label={pinned ? "Unpin sidebar" : "Pin sidebar open"}
            icon={pinned ? PinOff : Pin}
            onClick={onTogglePin}
            className="text-teachpad-muted hover:bg-surface-sunken hover:text-teachpad-ink"
          />
        </div>
      </TooltipProvider>
    </aside>
  );
}

/** A rail row that is icon-only when collapsed and icon + label when open. */
function RailButton({
  open,
  label,
  icon: Icon,
  onClick,
  className
}: {
  open: boolean;
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex h-11 w-full items-center gap-3 rounded-card px-3 text-sm font-bold transition-colors duration-200",
        className
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className={cn("truncate whitespace-nowrap", open ? "opacity-100" : "opacity-0")}>{label}</span>
    </button>
  );

  if (open) return button;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function FloatingNavItem({
  item,
  active,
  onClick,
  open
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
  open: boolean;
}) {
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onClick}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        // The active bar is drawn as a left border so it lines up in both
        // widths. Inactive rows reserve the same 3px so nothing shifts.
        "relative flex h-11 items-center gap-3 rounded-card border-l-[3px] px-2.5 text-sm font-bold transition-colors duration-200",
        active
          ? "border-brand bg-blue-50 text-brand-text"
          : "border-transparent text-teachpad-muted hover:bg-surface-sunken hover:text-teachpad-ink"
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0 transition-colors duration-200", active && "text-brand")} />
      <span className={cn("truncate whitespace-nowrap transition-opacity duration-200", open ? "opacity-100" : "opacity-0")}>
        {item.label}
      </span>
    </Link>
  );

  // A tooltip on an open rail would just repeat the label sitting next to it.
  if (open) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function MobileNavItem({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  const colorClass = navIconColors[item.label] || "text-blue-500";

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-semibold transition-all duration-200 [@media(max-height:680px)]:h-9 [@media(max-height:680px)]:px-3 [@media(max-height:680px)]:text-sm",
        active
          ? "bg-gradient-to-r from-blue-50 to-white text-teachpad-blue"
          : "text-teachpad-muted hover:bg-teachpad-tag hover:text-teachpad-ink"
      )}
    >
      <span className={cn(
        "grid h-10 w-10 place-items-center rounded-card transition-colors duration-200 [@media(max-height:680px)]:h-8 [@media(max-height:680px)]:w-8",
        active ? "bg-blue-100" : "bg-teachpad-tag",
        colorClass
      )}>
        <Icon className="h-5 w-5 [@media(max-height:680px)]:h-4 [@media(max-height:680px)]:w-4" />
      </span>
      {item.label}
    </Link>
  );
}

function MobileBottomNav({ nav, activePath }: { nav: NavItem[]; activePath: string }) {
  const items = nav.slice(0, 5);
  const centerIndex = items.findIndex((item) => item.href === "/dashboard/classroom-tools");

  if (centerIndex === -1 || items.length < 5) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center lg:hidden px-4 pb-4">
        <div className="flex h-[72px] w-full max-w-md items-center justify-around rounded-[28px] bg-white px-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          {items.map((item) => (
            <TabBarItem
              key={item.href}
              item={item}
              active={isActive(item.href, activePath)}
            />
          ))}
        </div>
      </nav>
    );
  }

  const centerItem = items[centerIndex];
  const sideItems = items.filter((_, index) => index !== centerIndex);
  const leftItems = sideItems.slice(0, 2);
  const rightItems = sideItems.slice(2, 4);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center lg:hidden px-4 pb-4">
      <div className="relative w-full max-w-md">
        {/* Floating bar */}
        <div className="flex h-[72px] items-center justify-around rounded-[28px] bg-white px-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          {leftItems.map((item) => (
            <TabBarItem
              key={item.href}
              item={item}
              active={isActive(item.href, activePath)}
            />
          ))}
          <div className="w-[60px]" /> {/* spacer for center button */}
          {rightItems.map((item) => (
            <TabBarItem
              key={item.href}
              item={item}
              active={isActive(item.href, activePath)}
            />
          ))}
        </div>
        {/* Center AI Tools button */}
        <Link
          href={centerItem.href}
          className="absolute left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-0.5" style={{ top: '-14px' }}
        >
          <div className={cn(
            "flex h-[58px] w-[58px] items-center justify-center rounded-full transition-all duration-200 hover:scale-105",
            "bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30",
            isActive(centerItem.href, activePath) && "scale-105 shadow-xl shadow-blue-500/40"
          )}>
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <span className={cn(
            "text-micro font-semibold transition-colors duration-200",
            isActive(centerItem.href, activePath) ? "text-gray-900" : "text-gray-500"
          )}>
            AI Tools
          </span>
        </Link>
      </div>
    </nav>
  );
}

function TabBarItem({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  const colorClass = navIconColors[item.label] || "text-blue-500";
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 transition-all duration-200 hover:scale-105 min-w-0",
        active && "scale-105"
      )}
    >
      <span className={cn(
        "flex h-9 w-9 items-center justify-center rounded-card transition-all duration-200",
        active ? "bg-blue-100" : "bg-transparent"
      )}>
        <Icon className={cn(
          "h-5 w-5 transition-colors duration-200",
          active ? colorClass : "text-gray-400"
        )} />
      </span>
      <span className={cn(
        "text-micro font-semibold transition-colors duration-200 truncate max-w-full",
        active ? "text-gray-900" : "text-gray-500"
      )}>
        {item.label}
      </span>
    </Link>
  );
}

function AuthCheckingScreen() {
  return (
    <main className="teachpad-page grid min-h-screen place-items-center px-4">
      <div className="rounded-3xl border border-teachpad-cardBorder bg-white/90 px-8 py-6 text-center shadow-[0_18px_50px_var(--teachpad-shadowCard)] backdrop-blur-xl">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-teachpad-blue" />
        <p className="mt-5 text-sm font-semibold text-teachpad-muted">Loading your workspace...</p>
      </div>
    </main>
  );
}

function ExpandedSidebar({ nav, activePath, onNavigate, onLogout, homeHref, showCommunity }: { nav: NavItem[]; activePath: string; onNavigate: () => void; onLogout: () => void; homeHref: string; showCommunity: boolean }) {
  const logout = (e: React.MouseEvent) => {
    e.preventDefault();
    onLogout();
  };

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-[240px] translate-x-[12px] translate-y-[12px] h-[calc(100vh-24px)] rounded-[24px] border border-teachpad-cardBorder bg-white/90 p-5 shadow-[0_20px_60px_var(--teachpad-shadowCard)] backdrop-blur-md lg:flex lg:flex-col justify-between overflow-hidden">
      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        <div className="mb-6 flex items-center justify-between [@media(max-height:760px)]:mb-4 [@media(max-height:680px)]:mb-3">
          <Brand href={homeHref} compact={true} />
        </div>
        <nav className="flex-1 min-h-0 pr-1 select-none">
          {groupNav(nav).map((group) => (
            <div key={group.key} className="space-y-1.5 [@media(max-height:760px)]:space-y-0.5 [@media(max-height:680px)]:space-y-0">
              {group.label ? (
                // Hidden on short laptop screens, where the vertical budget is
                // already tight enough that the existing max-height rules are
                // shrinking the rows themselves.
                <p className="px-3 pb-1 pt-3 text-micro font-black uppercase tracking-wider text-teachpad-muted [@media(max-height:760px)]:hidden">
                  {group.label}
                </p>
              ) : null}
              {group.items.map((item) => (
                <ExpandedSidebarNavItem
                  key={item.href}
                  item={item}
                  active={isActive(item.href, activePath)}
                  onClick={onNavigate}
                />
              ))}
            </div>
          ))}
        </nav>

        {showCommunity && (
          <>
            <div className="hidden [@media(min-height:940px)]:block">
              <WhatsAppCommunityCard />
            </div>
            <a
              href="https://chat.whatsapp.com/CSZrJFz6sMpJuSmAB87tq7?s=sw&p=i&ilr=1&amv=0"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join the TeachPad WhatsApp community"
              className="mt-2 flex h-12 shrink-0 items-center gap-3 rounded-2xl px-3 text-sm font-bold text-teachpad-muted transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-700 [@media(min-height:940px)]:hidden [@media(max-height:680px)]:h-9 [@media(max-height:680px)]:text-sm"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-card bg-emerald-50 text-[#20bd63] [@media(max-height:680px)]:h-8 [@media(max-height:680px)]:w-8">
                <WhatsAppIcon className="h-5 w-5" />
              </span>
              <span>Join Now</span>
            </a>
          </>
        )}
      </div>

      <div className="relative z-10 border-t border-teachpad-cardBorder pt-4 [@media(max-height:680px)]:pt-2">
        <button
          onClick={logout}
          className="flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-sm font-semibold text-rose-500 transition-all duration-300 hover:bg-teachpad-red [@media(max-height:680px)]:h-9 [@media(max-height:680px)]:px-3 [@media(max-height:680px)]:text-sm"
        >
          <span className="grid h-10 w-10 place-items-center rounded-card bg-rose-50 [@media(max-height:680px)]:h-8 [@media(max-height:680px)]:w-8">
            <LogOut className="h-5 w-5 [@media(max-height:680px)]:h-4 [@media(max-height:680px)]:w-4" />
          </span>
          Logout
        </button>
      </div>

    </aside>
  );
}

function WhatsAppCommunityCard() {
  return (
    <section
      className="relative mt-3 shrink-0 overflow-hidden rounded-[18px] border border-blue-100/90 bg-white antialiased shadow-[0_10px_26px_rgba(22,119,255,0.10)] ring-1 ring-white/80"
      style={{ fontFamily: 'ui-rounded, "SF Pro Rounded", "Avenir Next", "Nunito Sans", sans-serif' }}
    >
      <div className="relative h-[132px] overflow-hidden bg-gradient-to-br from-blue-50 via-blue-50 to-violet-50">
        <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-blue-200/35 blur-2xl" aria-hidden="true" />
        <div className="absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-violet-200/40 blur-2xl" aria-hidden="true" />
        <Sparkles className="absolute left-4 top-5 h-4 w-4 fill-violet-300 text-violet-400" aria-hidden="true" />
        <Sparkles className="absolute bottom-4 left-6 h-3.5 w-3.5 fill-sky-300 text-sky-400" aria-hidden="true" />
        <span className="absolute left-[72px] top-[76px] h-2.5 w-2.5 rotate-45 rounded-[2px] bg-amber-200" aria-hidden="true" />
        <span className="absolute right-3 top-6 h-2 w-2 rotate-45 rounded-[2px] bg-fuchsia-200" aria-hidden="true" />

        <div className="absolute left-3 top-4 z-10 max-w-[90px] rounded-[14px] border border-white bg-white/95 px-2.5 py-2 text-micro font-extrabold leading-[1.2] tracking-[-0.01em] text-blue-900 shadow-[0_6px_16px_rgba(22,119,255,0.10)]">
          Let&apos;s grow together
          <span className="absolute -bottom-1 right-4 h-2.5 w-2.5 rotate-45 border-b border-r border-white bg-white" aria-hidden="true" />
        </div>

        <img
          src="/avatars/elif-wave.png"
          alt="Elif waving"
          className="absolute -bottom-[68px] right-[-4px] h-[194px] w-auto object-contain drop-shadow-[0_10px_12px_rgba(0,91,191,0.16)]"
        />
      </div>

      <div className="relative z-10 border-t border-blue-100/70 bg-white px-3 pb-3 pt-3 text-center">
        <h2 className="text-sm font-extrabold leading-tight tracking-[-0.025em] text-blue-900">Join WhatsApp</h2>
        <a
          href="https://chat.whatsapp.com/CSZrJFz6sMpJuSmAB87tq7?s=sw&p=i&ilr=1&amv=0"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Join the TeachPad WhatsApp community"
          className="mt-2.5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#22c767] to-[#19b958] text-sm font-extrabold text-white shadow-[0_7px_16px_rgba(37,211,102,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_10px_20px_rgba(37,211,102,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25d366] focus-visible:ring-offset-2"
        >
          <WhatsAppIcon className="h-[18px] w-[18px]" />
          Join Now
        </a>
      </div>
    </section>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.05 3.2A12.72 12.72 0 0 0 5.1 22.4L3.3 29l6.75-1.77A12.74 12.74 0 1 0 16.05 3.2Zm0 2.14a10.58 10.58 0 1 1-5.39 19.69l-.38-.23-4 .99 1.06-3.87-.25-.4a10.58 10.58 0 0 1 8.96-16.18Z"
      />
      <path
        fill="currentColor"
        d="M12.44 10.27c-.24-.54-.5-.55-.74-.56h-.63c-.22 0-.57.08-.87.4-.3.33-1.14 1.12-1.14 2.72s1.17 3.15 1.33 3.37c.16.22 2.3 3.51 5.57 4.92.78.34 1.38.54 1.86.69.78.25 1.49.21 2.05.13.63-.09 1.93-.79 2.2-1.55.28-.76.28-1.41.2-1.55-.08-.13-.3-.21-.63-.38-.33-.16-1.93-.95-2.23-1.06-.3-.11-.52-.16-.74.17-.22.32-.85 1.06-1.04 1.27-.2.22-.39.25-.72.09-.33-.17-1.39-.52-2.65-1.63a9.9 9.9 0 0 1-1.83-2.28c-.19-.33-.02-.51.15-.67.15-.15.32-.38.49-.57.16-.2.22-.33.32-.55.11-.22.06-.41-.02-.57-.08-.17-.72-1.79-.99-2.43Z"
      />
    </svg>
  );
}

function ExpandedSidebarNavItem({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        // Active reads as a left bar + tint + brand text. The old treatment was
        // a near-white gradient on a near-white panel, so the one row that
        // needed to stand out was the hardest to see. Inactive rows carry the
        // same 3px border in transparent so nothing shifts on navigation.
        "flex h-12 items-center gap-3 rounded-card border-l-[3px] px-2.5 text-sm font-bold transition-colors duration-200 [@media(max-height:760px)]:h-10 [@media(max-height:680px)]:h-9",
        active
          ? "border-brand bg-blue-50 text-brand-text"
          : "border-transparent text-teachpad-muted hover:bg-surface-sunken hover:text-teachpad-ink"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 transition-colors duration-200 [@media(max-height:680px)]:h-4 [@media(max-height:680px)]:w-4",
          active && "text-brand"
        )}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function Brand({ compact = false, href = "/dashboard" }: { compact?: boolean; href?: string }) {
  return (
    <Link href={href} className={cn("block min-w-0", compact && "w-[154px]")}>
      {compact ? (
        <img
          src="/assets/teachpad-logo.png"
          alt="Teachpad"
          className="h-auto max-h-8 w-full object-contain"
        />
      ) : (
        <p className="font-extrabold leading-tight tracking-tight text-lg text-teachpad-ink">
          Teacher AI Tools
        </p>
      )}
    </Link>
  );
}

function isActive(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/classroom-tools") {
    return [
      "/dashboard/classroom-tools",
      "/dashboard/lesson-plans/new",
      "/dashboard/lesson-plans/generating",
      "/dashboard/worksheets/new",
      "/dashboard/presentation-generator",
      "/dashboard/notes-generator",
      "/dashboard/activity-generator"
    ].some((path) => pathname === path || pathname.startsWith(`${path}/`));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
