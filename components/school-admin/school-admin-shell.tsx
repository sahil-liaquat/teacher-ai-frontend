"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Building2, CalendarRange, Home, Library, LogOut, Menu, Palette, Settings, Users, X } from "lucide-react";
import {
  CURRENT_USER_QUERY_KEY,
  clearToken,
  ensureSession,
  getCurrentUser,
  logout as logoutSession,
  type ApiUser,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export const SCHOOL_ADMIN_NAV = [
  { href: "/school-admin", label: "Overview", icon: Home },
  { href: "/school-admin/curriculum", label: "Curriculum", icon: BookOpen },
  { href: "/school-admin/themes", label: "Themes", icon: Palette },
  { href: "/school-admin/resources", label: "Resources", icon: Library },
  { href: "/school-admin/academic-years", label: "Academic Years", icon: CalendarRange },
  { href: "/school-admin/teachers", label: "Teachers", icon: Users },
  { href: "/school-admin/settings", label: "Settings", icon: Settings },
] as const;

function isActive(href: string, pathname: string) {
  return href === "/school-admin" ? pathname === href : pathname.startsWith(href);
}

export function SchoolAdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const { data: user, isLoading, isError } = useQuery<ApiUser>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => getCurrentUser({ redirectOnUnauthorized: false }),
    enabled: sessionReady,
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    void ensureSession().then((present) => {
      if (!present) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      setSessionReady(true);
    });
  }, [pathname, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isError) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    if (user && user.role !== "org_admin") {
      router.replace(user.role === "admin" ? "/admin/primary-curriculum" : "/dashboard");
    }
  }, [isError, pathname, router, user]);

  async function signOut() {
    await logoutSession();
    clearToken();
    queryClient.clear();
    router.replace("/login");
  }

  if (!sessionReady || isLoading || !user || user.role !== "org_admin") {
    return <main className="grid min-h-screen place-items-center text-sm font-semibold text-slate-500">Loading school administration…</main>;
  }

  const navigation = (
    <>
      <Link href="/school-admin" className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.24)]"><Building2 className="h-5 w-5" /></span>
        <span><span className="block text-base font-semibold tracking-tight text-slate-950">TeachPad</span><span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">School Admin</span></span>
      </Link>
      <nav className="mt-8 space-y-1" aria-label="School administration">
        {SCHOOL_ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                isActive(item.href, pathname) ? "bg-blue-50 text-blue-700 before:absolute before:-left-3 before:h-5 before:w-1 before:rounded-full before:bg-blue-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-slate-200 pt-4">
        <p className="truncate px-3 text-xs font-semibold text-slate-900">{user?.full_name || user?.name || "School administrator"}</p>
        <p className="mt-0.5 truncate px-3 text-[11px] text-slate-400">{user?.email}</p>
        <button type="button" onClick={() => void signOut()} className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600"><LogOut className="h-4 w-4" /> Sign out</button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white p-5 lg:flex">
        {navigation}
      </aside>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
        <button type="button" aria-label="Open school administration navigation" onClick={() => setMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100"><Menu className="h-5 w-5" /></button>
        <span className="font-semibold tracking-tight">TeachPad School Admin</span>
        <span className="h-5 w-5" aria-hidden="true" />
      </header>
      {mobileOpen ? (
        <>
          <button type="button" aria-label="Close school administration navigation" className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(19rem,86vw)] flex-col bg-white p-5 shadow-xl lg:hidden">
            <button type="button" aria-label="Close navigation" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100" onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></button>
            {navigation}
          </aside>
        </>
      ) : null}
      <main className="min-h-screen p-4 sm:p-6 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-[1480px]">{children}</div>
      </main>
    </div>
  );
}
