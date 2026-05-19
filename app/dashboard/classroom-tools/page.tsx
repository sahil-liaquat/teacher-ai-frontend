"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, ClipboardCheck, FileQuestion, MessageSquareText, Plus, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tools = [
  { title: "Create Lesson Plan", description: "Generate complete textbook-grounded lesson plans with objectives, timeline, assessment, and notes.", href: "/dashboard/lesson-plans/new", icon: BookOpen, tone: "blue", badge: "Ready" },
  { title: "Create Worksheet", description: "Generate printable worksheet screens with answer keys and marking schemes using the existing worksheet integration.", href: "/dashboard/worksheets/new", icon: ClipboardCheck, tone: "green", badge: "Ready" },
  { title: "Quiz Generator", description: "Build quick checks for understanding from selected chapters and classroom objectives.", href: "#", icon: FileQuestion, tone: "blue", badge: "Coming soon" },
  { title: "Rubric Assistant", description: "Draft evaluation rubrics and feedback criteria for assignments, projects, and activities.", href: "#", icon: MessageSquareText, tone: "orange", badge: "Coming soon" }
];

export default function ClassroomToolsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredTools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return tools;
    return tools.filter((tool) =>
      `${tool.title} ${tool.description}`.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <div className="grid gap-4">
      <header className="premium-hover flex flex-col gap-3 rounded-[18px] border border-[#dbeafe] bg-white p-4 shadow-[0_14px_38px_rgba(39,30,91,0.06)] 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#dbeafe] px-3 py-1.5 text-xs font-black text-[#2563eb]">
            <Sparkles className="h-4 w-4" />
            AI Tools
          </div>
          <h1 className="text-[clamp(1.5rem,2.2vw,2rem)] font-black tracking-tight text-[#101039]">Choose a teaching tool</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#67627d]">Start from the same actions shown on the dashboard, with the backend integrations left exactly as they are.</p>
        </div>
        <label className="premium-hover-sm relative block w-full sm:w-[320px]">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77728e]" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-10 w-full rounded-xl border border-[#e5e1f1] bg-white px-10 text-base font-semibold outline-none focus:border-[#93c5fd] focus:ring-4 focus:ring-[#2563eb]/10 sm:text-sm"
            placeholder="Search tools..."
          />
        </label>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {filteredTools.map((tool) => {
          const Icon = tool.icon;
          const available = tool.href !== "#";
          const card = (
            <div className="premium-hover flex h-full min-h-[190px] flex-col rounded-[18px] border border-[#dbeafe] bg-white p-4 shadow-[0_14px_38px_rgba(39,30,91,0.06)]">
              <div className={cn("grid h-11 w-11 place-items-center rounded-xl shadow-[0_12px_24px_rgba(39,30,91,0.07)]", toneClass(tool.tone))}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <h2 className="text-base font-black text-[#101039]">{tool.title}</h2>
                <Badge className={available ? "bg-[#dbfae6] text-[#218e55]" : "bg-[#fff0d8] text-[#bc7619]"}>{tool.badge}</Badge>
              </div>
              <p className="mt-2.5 flex-1 text-sm font-medium leading-5 text-[#67627d]">{tool.description}</p>
              <Button className={cn("mt-4 w-full", tool.tone === "green" && "from-[#1fbc79] to-[#069462]")} variant={available ? "default" : "outline"} disabled={!available}>
                {available ? <Plus className="h-4 w-4" /> : null}
                {available ? "Open Tool" : "Coming Soon"}
                {available ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>
            </div>
          );
          return available ? <Link key={tool.title} href={tool.href}>{card}</Link> : <div key={tool.title}>{card}</div>;
        })}
        {!filteredTools.length ? (
          <div className="rounded-[18px] border border-dashed border-[#d8def0] bg-white p-6 text-sm font-semibold text-[#67627d] md:col-span-2 xl:col-span-4">
            No tools match your search.
          </div>
        ) : null}
      </section>
    </div>
  );
}

function toneClass(tone: string) {
  const tones: Record<string, string> = {
    blue: "bg-[#dbeafe] text-[#2563eb]",
    green: "bg-[#dbfae6] text-[#24a760]",
    orange: "bg-[#fff0d8] text-[#d88920]"
  };
  return tones[tone] || tones.blue;
}
