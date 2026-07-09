import type { Metadata } from "next";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { LessonPlanClient } from "./lesson-plan-client";

const pageTitle = "AI Lesson Plan Generator for Teachers | TeachPad";
const pageDescription =
  "Create textbook-based lesson plans in seconds with TeachPad's AI Lesson Plan Generator. Generate objectives, activities, assessment, homework, and PDFs.";
const siteUrl = "https://teachpad.in";
const pageUrl = `${siteUrl}/lesson-plan-generator`;
const previewImage = "/landing/teachpad-main-hero-centered.png";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: "/lesson-plan-generator"
  },
  openGraph: {
    title: pageTitle,
    description: "Create textbook-based lesson plans, activities, assessments, and homework in seconds with TeachPad.",
    url: pageUrl,
    siteName: "TeachPad",
    images: [
      {
        url: previewImage,
        width: 1672,
        height: 941,
        alt: "TeachPad AI Lesson Plan Generator for teachers."
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: "Create textbook-based lesson plans in seconds with TeachPad.",
    images: [previewImage]
  }
};

const faqs = [
  {
    question: "What is a lesson plan?",
    answer:
      "A lesson plan is a teacher's classroom guide for a topic or chapter. It usually includes learning objectives, teaching steps, examples, activities, assessment questions, homework, and teacher notes."
  },
  {
    question: "How to make a lesson plan?",
    answer:
      "Start with the textbook chapter, decide the learning outcomes, choose a lesson plan format, add teaching aids, plan the explanation flow, include an activity, and finish with assessment and homework. TeachPad helps create this structure quickly."
  },
  {
    question: "Is TeachPad a free lesson plan generator?",
    answer:
      "Yes, teachers can start creating lesson plans on TeachPad for free. Some advanced features, higher generation limits, exports, and saved resources may depend on the selected plan."
  },
  {
    question: "Can TeachPad create daily lesson plans for teachers?",
    answer:
      "Yes. TeachPad can create daily lesson plans from selected textbook chapters, including classroom flow, activities, questions, and homework."
  },
  {
    question: "Can I create a 5E lesson plan with TeachPad?",
    answer:
      "Yes. TeachPad can help teachers create a 5E lesson plan with Engage, Explore, Explain, Elaborate, and Evaluate stages."
  },
  {
    question: "Can TeachPad generate lesson plans in Hindi?",
    answer:
      "Yes. Teachers can create lesson plans in English or Hindi depending on classroom needs and product language support."
  },
  {
    question: "Can I download a lesson plan PDF?",
    answer:
      "If PDF export is enabled, teachers can download lesson plans as PDF files for school records, printing, or sharing. Teachers can also edit and save their generated lesson plans inside TeachPad based on the available product features."
  },
  {
    question: "Can TeachPad create worksheets from the same chapter?",
    answer:
      "Yes. TeachPad can help teachers create worksheets, MCQs, notes, question papers, presentations, and activities from the same chapter."
  },
  {
    question: "Is TeachPad useful for NCERT and JKBOSE teachers?",
    answer:
      "Yes. TeachPad is designed for textbook-based planning, which makes it useful for NCERT, JKBOSE, and other school curriculum needs."
  },
  {
    question: "What details do I need to enter to generate a lesson plan?",
    answer:
      "Teachers usually need to select or enter board, class, subject, textbook, chapter, topic, duration, language, and teaching preferences."
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
    name: "TeachPad AI Lesson Plan Generator",
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

export default function LessonPlanGeneratorPage() {
  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-white text-[#07111f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MarketingHeader active="ai-tools" />
      <LessonPlanClient />
      <MarketingFooter />
    </main>
  );
}
