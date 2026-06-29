"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  BookOpen,
  Coins,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Shield,
  Ticket,
  Users,
  Activity,
  X,
  ChevronRight
} from "lucide-react";
import { CURRENT_USER_QUERY_KEY, clearToken, ensureSession, getCurrentUser, logout as logoutSession, refreshSession, type ApiUser } from "@/lib/api";
import { cn } from "@/lib/utils";

type AdminNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/billing", label: "Billing", icon: Ticket },
  { href: "/admin/usage", label: "Usage", icon: Coins },
  { href: "/admin/curriculum", label: "Curriculum", icon: GraduationCap },
  { href: "/admin/textbooks", label: "Textbooks", icon: BookOpen },
  { href: "/admin/activity", label: "Activity", icon: ScrollText },
  { href: "/admin/system", label: "System", icon: Activity }
];

const SESSION_REFRESH_INTERVAL_MS = 50 * 60 * 1000;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeItem = useMemo(() => ADMIN_NAV.find((item) => isActive(item.href, pathname)) ?? ADMIN_NAV[0], [pathname]);
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
      const next = typeof window === "undefined" ? "/admin" : `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [isError, queryClient, router]);

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  async function logout() {
    await logoutSession();
    clearToken();
    queryClient.clear();
    router.replace("/login");
  }

  if (isLoading || isError || !currentUser || currentUser.role !== "admin") {
    return <AdminAuthScreen />;
  }

  return (
    <div className="teachpad-page min-h-screen text-teachpad-ink">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-teachpad-cardBorder bg-white/92 shadow-[0_20px_60px_var(--teachpad-shadowCard)] backdrop-blur-xl transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-teachpad-cardBorder px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <Link href="/admin" className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teachpad-blue to-blue-600 text-white shadow-[0_12px_24px_var(--teachpad-shadowBlue)]">
                  <Shield className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-teachpad-ink">Teacher AI</span>
                  <span className="block truncate text-xs text-teachpad-muted">Admin Panel</span>
                </span>
              </Link>
              <button 
                className="grid h-8 w-8 place-items-center rounded-lg text-teachpad-muted hover:bg-teachpad-tag hover:text-teachpad-ink lg:hidden" 
                onClick={() => setMobileOpen(false)} 
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {ADMIN_NAV.map((item) => (
                <AdminNavLink key={item.href} item={item} active={isActive(item.href, pathname)} />
              ))}
            </div>
          </nav>

          <div className="border-t border-teachpad-cardBorder p-4">
            <div className="rounded-xl border border-teachpad-cardBorder bg-teachpad-panel p-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-teachpad-blue">
                  <Users className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-teachpad-ink">{currentUser.full_name || currentUser.name || "Admin"}</p>
                  <p className="truncate text-xs text-teachpad-muted">{currentUser.email}</p>
                </div>
              </div>
              <button 
                onClick={logout} 
                className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-teachpad-cardBorder text-sm font-medium text-teachpad-muted transition-colors hover:bg-white hover:text-teachpad-ink"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-teachpad-ink/40 backdrop-blur-sm lg:hidden" 
          aria-hidden="true" 
          onClick={() => setMobileOpen(false)} 
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-teachpad-cardBorder bg-white/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-6">
            <div className="flex items-center gap-3">
              <button 
                className="grid h-9 w-9 place-items-center rounded-lg border border-teachpad-cardBorder bg-white text-teachpad-muted shadow-sm lg:hidden" 
                onClick={() => setMobileOpen(true)} 
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-base font-semibold text-teachpad-ink">{activeItem.label}</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="p-6">
          <div className="mx-auto max-w-7xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

function AdminNavLink({ item, active }: { item: AdminNavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
        active 
          ? "bg-blue-50 text-teachpad-blue" 
          : "text-teachpad-muted hover:bg-teachpad-tag hover:text-teachpad-ink"
      )}
    >
      <Icon className={cn("h-5 w-5", active ? "text-teachpad-blue" : "text-teachpad-muted")} />
      <span className="flex-1">{item.label}</span>
      {active && <ChevronRight className="h-4 w-4 text-teachpad-blue" />}
    </Link>
  );
}

function AdminAuthScreen() {
  return (
    <main className="teachpad-page grid min-h-screen place-items-center px-4">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-teachpad-blue" />
        <p className="text-sm font-medium text-teachpad-muted">Checking admin access...</p>
      </div>
    </main>
  );
}

function isActive(href: string, pathname: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
