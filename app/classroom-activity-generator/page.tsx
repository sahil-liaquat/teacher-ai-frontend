import type { Metadata } from "next";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { ActivityClient } from "./activity-client";

const pageTitle = "AI Classroom Activity Generator for Teachers | TeachPad";
const pageDescription =
  "Create textbook-based classroom activities in seconds with TeachPad's AI Classroom Activity Generator. Generate warm-up tasks, exit tickets, and team discussion prompts.";
const siteUrl = "https://teachpad.in";
const pageUrl = `${siteUrl}/classroom-activity-generator`;
const previewImage = "/landing/teachpad-main-hero-centered.png";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: "/classroom-activity-generator"
  },
  openGraph: {
    title: pageTitle,
    description: "Create textbook-based classroom activities, warm-ups, exit tickets, and team discussion prompts in seconds with TeachPad.",
    url: pageUrl,
    siteName: "TeachPad",
    images: [
      {
        url: previewImage,
        width: 1672,
        height: 941,
        alt: "TeachPad AI Classroom Activity Generator for teachers."
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: "Create textbook-based classroom activities in seconds with TeachPad.",
    images: [previewImage]
  }
};

const faqs = [
  {
    question: "What is a classroom activity generator?",
    answer:
      "A classroom activity generator is a tool that helps teachers create active learning tasks, group work exercises, discussion prompts, warm-ups, and exit tickets tied to a textbook chapter."
  },
  {
    question: "How does TeachPad create classroom activities?",
    answer:
      "Teachers enter their textbook curriculum details: board, class, subject, textbook, and chapter. Then select group size, activity duration, and language. TeachPad creates active learning steps based on the chapter content."
  },
  {
    question: "Is TeachPad a free classroom activity generator?",
    answer:
      "Yes, teachers can start creating classroom activities on TeachPad for free. Advanced features, higher limits, exports, and saved resources may depend on the selected plan."
  },
  {
    question: "Can I download the activity plan as a PDF?",
    answer:
      "If PDF export is enabled in your TeachPad subscription, teachers can download generated activities as a PDF file for school lesson planning records."
  },
  {
    question: "What types of activities can I generate?",
    answer:
      "Teachers can generate topic introduction warm-ups, active learning group tasks, hands-on lab experiments, think-pair-share discussion activities, exit tickets, and classroom recap games."
  },
  {
    question: "Can TeachPad create activities in Hindi?",
    answer:
      "Yes, TeachPad supports classroom activity generation in English or Hindi depending on available settings."
  },
  {
    question: "Can I customize the generated activity?",
    answer:
      "Yes. Teachers can review, edit, change group instructions, add classroom-specific setup rules, and customize the plan inside TeachPad."
  },
  {
    question: "Is it useful for NCERT curriculum boards?",
    answer:
      "Yes. Because TeachPad is grounded in textbooks, teachers can select NCERT or CBSE books to generate curriculum-aligned classroom activities."
  },
  {
    question: "What details are included in the activity plan?",
    answer:
      "TeachPad activity plans include learning objectives, timing, required materials list, grouping ideas, step-by-step teacher instructions, student tasks, discussion questions, and exit recap checks."
  },
  {
    question: "What is an exit ticket?",
    answer:
      "An exit ticket is a quick 5-minute recap task given to students at the end of class to assess their understanding of the day's topic before they leave."
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
    name: "TeachPad AI Classroom Activity Generator",
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

export default function ClassroomActivityGeneratorPage() {
  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-white text-[#07111f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MarketingHeader active="ai-tools" />
      <ActivityClient />
      <MarketingFooter />
    </main>
  );
}
