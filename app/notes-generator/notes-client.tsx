"use client";

import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ClipboardList,
  Download,
  FileQuestion,
  HelpCircle,
  NotebookPen,
  Presentation,
  Puzzle,
  School,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  EASE_PREMIUM,
  DURATION_REVEAL,
  staggerContainer,
  staggerItem,
  staggerScaleItem,
  checklistContainer,
  checklistItem,
} from "@/lib/use-motion";
import {
  RevealOnScroll,
  StaggerGroup,
  StaggerFadeItem,
  StaggerScaleItem,
  Card3DTilt,
  ParallaxTilt,
  AnimatedCheckmark,
  HeroStagger,
  HeroStaggerItem,
} from "@/components/motion-primitives";

const chapterPoints = [
  "Select board/curriculum, class, subject, textbook, and chapter.",
  "Choose detail level, detail preferences, and language.",
  "Generate notes aligned with the chapter outline.",
  "Create key points, revision summaries, and definitions.",
  "Avoid starting revision handouts from a blank document.",
  "Useful for school teachers, tutors, coaching teachers, and academic content creators.",
];

const includeCards = [
  [
    "Chapter Summaries",
    "Concise outline, summaries, and key concepts from the selected textbook chapter.",
  ],
  [
    "Definitions & Terms",
    "Highlighted formulas, definitions, equations, and main terms with clear explanations.",
  ],
  [
    "Teachable Explanations",
    "Structured points, examples, and details designed for blackboard explanation and lesson revision.",
  ],
  [
    "Important Questions",
    "Key questions, quiz prompts, and active checks to support notes-based learning.",
  ],
] as const;

const notesTypes = [
  [
    "Revision Notes",
    "Summarize key formulas, main concepts, and terms before class tests or school exams.",
  ],
  [
    "Short Notes",
    "Concise study sheets with definitions and main chapter topics.",
  ],
  [
    "Chapter Summary",
    "Overview of the textbook chapter structure, main ideas, and learning details.",
  ],
  [
    "Teaching Notes",
    "Teachable explanation flow, points, and examples for school teachers.",
  ],
] as const;

const processSteps = [
  {
    title: "Choose your textbook chapter",
    text: "Select the board, class, subject, textbook, and chapter.",
  },
  {
    title: "Choose notes preferences",
    text: "Select note type, detail level, language, and teaching preferences.",
  },
  {
    title: "Generate structured notes",
    text: "TeachPad creates summaries and explanation points based on the chapter.",
  },
  {
    title: "Edit, save, and download",
    text: "Review the notes, edit wording, add questions, and prepare them for revision or study handouts.",
  },
];

const relatedTools = [
  {
    title: "Lesson Plan Generator",
    text: "Create structured lesson plans from the same chapter.",
    cta: "Create Lesson Plan",
    href: "/lesson-plan-generator",
    Icon: FileText,
  },
  {
    title: "Worksheet Generator",
    text: "Create practice questions and answer keys from the chapter.",
    cta: "Create Worksheet",
    href: "/worksheet-generator",
    Icon: ClipboardList,
  },
  {
    title: "MCQ Generator",
    text: "Generate checks, MCQs, and short questions.",
    cta: "Generate MCQs",
    href: "/signup",
    Icon: ListChecks,
  },
  {
    title: "Question Paper Generator",
    text: "Prepare chapter tests and school exam papers.",
    cta: "Create Question Paper",
    href: "/signup",
    Icon: FileQuestion,
  },
  {
    title: "Presentation Generator",
    text: "Turn notes into classroom slides.",
    cta: "Create Presentation",
    href: "/presentation-generator",
    Icon: Presentation,
  },
  {
    title: "Classroom Activity Generator",
    text: "Create activities that support note-based learning.",
    cta: "Create Activity",
    href: "/classroom-activity-generator",
    Icon: Puzzle,
  },
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
  { label: "Hindi notes generator", href: "/signup" },
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
  { label: "Presentation generator", href: "/signup" },
];

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

function FileText(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

function ListChecks(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m3 17 2 2 4-4" />
      <path d="m3 7 2 2 4-4" />
      <path d="M13 6h8" />
      <path d="M13 12h8" />
      <path d="M13 18h8" />
      <path d="m3 12 2 2 4-4" />
    </svg>
  );
}

export function NotesClient() {
  return (
    <>
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
    </>
  );
}

function HeroSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_16%_8%,#f5f3ff_0,transparent_30%),radial-gradient(circle_at_88%_16%,#eef6ff_0,transparent_34%),linear-gradient(180deg,#ffffff_0%,#faf8ff_100%)]">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 pb-16 pt-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-8 lg:pb-32 lg:pt-32">
        <HeroStagger className="relative z-10 mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
          <HeroStaggerItem>
            <Badge icon={Sparkles}>AI Notes Generator</Badge>
          </HeroStaggerItem>
          <HeroStaggerItem>
            <h1 className="mt-5 text-[40px] font-black leading-[1.05] tracking-tight text-slate-950 min-[390px]:text-[46px] sm:text-6xl lg:text-[72px]">
              AI Notes Generator for Teachers
            </h1>
          </HeroStaggerItem>
          <HeroStaggerItem>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:mx-0">
              Create textbook-based notes in seconds. Select your board, class, subject, textbook, chapter, topic, note type, detail level, and language. TeachPad creates clear teaching notes, revision notes, short notes, chapter summaries, key points, and definitions for classroom teaching and student revision.
            </p>
          </HeroStaggerItem>
          <HeroStaggerItem>
            <div className="mx-auto mt-7 flex max-w-[460px] flex-col justify-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap lg:mx-0 lg:justify-start">
              <PrimaryLink href="/signup">Create Notes Free</PrimaryLink>
              <SecondaryLink href="#example">View Notes Example</SecondaryLink>
            </div>
          </HeroStaggerItem>
        </HeroStagger>

        <NotesPreview />
      </div>
    </section>
  );
}

function NotesPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[760px] lg:-mr-8 lg:max-w-none">
      <div className="hero-blob left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
      <ParallaxTilt className="relative z-10" maxDeg={3.5}>
        <div className="hero-float">
          <Image
            src="/ai-tools/showcase-notes.png"
            alt="Editable classroom notes preview."
            width={1448}
            height={1086}
            priority
            className="h-auto w-full drop-shadow-[0_34px_70px_rgba(47,79,129,0.16)]"
          />
        </div>
      </ParallaxTilt>
    </div>
  );
}

function ChapterSection() {
  return (
    <section className="mx-auto grid max-w-7xl gap-16 px-5 py-24 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-8 lg:py-36">
      <RevealOnScroll>
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
      </RevealOnScroll>
      
      <StaggerGroup className="grid gap-4 sm:grid-cols-2">
        {chapterPoints.map((point) => (
          <StaggerScaleItem key={point}>
            <Card3DTilt maxTilt={4} className="rounded-2xl border border-slate-200 bg-white p-5 h-full">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-600">
                <Check className="h-5 w-5" />
              </span>
              <p className="mt-4 text-sm font-bold leading-6 text-slate-700">{point}</p>
            </Card3DTilt>
          </StaggerScaleItem>
        ))}
      </StaggerGroup>
    </section>
  );
}

function IncludeSection() {
  return (
    <section className="bg-[#faf8ff]">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
        <RevealOnScroll>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">Notes content</p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              What TeachPad Can Include in Notes
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Create classroom notes with summaries, important points, definitions, explanations, examples, questions, and quick recap sections.
            </p>
          </div>
        </RevealOnScroll>
        
        <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {includeCards.map(([title, text]) => (
            <StaggerScaleItem key={title}>
              <Card3DTilt maxTilt={5} className="rounded-2xl border border-violet-100 bg-white p-5 h-full">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-600">
                  <NotebookPen className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
              </Card3DTilt>
            </StaggerScaleItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

function NotesTypeSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
      <RevealOnScroll>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">Notes types</p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Choose the Right Notes Type
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            Teachers need different types of notes for different classroom needs. TeachPad can help create revision notes, short notes, summaries, definitions, student notes, and teacher explanation notes.
          </p>
        </div>
      </RevealOnScroll>
      
      <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {notesTypes.map(([title, text]) => (
          <StaggerScaleItem key={title}>
            <Card3DTilt maxTilt={5} className="rounded-2xl border border-slate-200 bg-white p-5 h-full">
              <h3 className="text-lg font-black text-slate-950">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
            </Card3DTilt>
          </StaggerScaleItem>
        ))}
      </StaggerGroup>
    </section>
  );
}

function ProcessSection() {
  return (
    <section className="bg-[linear-gradient(180deg,#ffffff_0%,#faf8ff_100%)]">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
        <RevealOnScroll>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">How it works</p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              How TeachPad Creates Notes
            </h2>
          </div>
        </RevealOnScroll>
        
        <StaggerGroup className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((step, index) => (
            <StaggerScaleItem key={step.title}>
              <Card3DTilt maxTilt={5} className="rounded-2xl border border-violet-100 bg-white p-5 h-full">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-sm font-black text-white">{index + 1}</span>
                <h3 className="mt-5 text-lg font-black text-slate-950">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{step.text}</p>
              </Card3DTilt>
            </StaggerScaleItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

function ExampleSection() {
  return (
    <section id="example" className="bg-white">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-24 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24 lg:px-8 lg:py-36">
        <RevealOnScroll>
          <div>
            <Badge icon={NotebookPen}>Notes example</Badge>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Example Notes Output
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Review a generated notes preview with headings, bullets, highlighted definitions, and a quick recap that teachers can edit before class.
            </p>
          </div>
        </RevealOnScroll>
        
        <RevealOnScroll delay={0.15}>
          <div className="relative overflow-hidden">
            <Image
              src="/assets/illustrations/notes-output-preview.png"
              alt="Generated handwritten-style notes output preview."
              width={994}
              height={929}
              className="h-auto w-full [mask-image:linear-gradient(180deg,#000_0%,#000_78%,rgba(0,0,0,0.68)_88%,transparent_100%)]"
            />
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

function RevisionSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
      <RevealOnScroll>
        <div className="grid items-center gap-12 rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:grid-cols-[1fr_0.85fr] md:p-16 lg:p-20">
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
            {["Simple revision notes", "Short notes for quick study", "Chapter-wise notes", "Important points for tests"].map((item, index) => (
              <RevealOnScroll key={item} delay={index * 0.12}>
                <div className="mb-3 flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-bold text-slate-700 shadow-sm last:mb-0">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-violet-600 text-white">
                    <AnimatedCheckmark className="h-4 w-4" />
                  </span>
                  {item}
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}

function DownloadSection() {
  return (
    <section className="bg-[#faf8ff]">
      <RevealOnScroll>
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-24 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-24 lg:px-8 lg:py-36">
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
      </RevealOnScroll>
    </section>
  );
}

function CurriculumSection() {
  return (
    <section className="bg-[linear-gradient(180deg,#ffffff_0%,#faf8ff_100%)]">
      <RevealOnScroll>
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-24 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-8 lg:py-36">
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
      </RevealOnScroll>
    </section>
  );
}

function RelatedToolsSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
        <RevealOnScroll>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">Related teacher tools</p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Support your notes with matching resources.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              These tools support note-based teaching, but the main focus of this page is creating textbook-based notes and revision material.
            </p>
          </div>
        </RevealOnScroll>
        
        <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {relatedTools.map((tool) => (
            <StaggerScaleItem key={tool.title}>
              <Card3DTilt maxTilt={4} className="rounded-2xl border border-slate-200 bg-white p-5 h-full flex flex-col">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-600">
                  <tool.Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-black text-slate-950">{tool.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{tool.text}</p>
                <Link
                  href={tool.href}
                  className="mt-auto pt-5 inline-flex items-center gap-2 text-sm font-black text-violet-600 transition hover:text-violet-700"
                >
                  {tool.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Card3DTilt>
            </StaggerScaleItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

function LinksSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
      <RevealOnScroll>
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
      </RevealOnScroll>
    </section>
  );
}

function LinkPanel({ title, text, links }: { title: string; text: string; links: { label: string; href: string }[] }) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] flex-1">
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
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
      <RevealOnScroll>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">FAQ</p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Frequently Asked Questions
          </h2>
        </div>
      </RevealOnScroll>
      <StaggerGroup className="mx-auto mt-10 grid max-w-5xl gap-4">
        {faqs.map((faq) => (
          <StaggerFadeItem key={faq.question}>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
              <h3 className="text-lg font-black text-slate-950">{faq.question}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
            </article>
          </StaggerFadeItem>
        ))}
      </StaggerGroup>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-24 pt-16 sm:px-6 lg:px-8">
      <RevealOnScroll>
        <div className="grid items-center gap-12 rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#faf8ff_100%)] p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:grid-cols-[1fr_0.85fr] md:p-16 lg:p-20">
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
      </RevealOnScroll>
    </section>
  );
}

// Helper components
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
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-black text-white shadow-[0_18px_36px_rgba(37,99,235,0.24)] hover:-translate-y-0.5 hover:bg-blue-700"
      style={{
        transition: "transform var(--duration-micro) var(--ease-premium), background-color var(--duration-micro) var(--ease-premium), box-shadow var(--duration-micro) var(--ease-premium)"
      }}
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
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600"
      style={{
        transition: "transform var(--duration-micro) var(--ease-premium), border-color var(--duration-micro) var(--ease-premium), color var(--duration-micro) var(--ease-premium)"
      }}
    >
      {children}
    </Link>
  );
}
