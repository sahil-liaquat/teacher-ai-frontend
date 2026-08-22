"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, LogOut, Menu, X } from "lucide-react";
import {
  backendApi,
  CURRENT_USER_QUERY_KEY,
  clearToken,
  ensureSession,
  getCurrentUser,
  logout as logoutSession,
  type ApiUser,
} from "@/lib/api";
import { activeModule, isProductNavItemActive, productNavFor } from "@/lib/product-nav";
import { ModuleSwitcher } from "@/components/product/module-switcher";
import { hasDeferredSetup, shouldRedirectToSetup } from "@/lib/school-admin-onboarding";
import type { OnboardingState } from "@/lib/api";
import { cn } from "@/lib/utils";

// Nav lives in lib/school-admin-nav.ts so the shell and the architecture test
// read the same definition. Re-exported because existing imports point here.
export { SCHOOL_ADMIN_NAV } from "@/lib/school-admin-nav";

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

  /**
   * ⚠ A school that has not finished setup does not get the ERP.
   *
   * Nine navigation items, every one of which leads to an empty state or a
   * "create an academic year first" wall, is not a product — it is a maze. The
   * wizard is where an unconfigured school belongs.
   *
   * `retry: false` and the undefined guard matter: on an unknown state the
   * shell holds rather than guessing, so a configured school is never bounced
   * through the wizard on a cold load or a flaky request.
   */
  const onboarding = useQuery<OnboardingState>({
    queryKey: ["school-admin", "onboarding"],
    queryFn: backendApi.schoolAdminOnboarding,
    enabled: sessionReady && user?.role === "org_admin",
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    if (shouldRedirectToSetup({
      isComplete: onboarding.data?.is_complete,
      deferred: hasDeferredSetup(),
      pathname,
    })) {
      router.replace("/school-admin/setup");
    }
  }, [onboarding.data?.is_complete, pathname, router]);

  useEffect(() => {
    if (isError) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    if (user && user.role !== "org_admin") {
      router.replace(user.role === "admin" ? "/admin/master-curriculum" : "/dashboard");
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

  const module = activeModule(pathname);
  const navItems = productNavFor(pathname);

  const navigation = (
    <>
      <Link href="/school-admin" className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.24)]"><Building2 className="h-5 w-5" /></span>
        <span className="min-w-0"><span className="block truncate text-base font-semibold tracking-tight text-slate-950">{user.organization_name || "TeachPad"}</span><span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">TeachPad · School Excellence</span></span>
      </Link>
      {/* One collapsed row. Academic's own items keep their position below it. */}
      <ModuleSwitcher pathname={pathname} />
      <nav className="mt-6 space-y-1" aria-label={`${module.label} navigation`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                isProductNavItemActive(item.href, pathname) ? "bg-blue-50 text-blue-700 before:absolute before:-left-3 before:h-5 before:w-1 before:rounded-full before:bg-blue-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {item.status === "foundation" ? (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">Soon</span>
              ) : null}
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
        <button type="button" aria-label={`Open ${module.label} navigation`} onClick={() => setMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100"><Menu className="h-5 w-5" /></button>
        <span className="max-w-[70vw] truncate font-semibold tracking-tight">{user.organization_name || "TeachPad"}</span>
        <span className="h-5 w-5" aria-hidden="true" />
      </header>
      {mobileOpen ? (
        <>
          <button type="button" aria-label={`Close ${module.label} navigation`} className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" onClick={() => setMobileOpen(false)} />
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

/**
 * The same shell, named for what it now is.
 *
 * ⚠ ONE SHELL, NOT TWO. Every module in the School Excellence OS is an
 * org-admin surface behind the same session check, the same onboarding gate and
 * the same sign-out. A second shell for the new modules would mean a second
 * place to fix an auth bug, and — worse — two subtly different sidebars, which
 * is exactly the "two projects stitched together" failure this product is
 * trying to avoid.
 *
 * The nav it renders is resolved from the pathname (`productNavFor`), so for
 * every `/school-admin/*` route this is byte-for-byte the Academic shell that
 * shipped, plus one collapsed module switcher.
 */
export const ProductShell = SchoolAdminShell;
