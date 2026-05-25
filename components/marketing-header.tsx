"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "AI Tools", href: "/ai-tools", key: "ai-tools" },
  { label: "Boards & Curriculums", href: "/boards-curriculums", key: "boards-curriculums" }
];

export function MarketingHeader({ active }: { active?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const activeKey =
    active ||
    navItems.find((item) => pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`)))?.key;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/86 backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr] items-center gap-2 px-4 sm:h-20 sm:gap-3 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:px-8">
        <Link href="/" aria-label="teachpad.in home" className="shrink-0">
          <TeachPadLogo />
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center justify-center gap-7 lg:flex">
          {navItems.map((item) => {
            const isActive = activeKey === item.key;

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
              <Image src="/assets/teachpad-logo.png" alt="TeachPad.in" width={1385} height={279} className="h-auto w-44" priority={false} />
            </Link>
            {navItems.map((item) => {
              const isActive = activeKey === item.key;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-lg px-3 py-3 text-sm font-bold transition ${
                    isActive ? "bg-blue-50 text-blue-600" : "text-slate-800 hover:bg-slate-50 hover:text-blue-600"
                  }`}
                >
                  {item.label}
                </Link>
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
    <Image src="/assets/teachpad-logo.png" alt="TeachPad.in" width={1385} height={279} className="h-auto w-24 min-[390px]:w-32 sm:w-44" priority />
  );
}
