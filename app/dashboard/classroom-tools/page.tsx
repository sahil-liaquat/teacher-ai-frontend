"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardCheck, FileQuestion, MessageSquareText, Plus, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tools = [
  { title: "Create Lesson Plan", description: "Generate complete textbook-grounded lesson plans with objectives, timeline, assessment, and notes.", href: "/dashboard/lesson-plans/new", icon: BookOpen, tone: "purple", badge: "Ready" },
  { title: "Create Worksheet", description: "Generate printable worksheet screens with answer keys and marking schemes using the existing worksheet integration.", href: "/dashboard/worksheets/new", icon: ClipboardCheck, tone: "green", badge: "Ready" },
  { title: "Quiz Generator", description: "Build quick checks for understanding from selected chapters and classroom objectives.", href: "#", icon: FileQuestion, tone: "blue", badge: "Coming soon" },
  { title: "Rubric Assistant", description: "Draft evaluation rubrics and feedback criteria for assignments, projects, and activities.", href: "#", icon: MessageSquareText, tone: "orange", badge: "Coming soon" }
];

export default function ClassroomToolsPage() {
  return (
    <div className="grid gap-4 2xl:gap-7">
      <header className="premium-hover flex flex-col gap-3 rounded-[18px] border border-[#ebe7f4] bg-white p-4 shadow-[0_14px_38px_rgba(39,30,91,0.06)] 2xl:flex-row 2xl:items-center 2xl:justify-between 2xl:rounded-[24px] 2xl:p-7">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#f0e5ff] px-3 py-1.5 text-xs font-black text-[#7a43e8] 2xl:mb-4 2xl:px-4 2xl:py-2 2xl:text-sm">
            <Sparkles className="h-4 w-4" />
            AI Tools
          </div>
          <h1 className="text-[clamp(1.5rem,2.2vw,2rem)] font-black tracking-tight text-[#101039] 2xl:text-[34px]">Choose a teaching tool</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#67627d] 2xl:mt-3 2xl:text-base 2xl:leading-7">Start from the same actions shown on the dashboard, with the backend integrations left exactly as they are.</p>
        </div>
        <label className="premium-hover-sm relative block w-full sm:w-[320px] 2xl:w-[360px]">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#77728e]" />
          <input className="h-11 w-full rounded-[13px] border border-[#e5e1f1] bg-white px-11 text-sm font-semibold outline-none focus:border-[#b998f6] focus:ring-4 focus:ring-[#8d57f6]/10 2xl:h-12 2xl:rounded-[14px] 2xl:px-12" placeholder="Search tools..." />
        </label>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const available = tool.href !== "#";
          const card = (
            <div className="premium-hover flex h-full min-h-[210px] flex-col rounded-[18px] border border-[#ebe7f4] bg-white p-4 shadow-[0_14px_38px_rgba(39,30,91,0.06)] 2xl:min-h-[290px] 2xl:rounded-[24px] 2xl:p-7">
              <div className={cn("grid h-12 w-12 place-items-center rounded-[14px] shadow-[0_12px_24px_rgba(39,30,91,0.07)] 2xl:h-[72px] 2xl:w-[72px] 2xl:rounded-[18px]", toneClass(tool.tone))}>
                <Icon className="h-6 w-6 2xl:h-9 2xl:w-9" />
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 2xl:mt-6 2xl:gap-3">
                <h2 className="text-lg font-black text-[#101039] 2xl:text-2xl">{tool.title}</h2>
                <Badge className={available ? "bg-[#dbfae6] text-[#218e55]" : "bg-[#fff0d8] text-[#bc7619]"}>{tool.badge}</Badge>
              </div>
              <p className="mt-3 flex-1 text-sm font-medium leading-6 text-[#67627d] 2xl:mt-4 2xl:leading-7">{tool.description}</p>
              <Button className={cn("mt-5 w-full 2xl:mt-6", tool.tone === "green" && "from-[#1fbc79] to-[#069462]")} variant={available ? "default" : "outline"} disabled={!available}>
                {available ? <Plus className="h-4 w-4" /> : null}
                {available ? "Open Tool" : "Coming Soon"}
                {available ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>
            </div>
          );
          return available ? <Link key={tool.title} href={tool.href}>{card}</Link> : <div key={tool.title}>{card}</div>;
        })}
      </section>
    </div>
  );
}

function toneClass(tone: string) {
  const tones: Record<string, string> = {
    purple: "bg-[#eee0ff] text-[#7a43e8]",
    green: "bg-[#dbfae6] text-[#24a760]",
    orange: "bg-[#fff0d8] text-[#d88920]",
    blue: "bg-[#e3f0ff] text-[#2c75d0]"
  };
  return tones[tone] || tones.purple;
}
