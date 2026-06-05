"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  BarChart3,
  BookmarkCheck,
  BookMarked,
  BookOpen,
  CreditCard,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  Settings,
  Shield,
  Sparkles,
  Users,
  X
} from "lucide-react";
import { CURRENT_USER_QUERY_KEY, clearToken, ensureSession, getCurrentUser, logout as logoutSession, refreshSession, type ApiUser } from "@/lib/api";
import { cn } from "@/lib/utils";
import { BoyAvatar } from "@/components/profile-avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrialStatusPill } from "@/components/billing/trial-status-pill";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const teacherNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/classroom-tools", label: "AI Tools", icon: Sparkles },
  { href: "/dashboard/resources", label: "Saved", icon: BookmarkCheck },
  { href: "/dashboard/textbooks", label: "Books", icon: BookMarked },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Overview", icon: Home },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/curriculum", label: "Curriculum", icon: GraduationCap },
  { href: "/admin/generations", label: "Generations", icon: BarChart3 },
  { href: "/admin/textbooks", label: "Textbooks", icon: BookOpen },
  { href: "/admin/system", label: "System", icon: Shield }
];

const SESSION_REFRESH_INTERVAL_MS = 50 * 60 * 1000;

export function AppShell({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = admin ? adminNav : teacherNav;
  const { data: currentUser, isError, isLoading } = useQuery<ApiUser>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: async () => {
      const hasSession = await ensureSession();
      if (!hasSession) throw new Error("No active session");
      return getCurrentUser({ redirectOnUnauthorized: false });
    },
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity
  });

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
  }, [admin, currentUser, router]);

  async function logout() {
    await logoutSession();
    clearToken();
    queryClient.clear();
    router.replace("/login");
  }

  if (isLoading || isError || !currentUser || (admin && currentUser.role !== "admin")) {
    return <AuthCheckingScreen />;
  }

  return (
    <div className="min-h-screen bg-transparent text-teachpad-ink">
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-teachpad-cardBorder bg-white/80 px-4 shadow-[0_10px_28px_var(--teachpad-shadowCard)] backdrop-blur-xl lg:hidden">
        <button onClick={() => setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-2xl border border-teachpad-cardBorder bg-white/90 text-teachpad-muted shadow-md backdrop-blur-sm transition-all hover:bg-white hover:text-teachpad-blue">
          <Menu className="h-5 w-5" />
        </button>
        <Brand compact />
        <Link href="/dashboard/settings" aria-label="Open profile settings" className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl border border-teachpad-cardBorder bg-white/90 shadow-md backdrop-blur-sm transition-all hover:bg-white">
          <BoyAvatar />
        </Link>
      </header>

      {mobileOpen && (
        <>
          <button aria-label="Close sidebar overlay" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-teachpad-ink/20 backdrop-blur-sm lg:hidden" />
          <aside className="fixed inset-y-0 left-0 z-50 w-[280px] rounded-r-3xl border-r border-teachpad-cardBorder bg-white/95 p-5 shadow-2xl lg:hidden">
            <div className="flex items-center justify-between">
              <Brand />
              <button onClick={() => setMobileOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl border border-teachpad-cardBorder bg-white/90 text-teachpad-muted shadow-sm transition-all hover:bg-white hover:text-teachpad-blue">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="mt-6 flex-1 space-y-1.5">
              {nav.map((item) => (
                <MobileNavItem key={item.href} item={item} active={isActive(item.href, pathname)} onClick={() => setMobileOpen(false)} />
              ))}
            </nav>
            <button onClick={logout} className="mt-6 flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-sm font-semibold text-teachpad-muted transition-all hover:bg-teachpad-red hover:text-[#eb3b5a]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-teachpad-tag"><LogOut className="h-5 w-5" /></span>
              Logout
            </button>
          </aside>
        </>
      )}

      <FloatingSidebar nav={nav} activePath={pathname} onNavigate={() => {}} onLogout={logout} />

      <main className="min-h-screen pb-20 pt-16 lg:pb-0 lg:pt-0">
        <div className="mx-auto w-full max-w-[1480px] px-4 py-4 sm:px-5 lg:px-6 lg:pl-24 xl:py-5">
          {!admin && <TrialStatusPill />}
          {children}
        </div>
      </main>
      {!admin && <MobileBottomNav nav={teacherNav} activePath={pathname} />}
    </div>
  );
}

function FloatingSidebar({ nav, activePath, onNavigate, onLogout }: { nav: NavItem[]; activePath: string; onNavigate: () => void; onLogout: () => void }) {
  const logout = (e: React.MouseEvent) => {
    e.preventDefault();
    onLogout();
  };

  return (
    <aside className="fixed bottom-0 left-5 top-0 z-40 hidden h-[calc(100vh-32px)] translate-y-[16px] lg:block">
      <TooltipProvider delayDuration={0} skipDelayDuration={0}>
        <nav className="flex h-full flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-2 rounded-[24px] border border-teachpad-cardBorder bg-white/86 px-2.5 py-4 shadow-[0_20px_60px_var(--teachpad-shadowCard)] backdrop-blur-md">
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
                  className="group flex h-10 w-10 items-center justify-center rounded-xl text-teachpad-muted transition-all duration-300 hover:scale-105 hover:bg-teachpad-red hover:text-[#eb3b5a]"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          </div>
        </nav>
      </TooltipProvider>
    </aside>
  );
}

function FloatingNavItem({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;

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
                active ? "text-teachpad-blue" : "text-teachpad-muted group-hover:text-teachpad-blue"
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

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-semibold transition-all duration-200",
        active
          ? "bg-gradient-to-r from-blue-50 to-white text-teachpad-blue"
          : "text-teachpad-muted hover:bg-teachpad-tag hover:text-teachpad-ink"
      )}
    >
      <span className={cn(
        "grid h-10 w-10 place-items-center rounded-xl transition-colors duration-200",
        active ? "bg-blue-100 text-teachpad-blue" : "bg-teachpad-tag text-teachpad-muted"
      )}>
        <Icon className="h-5 w-5" />
      </span>
      {item.label}
    </Link>
  );
}

function MobileBottomNav({ nav, activePath }: { nav: NavItem[]; activePath: string }) {
  const visibleNav = nav.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 w-full max-w-full border-t border-teachpad-cardBorder bg-white/90 px-3 shadow-[0_-10px_40px_var(--teachpad-shadowCard)] backdrop-blur-xl lg:hidden" style={{ boxSizing: "border-box" }}>
      <div className="flex h-16 items-center" style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, activePath);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-all duration-200 min-w-0",
                active ? "scale-110" : ""
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300",
                  active
                    ? "bg-gradient-to-br from-teachpad-blue to-blue-600 shadow-lg"
                    : "bg-teachpad-tag"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    active ? "text-white" : "text-teachpad-muted"
                  )}
                />
              </span>
              <span className={cn(
                "text-[10px] font-semibold transition-colors truncate max-w-full",
                active ? "text-teachpad-blue" : "text-teachpad-muted"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function AuthCheckingScreen() {
  return (
    <main className="teachpad-page grid min-h-screen place-items-center px-4">
      <div className="rounded-3xl border border-teachpad-cardBorder bg-white/90 px-8 py-6 text-center shadow-[0_18px_50px_var(--teachpad-shadowCard)] backdrop-blur-xl">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-teachpad-blue" />
        <p className="mt-5 text-sm font-semibold text-teachpad-muted">Checking your session...</p>
      </div>
    </main>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className={cn("block min-w-0", compact && "w-[154px]")}>
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
      "/dashboard/activity-generator",
      "/dashboard/live-quiz"
    ].some((path) => pathname === path || pathname.startsWith(`${path}/`));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
