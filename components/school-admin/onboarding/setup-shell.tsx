"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, LogOut } from "lucide-react";
import {
  CURRENT_USER_QUERY_KEY,
  clearToken,
  ensureSession,
  getCurrentUser,
  logout as logoutSession,
  type ApiUser,
} from "@/lib/api";
import { deferSetup } from "@/lib/school-admin-onboarding";

/**
 * The chrome for guided setup: enough to know where you are, nothing to wander
 * into.
 *
 * ⚠ Deliberately NOT `SchoolAdminShell`. No sidebar, no nine navigation items,
 * no links into surfaces that cannot work yet. The only ways out are finishing
 * setup, explicitly deferring it, and signing out.
 *
 * The auth and role gate is duplicated from the shell rather than shared,
 * because the two now have genuinely different bodies — extracting a common
 * wrapper would be one abstraction serving two layouts that agree on four lines
 * and differ on everything else.
 */
export function SetupShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
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
        router.replace("/login?next=%2Fschool-admin%2Fsetup");
        return;
      }
      setSessionReady(true);
    });
  }, [router]);

  useEffect(() => {
    if (isError) router.replace("/login?next=%2Fschool-admin%2Fsetup");
    if (user && user.role !== "org_admin") {
      router.replace(user.role === "admin" ? "/admin/master-curriculum" : "/dashboard");
    }
  }, [isError, router, user]);

  async function signOut() {
    await logoutSession();
    clearToken();
    queryClient.clear();
    router.replace("/login");
  }

  /**
   * The release valve. Without it, a school that cannot satisfy one of the five
   * readiness keys would be redirected into a wizard it cannot finish and back
   * out of every escape route — a lockout wearing an onboarding flow's clothes.
   */
  function skipForNow() {
    deferSetup();
    router.replace("/school-admin");
  }

  if (!sessionReady || isLoading || !user || user.role !== "org_admin") {
    return (
      <main className="grid min-h-screen place-items-center text-sm font-semibold text-slate-500">
        Loading school setup…
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-[880px] items-center justify-between gap-4 px-5">
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white">
              <Building2 className="h-4.5 w-4.5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight text-slate-950">
                {user.organization_name || "Your school"}
              </span>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Setting up
              </span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={skipForNow}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              Skip for now
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              aria-label="Sign out"
              className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-[880px] px-5 py-10">{children}</main>
    </div>
  );
}
