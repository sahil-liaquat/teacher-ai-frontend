import type { Metadata } from "next";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { BoardsClient } from "./boards-client";

const siteUrl = "https://teachpad.in";
const pageUrl = `${siteUrl}/boards-curriculums`;
const pageTitle = "Boards and Curriculums Supported by TeachPad";
const pageDescription = "Explore TeachPad supported boards, curriculums, classes, subjects, and textbooks for AI lesson plans, worksheets, presentations, notes, and activities.";
const previewImage = "/landing/boards-curriculums-hero.png";

export const metadata: Metadata = {
  title: "Boards & Curriculums | TeachPad",
  description: pageDescription,
  alternates: {
    canonical: "/boards-curriculums"
  },
  openGraph: {
    title: pageTitle,
    description: "Explore supported boards, curriculums, classes, subjects, and textbooks for textbook-grounded AI teaching resources.",
    url: "/boards-curriculums",
    siteName: "TeachPad",
    images: [
      {
        url: "/landing/boards-curriculums-hero.png",
        width: 1500,
        height: 1030,
        alt: "TeachPad boards and curriculums support for textbook-grounded teaching resources."
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Boards and Curriculums Supported by TeachPad",
    description: "Find supported boards, curriculums, classes, subjects, and textbooks for AI teaching resources.",
    images: ["/landing/boards-curriculums-hero.png"]
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
    name: "TeachPad Curriculum Tools",
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
    name: "TeachPad Curriculum Support",
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
        name: "Boards & Curriculums",
        item: pageUrl
      }
    ]
  }
];

export default function BoardsCurriculumsPage() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_45%,#ffffff_100%)] text-[#07133b]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MarketingHeader active="boards-curriculums" />
      <BoardsClient />
      <MarketingFooter />
    </main>
  );
}
