"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, Sparkles, GraduationCap, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type WorkspaceType = "main" | "primary";

export function WorkspaceSwitcher({ className, compact = false }: { className?: string; compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceType>("main");

  useEffect(() => {
    if (pathname.startsWith("/primary")) {
      setCurrentWorkspace("primary");
      localStorage.setItem("teachpad_workspace", "primary");
    } else {
      setCurrentWorkspace("main");
      localStorage.setItem("teachpad_workspace", "main");
    }
  }, [pathname]);

  const handleSelect = (ws: WorkspaceType) => {
    setOpen(false);
    setCurrentWorkspace(ws);
    localStorage.setItem("teachpad_workspace", ws);
    if (ws === "primary") {
      router.push("/primary");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 rounded-xl border border-blue-200 bg-white/90 px-3 py-1.5 text-xs font-bold text-[#102A63] shadow-sm transition-all hover:bg-blue-50/80 hover:border-blue-300 focus:outline-none",
          currentWorkspace === "primary" && "bg-blue-50 border-blue-300 text-[#1666D8]"
        )}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-100 text-[#1666D8]">
          {currentWorkspace === "primary" ? (
            <Sparkles className="h-3.5 w-3.5 text-[#1666D8]" />
          ) : (
            <GraduationCap className="h-3.5 w-3.5 text-[#102A63]" />
          )}
        </span>
        <span className="font-extrabold tracking-tight">
          {currentWorkspace === "primary" ? "TeachPad Primary" : "Main TeachPad"}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 z-50 w-56 rounded-2xl border border-blue-100 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95">
            <div className="px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Select Workspace
            </div>

            <button
              type="button"
              onClick={() => handleSelect("main")}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-[#102A63] transition-colors hover:bg-slate-50",
                currentWorkspace === "main" && "bg-blue-50/80 text-[#1666D8]"
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <GraduationCap className="h-4 w-4" />
                </span>
                <div className="text-left">
                  <div className="font-extrabold">Main TeachPad</div>
                  <div className="text-[10px] font-medium text-slate-400">Classes 1–12 & High School</div>
                </div>
              </div>
              {currentWorkspace === "main" && <Check className="h-4 w-4 text-[#1666D8]" />}
            </button>

            <button
              type="button"
              onClick={() => handleSelect("primary")}
              className={cn(
                "mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-[#102A63] transition-colors hover:bg-amber-50/80",
                currentWorkspace === "primary" && "bg-amber-50 text-[#1666D8]"
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="text-left">
                  <div className="font-extrabold text-[#102A63]">TeachPad Primary</div>
                  <div className="text-[10px] font-medium text-amber-700">Nursery, LKG, UKG</div>
                </div>
              </div>
              {currentWorkspace === "primary" && <Check className="h-4 w-4 text-[#1666D8]" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
