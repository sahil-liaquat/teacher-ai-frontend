import { FoundationNotice, PageHeading, ProductPage } from "@/components/product/primitives";

/**
 * Teacher observations — human evidence capture.
 *
 * ⚠ Deliberately shows no figures. The brief is explicit that the prototype's
 * numbers must never ship as if they were real, and this module has no data
 * source yet. A screen of plausible-looking widgets would read as a working
 * product that nobody is using.
 */
export default function TeacherObservationsPage() {
  return (
    <ProductPage>
      <PageHeading
        eyebrow="School Excellence"
        title="Teacher observations"
        description="A coordinator's record of a lesson, scored against shared criteria."
      />
      <FoundationNotice>No observation has been recorded. These are observations of teaching, and are a separate record from the per-child observations teachers already keep in Academic.</FoundationNotice>
    </ProductPage>
  );
}
