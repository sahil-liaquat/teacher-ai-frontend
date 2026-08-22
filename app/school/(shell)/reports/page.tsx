import { FoundationNotice, PageHeading, ProductPage } from "@/components/product/primitives";

/**
 * Reports — the reporting surface.
 *
 * ⚠ Deliberately shows no figures. The brief is explicit that the prototype's
 * numbers must never ship as if they were real, and this module has no data
 * source yet. A screen of plausible-looking widgets would read as a working
 * product that nobody is using.
 */
export default function ReportsPage() {
  return (
    <ProductPage>
      <PageHeading
        eyebrow="Reports"
        title="Reports"
        description="How this school communicates its current state and its improvement journey."
      />
      <FoundationNotice>No reports can be generated yet. Reports are outputs assembled from the other modules — business truth is never stored only inside a generated document.</FoundationNotice>
    </ProductPage>
  );
}
