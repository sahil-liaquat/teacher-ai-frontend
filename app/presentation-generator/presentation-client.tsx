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
  FileText,
  ListChecks,
  MessageSquareText,
  NotebookPen,
  Presentation,
  Puzzle,
  Sparkles,
  Layers3,
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
  "Choose slide settings, duration, and teaching preferences.",
  "Generate explanation slides aligned with the chapter flow.",
  "Create visual aids, explanation prompts, and quick quiz slides.",
  "Avoid starting explanation slides from a blank deck.",
  "Useful for school teachers, tutors, coaching teachers, and academic content creators.",
];

const includeCards = [
  [
    "Structured Explanation",
    "Slide-by-slide concepts, definitions, and main topics from the selected chapter.",
  ],
  [
    "Visual Slide Flow",
    " Teachable slide structures, diagrams, bullet points, and explanation aids.",
  ],
  [
    "Classroom Activities",
    "engagement prompts, discussion topics, and quick exercises to keep the class active.",
  ],
  [
    "Recap and Quiz Slides",
    "Summary points, exit checks, and quick questions to check chapter understanding.",
  ],
] as const;

const presentationTypes = [
  [
    "Lesson Presentation",
    "Explain chapter concepts step-by-step with structured slide content.",
  ],
  [
    "Revision Slide Deck",
    "Summarize main formulas, terms, definitions, and key points before exams.",
  ],
  [
    "Quiz Presentation",
    "Create interactive question slides, MCQs, and checks to keep students active.",
  ],
  [
    "Visual Lesson PPT",
    "Teachable visual flow, diagrams, and examples tied to textbook details.",
  ],
] as const;

const processSteps = [
  {
    title: "Choose your textbook chapter",
    text: "Select the board, class, subject, textbook, and chapter.",
  },
  {
    title: "Choose presentation settings",
    text: "Select slide count, duration, presentation preference, and language.",
  },
  {
    title: "Generate structured slides",
    text: "TeachPad creates slides and explanation prompts based on the chapter.",
  },
  {
    title: "Edit, save, and export",
    text: "Review the presentation, edit slide content, add notes, and prepare it for classroom teaching.",
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
    title: "Notes Generator",
    text: "Create concise notes from the same chapter.",
    cta: "Generate Notes",
    href: "/notes-generator",
    Icon: NotebookPen,
  },
  {
    title: "Classroom Activity Generator",
    text: "Add classroom activities and discussion prompts to your lesson.",
    cta: "Create Activity",
    href: "/classroom-activity-generator",
    Icon: Puzzle,
  },
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
  { label: "PPT generator for teachers", href: "/signup" },
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
  { label: "Question paper generator", href: "/signup" },
];

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

export function PresentationClient() {
  return (
    <>
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
    </>
  );
}

function HeroSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_16%_8%,#fff7ed_0,transparent_30%),radial-gradient(circle_at_88%_16%,#eef6ff_0,transparent_34%),linear-gradient(180deg,#ffffff_0%,#fffaf4_100%)]">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 pb-16 pt-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-8 lg:pb-32 lg:pt-32">
        <HeroStagger className="relative z-10 mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
          <HeroStaggerItem>
            <Badge icon={Sparkles}>AI Presentation Generator</Badge>
          </HeroStaggerItem>
          <HeroStaggerItem>
            <h1 className="mt-5 text-[40px] font-black leading-[1.05] tracking-tight text-slate-950 min-[390px]:text-[46px] sm:text-6xl lg:text-[72px]">
              AI Presentation Generator for Teachers
            </h1>
          </HeroStaggerItem>
          <HeroStaggerItem>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:mx-0">
              Create classroom-ready presentations in seconds. Select your board, class, subject, textbook, chapter, topic, number of slides, and language. TeachPad creates a structured teaching presentation with slide titles, key points, examples, classroom visuals, and speaker notes.
            </p>
          </HeroStaggerItem>
          <HeroStaggerItem>
            <div className="mx-auto mt-7 flex max-w-[460px] flex-col justify-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap lg:mx-0 lg:justify-start">
              <PrimaryLink href="/signup">Create Presentation Free</PrimaryLink>
              <SecondaryLink href="#example">View Presentation Example</SecondaryLink>
            </div>
          </HeroStaggerItem>
        </HeroStagger>

        <PresentationPreview />
      </div>
    </section>
  );
}

function PresentationPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[760px] lg:-mr-8 lg:max-w-none">
      <div className="hero-blob left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
      <ParallaxTilt className="relative z-10" maxDeg={3.5}>
        <div className="hero-float">
          <Image
            src="/ai-tools/showcase-presentation.png"
            alt="Editable classroom presentation preview."
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
            Create Presentations from Textbook Chapters
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            TeachPad works as a presentation generator for teachers who want classroom slides connected to the exact chapter they are teaching. Use it as a teaching presentation generator, lesson presentation generator, classroom presentation maker, or textbook-based presentation generator when you need a clear PPT without starting from a blank file.
          </p>
          <p className="mt-4 text-base leading-8 text-slate-600">
            It helps school teachers, tutors, coaching teachers, and academic content creators prepare chapter presentations for explanation, examples, activities, and recap.
          </p>
        </div>
      </RevealOnScroll>
      
      <StaggerGroup className="grid gap-4 sm:grid-cols-2">
        {chapterPoints.map((point) => (
          <StaggerScaleItem key={point}>
            <Card3DTilt maxTilt={4} className="rounded-2xl border border-slate-200 bg-white p-5 h-full">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-50 text-orange-600">
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
    <section className="bg-[#fffaf4]">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
        <RevealOnScroll>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Presentation content</p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              What TeachPad Can Include in a Presentation
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Create classroom PPTs with the structure teachers need for explanation, student engagement, recap, and quick checks.
            </p>
          </div>
        </RevealOnScroll>
        
        <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {includeCards.map(([title, text]) => (
            <StaggerScaleItem key={title}>
              <Card3DTilt maxTilt={5} className="rounded-2xl border border-orange-100 bg-white p-5 h-full">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-orange-600">
                  <Presentation className="h-5 w-5" />
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

function PresentationTypeSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
      <RevealOnScroll>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Presentation types</p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Choose the Right Presentation Type
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            Teachers need different presentation styles for different classroom needs. TeachPad can help create lesson PPTs, revision decks, quiz slides, chapter summaries, and visual classroom presentations.
          </p>
        </div>
      </RevealOnScroll>
      
      <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {presentationTypes.map(([title, text]) => (
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
    <section className="bg-[linear-gradient(180deg,#ffffff_0%,#fffaf4_100%)]">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
        <RevealOnScroll>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">How it works</p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              How TeachPad Creates a Presentation
            </h2>
          </div>
        </RevealOnScroll>
        
        <StaggerGroup className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((step, index) => (
            <StaggerScaleItem key={step.title}>
              <Card3DTilt maxTilt={5} className="rounded-2xl border border-orange-100 bg-white p-5 h-full">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500 text-sm font-black text-white">{index + 1}</span>
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
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
        <RevealOnScroll>
          <div className="mx-auto max-w-3xl text-center">
            <Badge icon={Layers3}>Presentation example</Badge>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Example Presentation Output
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              A classroom presentation can include slide titles, teaching bullets, activities, recap questions, and speaker notes.
            </p>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={0.15}>
          <div className="relative mt-10 overflow-hidden">
            <Image
              src="/assets/illustrations/presentation-output-preview.png"
              alt="Generated classroom presentation output preview."
              width={1851}
              height={1080}
              className="h-auto w-full [mask-image:linear-gradient(180deg,#000_0%,#000_78%,rgba(0,0,0,0.68)_88%,transparent_100%)]"
            />
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

function SpeakerNotesSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
      <RevealOnScroll>
        <div className="grid items-center gap-12 rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:grid-cols-[1fr_0.85fr] md:p-16 lg:p-20">
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
            {["Explain each slide confidently", "Add examples and recap prompts", "Prepare questions before class", "Keep the lesson PPT easy to present"].map((item, index) => (
              <RevealOnScroll key={item} delay={index * 0.12}>
                <div className="mb-3 flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-bold text-slate-700 shadow-sm last:mb-0">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-orange-500 text-white">
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
    <section className="bg-[#fffaf4]">
      <RevealOnScroll>
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-24 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-24 lg:px-8 lg:py-36">
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
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Related teacher tools</p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Support your classroom presentation with matching resources.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              These tools support presentation planning, but the main focus of this page is creating classroom presentations and PPTs.
            </p>
          </div>
        </RevealOnScroll>
        
        <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {relatedTools.map((tool) => (
            <StaggerScaleItem key={tool.title}>
              <Card3DTilt maxTilt={4} className="rounded-2xl border border-slate-200 bg-white p-5 h-full flex flex-col">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-orange-600">
                  <tool.Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-black text-slate-950">{tool.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{tool.text}</p>
                <Link
                  href={tool.href}
                  className="mt-auto pt-5 inline-flex items-center gap-2 text-sm font-black text-orange-600 transition hover:text-orange-700"
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
      </RevealOnScroll>
    </section>
  );
}

function LinkPanel({ title, text, links }: { title: string; text: string; links: { label: string; href: string }[] }) {
  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] flex-1">
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {links.map((link) => (
          <Link
            key={link.label}
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
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
      <RevealOnScroll>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">FAQ</p>
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
        <div className="grid items-center gap-12 rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#fff7ed_100%)] p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:grid-cols-[1fr_0.85fr] md:p-16 lg:p-20">
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
      </RevealOnScroll>
    </section>
  );
}

// Helper components
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
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600"
      style={{
        transition: "transform var(--duration-micro) var(--ease-premium), border-color var(--duration-micro) var(--ease-premium), color var(--duration-micro) var(--ease-premium)"
      }}
    >
      {children}
    </Link>
  );
}
