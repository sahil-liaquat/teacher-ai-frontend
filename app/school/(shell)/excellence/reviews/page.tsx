import { FoundationNotice, PageHeading, ProductPage } from "@/components/product/primitives";

/**
 * Reviews — the review lifecycle surface.
 *
 * ⚠ Deliberately shows no figures. The brief is explicit that the prototype's
 * numbers must never ship as if they were real, and this module has no data
 * source yet. A screen of plausible-looking widgets would read as a working
 * product that nobody is using.
 */
export default function ExcellenceReviewsPage() {
  return (
    <ProductPage>
      <PageHeading
        eyebrow="School Excellence"
        title="Reviews"
        description="Scored assessments of this school against a published excellence framework."
      />
      <FoundationNotice>No review has been created. A review is scoped to one academic year and one framework version, so historical reviews keep the framework they were scored against.</FoundationNotice>
    </ProductPage>
  );
}
