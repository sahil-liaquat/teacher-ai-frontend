import { FoundationNotice, PageHeading, ProductPage } from "@/components/product/primitives";

/** Teacher preparation — replaced with live figures in the Insights phase. */
export default function TeacherPreparationPage() {
  return (
    <ProductPage>
      <PageHeading eyebrow="Insights" title="Teacher preparation" description="How consistently lessons are prepared before they are taught." />
      <FoundationNotice>This metric is derived from existing Academic preparation records. It is not a second preparation workflow.</FoundationNotice>
    </ProductPage>
  );
}
