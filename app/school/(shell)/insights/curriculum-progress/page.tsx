import { FoundationNotice, PageHeading, ProductPage } from "@/components/product/primitives";

/** Curriculum progress — replaced with live figures in the Insights phase. */
export default function CurriculumProgressPage() {
  return (
    <ProductPage>
      <PageHeading eyebrow="Insights" title="Curriculum progress" description="Whether delivery is keeping pace with the plan, by class and subject." />
      <FoundationNotice>Compares expected progress by today's date against what teachers recorded delivering — never completed lessons over the annual total.</FoundationNotice>
    </ProductPage>
  );
}
