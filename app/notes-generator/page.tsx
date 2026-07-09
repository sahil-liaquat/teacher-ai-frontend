import type { Metadata } from "next";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { NotesClient } from "./notes-client";

const pageTitle = "AI Notes Generator for Teachers | TeachPad";
const pageDescription =
  "Create textbook-based notes in seconds with TeachPad's AI Notes Generator. Generate revision notes, summaries, definitions, and key points.";
const siteUrl = "https://teachpad.in";
const pageUrl = `${siteUrl}/notes-generator`;
const previewImage = "/landing/teachpad-main-hero-centered.png";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: "/notes-generator"
  },
  openGraph: {
    title: pageTitle,
    description: "Create textbook-based notes, summaries, definitions, and key points in seconds with TeachPad.",
    url: pageUrl,
    siteName: "TeachPad",
    images: [
      {
        url: previewImage,
        width: 1672,
        height: 941,
        alt: "TeachPad AI Notes Generator for teachers."
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: "Create textbook-based notes in seconds with TeachPad.",
    images: [previewImage]
  }
};

const faqs = [
  {
    question: "What is a notes generator?",
    answer:
      "A notes generator is a tool that helps teachers create structured summary outlines, terms, definitions, formulas, and explanation prompts for classroom teaching."
  },
  {
    question: "How does TeachPad create textbook notes?",
    answer:
      "Teachers select the board, class, subject, textbook, chapter, note style, detail level, and language. TeachPad generates clear chapter-based notes from the selected curriculum details."
  },
  {
    question: "Is TeachPad a free notes generator?",
    answer:
      "Yes, teachers can start creating chapter-wise notes on TeachPad for free. Advanced features, higher usage limits, exports, and saved resources may depend on the selected plan."
  },
  {
    question: "Can I download notes as a PDF?",
    answer:
      "If PDF export is enabled in your TeachPad subscription, teachers can download notes as a PDF file for school records, printing, or student sharing."
  },
  {
    question: "What notes formats can I generate?",
    answer:
      "Teachers can generate revision notes, short notes, chapter summaries, key points lists, definitions notes, and student study handouts."
  },
  {
    question: "Can TeachPad create notes in Hindi?",
    answer:
      "Yes. TeachPad supports note generation in English or Hindi depending on available product settings."
  },
  {
    question: "Can I customize the notes after they are generated?",
    answer:
      "Yes. Teachers can review, edit, reorganize, and customize notes inside TeachPad before saving or exporting them."
  },
  {
    question: "Is it grounded in NCERT textbooks?",
    answer:
      "Yes. Since TeachPad is textbook-grounded, teachers can choose NCERT, JKBOSE, or other state curriculums to prepare chapter-aligned notes."
  },
  {
    question: "What is the difference between revision notes and short notes?",
    answer:
      "Revision notes focus on important exam topics, key questions, and recap points. Short notes are concise summaries of definitions, terms, and core concepts."
  },
  {
    question: "Can TeachPad generate notes with important questions?",
    answer:
      "Yes, TeachPad notes templates can include quick checks, important chapter questions, exit questions, and active recall prompts at the end."
  }
];

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
    "@type": "WebApplication",
    name: "TeachPad AI Notes Generator",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: pageUrl,
    image: `${siteUrl}${previewImage}`,
    description: pageDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "TeachPad",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: pageUrl,
    image: `${siteUrl}${previewImage}`,
    description: pageDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  }
];

export default function NotesGeneratorPage() {
  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-white text-[#07111f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MarketingHeader active="ai-tools" />
      <NotesClient />
      <MarketingFooter />
    </main>
  );
}
