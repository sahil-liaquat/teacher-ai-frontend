"use client";

import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { READY_TOOLS } from "@/lib/tools";

const aiToolPages = READY_TOOLS.map((tool) => ({
  label: tool.name,
  description: tool.description,
  href: tool.publicHref,
  Icon: tool.Icon,
  tone: tool.tone,
  status: tool.status,
}));

const navItems = [
  { label: "Home", href: "/", key: "home" },
  { label: "AI Tools", href: "/ai-tools", key: "ai-tools", children: aiToolPages },
  { label: "Boards & Curriculums", href: "/boards-curriculums", key: "boards-curriculums" },
  { label: "Growth Hub", href: "/academy", key: "academy" },
  { label: "Pricing", href: "/pricing", key: "pricing" }
];

const toolToneClasses = {
  blue: "bg-blue-50 text-blue-600 group-hover/item:bg-blue-600 group-hover/item:text-white",
  green: "bg-emerald-50 text-emerald-600 group-hover/item:bg-emerald-600 group-hover/item:text-white",
  orange: "bg-orange-50 text-orange-600 group-hover/item:bg-orange-500 group-hover/item:text-white",
  purple: "bg-violet-50 text-violet-600 group-hover/item:bg-violet-600 group-hover/item:text-white",
  aqua: "bg-cyan-50 text-cyan-600 group-hover/item:bg-cyan-600 group-hover/item:text-white",
  yellow: "bg-amber-50 text-amber-600 group-hover/item:bg-amber-500 group-hover/item:text-white"
} as const;

export function MarketingHeader({ active }: { active?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const activeKey =
    active ||
    navItems.find(
      (item) =>
        pathname === item.href ||
        (item.href !== "/" && pathname.startsWith(`${item.href}/`)) ||
        item.children?.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`))
    )?.key;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/86 backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr] items-center gap-2 px-4 sm:h-20 sm:gap-3 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:px-8">
        <Link href="/" aria-label="teachpad.in home" className="shrink-0">
          <TeachPadLogo />
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center justify-center gap-7 lg:flex">
          {navItems.map((item) => {
            const isActive = activeKey === item.key;

            if (item.children) {
              return (
                <div key={item.key} className="group relative">
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative inline-flex items-center gap-1.5 py-2 text-sm font-bold transition hover:text-blue-600 ${
                      isActive ? "text-blue-600" : "text-slate-800"
                    }`}
                  >
                    {item.label}
                    <ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180" />
                  </Link>
                  <div className="pointer-events-none absolute left-1/2 top-full z-50 w-[390px] -translate-x-1/2 pt-3 opacity-0 transition duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
                      <Link
                        href="/ai-tools"
                        className="flex items-center justify-between bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_100%)] px-4 py-4 text-sm font-black text-slate-950 transition hover:text-blue-600"
                      >
                        <span>
                          <span className="block">View All AI Tools</span>
                          <span className="mt-1 block text-xs font-semibold text-slate-500">One textbook. Every teaching resource.</span>
                        </span>
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </Link>
                      <div className="grid gap-1 p-2">
                      {item.children.map((child) => {
                        const Icon = child.Icon;
                        const tone = toolToneClasses[child.tone as keyof typeof toolToneClasses];
                        return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="group/item grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-50"
                        >
                          <span className={`grid h-11 w-11 place-items-center rounded-xl transition ${tone}`}>
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-black text-slate-900 transition group-hover/item:text-blue-600">
                              {child.label}{child.status === "beta" ? " (Beta)" : ""}
                            </span>
                            <span className="mt-0.5 block text-xs font-semibold leading-5 text-slate-500">{child.description}</span>
                          </span>
                          <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover/item:translate-x-0.5 group-hover/item:text-blue-600" />
                        </Link>
                        );
                      })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative py-2 text-sm font-bold transition hover:text-blue-600 ${
                  isActive ? "text-blue-600" : "text-slate-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-3">
          <Link href="/login" className="inline-flex h-10 shrink-0 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 shadow-sm transition hover:border-blue-200 hover:text-blue-600 sm:h-11 sm:px-4 sm:text-sm">
            Log In
          </Link>
          <Link
            href="/signup"
            className="hidden h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-black text-white shadow-[0_18px_36px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:bg-blue-700 min-[390px]:inline-flex sm:h-11 sm:px-5 sm:text-sm"
          >
            <span className="sm:hidden">Sign Up</span>
            <span className="hidden sm:inline">Sign Up Free</span>
            <ArrowRight className="hidden h-4 w-4 sm:block" />
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:border-blue-200 hover:text-blue-600 lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav aria-label="Mobile navigation" className="border-t border-slate-200 bg-white px-4 py-3 shadow-[0_18px_36px_rgba(15,23,42,0.08)] lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-2">
            <Link href="/" aria-label="teachpad.in home" onClick={() => setMenuOpen(false)} className="mb-2 inline-flex w-fit">
              <Image src="/assets/teachpad-logo.png" alt="TeachPad.in" width={1385} height={279} quality={100} className="h-auto w-44" priority={false} />
            </Link>
            {navItems.map((item) => {
              const isActive = activeKey === item.key;

              return (
                <div key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center justify-between rounded-lg px-3 py-3 text-sm font-bold transition ${
                      isActive ? "bg-blue-50 text-blue-600" : "text-slate-800 hover:bg-slate-50 hover:text-blue-600"
                    }`}
                  >
                    {item.label}
                    {item.children ? <ChevronDown className="h-4 w-4" /> : null}
                  </Link>
                  {item.children ? (
                    <div className="mt-1 grid gap-1 pl-3">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMenuOpen(false)}
                          className="grid grid-cols-[34px_1fr] items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
                        >
                          <span className={`grid h-8 w-8 place-items-center rounded-lg ${toolToneClasses[child.tone as keyof typeof toolToneClasses]}`}>
                            <child.Icon className="h-4 w-4" />
                          </span>
                          <span>{child.label}</span>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </nav>
      ) : null}
    </header>
  );
}

function TeachPadLogo() {
  return (
    <Image src="/assets/teachpad-logo.png" alt="TeachPad.in" width={1385} height={279} quality={100} className="h-auto w-24 min-[390px]:w-32 sm:w-44" priority />
  );
}
