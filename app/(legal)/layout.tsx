import type { ReactNode } from "react";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";

/**
 * Shared chrome for the legal/policy pages (/privacy, /terms, /refund, /contact).
 * The `(legal)` route group keeps the URLs clean — the parentheses are not part
 * of the path. Pages render inside a centered, readable prose card.
 */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f6f9ff] text-[#07111f]">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-6 sm:py-14 lg:px-8">
        <article className="rounded-2xl bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] sm:p-10">
          {children}
        </article>
      </main>
      <MarketingFooter />
    </div>
  );
}
