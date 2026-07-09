import type { Metadata } from "next";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { PresentationClient } from "./presentation-client";

const pageTitle = "AI Presentation Generator for Teachers | TeachPad";
const pageDescription =
  "Create classroom-ready presentations in seconds with TeachPad's AI Presentation Generator. Generate slide outlines, visual layouts, and speaker notes.";
const siteUrl = "https://teachpad.in";
const pageUrl = `${siteUrl}/presentation-generator`;
const previewImage = "/landing/teachpad-main-hero-centered.png";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: "/presentation-generator"
  },
  openGraph: {
    title: pageTitle,
    description: "Create classroom-ready presentations, visual layouts, and speaker notes in seconds with TeachPad.",
    url: pageUrl,
    siteName: "TeachPad",
    images: [
      {
        url: previewImage,
        width: 1672,
        height: 941,
        alt: "TeachPad AI Presentation Generator for teachers."
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: "Create classroom-ready presentations in seconds with TeachPad.",
    images: [previewImage]
  }
};

const faqs = [
  {
    question: "What is a presentation generator?",
    answer:
      "A presentation generator is a tool that helps teachers create slide content, diagrams, examples, and layout outlines for visual classroom teaching."
  },
  {
    question: "How does TeachPad generate presentations?",
    answer:
      "Teachers enter the curriculum info: board, class, subject, textbook, and chapter. Then choose duration, number of slides, and language. TeachPad creates slides and explanation notes based on the chapter content."
  },
  {
    question: "Is TeachPad a free PPT generator?",
    answer:
      "Teachers can start using TeachPad for free to generate teaching slides. Advanced options, higher generation limits, exports, and saved resources may depend on the selected plan."
  },
  {
    question: "Can I download a presentation as a PPT?",
    answer:
      "If PPT export is enabled in your TeachPad subscription, teachers can download generated slide decks for Microsoft PowerPoint, Google Slides, or Apple Keynote."
  },
  {
    question: "Can TeachPad create presentations with speaker notes?",
    answer:
      "Yes. TeachPad generates slide content and corresponding explanation prompts in speaker notes so teachers know exactly what to cover on each slide."
  },
  {
    question: "What topics can I generate presentations for?",
    answer:
      "Teachers can create presentations for science topics, math explanations, history lessons, literature summaries, and any other chapter covered in supported school textbooks."
  },
  {
    question: "Can TeachPad generate slides in Hindi?",
    answer:
      "Yes, TeachPad supports slide creation in English or Hindi depending on product language configurations."
  },
  {
    question: "Is it useful for NCERT board presentations?",
    answer:
      "Yes. Because TeachPad is grounded in textbooks, teachers can select NCERT or CBSE-aligned books to generate matching classroom presentations."
  },
  {
    question: "Can I customize the generated slides?",
    answer:
      "Yes. School teachers should be able to review, edit, reorganize, and customize the slide content and speaker notes inside TeachPad."
  },
  {
    question: "Does it support quick check questions?",
    answer:
      "Yes. Presentation templates can include recap slides, exit check questions, active classroom prompts, and discussion topics at the end."
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
    name: "TeachPad AI Presentation Generator",
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

export default function PresentationGeneratorPage() {
  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-white text-[#07111f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MarketingHeader active="ai-tools" />
      <PresentationClient />
      <MarketingFooter />
    </main>
  );
}
