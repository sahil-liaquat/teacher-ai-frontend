"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  BookOpen,
  Building2,
  Coins,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquareText,
  ScrollText,
  Shield,
  Sprout,
  Ticket,
  Users,
  Activity,
  X,
  ChevronRight,
  Calendar,
  Bell
} from "lucide-react";
import { CURRENT_USER_QUERY_KEY, clearToken, ensureSession, getCurrentUser, logout as logoutSession, refreshSession, type ApiUser } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/notifications/notification-center";

type AdminNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  children?: AdminNavItem[];
};

const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/admin/organizations",
    label: "Organizations",
    icon: Building2,
    children: [
      { href: "/admin/organizations", label: "Schools", icon: Building2 },
      { href: "/admin/organizations/master-curriculum", label: "Master Curriculum", icon: Sprout },
    ],
  },
  { href: "/admin/curriculum", label: "Textbook Curriculum", icon: GraduationCap },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/usage", label: "Usage", icon: Coins },
  { href: "/admin/billing", label: "Billing", icon: Ticket },
  {
    href: "/admin/system",
    label: "Settings",
    icon: Shield,
    children: [
      { href: "/admin/influencers", label: "Influencers", icon: Megaphone },
      { href: "/admin/workshops", label: "Workshops", icon: Calendar },
      { href: "/admin/activity", label: "Activity", icon: ScrollText },
      { href: "/admin/feedback", label: "Feedback", icon: MessageSquareText },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/system", label: "System", icon: Activity },
    ],
  },
];

const SESSION_REFRESH_INTERVAL_MS = 50 * 60 * 1000;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeItem = useMemo(() => {
    for (const item of ADMIN_NAV) {
      const child = item.children?.find((candidate) => isActive(candidate.href, pathname));
      if (child) return child;
      if (isActive(item.href, pathname)) return item;
    }
    return ADMIN_NAV[0];
  }, [pathname]);
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

  if (isLoading || isError || !currentUser || currentUser.role !== "admin") {
    return <AdminAuthScreen />;
  }

  return (
    // Same canvas, sidebar and spacing as SchoolAdminShell. The two admin
    // surfaces are one product and a platform admin moves between them
    // constantly; the glass-and-gradient chrome made them look like different
    // applications.
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="px-5 pt-5">
            <div className="flex items-center justify-between gap-3">
              <Link href="/admin" className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.24)]">
                  <Shield className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-base font-semibold tracking-tight text-slate-950">TeachPad</span>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">TeachPad · Super Admin</span>
                </span>
              </Link>
              <button
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-950 lg:hidden"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <nav className="mt-8 flex-1 overflow-y-auto px-5" aria-label="Platform administration">
            <div className="space-y-1">
              {ADMIN_NAV.map((item) => {
                const groupActive = isActive(item.href, pathname) || Boolean(item.children?.some((child) => isActive(child.href, pathname)));
                return (
                  <div key={`${item.href}-${item.label}`}>
                    <AdminNavLink item={item} active={groupActive && !item.children} />
                    {item.children ? (
                      <div className="ml-4 mt-1 space-y-1 border-l border-slate-200 pl-3">
                        {item.children.map((child) => (
                          <AdminNavLink key={child.href} item={child} active={isActive(child.href, pathname)} compact />
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </nav>

          <div className="mt-auto border-t border-slate-200 p-5">
            <div>
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900">{currentUser.full_name || currentUser.name || "Platform administrator"}</p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-400">{currentUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
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
          className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100 lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
              {/* Not an <h1>: every admin page renders its own via
                  AdminPageHeader, and two h1s on one page is a real
                  accessibility defect, not a styling preference. */}
              <p className="truncate text-sm font-semibold tracking-tight text-slate-950">{activeItem.label}</p>
            </div>
            <NotificationCenter />
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1480px] space-y-6">{children}</div>
        </main>
      </div>

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

function AdminNavLink({ item, active, compact = false }: { item: AdminNavItem; active: boolean; compact?: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-3 rounded-xl px-3 text-sm font-semibold transition",
        compact ? "py-2" : "py-2.5",
        active
          // The left rail marker is School Admin's active affordance. Nested
          // children sit inside a bordered rail already, so the marker would
          // collide with it — they keep the tint alone.
          ? cn("bg-blue-50 text-blue-700", !compact && "before:absolute before:-left-5 before:h-5 before:w-1 before:rounded-full before:bg-blue-600")
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1">{item.label}</span>
    </Link>
  );
}

function AdminAuthScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8fa] px-4">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <p className="text-sm font-semibold text-slate-500">Checking admin access…</p>
      </div>
    </main>
  );
}

function isActive(href: string, pathname: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
