import type { Metadata } from "next";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { seDisplay } from "@/lib/se-font";
import { LeadFormProvider } from "@/components/school-excellence/lead-form";
import { ScrollProgress } from "@/components/school-excellence/media";
import { ImageLedSchoolExcellence } from "@/components/school-excellence/image-led-page";
import "./school-excellence.css";

const siteUrl = "https://teachpad.in";
const pageUrl = `${siteUrl}/school-excellence`;
const pageTitle =
  "TeachPad School Excellence Program | A Guided 60-Day School Improvement Journey";
const pageDescription =
  "Help your school become better, one academic system at a time. A guided 60-day programme that strengthens planning, teacher support, classroom practice and leadership visibility.";
// Flattened onto an opaque background: the source render is transparent, and
// social cards composite against black.
const previewImage = "/landing/school-excellence-2026/og-school-excellence.jpg";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: "/school-excellence",
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/school-excellence",
    siteName: "TeachPad",
    images: [
      {
        url: previewImage,
        width: 1200,
        height: 630,
        alt: "TeachPad School Excellence Program — one connected academic system for planning, teaching, tracking and improving.",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TeachPad School Excellence Program",
    description:
      "A guided 60-day journey to understand your school, strengthen its systems, support teachers and measure improvement.",
    images: [previewImage],
  },
};

// Only what the page actually says. There is no price and no FAQ in this copy,
// so there is no Offer or FAQPage node here either.
const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "TeachPad School Excellence Program",
    serviceType: "Academic transformation programme for schools",
    description:
      "A guided 60-day school improvement programme that helps schools strengthen academic planning, curriculum implementation, teacher preparation, classroom practice, assessment and leadership visibility.",
    url: pageUrl,
    provider: {
      "@type": "Organization",
      name: "TeachPad",
      url: siteUrl,
      logo: `${siteUrl}/assets/teachpad-logo.png`,
    },
    areaServed: { "@type": "Country", name: "India" },
    audience: {
      "@type": "Audience",
      audienceType:
        "School owners, directors, principals, academic heads and curriculum coordinators",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "School Excellence Program",
      itemListElement: [
        "Understand — School Excellence Scorecard",
        "Design — 60-Day School Excellence Plan",
        "Build — Connected Academic Workspace",
        "Practice — Teacher Implementation Support",
        "Improve — School Excellence Report",
      ].map((name) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name },
      })),
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "School Excellence", item: pageUrl },
    ],
  },
];

export default function SchoolExcellencePage() {
  return (
    // No overflow clipping here: `overflow-x: hidden/clip` on an ancestor makes
    // Chrome treat it as the scrollport for `position: sticky`, which would stop
    // both the site header and the in-page nav from sticking. Horizontal
    // overflow is already contained by `body { overflow-x: hidden }`.
    <main className={`se ${seDisplay.variable} min-h-screen w-full max-w-full`}>
      <link
        rel="preload"
        as="image"
        href="/landing/school-excellence-2026/school-excellence-hero-bg-4k.webp"
        type="image/webp"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <ScrollProgress />
      <MarketingHeader active="school-excellence" />

      <LeadFormProvider>
        <ImageLedSchoolExcellence />
      </LeadFormProvider>

      <MarketingFooter />
    </main>
  );
}
