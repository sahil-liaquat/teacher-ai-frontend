"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  BarChart3,
  BookMarked,
  BookOpen,
  GraduationCap,
  Home,
  LogOut,
  Settings,
  Shield,
  Sparkles,
  Users,
  X
} from "lucide-react";
import { CURRENT_USER_QUERY_KEY, clearToken, ensureSession, getCurrentUser, logout as logoutSession, refreshSession, type ApiUser } from "@/lib/api";
import { cn } from "@/lib/utils";
import { BoyAvatar } from "@/components/profile-avatar";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const teacherNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/classroom-tools", label: "AI Tools", icon: Sparkles },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/resources", label: "Saved", icon: BookOpen },
  { href: "/dashboard/textbooks", label: "Books", icon: BookMarked },
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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-violet-50 text-slate-900">
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/50 bg-white/80 px-4 shadow-md backdrop-blur-xl lg:hidden">
        <button onClick={() => setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-2xl border border-white/70 bg-white/90 text-slate-600 shadow-md backdrop-blur-sm hover:bg-white transition-all">
          <Sparkles className="h-5 w-5" />
        </button>
        <Brand compact />
        <Link href="/dashboard/settings" aria-label="Open profile settings" className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-md backdrop-blur-sm hover:bg-white transition-all">
          <BoyAvatar />
        </Link>
      </header>

      {mobileOpen && (
        <>
          <button aria-label="Close sidebar overlay" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden" />
          <aside className="fixed inset-y-0 left-0 z-50 w-[280px] rounded-r-3xl border-r border-white/50 bg-white/95 p-5 shadow-2xl lg:hidden">
            <div className="flex items-center justify-between">
              <Brand />
              <button onClick={() => setMobileOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/70 bg-white/90 text-slate-600 shadow-sm hover:bg-white transition-all">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="mt-6 flex-1 space-y-1.5">
              {nav.map((item) => (
                <MobileNavItem key={item.href} item={item} active={isActive(item.href, pathname)} onClick={() => setMobileOpen(false)} />
              ))}
            </nav>
            <button onClick={logout} className="mt-6 flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-sm font-semibold text-slate-500 transition-all hover:bg-red-50 hover:text-red-600">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50"><LogOut className="h-5 w-5" /></span>
              Logout
            </button>
          </aside>
        </>
      )}

      <FloatingSidebar nav={nav} activePath={pathname} onNavigate={() => {}} onLogout={logout} />

      <main className="min-h-screen pt-16 pb-20 lg:pt-0 lg:pb-0">
        <div className="mx-auto w-full max-w-full px-4 py-5 sm:px-6 lg:px-8 lg:pl-28 xl:py-8">
          {children}
        </div>
      </main>

      <MobileBottomNav nav={nav} activePath={pathname} />
    </div>
  );
}

function FloatingSidebar({ nav, activePath, onNavigate, onLogout }: { nav: NavItem[]; activePath: string; onNavigate: () => void; onLogout: () => void }) {
  const logout = (e: React.MouseEvent) => {
    e.preventDefault();
    onLogout();
  };

  return (
    <aside className="fixed bottom-0 left-6 top-0 z-40 hidden h-[calc(100vh-48px)] translate-y-[24px] lg:block">
      <nav className="flex h-full flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-3 rounded-[32px] border border-white/70 bg-white/85 px-3 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-md">
          {nav.map((item) => (
            <FloatingNavItem
              key={item.href}
              item={item}
              active={isActive(item.href, activePath)}
              onClick={onNavigate}
            />
          ))}

          <div className="my-2 h-px w-8 bg-slate-100" />

          <a
            href="#"
            onClick={logout}
            title="Logout"
            className="group flex h-11 w-11 items-center justify-center rounded-2xl text-slate-400 transition-all duration-300 hover:scale-110 hover:bg-red-50 hover:text-red-500"
          >
            <LogOut className="h-5 w-5" />
          </a>
        </div>
      </nav>
    </aside>
  );
}

function FloatingNavItem({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={item.label}
      className={cn(
        "group relative flex items-center justify-center transition-all duration-300 hover:scale-110",
        active ? "scale-110" : ""
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300",
          active
            ? "bg-white shadow-[0_8px_24px_rgba(59,130,246,0.15)]"
            : "group-hover:bg-blue-50"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5 transition-colors duration-300",
            active ? "text-blue-600" : "text-slate-500 group-hover:text-blue-500"
          )}
        />
      </span>
    </Link>
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
          ? "bg-gradient-to-r from-blue-50 to-violet-50 text-blue-600"
          : "text-slate-600 hover:bg-slate-50"
      )}
    >
      <span className={cn(
        "grid h-10 w-10 place-items-center rounded-xl transition-colors duration-200",
        active ? "bg-blue-100 text-blue-600" : "bg-slate-50 text-slate-500"
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 w-full max-w-full border-t border-white/50 bg-white/90 px-3 shadow-[0_-10px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden" style={{ boxSizing: "border-box" }}>
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
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg"
                    : "bg-slate-50"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    active ? "text-white" : "text-slate-500"
                  )}
                />
              </span>
              <span className={cn(
                "text-[10px] font-semibold transition-colors truncate max-w-full",
                active ? "text-blue-600" : "text-slate-500"
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
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-sky-50 via-white to-violet-50 px-4">
      <div className="rounded-3xl border border-white/70 bg-white/90 px-8 py-6 text-center shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
        <p className="mt-5 text-sm font-semibold text-slate-600">Checking your session...</p>
      </div>
    </main>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="block min-w-0">
      <p className={cn("font-extrabold leading-tight tracking-tight text-slate-900", compact ? "text-base" : "text-lg")}>
        Teacher AI Tools
      </p>
    </Link>
  );
}

function isActive(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/classroom-tools") return pathname.includes("/classroom-tools") || pathname.includes("/lesson-plans/new") || pathname.includes("/worksheets/new");
  return pathname === href || pathname.startsWith(`${href}/`);
}