import { FoundationNotice, PageHeading, ProductPage, SectionHeading } from "@/components/product/primitives";

/**
 * Leadership dashboard — the leadership surface.
 *
 * ⚠ Deliberately shows no figures. The brief is explicit that the prototype's
 * numbers must never ship as if they were real, and this module has no data
 * source yet. A screen of plausible-looking widgets would read as a working
 * product that nobody is using.
 */
export default function LeadershipDashboardPage() {
  return (
    <ProductPage>
      <PageHeading
        eyebrow="Leadership"
        title="Leadership dashboard"
        description="The risks, recommendations and decisions that need a leader this week."
      />
      <FoundationNotice>Leadership consumes every other module and creates no metrics of its own, so it is built last. Risk detection is deterministic — AI never decides whether an underlying fact is true.</FoundationNotice>
      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
        <SectionHeading
          title="The chain this is being built on"
          description="Each step is owned by exactly one module, so a number has one definition wherever it appears."
        />
        <ol className="mt-5 flex flex-wrap items-center gap-2 text-sm font-semibold">
          {["Academic", "Insights", "School Excellence", "Improvement", "Risk", "Recommendation"].map((step, index, all) => (
            <li key={step} className="flex items-center gap-2">
              <span className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700">{step}</span>
              {index < all.length - 1 ? <span className="text-slate-300">→</span> : null}
            </li>
          ))}
        </ol>
      </section>
    </ProductPage>
  );
}
