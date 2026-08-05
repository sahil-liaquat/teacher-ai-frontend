"use client";

import { useEffect, useState } from "react";
import { BookOpenCheck, CalendarRange, Check, Palette, FileText } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { CurriculumPanel } from "@/components/admin/primary-curriculum/curriculum-panel";
import { ThemeEnginePanel } from "@/components/admin/primary-curriculum/theme-engine-panel";
import { ResourcePanel } from "@/components/admin/primary-curriculum/resource-panel";
import { AcademicYearsPanel } from "@/components/admin/primary-curriculum/academic-years-panel";
import { cn } from "@/lib/utils";

type Tab = "curriculum" | "themes" | "resources" | "years";

const sections: Array<{ id: Tab; title: string; description: string; icon: typeof BookOpenCheck }> = [
  { id: "curriculum", title: "Curriculum", description: "Design weeks and teaching days", icon: BookOpenCheck },
  { id: "themes", title: "Themes", description: "Manage visuals and topic lists", icon: Palette },
  { id: "resources", title: "Resources", description: "Manage printables and worksheets", icon: FileText },
  { id: "years", title: "Academic Year", description: "Manage curriculum calendars", icon: CalendarRange },
];

export default function AdminPrimaryCurriculumPage() {
  const [tab, setTab] = useState<Tab>("curriculum");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryTab = params.get("tab");
      if (queryTab === "themes") setTab("themes");
      else if (queryTab === "years") setTab("years");
      else if (queryTab === "resources") setTab("resources");
      else if (queryTab === "builder" || queryTab === "feedback" || queryTab === "curriculum") {
        setTab("curriculum");
      }
    }
  }, []);

  return (
    <>
      <AdminPageHeader
        eyebrow="TeachPad Primary"
        title="Primary classroom OS"
        description="Create themes and topics, author class-specific lessons, publish the classroom sequence, and manage worksheets and resources."
      />

      <nav className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Primary administration sections">
        {sections.map((section) => {
          const Icon = section.icon;
          const active = tab === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setTab(section.id)}
              className={cn(
                "group flex items-center gap-3 rounded-2xl border p-4 text-left transition",
                active
                  ? "border-blue-300 bg-blue-50 shadow-sm ring-1 ring-blue-100"
                  : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40",
              )}
            >
              <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", active ? "bg-teachpad-blue text-white" : "bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-teachpad-blue")}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-sm text-gray-900">{section.title}</b>
                <small className="mt-0.5 block text-xs leading-4 text-gray-500">{section.description}</small>
              </span>
              {active ? <Check className="h-4 w-4 shrink-0 text-teachpad-blue" /> : null}
            </button>
          );
        })}
      </nav>

      <div className="mt-6">
        {tab === "curriculum" && <CurriculumPanel />}
        {tab === "themes" && <ThemeEnginePanel />}
        {tab === "resources" && <ResourcePanel />}
        {tab === "years" && <AcademicYearsPanel />}
      </div>
    </>
  );
}
