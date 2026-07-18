import type { Metadata } from "next";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { PricingClient } from "./pricing-client";

const siteUrl = "https://teachpad.in";
const pageUrl = `${siteUrl}/pricing`;
const pageTitle = "TeachPad Pricing for Teachers and Schools";
const pageDescription = "Compare TeachPad pricing for teachers and schools. Start free, upgrade for AI lesson plans, worksheets, presentations, exports, and textbook-grounded tools.";
const previewImage = "/landing/teachpad-main-hero-centered.png";

export const metadata: Metadata = {
  title: "Pricing | TeachPad",
  description: pageDescription,
  alternates: {
    canonical: "/pricing"
  },
  openGraph: {
    title: pageTitle,
    description: "Compare TeachPad plans for AI lesson plans, worksheets, presentations, exports, and textbook-grounded classroom tools.",
    url: "/pricing",
    siteName: "TeachPad",
    images: [
      {
        url: "/landing/teachpad-main-hero-centered.png",
        width: 1672,
        height: 941,
        alt: "TeachPad dashboard with AI teaching tools for lesson planning and classroom resources."
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "TeachPad Pricing for Teachers and Schools",
    description: "Start free and upgrade for AI lesson plans, worksheets, presentations, exports, and textbook-grounded tools.",
    images: ["/landing/teachpad-main-hero-centered.png"]
  }
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TeachPad",
    url: siteUrl,
    logo: `${siteUrl}/assets/teachpad-logo.png`
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TeachPad",
    url: siteUrl,
    description: "TeachPad helps teachers create textbook-grounded classroom resources with AI."
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "TeachPad",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: siteUrl,
    image: `${siteUrl}${previewImage}`,
    description: "TeachPad creates textbook-grounded lesson plans, worksheets, presentations, notes, assessment questions, and classroom activities for teachers.",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: "0",
      highPrice: "1699",
      offerCount: 3,
      offers: [
        {
          "@type": "Offer",
          name: "TeachPad Starter",
          price: "0",
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          url: `${siteUrl}/signup`
        },
        {
          "@type": "Offer",
          name: "TeachPad Pro Monthly",
          price: "299",
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          url: `${siteUrl}/signup`
        },
        {
          "@type": "Offer",
          name: "TeachPad Pro Annual",
          price: "1699",
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          url: `${siteUrl}/signup`
        }
      ]
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "TeachPad",
    image: `${siteUrl}${previewImage}`,
    description: pageDescription,
    brand: {
      "@type": "Brand",
      name: "TeachPad"
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: "0",
      highPrice: "1699",
      offerCount: 3,
      offers: [
        {
          "@type": "Offer",
          name: "Starter",
          price: "0",
          priceCurrency: "INR",
          url: `${siteUrl}/signup`
        },
        {
          "@type": "Offer",
          name: "Pro Monthly",
          price: "299",
          priceCurrency: "INR",
          url: `${siteUrl}/signup`
        },
        {
          "@type": "Offer",
          name: "Pro Annual",
          price: "1699",
          priceCurrency: "INR",
          url: `${siteUrl}/signup`
        }
      ]
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Pricing",
        item: pageUrl
      }
    ]
  }
];

export default function PricingPage() {
  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-white text-[#07111f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MarketingHeader active="pricing" />
      <PricingClient />
      <MarketingFooter />
    </main>
  );
}
