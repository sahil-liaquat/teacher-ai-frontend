"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  BarChart3,
  BookMarked,
  BookOpen,
  Home,
  LogOut,
  Menu,
  Settings,
  Shield,
  SlidersHorizontal,
  Users,
  Wand2,
  X
} from "lucide-react";
import { clearToken, ensureSession, getCurrentUser, logout as logoutSession, type ApiUser } from "@/lib/api";
import { cn } from "@/lib/utils";
import { BoyAvatar } from "@/components/profile-avatar";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const teacherNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/classroom-tools", label: "AI Tools", icon: Wand2 },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/resources", label: "Saved", icon: BookOpen },
  { href: "/dashboard/textbooks", label: "Books", icon: BookMarked },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Overview", icon: Home },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/generations", label: "Generations", icon: BarChart3 },
  { href: "/admin/textbooks", label: "Textbooks", icon: BookOpen },
  { href: "/admin/system", label: "System", icon: Shield }
];

export function AppShell({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [authState, setAuthState] = useState<"checking" | "ready" | "denied">("checking");
  const nav = admin ? adminNav : teacherNav;

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    let cancelled = false;
    setAuthState("checking");
    ensureSession()
      .then((hasSession) => {
        if (!hasSession) throw new Error("No active session");
        return getCurrentUser({ redirectOnUnauthorized: false });
      })
      .then((user) => {
        if (cancelled) return;
        setCurrentUser(user);
        if (admin && user.role !== "admin") {
          setAuthState("denied");
          router.replace("/dashboard");
          return;
        }
        setAuthState("ready");
      })
      .catch(() => {
        if (!cancelled) {
          clearToken();
          setCurrentUser(null);
          setAuthState("denied");
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [admin, pathname, router]);

  async function logout() {
    await logoutSession();
    clearToken();
    router.replace("/login");
  }

  if (authState !== "ready") {
    return <AuthCheckingScreen />;
  }

  return (
    <div className="min-h-screen bg-[#fbfaff] text-[#101039]">
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-[#eeeaf7] bg-white/95 px-4 py-3 shadow-[0_10px_30px_rgba(39,30,91,0.06)] backdrop-blur-xl xl:hidden">
        <button onClick={() => setMobileOpen(true)} className="premium-hover-sm grid h-11 w-11 place-items-center rounded-[14px] border border-[#ebe7f4] bg-white text-[#5d5874] shadow-sm">
          <Menu className="h-5 w-5" />
        </button>
        <Brand compact />
        <Link href="/dashboard/settings" aria-label="Open profile settings" className="premium-hover-sm grid h-11 w-11 place-items-center overflow-hidden rounded-[14px] border border-[#ebe7f4] bg-white shadow-sm">
          <BoyAvatar />
        </Link>
      </header>

      {mobileOpen ? <button aria-label="Close sidebar overlay" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-[#101039]/35 backdrop-blur-sm xl:hidden" /> : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#eeeaf7] bg-white shadow-[26px_0_80px_rgba(39,30,91,0.09)] transition-[transform,width,padding] duration-150 ease-out will-change-[transform,width]",
          "w-[min(86vw,320px)] px-4 py-5 xl:translate-x-0 xl:py-5 2xl:py-7",
          "xl:w-[76px] xl:px-2.5 2xl:w-[92px] 2xl:px-3",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between xl:justify-center">
          <div className="xl:hidden">
            <Brand />
          </div>
          <button onClick={() => setMobileOpen(false)} className="premium-hover-sm grid h-10 w-10 place-items-center rounded-[12px] border border-[#ebe7f4] text-[#5d5874] xl:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 flex-1 space-y-1.5 2xl:mt-9 2xl:space-y-2">
          {nav.map((item, index) => (
            <div key={`${item.label}-${item.href}`}>
              {index === 5 && !admin ? <div className="my-4 h-px bg-[#eeeaf7] 2xl:my-6" /> : null}
              <SidebarItem item={item} active={isActive(item.href, pathname)} />
            </div>
          ))}
        </nav>

        <button
          onClick={logout}
          className="sidebar-menu-item flex h-12 items-center gap-3 rounded-[14px] px-3 text-sm font-bold text-[#5d5874] transition-colors duration-200 hover:bg-[#f8f6ff] hover:text-[#6f3ee9] xl:justify-center xl:px-0"
          title="Logout"
          aria-label="Logout"
        >
          <span className="grid h-9 w-9 place-items-center rounded-[12px] transition-colors duration-200">
            <LogOut className="h-5 w-5" />
          </span>
          <span className="xl:hidden">Logout</span>
        </button>
      </aside>

      <main className="min-h-screen pt-[68px] transition-[margin] duration-150 ease-out xl:ml-[76px] xl:pt-0 2xl:ml-[92px]">
        <div className="mx-auto max-w-[1320px] px-4 py-4 sm:px-5 md:px-5 xl:px-5 xl:py-5 2xl:max-w-[1680px] 2xl:px-8 2xl:py-8">{children}</div>
      </main>
    </div>
  );
}

function AuthCheckingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fbfaff] px-4">
      <div className="rounded-[18px] border border-[#ebe7f4] bg-white px-6 py-5 text-center shadow-[0_18px_50px_rgba(39,30,91,0.08)]">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#ded7ed] border-t-[#6f3ee9]" />
        <p className="mt-4 text-sm font-bold text-[#5d5874]">Checking your session...</p>
      </div>
    </main>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="block min-w-0">
      <p className={cn("font-black leading-6 tracking-tight text-[#171236]", compact ? "text-[17px]" : "text-[20px] 2xl:text-[22px]")}>Teacher AI Tools</p>
      {!compact ? <p className="mt-1 text-xs font-semibold text-[#77728e] 2xl:text-sm">AI-Powered Teaching Assistant</p> : null}
    </Link>
  );
}

function SidebarItem({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={item.label}
      className={cn(
        "sidebar-menu-item flex h-11 items-center gap-3 rounded-[13px] px-3.5 text-sm font-bold text-[#4f4b68] transition-colors duration-200 hover:bg-[#f8f6ff] hover:text-[#6f3ee9] xl:justify-center xl:px-0 2xl:h-[56px] 2xl:gap-4 2xl:rounded-[14px] 2xl:px-0 2xl:text-[16px]",
        active && "text-[#6f3ee9]"
      )}
    >
      <span className={cn(
        "grid h-9 w-9 place-items-center rounded-[12px] transition-colors duration-200 2xl:h-11 2xl:w-11",
        active ? "text-[#6f3ee9]" : "text-[#5d5874]"
      )}>
        <Icon className="h-5 w-5 shrink-0 2xl:h-6 2xl:w-6" />
      </span>
      <span className="xl:hidden">{item.label}</span>
      {item.label === "Settings" ? <SlidersHorizontal className="ml-auto h-4 w-4 opacity-0 xl:hidden" /> : null}
    </Link>
  );
}

function isActive(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/classroom-tools") return pathname.includes("/classroom-tools") || pathname.includes("/lesson-plans/new") || pathname.includes("/worksheets/new");
  return pathname === href || pathname.startsWith(`${href}/`);
}
