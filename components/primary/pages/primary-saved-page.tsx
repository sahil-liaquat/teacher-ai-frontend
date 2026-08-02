"use client";

import { usePrimaryTeachingContext } from "@/lib/primary-teaching-context";
import { Bookmark, FileText, Image as ImageIcon, Heart } from "lucide-react";

// V2 Saved Page

export default function PrimarySavedPage({
  Resources,
  notify,
}: {
  Resources: React.ComponentType<{ notify: (s: string) => void; resourceCategory?: string; isSavedDefault?: boolean }>;
  notify: (s: string) => void;
}) {
  const { context } = usePrimaryTeachingContext();

  const categories = [
    { name: "My Worksheets", count: "Worksheets & trace sheets", icon: FileText },
    { name: "Curriculum Assets", count: "Flashcards & templates", icon: ImageIcon },
    { name: "Saved Ideas", count: "Warmups & movement breaks", icon: Heart },
  ];

  return (
    <div className="space-y-6">
      {/* V2 Saved Categories Placeholders */}
      <div className="grid gap-4 sm:grid-cols-3">
        {categories.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.name} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-50 text-purple-600">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-slate-900 truncate">{c.name}</h3>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{c.count}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="primary-card p-5">
        <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900 mb-4">
          <Bookmark className="h-5 w-5 text-purple-600" /> Bookmarked Files
        </h3>
        <Resources notify={notify} isSavedDefault={true} />
      </div>
    </div>
  );
}
