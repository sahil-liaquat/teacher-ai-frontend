import { FoundationNotice, PageHeading, ProductPage } from "@/components/product/primitives";

/**
 * Evidence — the evidence surface.
 *
 * ⚠ Deliberately shows no figures. The brief is explicit that the prototype's
 * numbers must never ship as if they were real, and this module has no data
 * source yet. A screen of plausible-looking widgets would read as a working
 * product that nobody is using.
 */
export default function ExcellenceEvidencePage() {
  return (
    <ProductPage>
      <PageHeading
        eyebrow="School Excellence"
        title="Evidence"
        description="What the scores are based on — recorded by people, and derived by the system."
      />
      <FoundationNotice>No evidence has been collected. System evidence references the Academic and Insights records it came from rather than copying them, so it stays true as the underlying data changes.</FoundationNotice>
    </ProductPage>
  );
}
