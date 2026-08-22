import { FoundationNotice, PageHeading, ProductPage } from "@/components/product/primitives";

/**
 * Goals — the goal surface.
 *
 * ⚠ Deliberately shows no figures. The brief is explicit that the prototype's
 * numbers must never ship as if they were real, and this module has no data
 * source yet. A screen of plausible-looking widgets would read as a working
 * product that nobody is using.
 */
export default function ImprovementGoalsPage() {
  return (
    <ProductPage>
      <PageHeading
        eyebrow="Improvement"
        title="Goals"
        description="What the school is trying to move, with a baseline and a target."
      />
      <FoundationNotice>No goals exist yet. A goal references an Insights metric rather than storing its own current value, so progress updates automatically as teaching happens.</FoundationNotice>
    </ProductPage>
  );
}
