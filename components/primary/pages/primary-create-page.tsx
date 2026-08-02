"use client";

import { usePrimaryTeachingContext } from "@/lib/primary-teaching-context";
import { Sparkles, FileText, Image as ImageIcon, Music, Heart } from "lucide-react";

// V2 Create Page

export default function PrimaryCreatePage({
  AiStudio,
  notify,
}: {
  AiStudio: React.ComponentType<{ notify: (s: string) => void }>;
  notify: (s: string) => void;
}) {
  const { context } = usePrimaryTeachingContext();

  const categories = [
    { name: "Lesson Materials", icon: FileText, desc: "NEP-aligned story scripts, rhyme prompts, & circle questions" },
    { name: "Printables & Art", icon: ImageIcon, desc: "Tracing sheets, colouring pages, and flashcards" },
    { name: "Rhymes & Movement", icon: Music, desc: "Action songs, recap poems, and physical game sets" },
    { name: "Parent Updates", icon: Heart, desc: "Customized home connection letters and progress notes" },
  ];

  return (
    <div className="space-y-6">
      {/* V2 Generator Categories Placeholders */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {categories.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-blue-200">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-sm font-extrabold text-slate-900">{c.name}</h3>
              <p className="mt-1 text-xs text-slate-500 leading-normal">{c.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="primary-card p-5">
        <AiStudio notify={notify} />
      </div>
    </div>
  );
}
