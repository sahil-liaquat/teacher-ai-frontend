import type { ReactNode } from "react";
import { AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SchoolAdminPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1320px] space-y-8 pb-16", className)}>{children}</div>;
}

export function PageHeading({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold tracking-[-0.025em] text-slate-950 sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function SectionHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.015em] text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PageError({ title = "This page could not be loaded", description = "Check your connection and try again.", onRetry }: { title?: string; description?: string; onRetry: () => void }) {
  return <div role="alert" className="rounded-3xl border border-rose-200 bg-white px-6 py-12 text-center"><AlertCircle className="mx-auto h-7 w-7 text-rose-500" /><h2 className="mt-3 text-lg font-semibold text-slate-950">{title}</h2><p className="mt-2 text-sm text-slate-500">{description}</p><Button variant="outline" className="mt-5" onClick={onRetry}>Try again</Button></div>;
}

export function AIAction({ title, description, onClick, muted = false }: { title: string; description: string; onClick: () => void; muted?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex min-h-28 w-full items-start gap-3 rounded-2xl border p-4 text-left transition focus-visible:ring-2 focus-visible:ring-blue-600",
        muted ? "border-slate-200 bg-white hover:border-violet-200" : "border-violet-200 bg-violet-50/60 hover:bg-violet-50",
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-violet-700 shadow-sm"><Sparkles className="h-4 w-4" /></span>
      <span>
        <span className="block text-sm font-semibold text-slate-950">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-600">{description}</span>
      </span>
    </button>
  );
}
