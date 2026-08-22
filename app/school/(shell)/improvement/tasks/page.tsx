import { FoundationNotice, PageHeading, ProductPage } from "@/components/product/primitives";

/**
 * Tasks — the task surface.
 *
 * ⚠ Deliberately shows no figures. The brief is explicit that the prototype's
 * numbers must never ship as if they were real, and this module has no data
 * source yet. A screen of plausible-looking widgets would read as a working
 * product that nobody is using.
 */
export default function ImprovementTasksPage() {
  return (
    <ProductPage>
      <PageHeading
        eyebrow="Improvement"
        title="Tasks"
        description="The concrete actions behind each initiative, and who owns them."
      />
      <FoundationNotice>No tasks exist yet. Task owners are existing school members — this module adds no second staff directory.</FoundationNotice>
    </ProductPage>
  );
}
