"use client";

import { useEffect, useState } from "react";
import { BookOpenCheck, CalendarRange, Check, FileText, Palette, Settings2, Sparkles, ArrowRight, LayoutGrid, Link2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { CurriculumPanel } from "@/components/admin/primary-curriculum/curriculum-panel";
import { ThemeEnginePanel } from "@/components/admin/primary-curriculum/theme-engine-panel";
import { ResourcePanel } from "@/components/admin/primary-curriculum/resource-panel";
import { ResourceMappingPanel } from "@/components/admin/primary-curriculum/resource-mapping-panel";
import { AcademicYearsPanel } from "@/components/admin/primary-curriculum/academic-years-panel";
import { cn } from "@/lib/utils";

type Tab = "themes" | "curriculum" | "resources" | "mapping" | "years";

const steps: Array<{ id: Tab; step: number; title: string; description: string; icon: typeof Sparkles }> = [
  { id: "themes", step: 1, title: "Create Themes", description: "Set up theme topics & look", icon: Palette },
  { id: "curriculum", step: 2, title: "Design Curriculum", description: "Fill & publish teaching days", icon: LayoutGrid },
  { id: "resources", step: 3, title: "Manage Resources", description: "Add printables & worksheets", icon: FileText },
  { id: "mapping", step: 3, title: "Map Resources", description: "Attach printables to lesson steps", icon: Link2 },
  { id: "years", step: 0, title: "Settings", description: "Academic year & cloning", icon: Settings2 },
];

export default function AdminPrimaryCurriculumPage() {
  const [tab, setTab] = useState<Tab>("themes");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryTab = params.get("tab");
      if (queryTab === "curriculum") setTab("curriculum");
      else if (queryTab === "resources") setTab("resources");
      else if (queryTab === "mapping") setTab("mapping");
      else if (queryTab === "years") setTab("years");
      else setTab("themes");
    }
  }, []);

  const orderedSteps = steps.filter((s) => s.step > 0);

  return (
    <>
      <AdminPageHeader
        eyebrow="TeachPad Primary"
        title="Primary classroom OS"
        description="A simple 3-step setup: create themes, design the curriculum map, and map printables to lesson steps. Everything saves instantly and publishes to the teacher classroom."
      />

      {/* Guided workflow nav */}
      <nav className="mt-6 grid gap-3 lg:grid-cols-4" aria-label="Primary administration steps">
        {orderedSteps.map((section, index) => {
          const Icon = section.icon;
          const active = tab === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setTab(section.id)}
              className={cn(
                "group relative flex items-center gap-3 rounded-2xl border p-4 text-left transition",
                active
                  ? "border-blue-300 bg-blue-50 shadow-sm ring-1 ring-blue-100"
                  : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40",
              )}
            >
              <span className="absolute left-4 -top-2 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-black text-white">
                STEP {section.step}
              </span>
              <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", active ? "bg-teachpad-blue text-white" : "bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-teachpad-blue")}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-sm text-gray-900">{section.title}</b>
                <small className="mt-0.5 block text-xs leading-4 text-gray-500">{section.description}</small>
              </span>
              {active ? <Check className="h-4 w-4 shrink-0 text-teachpad-blue" /> : index < orderedSteps.length - 1 ? <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-300 group-hover:text-blue-300" /> : null}
            </button>
          );
        })}
      </nav>

      {/* Settings pill row */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Also available</span>
        <button
          type="button"
          onClick={() => setTab("years")}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition",
            tab === "years"
              ? "border-blue-300 bg-blue-50 text-teachpad-blue"
              : "border-gray-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/40",
          )}
        >
          <CalendarRange className="h-3.5 w-3.5" />
          Academic Years & Cloning
        </button>
        <span className="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex">
          <BookOpenCheck className="h-3.5 w-3.5" />
          Tip: finish step 1 before designing lessons so themes appear in the map.
        </span>
      </div>

      <div className="mt-6">
        {tab === "themes" && <ThemeEnginePanel />}
        {tab === "curriculum" && <CurriculumPanel />}
        {tab === "resources" && <ResourcePanel />}
        {tab === "mapping" && <ResourceMappingPanel />}
        {tab === "years" && <AcademicYearsPanel />}
      </div>
    </>
  );
}
