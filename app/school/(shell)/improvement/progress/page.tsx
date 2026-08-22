import { FoundationNotice, PageHeading, ProductPage } from "@/components/product/primitives";

/**
 * Progress — the progress surface.
 *
 * ⚠ Deliberately shows no figures. The brief is explicit that the prototype's
 * numbers must never ship as if they were real, and this module has no data
 * source yet. A screen of plausible-looking widgets would read as a working
 * product that nobody is using.
 */
export default function ImprovementProgressPage() {
  return (
    <ProductPage>
      <PageHeading
        eyebrow="Improvement"
        title="Progress"
        description="Whether the intervention is actually working, measured rather than asserted."
      />
      <FoundationNotice>No progress reviews exist yet. Progress compares goal metrics against their expected trajectory, so it needs both a programme and live metrics.</FoundationNotice>
    </ProductPage>
  );
}
