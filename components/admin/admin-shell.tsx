"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Shield,
  UserRound,
  Users,
  X
} from "lucide-react";
import { CURRENT_USER_QUERY_KEY, clearToken, ensureSession, getCurrentUser, logout as logoutSession, refreshSession, type ApiUser } from "@/lib/api";
import { cn } from "@/lib/utils";

type AdminNavItem = {
  href: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Overview", description: "Operating snapshot", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", description: "People and access", icon: Users },
  { href: "/admin/curriculum", label: "Curriculum", description: "Boards and classes", icon: GraduationCap },
  { href: "/admin/textbooks", label: "Textbooks", description: "Library and indexing", icon: BookOpen },
  { href: "/admin/generations", label: "Generations", description: "Saved outputs", icon: BarChart3 },
  { href: "/admin/system", label: "System", description: "Health and version", icon: Activity }
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
    <div className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[304px] border-r border-slate-200 bg-slate-950 text-white shadow-2xl transition-transform duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <Link href="/admin" className="flex min-w-0 items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-slate-950">
                  <Shield className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-base font-black">Teacher AI Admin</span>
                  <span className="block truncate text-xs font-semibold text-slate-400">Control workspace</span>
                </span>
              </Link>
              <button className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close admin navigation">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {ADMIN_NAV.map((item) => (
              <AdminNavLink key={item.href} item={item} active={isActive(item.href, pathname)} />
            ))}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="rounded-lg bg-white/5 p-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-100 text-cyan-800">
                  <UserRound className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{currentUser.full_name || currentUser.name || "Admin"}</p>
                  <p className="truncate text-xs text-slate-400">{currentUser.email}</p>
                </div>
              </div>
              <button onClick={logout} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/10 text-sm font-bold text-slate-200 hover:bg-white/10">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen ? <button className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden" aria-label="Close admin navigation overlay" onClick={() => setMobileOpen(false)} /> : null}

      <div className="min-h-screen lg:pl-[304px]">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
          <div className="flex min-h-[72px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open admin navigation">
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950">{activeItem.label}</p>
                <p className="truncate text-xs font-medium text-slate-500">{activeItem.description}</p>
              </div>
            </div>
            <div className="hidden min-w-[280px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 md:flex">
              <Search className="h-4 w-4" />
              <span className="truncate">Use each page filter to find records</span>
            </div>
          </div>
        </header>
        <main className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto max-w-[1440px] space-y-5">{children}</div>
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
        "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-slate-300 transition-colors hover:bg-white/10 hover:text-white",
        active && "bg-white text-slate-950 hover:bg-white hover:text-slate-950"
      )}
    >
      <span className={cn("grid h-9 w-9 place-items-center rounded-lg", active ? "bg-slate-950 text-white" : "bg-white/10 text-slate-300")}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate">{item.label}</span>
        <span className={cn("block truncate text-xs font-medium", active ? "text-slate-500" : "text-slate-500")}>{item.description}</span>
      </span>
    </Link>
  );
}

function AdminAuthScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8fb] px-4">
      <div className="rounded-lg border border-slate-200 bg-white px-6 py-5 text-center shadow-sm">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
        <p className="mt-4 text-sm font-bold text-slate-700">Checking admin access...</p>
      </div>
    </main>
  );
}

function isActive(href: string, pathname: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
