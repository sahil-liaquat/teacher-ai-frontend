import type { Metadata } from "next";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { AiToolsClient } from "./ai-tools-client";

const siteUrl = "https://teachpad.in";
const pageUrl = `${siteUrl}/ai-tools`;
const pageDescription = "Explore TeachPad AI tools for teachers to create textbook-based lesson plans, worksheets, presentations, notes, quizzes, and classroom activities in minutes.";
const previewImage = "/ai-tools/ai-tools-hero.png";

export const metadata: Metadata = {
  title: "AI Tools | TeachPad",
  description: pageDescription,
  alternates: {
    canonical: "/ai-tools"
  },
  openGraph: {
    title: "TeachPad AI Tools for Teachers",
    description: "Create textbook-based lesson plans, worksheets, presentations, notes, quizzes, and classroom activities with TeachPad AI tools.",
    url: "/ai-tools",
    siteName: "TeachPad",
    images: [
      {
        url: "/ai-tools/ai-tools-hero.png",
        width: 1448,
        height: 1086,
        alt: "TeachPad AI tools for creating teaching resources from textbook chapters."
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "TeachPad AI Tools for Teachers",
    description: "Create lesson plans, worksheets, presentations, notes, quizzes, and activities from textbook chapters.",
    images: ["/ai-tools/ai-tools-hero.png"]
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
    name: "TeachPad AI Tools",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: pageUrl,
    image: `${siteUrl}${previewImage}`,
    description: pageDescription,
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
    name: "TeachPad AI Tools",
    image: `${siteUrl}${previewImage}`,
    description: pageDescription,
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
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "AI Tools",
        item: pageUrl
      }
    ]
  }
];

export default function AiToolsPage() {
  return (
    <main className="min-h-screen w-full max-w-full bg-white text-[#07111f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MarketingHeader active="ai-tools" />
      <AiToolsClient />
      <MarketingFooter />
    </main>
  );
}
