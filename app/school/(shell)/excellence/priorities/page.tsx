import { FoundationNotice, PageHeading, ProductPage } from "@/components/product/primitives";

/**
 * Priorities — the prioritisation surface.
 *
 * ⚠ Deliberately shows no figures. The brief is explicit that the prototype's
 * numbers must never ship as if they were real, and this module has no data
 * source yet. A screen of plausible-looking widgets would read as a working
 * product that nobody is using.
 */
export default function ExcellencePrioritiesPage() {
  return (
    <ProductPage>
      <PageHeading
        eyebrow="School Excellence"
        title="Priorities"
        description="Which problems to solve first, and the transparent reasoning behind the order."
      />
      <FoundationNotice>No priorities have been ranked. The priority score is deterministic and its factors are always shown, so leadership can disagree with the order and change it.</FoundationNotice>
    </ProductPage>
  );
}
