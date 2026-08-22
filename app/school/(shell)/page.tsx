import { FoundationNotice, PageHeading, ProductPage } from "@/components/product/primitives";

/**
 * Home — the product home, built last because it summarises everything else.
 *
 * ⚠ Deliberately shows no figures. The brief is explicit that the prototype's
 * numbers must never ship as if they were real, and this module has no data
 * source yet. A screen of plausible-looking widgets would read as a working
 * product that nobody is using.
 */
export default function HomePage() {
  return (
    <ProductPage>
      <PageHeading
        eyebrow="Home"
        title="Home"
        description="What needs your attention across the school today."
      />
      <FoundationNotice>The home surface summarises the other modules, so it arrives once they produce data. Academic is live today — open it from the module switcher.</FoundationNotice>
    </ProductPage>
  );
}
