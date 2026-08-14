"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BarChart3, BookOpen, Library, Link2, Palette, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const ROOT = "/admin/organizations/master-curriculum";
export const MASTER_CURRICULUM_NAV = [
  { href: ROOT, label: "Overview", icon: BarChart3 },
  { href: `${ROOT}/themes`, label: "Create Themes", icon: Palette },
  { href: `${ROOT}/design`, label: "Design Curriculum", icon: BookOpen },
  { href: `${ROOT}/resources`, label: "Manage Resources", icon: Library },
  { href: `${ROOT}/resource-mapping`, label: "Map Resources", icon: Link2 },
  { href: `${ROOT}/review`, label: "Review & Publish", icon: ShieldCheck },
] as const;

export function MasterCurriculumShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">Organizations · TeachPad</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Master Curriculum</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Canonical TeachPad curriculum that schools may adopt and customize without changing the platform source.</p>
      </div>
      <nav aria-label="Master Curriculum" className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {MASTER_CURRICULUM_NAV.map((item) => {
          const Icon = item.icon;
          const active = item.href === ROOT ? pathname === ROOT : pathname.startsWith(item.href);
          return <Link key={item.href} href={item.href} className={cn("inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold transition", active ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950")}><Icon className="h-4 w-4" />{item.label}</Link>;
        })}
      </nav>
      {children}
    </div>
  );
}
