import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  ClipboardList,
  Download,
  FileQuestion,
  FileText,
  Layers3,
  ListChecks,
  MessageSquareText,
  NotebookPen,
  Presentation,
  Puzzle,
  Sparkles
} from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";

const pageTitle = "AI Presentation Generator for Teachers | TeachPad";
const pageDescription =
  "Create classroom presentations in seconds with TeachPad's AI Presentation Generator. Generate lesson PPTs, teaching slides, speaker notes, and quiz slides.";
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
    description: "Create classroom presentations, lesson PPTs, speaker notes, and quiz slides in seconds with TeachPad.",
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
    description: "Create classroom presentations and lesson PPTs in seconds with TeachPad.",
    images: [previewImage]
  }
};

const faqs = [
  {
    question: "What is an AI presentation generator for teachers?",
    answer:
      "An AI presentation generator for teachers helps create classroom slides, teaching points, examples, recap questions, and speaker notes for a lesson topic or textbook chapter."
  },
  {
    question: "How does TeachPad create presentations?",
    answer:
      "Teachers select the board, class, subject, textbook, chapter, topic, number of slides, language, and presentation style. TeachPad then creates a structured classroom presentation based on those inputs."
  },
  {
    question: "Is TeachPad a free presentation generator?",
    answer:
      "Teachers can start creating presentations on TeachPad for free. Some advanced features, higher usage limits, exports, and saved resources may depend on the selected plan."
  },
  {
    question: "Can TeachPad create PPTs for classroom teaching?",
    answer:
      "Yes. TeachPad can help teachers create classroom PPTs for lesson explanation, chapter summaries, revision, activities, and quick assessments."
  },
  {
    question: "Can TeachPad create presentations with speaker notes?",
    answer:
      "Yes. TeachPad can help create speaker notes so teachers know what to explain on each slide."
  },
  {
    question: "Can I create a presentation from an NCERT chapter?",
    answer:
      "Yes. TeachPad is designed for textbook-based presentation creation, which makes it useful for NCERT, JKBOSE, and other curriculum-based classroom needs."
  },
  {
    question: "Can TeachPad create science, maths, English, and Hindi presentations?",
    answer:
      "Yes. Teachers can create subject-wise presentations depending on the selected class, subject, textbook, chapter, topic, and language settings."
  },
  {
    question: "Can I edit the presentation after it is generated?",
    answer:
      "Yes. Teachers should be able to review, edit, and customize generated slides before using them in class."
  },
  {
    question: "Can TeachPad create quiz slides?",
    answer:
      "Yes. Teachers can create quiz slides, recap questions, and quick assessment slides to check student understanding."
  },
  {
    question: "Can I download the presentation as PPT or PDF?",
    answer:
      "If export is enabled, teachers can download presentations as PPT or PDF files for classroom use, sharing, or school records."
  },
  {
    question: "Can TeachPad create visual presentation ideas?",
    answer:
      "Yes. TeachPad can suggest simple visuals, diagrams, icons, examples, and activity ideas to make classroom presentations easier to understand."
  },
  {
    question: "Is TeachPad useful for Indian teachers?",
    answer:
      "Yes. TeachPad is useful for Indian teachers because it supports textbook-based classroom planning for school curriculum needs."
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

const chapterPoints = [
  "Select board/curriculum, class, subject, textbook, and chapter.",
  "Enter the topic and number of slides.",
  "Generate a presentation aligned with the chapter.",
  "Create slides for explanation, examples, activities, and recap.",
  "Avoid starting from a blank PowerPoint.",
  "Useful for school teachers, tutors, coaching teachers, and academic content creators."
];

const includeCards = [
  ["Slide Titles", "Clear titles for each part of the topic."],
  ["Key Teaching Points", "Simple bullet points teachers can explain in class."],
  ["Textbook-Based Explanation", "Slides built around the selected chapter and topic."],
  ["Examples and Recap", "Add examples, summary points, and quick revision slides."],
  ["Classroom Activity Slide", "Include a small activity or discussion prompt."],
  ["Speaker Notes", "Add teacher notes to help explain each slide confidently."],
  ["Visual Suggestions", "Suggest simple diagrams, icons, or image ideas for better understanding."],
  ["Assessment Slide", "Add quick questions to check student understanding."]
];

const presentationTypes = [
  ["Lesson Explanation PPT", "Explain a new chapter with a clear classroom flow."],
  ["Chapter Summary Presentation", "Turn long chapters into focused summary slides."],
  ["Revision Presentation", "Prepare quick recap slides before a test or exam."],
  ["Activity-Based Presentation", "Add prompts, group tasks, and discussion slides."],
  ["Quiz Presentation", "Create question slides for quick classroom checks."],
  ["Concept Explanation Slides", "Break down one difficult concept step by step."],
  ["Homework/Recap Slides", "Close the lesson with review points and home practice."],
  ["Visual Classroom Presentation", "Use visual ideas to make explanations easier."]
];

const processSteps = [
  {
    title: "Choose your textbook chapter",
    text: "Select the board, class, subject, textbook, and chapter."
  },
  {
    title: "Add presentation details",
    text: "Enter the topic, number of slides, language, and presentation style."
  },
  {
    title: "Generate structured slides",
    text: "TeachPad creates slide titles, teaching points, examples, recap, and speaker notes."
  },
  {
    title: "Edit, save, and export",
    text: "Review the presentation, edit slide content, and prepare it for classroom teaching."
  }
];

const relatedTools = [
  {
    title: "Lesson Plan Generator",
    text: "Create a complete lesson plan before preparing classroom slides.",
    cta: "Create Lesson Plan",
    href: "/lesson-plan-generator",
    Icon: FileText
  },
  {
    title: "Worksheet Generator",
    text: "Create practice worksheets after the presentation.",
    cta: "Create Worksheet",
    href: "/worksheet-generator",
    Icon: ClipboardList
  },
  {
    title: "MCQ Generator",
    text: "Generate quick quiz questions for the final slide.",
    cta: "Generate MCQs",
    href: "/signup",
    Icon: ListChecks
  },
  {
    title: "Question Paper Generator",
    text: "Turn the chapter into tests and assessment papers.",
    cta: "Create Question Paper",
    href: "/signup",
    Icon: FileQuestion
  },
  {
    title: "Notes Generator",
    text: "Create concise notes from the same chapter.",
    cta: "Generate Notes",
    href: "/notes-generator",
    Icon: NotebookPen
  },
  {
    title: "Classroom Activity Generator",
    text: "Add classroom activities and discussion prompts to your lesson.",
    cta: "Create Activity",
    href: "/classroom-activity-generator",
    Icon: Puzzle
  }
];

const ideaLinks = [
  { label: "Science presentation generator", href: "/signup" },
  { label: "Maths presentation generator", href: "/signup" },
  { label: "English presentation generator", href: "/signup" },
  { label: "Hindi presentation generator", href: "/signup" },
  { label: "NCERT presentation generator", href: "/signup" },
  { label: "JKBOSE presentation generator", href: "/signup" },
  { label: "Lesson PPT generator", href: "/signup" },
  { label: "Chapter summary presentation", href: "/signup" },
  { label: "Quiz presentation generator", href: "/signup" },
  { label: "Revision presentation generator", href: "/signup" },
  { label: "Classroom PPT generator", href: "/signup" },
  { label: "PPT generator for teachers", href: "/signup" }
];

const resourceLinks = [
  { label: "PPT generator for teachers", href: "/signup" },
  { label: "AI PPT generator", href: "/signup" },
  { label: "Classroom presentation maker", href: "/signup" },
  { label: "Teaching presentation generator", href: "/signup" },
  { label: "Lesson presentation generator", href: "/signup" },
  { label: "Presentation with speaker notes", href: "/signup" },
  { label: "Editable PPT generator", href: "/signup" },
  { label: "Lesson plan generator", href: "/lesson-plan-generator" },
  { label: "Worksheet generator", href: "/worksheet-generator" },
  { label: "Question paper generator", href: "/signup" }
];

export default function PresentationGeneratorPage() {
  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-white text-[#07111f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MarketingHeader active="ai-tools" />
      <HeroSection />
      <ChapterSection />
      <IncludeSection />
      <PresentationTypeSection />
      <ProcessSection />
      <ExampleSection />
      <SpeakerNotesSection />
      <DownloadSection />
      <RelatedToolsSection />
      <LinksSection />
      <FaqSection />
      <FinalCtaSection />
      <MarketingFooter />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_16%_8%,#fff7ed_0,transparent_30%),radial-gradient(circle_at_88%_16%,#eef6ff_0,transparent_34%),linear-gradient(180deg,#ffffff_0%,#fffaf4_100%)]">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 pb-10 pt-9 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:pb-16 lg:pt-14">
        <div className="relative z-10 mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
          <Badge icon={Sparkles}>AI Presentation Generator</Badge>
          <h1 className="mt-5 text-[40px] font-black leading-[1.05] tracking-tight text-slate-950 min-[390px]:text-[46px] sm:text-6xl lg:text-[72px]">
            AI Presentation Generator for Teachers
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:mx-0">
            Create classroom-ready presentations in seconds. Select your board, class, subject, textbook, chapter, topic, number of slides, and language. TeachPad creates a structured teaching presentation with slide titles, key points, examples, classroom visuals, and speaker notes.
          </p>
          <div className="mx-auto mt-7 flex max-w-[460px] flex-col justify-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap lg:mx-0 lg:justify-start">
            <PrimaryLink href="/signup">Create Presentation Free</PrimaryLink>
            <SecondaryLink href="#example">View Presentation Example</SecondaryLink>
          </div>
        </div>

        <PresentationPreview />
      </div>
    </section>
  );
}

function PresentationPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[760px] lg:-mr-8 lg:max-w-none">
      <Image
        src="/ai-tools/showcase-presentation.png"
        alt="Editable classroom presentation preview."
        width={1448}
        height={1086}
        priority
        className="h-auto w-full drop-shadow-[0_34px_70px_rgba(47,79,129,0.16)]"
      />
    </div>
  );
}

function ChapterSection() {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
      <div>
        <Badge icon={BookOpen}>Textbook chapters</Badge>
        <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
          Create Presentations from Textbook Chapters
        </h2>
        <p className="mt-5 text-base leading-8 text-slate-600">
          TeachPad works as a presentation generator for teachers who want classroom slides connected to the exact chapter they are teaching. Use it as a teaching presentation generator, lesson presentation generator, classroom presentation maker, or textbook-based presentation generator when you need a clear PPT without starting from a blank file.
        </p>
        <p className="mt-4 text-base leading-8 text-slate-600">
          It helps school teachers, tutors, coaching teachers, and academic content creators prepare chapter presentations for explanation, examples, activities, and recap.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {chapterPoints.map((point) => (
          <article key={point} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-50 text-orange-600">
              <Check className="h-5 w-5" />
            </span>
            <p className="mt-4 text-sm font-bold leading-6 text-slate-700">{point}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function IncludeSection() {
  return (
    <section className="bg-[#fffaf4]">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Presentation content</p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            What TeachPad Can Include in a Presentation
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            Create classroom PPTs with the structure teachers need for explanation, student engagement, recap, and quick checks.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {includeCards.map(([title, text]) => (
            <article key={title} className="rounded-2xl border border-orange-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-orange-600">
                <Presentation className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-black text-slate-950">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PresentationTypeSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Presentation types</p>
        <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
          Choose the Right Presentation Type
        </h2>
        <p className="mt-5 text-base leading-8 text-slate-600">
          Teachers need different presentation styles for different classroom needs. TeachPad can help create lesson PPTs, revision decks, quiz slides, chapter summaries, and visual classroom presentations.
        </p>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {presentationTypes.map(([title, text]) => (
          <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <h3 className="text-lg font-black text-slate-950">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section className="bg-[linear-gradient(180deg,#ffffff_0%,#fffaf4_100%)]">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">How it works</p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            How TeachPad Creates a Presentation
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((step, index) => (
            <article key={step.title} className="rounded-2xl border border-orange-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500 text-sm font-black text-white">{index + 1}</span>
              <h3 className="mt-5 text-lg font-black text-slate-950">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExampleSection() {
  return (
    <section id="example" className="bg-white">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Badge icon={Layers3}>Presentation example</Badge>
          <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Example Presentation Output
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            A classroom presentation can include slide titles, teaching bullets, activities, recap questions, and speaker notes.
          </p>
        </div>

        <div className="relative mt-10 overflow-hidden">
          <Image
            src="/assets/illustrations/presentation-output-preview.png"
            alt="Generated classroom presentation output preview."
            width={1851}
            height={1080}
            className="h-auto w-full [mask-image:linear-gradient(180deg,#000_0%,#000_78%,rgba(0,0,0,0.68)_88%,transparent_100%)]"
          />
        </div>
      </div>
    </section>
  );
}

function SpeakerNotesSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="grid items-center gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:grid-cols-[1fr_0.85fr] md:p-10">
        <div>
          <Badge icon={MessageSquareText}>Speaker notes</Badge>
          <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Create Presentations with Speaker Notes
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            TeachPad can help teachers create presentations with speaker notes so they know what to explain on each slide. Speaker notes make classroom teaching smoother, especially when teachers want a clear flow for explanation, examples, recap, and questions.
          </p>
          <p className="mt-4 text-base leading-8 text-slate-600">
            Use speaker notes with a teaching PPT, classroom PPT, lesson PPT, or PowerPoint presentation for teachers when you want the slide deck and explanation flow ready together.
          </p>
        </div>
        <div className="rounded-3xl bg-[#fffaf4] p-5">
          {["Explain each slide confidently", "Add examples and recap prompts", "Prepare questions before class", "Keep the lesson PPT easy to present"].map((item) => (
            <div key={item} className="mb-3 flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-bold text-slate-700 shadow-sm last:mb-0">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-orange-500 text-white">
                <Check className="h-4 w-4" />
              </span>
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DownloadSection() {
  return (
    <section className="bg-[#fffaf4]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
        <div>
          <Badge icon={Download}>Save and export</Badge>
          <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Download, Edit, and Save Presentations
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            TeachPad creates editable classroom presentations that teachers can review, customize, and use for teaching, revision, or school activities. You can adjust slide content, add examples, include your own instructions, and prepare the presentation in a format that fits your classroom needs.
          </p>
          <p className="mt-4 text-base leading-8 text-slate-600">
            Use your generated presentation as a lesson PPT, chapter summary presentation, revision presentation, or classroom explanation deck. If PPT or PDF export is enabled in TeachPad, teachers can download the final presentation for easy sharing and classroom use.
          </p>
          <div className="mt-8">
            <PrimaryLink href="/signup">Create Presentation Free</PrimaryLink>
          </div>
        </div>
        <Image
          src="/assets/illustrations/presentation-generator-preview.png"
          alt="Presentation generator setup preview."
          width={1448}
          height={1086}
          className="mx-auto h-auto w-full max-w-2xl drop-shadow-[0_24px_42px_rgba(47,79,129,0.12)]"
        />
      </div>
    </section>
  );
}

function RelatedToolsSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Related teacher tools</p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Support your classroom presentation with matching resources.
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            These tools support presentation planning, but the main focus of this page is creating classroom presentations and PPTs.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {relatedTools.map((tool) => (
            <article key={tool.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-orange-600">
                <tool.Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-black text-slate-950">{tool.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{tool.text}</p>
              <Link
                href={tool.href}
                className="mt-5 inline-flex items-center gap-2 text-sm font-black text-orange-600 transition hover:text-orange-700"
              >
                {tool.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function LinksSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-5 lg:grid-cols-2">
        <LinkPanel
          title="Popular Classroom Presentation Ideas"
          text="Explore common presentation topics and classroom slide ideas teachers can create for explanation, revision, and student engagement."
          links={ideaLinks}
        />
        <LinkPanel
          title="Explore More Presentation Resources"
          text="Explore classroom PPT formats, lesson presentation ideas, chapter summary slides, quiz presentations, and teaching presentation examples for school teachers."
          links={resourceLinks}
        />
      </div>
    </section>
  );
}

function LinkPanel({ title, text, links }: { title: string; text: string; links: { label: string; href: string }[] }) {
  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-orange-200 hover:text-orange-600"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function FaqSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">FAQ</p>
        <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
          Frequently Asked Questions
        </h2>
      </div>
      <div className="mx-auto mt-10 grid max-w-5xl gap-4">
        {faqs.map((faq) => (
          <article key={faq.question} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
            <h3 className="text-lg font-black text-slate-950">{faq.question}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-12 pt-4 sm:px-6 lg:px-8">
      <div className="grid items-center gap-8 rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#fff7ed_100%)] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:grid-cols-[1fr_0.85fr] md:p-10 lg:p-12">
        <div>
          <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Create a classroom presentation from your textbook chapter in seconds.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
            Choose the class, subject, topic, or chapter you are teaching and let TeachPad prepare a structured presentation with slide titles, teaching points, examples, recap questions, and speaker notes.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <PrimaryLink href="/signup">Create Presentation Free</PrimaryLink>
            <SecondaryLink href="/ai-tools">Explore AI Tools</SecondaryLink>
          </div>
        </div>
        <Image
          src="/ai-tools/showcase-presentation.png"
          alt="Editable classroom presentation preview."
          width={1448}
          height={1086}
          className="mx-auto h-auto w-full max-w-2xl drop-shadow-[0_24px_42px_rgba(47,79,129,0.12)]"
        />
      </div>
    </section>
  );
}

function Badge({ children, icon: Icon }: { children: React.ReactNode; icon: LucideIcon }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-orange-600 shadow-[0_12px_26px_rgba(249,115,22,0.08)]">
      <Icon className="h-4 w-4" />
      {children}
    </span>
  );
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-orange-500 px-6 text-sm font-black text-white shadow-[0_18px_36px_rgba(249,115,22,0.24)] transition hover:-translate-y-0.5 hover:bg-orange-600"
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-orange-200 hover:text-orange-600"
    >
      {children}
    </Link>
  );
}
