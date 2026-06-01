import type { ReactNode } from "react";
import { LEGAL } from "@/lib/legal";
import { cn } from "@/lib/utils";

/**
 * Header for a legal document: brand eyebrow, title, optional intro line, and the
 * "Last updated / Effective" dates pulled from `lib/legal.ts`.
 */
export function LegalDocHeader({ title, intro }: { title: string; intro?: string }) {
  return (
    <header className="mb-8 border-b border-slate-200 pb-6">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
        {LEGAL.brand} · Legal
      </p>
      <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h1>
      {intro ? (
        <p className="mt-3 text-base font-semibold leading-7 text-slate-600">{intro}</p>
      ) : null}
      <p className="mt-4 text-sm font-semibold text-slate-500">
        Last updated: {LEGAL.lastUpdated} · Effective: {LEGAL.effectiveDate}
      </p>
    </header>
  );
}

/**
 * Typographic wrapper for legal copy. The project has no `@tailwindcss/typography`
 * plugin, so element styling is applied with Tailwind arbitrary-variant selectors.
 * Pages can therefore write plain semantic HTML (`<h2>`, `<p>`, `<ul>`, `<table>`)
 * and get consistent, on-brand styling without per-element classes.
 */
export function LegalProse({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "text-slate-600",
        // Headings
        "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:scroll-mt-24 [&_h2]:text-xl [&_h2]:font-black [&_h2]:tracking-tight [&_h2]:text-slate-900 sm:[&_h2]:text-2xl [&_h2:first-child]:mt-0",
        "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-black [&_h3]:text-slate-900",
        // Paragraphs
        "[&_p]:my-3 [&_p]:text-[15px] [&_p]:font-medium [&_p]:leading-7 [&_p]:text-slate-600 sm:[&_p]:text-base",
        // Links
        "[&_a]:font-bold [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-blue-700",
        // Lists
        "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6",
        "[&_li]:pl-1 [&_li]:text-[15px] [&_li]:font-medium [&_li]:leading-7 [&_li]:text-slate-600 [&_li]:marker:text-slate-400 sm:[&_li]:text-base",
        // Emphasis
        "[&_strong]:font-black [&_strong]:text-slate-900",
        // Tables (used for the subprocessor list)
        "[&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-lg [&_table]:text-sm",
        "[&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-black [&_th]:text-slate-900",
        "[&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_td]:text-[13px] [&_td]:font-medium [&_td]:leading-6 [&_td]:text-slate-600",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * A highlighted callout used for the "review before relying on this" notice and
 * other important asides.
 */
export function LegalNote({ children }: { children: ReactNode }) {
  return (
    <div className="my-5 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-[13px] font-semibold leading-6 text-blue-900">
      {children}
    </div>
  );
}
