"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const teacherNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/my-workspace", label: "Workspace", icon: PanelsTopLeft },
  { href: "/dashboard/classroom-tools", label: "AI Tools", icon: Sparkles },
  { href: "/dashboard/workshops", label: "Growth Hub", icon: Calendar },
  { href: "/dashboard/recent-generations", label: "Recent", icon: Clock },
  { href: "/dashboard/resources", label: "Saved", icon: BookmarkCheck },
  { href: "/dashboard/textbooks", label: "Books", icon: BookMarked },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

const influencerWorkspaceNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/my-workspace", label: "Workspace", icon: PanelsTopLeft },
  { href: "/influencer", label: "Influencer", icon: HandCoins },
  { href: "/dashboard/classroom-tools", label: "AI Tools", icon: Sparkles },
  { href: "/dashboard/workshops", label: "Growth Hub", icon: Calendar },
  { href: "/dashboard/recent-generations", label: "Recent", icon: Clock },
  { href: "/dashboard/resources", label: "Saved", icon: BookmarkCheck },
  { href: "/dashboard/textbooks", label: "Books", icon: BookMarked },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
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
              <button onClick={() => setMobileOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl border border-teachpad-cardBorder bg-white/90 text-teachpad-muted shadow-sm transition-all hover:bg-white hover:text-teachpad-blue">
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
                className="mt-4 flex h-12 shrink-0 items-center gap-3 rounded-2xl px-4 text-sm font-bold text-teachpad-muted transition-all hover:bg-emerald-50 hover:text-emerald-700 [@media(max-height:680px)]:mt-2 [@media(max-height:680px)]:h-9 [@media(max-height:680px)]:px-3 [@media(max-height:680px)]:text-[13px]"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-[#20bd63] [@media(max-height:680px)]:h-8 [@media(max-height:680px)]:w-8">
                  <WhatsAppIcon className="h-5 w-5" />
                </span>
                Join Now
              </a>
            )}

            <button onClick={logout} className="mt-2 flex h-12 w-full shrink-0 items-center gap-3 rounded-2xl px-4 text-sm font-semibold text-[#eb3b5a] transition-all hover:bg-teachpad-red [@media(max-height:680px)]:h-9 [@media(max-height:680px)]:px-3 [@media(max-height:680px)]:text-[13px]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 [@media(max-height:680px)]:h-8 [@media(max-height:680px)]:w-8"><LogOut className="h-5 w-5 [@media(max-height:680px)]:h-4 [@media(max-height:680px)]:w-4" /></span>
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
        <FloatingSidebar nav={nav} activePath={pathname} onNavigate={() => {}} onLogout={logout} />
      )}

      <div className="hidden lg:block">
        <div className={cn(
          "mx-auto w-full max-w-[1480px] px-6 pt-3",
          sidebarLayout === "expanded" ? "pl-[260px]" : "pl-24"
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
          sidebarLayout === "expanded" ? "lg:pl-[260px]" : "lg:pl-24"
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
                className="h-10 px-4 text-sm font-bold rounded-xl text-slate-500 border border-slate-200 bg-white hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmLogout}
                className="h-10 px-4 text-sm font-bold rounded-xl text-white"
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


function FloatingSidebar({ nav, activePath, onNavigate, onLogout }: { nav: NavItem[]; activePath: string; onNavigate: () => void; onLogout: () => void }) {
  const logout = (e: React.MouseEvent) => {
    e.preventDefault();
    onLogout();
  };

  return (
    <aside className="fixed bottom-0 left-5 top-0 z-40 hidden h-[calc(100vh-32px)] translate-y-[16px] lg:block">
      <TooltipProvider delayDuration={0} skipDelayDuration={0}>
        <nav className="flex h-full flex-col items-center justify-center">
          <div className="relative overflow-hidden flex flex-col items-center justify-center rounded-[24px] border border-teachpad-cardBorder bg-white/86 px-2.5 py-4 shadow-[0_20px_60px_var(--teachpad-shadowCard)] backdrop-blur-md">
            <div className="relative z-10 flex flex-col items-center gap-2">
              {nav.map((item) => (
                <FloatingNavItem
                  key={item.href}
                  item={item}
                  active={isActive(item.href, activePath)}
                  onClick={onNavigate}
                />
              ))}

              <div className="my-2 h-px w-8 bg-teachpad-cardBorder" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={logout}
                    aria-label="Logout"
                    className="group flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-[#eb3b5a] transition-all duration-300 hover:scale-105 hover:bg-teachpad-red"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Logout</TooltipContent>
              </Tooltip>
            </div>

            {/* Gradient blurry blobs at bottom */}
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-blue-500/15 blur-2xl z-0" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-fuchsia-500/15 blur-2xl z-0" />
          </div>
        </nav>
      </TooltipProvider>
    </aside>
  );
}

function FloatingNavItem({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  const colorClass = navIconColors[item.label] || "text-blue-500";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          onClick={onClick}
          aria-label={item.label}
          className={cn(
            "group relative flex items-center justify-center transition-all duration-300 hover:scale-105",
            active ? "scale-105" : ""
          )}
        >
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300",
              active
                ? "bg-white shadow-[0_8px_24px_var(--teachpad-shadowBlue)]"
                : "group-hover:bg-blue-50"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 transition-colors duration-300",
                colorClass
              )}
            />
          </span>
        </Link>
      </TooltipTrigger>
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
        "flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-semibold transition-all duration-200 [@media(max-height:680px)]:h-9 [@media(max-height:680px)]:px-3 [@media(max-height:680px)]:text-[13px]",
        active
          ? "bg-gradient-to-r from-blue-50 to-white text-teachpad-blue"
          : "text-teachpad-muted hover:bg-teachpad-tag hover:text-teachpad-ink"
      )}
    >
      <span className={cn(
        "grid h-10 w-10 place-items-center rounded-xl transition-colors duration-200 [@media(max-height:680px)]:h-8 [@media(max-height:680px)]:w-8",
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
            "text-[10px] font-semibold transition-colors duration-200",
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
        "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200",
        active ? "bg-blue-100" : "bg-transparent"
      )}>
        <Icon className={cn(
          "h-5 w-5 transition-colors duration-200",
          active ? colorClass : "text-gray-400"
        )} />
      </span>
      <span className={cn(
        "text-[10px] font-semibold transition-colors duration-200 truncate max-w-full",
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
        <nav className="flex-1 space-y-1.5 min-h-0 pr-1 select-none [@media(max-height:760px)]:space-y-0.5 [@media(max-height:680px)]:space-y-0">
          {nav.map((item) => (
            <ExpandedSidebarNavItem
              key={item.href}
              item={item}
              active={isActive(item.href, activePath)}
              onClick={onNavigate}
            />
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
              className="mt-2 flex h-12 shrink-0 items-center gap-3 rounded-2xl px-3 text-sm font-bold text-teachpad-muted transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-700 [@media(min-height:940px)]:hidden [@media(max-height:680px)]:h-9 [@media(max-height:680px)]:text-[13px]"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-[#20bd63] [@media(max-height:680px)]:h-8 [@media(max-height:680px)]:w-8">
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
          className="flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-sm font-semibold text-[#eb3b5a] transition-all duration-300 hover:bg-teachpad-red [@media(max-height:680px)]:h-9 [@media(max-height:680px)]:px-3 [@media(max-height:680px)]:text-[13px]"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 [@media(max-height:680px)]:h-8 [@media(max-height:680px)]:w-8">
            <LogOut className="h-5 w-5 [@media(max-height:680px)]:h-4 [@media(max-height:680px)]:w-4" />
          </span>
          Logout
        </button>
      </div>

      {/* Gradient blurry blobs at bottom */}
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-blue-500/15 blur-2xl z-0" />
      <div className="pointer-events-none absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-fuchsia-500/15 blur-2xl z-0" />
    </aside>
  );
}

function WhatsAppCommunityCard() {
  return (
    <section
      className="relative mt-3 shrink-0 overflow-hidden rounded-[18px] border border-blue-100/90 bg-white antialiased shadow-[0_10px_26px_rgba(22,119,255,0.10)] ring-1 ring-white/80"
      style={{ fontFamily: 'ui-rounded, "SF Pro Rounded", "Avenir Next", "Nunito Sans", sans-serif' }}
    >
      <div className="relative h-[132px] overflow-hidden bg-gradient-to-br from-blue-50 via-[#eefaff] to-violet-50">
        <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-blue-200/35 blur-2xl" aria-hidden="true" />
        <div className="absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-violet-200/40 blur-2xl" aria-hidden="true" />
        <Sparkles className="absolute left-4 top-5 h-4 w-4 fill-violet-300 text-violet-400" aria-hidden="true" />
        <Sparkles className="absolute bottom-4 left-6 h-3.5 w-3.5 fill-sky-300 text-sky-400" aria-hidden="true" />
        <span className="absolute left-[72px] top-[76px] h-2.5 w-2.5 rotate-45 rounded-[2px] bg-amber-200" aria-hidden="true" />
        <span className="absolute right-3 top-6 h-2 w-2 rotate-45 rounded-[2px] bg-fuchsia-200" aria-hidden="true" />

        <div className="absolute left-3 top-4 z-10 max-w-[90px] rounded-[14px] border border-white bg-white/95 px-2.5 py-2 text-[10.5px] font-extrabold leading-[1.2] tracking-[-0.01em] text-[#12346b] shadow-[0_6px_16px_rgba(22,119,255,0.10)]">
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
        <h2 className="text-[15px] font-extrabold leading-tight tracking-[-0.025em] text-[#12346b]">Join WhatsApp</h2>
        <a
          href="https://chat.whatsapp.com/CSZrJFz6sMpJuSmAB87tq7?s=sw&p=i&ilr=1&amv=0"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Join the TeachPad WhatsApp community"
          className="mt-2.5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#22c767] to-[#19b958] text-[13px] font-extrabold text-white shadow-[0_7px_16px_rgba(37,211,102,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_10px_20px_rgba(37,211,102,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25d366] focus-visible:ring-offset-2"
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
  const colorClass = navIconColors[item.label] || "text-blue-500";

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex h-12 items-center gap-3 rounded-2xl px-3 text-sm font-bold transition-all duration-300 hover:scale-[1.02] [@media(max-height:760px)]:h-10 [@media(max-height:680px)]:h-9 [@media(max-height:680px)]:text-[13px]",
        active
          ? "bg-gradient-to-r from-blue-50/50 to-white text-teachpad-blue border border-teachpad-cardBorder/30 shadow-sm"
          : "text-teachpad-muted hover:bg-slate-50 hover:text-teachpad-ink"
      )}
    >
      <span className={cn(
        "grid h-9 w-9 place-items-center rounded-xl transition-all duration-300 [@media(max-height:760px)]:h-8 [@media(max-height:760px)]:w-8",
        active
          ? "bg-white shadow-[0_4px_12px_rgba(59,130,246,0.12)]"
          : "",
        colorClass
      )}>
        <Icon className="h-5 w-5 [@media(max-height:680px)]:h-4 [@media(max-height:680px)]:w-4" />
      </span>
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
