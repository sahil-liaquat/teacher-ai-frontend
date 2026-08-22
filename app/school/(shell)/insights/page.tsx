import { FoundationNotice, PageHeading, ProductPage } from "@/components/product/primitives";

/** Academic health — replaced with live figures in the Insights phase. */
export default function AcademicHealthPage() {
  return (
    <ProductPage>
      <PageHeading eyebrow="Insights" title="Academic health" description="What is actually happening across the school, derived from what teachers recorded." />
      <FoundationNotice>Metrics arrive with the Insights module. Every figure here is server-derived from Academic records, and a metric with no data reads as unavailable rather than as zero.</FoundationNotice>
    </ProductPage>
  );
}
