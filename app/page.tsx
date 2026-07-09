import type { Metadata } from "next";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import LandingPageClient from "@/components/landing-client";

export const metadata: Metadata = {
  alternates: {
    canonical: "/"
  }
};

const siteUrl = "https://teachpad.in";
const siteTitle = "TeachPad | AI Lesson Plans & Worksheets for Teachers";
const siteDescription = "Create textbook-based lesson plans, worksheets, notes, presentations, quizzes, and classroom activities in seconds with TeachPad AI.";
const previewImage = "/landing/teachpad-main-hero-centered.png";

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TeachPad",
    url: siteUrl,
    logo: `${siteUrl}/assets/teachpad-logo.png`,
    sameAs: [siteUrl]
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TeachPad",
    url: siteUrl,
    description: siteDescription,
    publisher: {
      "@type": "Organization",
      name: "TeachPad"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "TeachPad",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: siteUrl,
    image: `${siteUrl}${previewImage}`,
    description: siteDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/signup`
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "TeachPad",
    image: `${siteUrl}${previewImage}`,
    description: siteDescription,
    brand: {
      "@type": "Brand",
      name: "TeachPad"
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/pricing`
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
      }
    ]
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-white text-[#07111f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MarketingHeader active="home" />
      <LandingPageClient />
      <MarketingFooter />
    </main>
  );
}
