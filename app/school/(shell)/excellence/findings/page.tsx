import { FoundationNotice, PageHeading, ProductPage } from "@/components/product/primitives";

/**
 * Findings — the findings surface.
 *
 * ⚠ Deliberately shows no figures. The brief is explicit that the prototype's
 * numbers must never ship as if they were real, and this module has no data
 * source yet. A screen of plausible-looking widgets would read as a working
 * product that nobody is using.
 */
export default function ExcellenceFindingsPage() {
  return (
    <ProductPage>
      <PageHeading
        eyebrow="School Excellence"
        title="Findings"
        description="Diagnosed problems, each one traceable to the evidence that raised it."
      />
      <FoundationNotice>No finding has been raised. A finding must reference the evidence behind it, so findings arrive after a review has been scored.</FoundationNotice>
    </ProductPage>
  );
}
