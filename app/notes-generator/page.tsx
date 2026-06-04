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
  HelpCircle,
  ListChecks,
  NotebookPen,
  Presentation,
  Puzzle,
  School,
  Sparkles
} from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";

const pageTitle = "AI Notes Generator for Teachers | TeachPad";
const pageDescription =
  "Create textbook-based notes in seconds with TeachPad's AI Notes Generator. Generate revision notes, short notes, chapter summaries, key points, and definitions.";
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
    description: "Create textbook-based revision notes, short notes, chapter summaries, key points, and definitions in seconds with TeachPad.",
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
    description: "Create revision notes, short notes, and chapter summaries in seconds with TeachPad.",
    images: [previewImage]
  }
};

const faqs = [
  {
    question: "What is an AI notes generator for teachers?",
    answer:
      "An AI notes generator for teachers helps create classroom notes, revision notes, short notes, summaries, key points, definitions, and student-friendly explanations from a topic or textbook chapter."
  },
  {
    question: "How does TeachPad create notes?",
    answer:
      "Teachers select the board, class, subject, textbook, chapter, topic, note type, detail level, and language. TeachPad then creates structured notes based on those inputs."
  },
  {
    question: "Is TeachPad a free notes generator?",
    answer:
      "Teachers can start creating notes on TeachPad for free. Some advanced features, higher usage limits, exports, and saved resources may depend on the selected plan."
  },
  {
    question: "Can TeachPad create revision notes?",
    answer:
      "Yes. TeachPad can help teachers create revision notes for classroom explanation, homework support, and exam preparation."
  },
  {
    question: "Can TeachPad create short notes?",
    answer:
      "Yes. Teachers can create short notes with key points, definitions, examples, and quick recap sections."
  },
  {
    question: "Can TeachPad create chapter summaries?",
    answer:
      "Yes. TeachPad can generate chapter summaries that explain the main ideas of a selected textbook chapter or topic."
  },
  {
    question: "Can TeachPad create notes from NCERT chapters?",
    answer:
      "Yes. TeachPad is designed for textbook-based notes creation, which makes it useful for NCERT, JKBOSE, and other curriculum-based classroom needs."
  },
  {
    question: "Can TeachPad create notes in Hindi?",
    answer:
      "TeachPad can support notes creation in English or Hindi depending on the available product language settings."
  },
  {
    question: "Can I edit the notes after they are generated?",
    answer:
      "Yes. Teachers should be able to review, edit, and customize generated notes before using them in class or sharing them with students."
  },
  {
    question: "Can TeachPad create important questions with notes?",
    answer:
      "Yes. TeachPad can help include important questions, key points, and recap sections along with the generated notes."
  },
  {
    question: "Can I download notes as PDF?",
    answer:
      "If export is enabled, teachers can download notes as PDF files for classroom use, printing, sharing, or school records."
  },
  {
    question: "Can TeachPad turn notes into worksheets or presentations?",
    answer:
      "Yes. Teachers can use TeachPad's related tools to turn the same chapter or topic into worksheets, MCQs, question papers, and classroom presentations."
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

const chapterPoints = [
  "Select board/curriculum, class, subject, textbook, and chapter.",
  "Enter the topic and choose note type.",
  "Generate notes aligned with the chapter.",
  "Create revision notes, short notes, summaries, definitions, and key points.",
  "Avoid starting from a blank document.",
  "Useful for school teachers, tutors, coaching teachers, and academic content creators."
];

const includeCards = [
  ["Chapter Summary", "A clear summary of the selected textbook chapter or topic."],
  ["Key Points", "Important points teachers and students should remember."],
  ["Definitions", "Simple definitions of important terms from the chapter."],
  ["Concept Explanation", "Student-friendly explanations for difficult concepts."],
  ["Important Questions", "Questions that help students revise the chapter."],
  ["Examples", "Simple examples that make the topic easier to understand."],
  ["Quick Recap", "Short recap notes for revision before tests."],
  ["Teacher Notes", "Extra teaching points teachers can use during explanation."]
];

const notesTypes = [
  ["Revision Notes", "Prepare organized notes for exam and test revision."],
  ["Short Notes", "Create brief notes with only the most important points."],
  ["Chapter Summary", "Summarize the main ideas of a textbook chapter."],
  ["Key Points Notes", "List important points students should remember."],
  ["Definition Notes", "Collect simple definitions from the chapter."],
  ["Important Questions Notes", "Add likely revision questions with the notes."],
  ["Student-Friendly Notes", "Explain concepts in simple classroom language."],
  ["Teacher Explanation Notes", "Prepare teaching points for class explanation."]
];

const processSteps = [
  {
    title: "Choose your textbook chapter",
    text: "Select the board, class, subject, textbook, and chapter."
  },
  {
    title: "Add notes details",
    text: "Enter the topic, note type, detail level, language, and student level."
  },
  {
    title: "Generate structured notes",
    text: "TeachPad creates summaries, key points, definitions, explanations, and revision notes."
  },
  {
    title: "Edit, save, and export",
    text: "Review the notes, edit the content, and prepare them for classroom teaching or student revision."
  }
];

const relatedTools = [
  {
    title: "Lesson Plan Generator",
    text: "Create a complete lesson plan before preparing notes.",
    cta: "Create Lesson Plan",
    href: "/lesson-plan-generator",
    Icon: FileText
  },
  {
    title: "Worksheet Generator",
    text: "Turn notes into practice worksheets for students.",
    cta: "Create Worksheet",
    href: "/worksheet-generator",
    Icon: ClipboardList
  },
  {
    title: "MCQ Generator",
    text: "Generate quick quiz questions from the same topic.",
    cta: "Generate MCQs",
    href: "/signup",
    Icon: ListChecks
  },
  {
    title: "Question Paper Generator",
    text: "Turn chapter notes into tests and assessment papers.",
    cta: "Create Question Paper",
    href: "/signup",
    Icon: FileQuestion
  },
  {
    title: "Presentation Generator",
    text: "Turn notes into classroom slides.",
    cta: "Create Presentation",
    href: "/presentation-generator",
    Icon: Presentation
  },
  {
    title: "Classroom Activity Generator",
    text: "Create activities that support note-based learning.",
    cta: "Create Activity",
    href: "/classroom-activity-generator",
    Icon: Puzzle
  }
];

const popularLinks = [
  { label: "Revision notes generator", href: "/signup" },
  { label: "Short notes generator", href: "/signup" },
  { label: "Chapter summary generator", href: "/signup" },
  { label: "Key points generator", href: "/signup" },
  { label: "Important questions generator", href: "/signup" },
  { label: "Definition notes generator", href: "/signup" },
  { label: "NCERT notes generator", href: "/signup" },
  { label: "JKBOSE notes generator", href: "/signup" },
  { label: "Science notes generator", href: "/signup" },
  { label: "Maths notes generator", href: "/signup" },
  { label: "English notes generator", href: "/signup" },
  { label: "Hindi notes generator", href: "/signup" }
];

const resourceLinks = [
  { label: "Revision notes generator", href: "/signup" },
  { label: "Short notes generator", href: "/signup" },
  { label: "Chapter summary generator", href: "/signup" },
  { label: "Textbook summary generator", href: "/signup" },
  { label: "Notes with important questions", href: "/signup" },
  { label: "Student notes generator", href: "/signup" },
  { label: "Teaching notes generator", href: "/signup" },
  { label: "Lesson plan generator", href: "/signup" },
  { label: "Worksheet generator", href: "/signup" },
  { label: "Question paper generator", href: "/signup" },
  { label: "Presentation generator", href: "/signup" }
];

export default function NotesGeneratorPage() {
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
      <NotesTypeSection />
      <ProcessSection />
      <ExampleSection />
      <RevisionSection />
      <DownloadSection />
      <CurriculumSection />
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
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_16%_8%,#f5f3ff_0,transparent_30%),radial-gradient(circle_at_88%_16%,#eef6ff_0,transparent_34%),linear-gradient(180deg,#ffffff_0%,#faf8ff_100%)]">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 pb-10 pt-9 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:pb-16 lg:pt-14">
        <div className="relative z-10 mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
          <Badge icon={Sparkles}>AI Notes Generator</Badge>
          <h1 className="mt-5 text-[40px] font-black leading-[1.05] tracking-tight text-slate-950 min-[390px]:text-[46px] sm:text-6xl lg:text-[72px]">
            AI Notes Generator for Teachers
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:mx-0">
            Create textbook-based notes in seconds. Select your board, class, subject, textbook, chapter, topic, note type, detail level, and language. TeachPad creates clear teaching notes, revision notes, short notes, chapter summaries, key points, and definitions for classroom teaching and student revision.
          </p>
          <div className="mx-auto mt-7 flex max-w-[460px] flex-col justify-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap lg:mx-0 lg:justify-start">
            <PrimaryLink href="/signup">Create Notes Free</PrimaryLink>
            <SecondaryLink href="#example">View Notes Example</SecondaryLink>
          </div>
        </div>

        <NotesPreview />
      </div>
    </section>
  );
}

function NotesPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[760px] lg:-mr-8 lg:max-w-none">
      <Image
        src="/ai-tools/showcase-notes.png"
        alt="Editable classroom notes preview."
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
          Create Notes from Textbook Chapters
        </h2>
        <p className="mt-5 text-base leading-8 text-slate-600">
          TeachPad works as a notes generator for teachers who want notes to match the chapter they are teaching. Use it as a revision notes generator, short notes generator, textbook notes generator, or teaching notes generator when you need clean study material without starting from a blank document.
        </p>
        <p className="mt-4 text-base leading-8 text-slate-600">
          It helps school teachers, tutors, coaching teachers, and academic content creators prepare chapter-wise notes for classroom explanation, homework support, and revision.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {chapterPoints.map((point) => (
          <article key={point} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-600">
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
    <section className="bg-[#faf8ff]">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">Notes content</p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            What TeachPad Can Include in Notes
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            Create classroom notes with summaries, important points, definitions, explanations, examples, questions, and quick recap sections.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {includeCards.map(([title, text]) => (
            <article key={title} className="rounded-2xl border border-violet-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-600">
                <NotebookPen className="h-5 w-5" />
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

function NotesTypeSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">Notes types</p>
        <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
          Choose the Right Notes Type
        </h2>
        <p className="mt-5 text-base leading-8 text-slate-600">
          Teachers need different types of notes for different classroom needs. TeachPad can help create revision notes, short notes, summaries, definitions, student notes, and teacher explanation notes.
        </p>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {notesTypes.map(([title, text]) => (
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
    <section className="bg-[linear-gradient(180deg,#ffffff_0%,#faf8ff_100%)]">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">How it works</p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            How TeachPad Creates Notes
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((step, index) => (
            <article key={step.title} className="rounded-2xl border border-violet-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-sm font-black text-white">{index + 1}</span>
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
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:py-20">
        <div>
          <Badge icon={NotebookPen}>Notes example</Badge>
          <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Example Notes Output
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            Review a generated notes preview with headings, bullets, highlighted definitions, and a quick recap that teachers can edit before class.
          </p>
        </div>
        <div className="relative overflow-hidden">
          <Image
            src="/assets/illustrations/notes-output-preview.png"
            alt="Generated handwritten-style notes output preview."
            width={994}
            height={929}
            className="h-auto w-full [mask-image:linear-gradient(180deg,#000_0%,#000_78%,rgba(0,0,0,0.68)_88%,transparent_100%)]"
          />
        </div>
      </div>
    </section>
  );
}

function RevisionSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="grid items-center gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:grid-cols-[1fr_0.85fr] md:p-10">
        <div>
          <Badge icon={HelpCircle}>Student revision</Badge>
          <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Create Revision Notes for Students
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            TeachPad can help teachers create revision notes that are simple, organized, and easy for students to understand. Teachers can use these notes for classroom explanation, homework support, test preparation, and quick revision before exams.
          </p>
          <p className="mt-4 text-base leading-8 text-slate-600">
            Create revision notes, short notes, chapter-wise notes, notes for students, study material, and important points that support daily teaching and exam preparation.
          </p>
        </div>
        <div className="rounded-3xl bg-[#faf8ff] p-5">
          {["Simple revision notes", "Short notes for quick study", "Chapter-wise notes", "Important points for tests"].map((item) => (
            <div key={item} className="mb-3 flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-bold text-slate-700 shadow-sm last:mb-0">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-violet-600 text-white">
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
    <section className="bg-[#faf8ff]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
        <div>
          <Badge icon={Download}>Save and export</Badge>
          <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Download, Edit, and Save Notes
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            TeachPad creates editable notes that teachers can review, customize, and use for classroom teaching, revision, homework support, or student study material. You can adjust the explanation, add examples, include important questions, and prepare the notes in a format that fits your classroom needs.
          </p>
          <p className="mt-4 text-base leading-8 text-slate-600">
            Use your generated notes as revision notes, short notes, chapter summary notes, or student handouts. If PDF export is enabled in TeachPad, teachers can download the final notes as a PDF for easy sharing and printing.
          </p>
          <div className="mt-8">
            <PrimaryLink href="/signup">Create Notes Free</PrimaryLink>
          </div>
        </div>
        <Image
          src="/ai-tools/showcase-notes.png"
          alt="Editable classroom notes preview."
          width={1448}
          height={1086}
          className="mx-auto h-auto w-full max-w-2xl drop-shadow-[0_24px_42px_rgba(47,79,129,0.12)]"
        />
      </div>
    </section>
  );
}

function CurriculumSection() {
  return (
    <section className="bg-[linear-gradient(180deg,#ffffff_0%,#faf8ff_100%)]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
        <div>
          <Badge icon={School}>Indian classrooms</Badge>
          <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Built for NCERT, JKBOSE, and School Curriculum
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            TeachPad supports textbook-based notes for Indian classrooms. It can be useful as an NCERT notes generator, JKBOSE notes generator, and textbook notes generator because teachers start with the school curriculum, selected textbook, and chapter topic.
          </p>
          <p className="mt-4 text-base leading-8 text-slate-600">
            Teachers can prepare chapter-wise notes for classroom explanation, revision, homework support, and student study material while keeping the notes aligned with what students are studying.
          </p>
        </div>
        <Image
          src="/assets/illustrations/create-notes-header.png"
          alt="Textbook-based notes planning illustration."
          width={1672}
          height={941}
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
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">Related teacher tools</p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Support your notes with matching resources.
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            These tools support note-based teaching, but the main focus of this page is creating textbook-based notes and revision material.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {relatedTools.map((tool) => (
            <article key={tool.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-600">
                <tool.Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-black text-slate-950">{tool.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{tool.text}</p>
              <Link
                href={tool.href}
                className="mt-5 inline-flex items-center gap-2 text-sm font-black text-violet-600 transition hover:text-violet-700"
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
          title="Popular Notes Teachers Create"
          text="Explore common notes formats teachers use for classroom explanation, revision, homework support, and exam preparation."
          links={popularLinks}
        />
        <LinkPanel
          title="Explore More Notes Resources"
          text="Explore revision notes, short notes, chapter summaries, definitions, important questions, and subject-wise study material for classroom teaching."
          links={resourceLinks}
        />
      </div>
    </section>
  );
}

function LinkPanel({ title, text, links }: { title: string; text: string; links: { label: string; href: string }[] }) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-violet-200 hover:text-violet-600"
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
        <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">FAQ</p>
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
      <div className="grid items-center gap-8 rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#faf8ff_100%)] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:grid-cols-[1fr_0.85fr] md:p-10 lg:p-12">
        <div>
          <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Create notes from your textbook chapter in seconds.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
            Choose the class, subject, topic, or chapter you are teaching and let TeachPad prepare clear notes with summaries, key points, definitions, examples, and revision-friendly formatting.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <PrimaryLink href="/signup">Create Notes Free</PrimaryLink>
            <SecondaryLink href="/ai-tools">Explore AI Tools</SecondaryLink>
          </div>
        </div>
        <Image
          src="/landing/backpack-globe-v2.png"
          alt="Backpack, globe, books, and stationery illustration."
          width={1600}
          height={900}
          className="mx-auto h-auto w-full max-w-xl"
        />
      </div>
    </section>
  );
}

function Badge({ children, icon: Icon }: { children: React.ReactNode; icon: LucideIcon }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-violet-600 shadow-[0_12px_26px_rgba(124,58,237,0.08)]">
      <Icon className="h-4 w-4" />
      {children}
    </span>
  );
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-violet-600 px-6 text-sm font-black text-white shadow-[0_18px_36px_rgba(124,58,237,0.24)] transition hover:-translate-y-0.5 hover:bg-violet-700"
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
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-600"
    >
      {children}
    </Link>
  );
}
