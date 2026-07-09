"use client";

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
  ListChecks,
  NotebookPen,
  Presentation,
  Puzzle,
  School,
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
} from "@/components/motion-primitives";

const chapterPoints = [
  "Select board/curriculum, class, subject, textbook, and chapter.",
  "Generate lesson plans aligned with the chapter topic.",
  "Avoid starting from a blank document.",
  "Create classroom-ready plans for daily teaching.",
  "Useful for school teachers, tutors, coaching teachers, and academic content creators.",
];

const formatItems = [
  "Topic, class, subject, chapter, and duration",
  "Learning objectives",
  "Previous knowledge",
  "Teaching aids",
  "Introduction",
  "Explanation flow",
  "Classroom activity",
  "Assessment",
  "Homework",
  "Teacher notes/reflection",
];

const processSteps = [
  {
    title: "Choose your textbook chapter",
    text: "Select the board, class, subject, textbook, and chapter you want to teach.",
  },
  {
    title: "Add teaching details",
    text: "Enter the topic, duration, language, and any classroom preferences.",
  },
  {
    title: "Generate a structured lesson plan",
    text: "TeachPad creates objectives, explanation flow, activities, assessment, and homework.",
  },
  {
    title: "Edit, save, and download",
    text: "Review the editable lesson plan and prepare it for school records or classroom use.",
  },
];

const relatedTools = [
  {
    title: "Worksheet Generator",
    text: "Create practice questions from the same chapter.",
    cta: "Create Worksheet",
    href: "/worksheet-generator",
    Icon: ClipboardList,
  },
  {
    title: "MCQ Generator",
    text: "Generate quick checks and revision questions.",
    cta: "Generate MCQs",
    href: "/signup",
    Icon: ListChecks,
  },
  {
    title: "Question Paper Generator",
    text: "Prepare chapter tests and assessment papers.",
    cta: "Create Question Paper",
    href: "/signup",
    Icon: FileQuestion,
  },
  {
    title: "Notes Generator",
    text: "Create concise revision notes from the selected chapter.",
    cta: "Generate Notes",
    href: "/notes-generator",
    Icon: NotebookPen,
  },
  {
    title: "Presentation Generator",
    text: "Turn the lesson topic into classroom slides.",
    cta: "Create Presentation",
    href: "/presentation-generator",
    Icon: Presentation,
  },
  {
    title: "Classroom Activity Generator",
    text: "Create activities for engagement and discussion.",
    cta: "Create Activity",
    href: "/classroom-activity-generator",
    Icon: Puzzle,
  },
];

const classroomPlanningPoints = [
  "Select the textbook chapter before generation",
  "Create editable lesson plans",
  "Prepare daily classroom flow quickly",
  "Save resources for later use",
  "Useful for school teachers, tutors, and coaching teachers",
];

const resourceLinks = [
  { label: "Lesson plan format", href: "/signup" },
  { label: "Lesson plan example", href: "/signup" },
  { label: "5E lesson plan", href: "/signup" },
  { label: "Lesson plan in Hindi", href: "/signup" },
  { label: "Daily lesson plan for teachers", href: "/signup" },
  { label: "Micro teaching lesson plan", href: "/signup" },
  { label: "Lesson plan template", href: "/signup" },
  { label: "Lesson plan PDF", href: "/signup" },
  { label: "Worksheet generator", href: "/signup" },
  { label: "Question paper generator", href: "/signup" },
  { label: "Presentation generator", href: "/signup" },
];

const faqs = [
  {
    question: "What is a lesson plan?",
    answer:
      "A lesson plan is a teacher's classroom guide for a topic or chapter. It usually includes learning objectives, teaching steps, examples, activities, assessment questions, homework, and teacher notes.",
  },
  {
    question: "How to make a lesson plan?",
    answer:
      "Start with the textbook chapter, decide the learning outcomes, choose a lesson plan format, add teaching aids, plan the explanation flow, include an activity, and finish with assessment and homework. TeachPad helps create this structure quickly.",
  },
  {
    question: "Is TeachPad a free lesson plan generator?",
    answer:
      "Yes, teachers can start creating lesson plans on TeachPad for free. Some advanced features, higher generation limits, exports, and saved resources may depend on the selected plan.",
  },
  {
    question: "Can TeachPad create daily lesson plans for teachers?",
    answer:
      "Yes. TeachPad can create daily lesson plans from selected textbook chapters, including classroom flow, activities, questions, and homework.",
  },
  {
    question: "Can I create a 5E lesson plan with TeachPad?",
    answer:
      "Yes. TeachPad can help teachers create a 5E lesson plan with Engage, Explore, Explain, Elaborate, and Evaluate stages.",
  },
  {
    question: "Can TeachPad generate lesson plans in Hindi?",
    answer:
      "Yes. Teachers can create lesson plans in English or Hindi depending on classroom needs and product language support.",
  },
  {
    question: "Can I download a lesson plan PDF?",
    answer:
      "If PDF export is enabled, teachers can download lesson plans as PDF files for school records, printing, or sharing. Teachers can also edit and save their generated lesson plans inside TeachPad based on the available product features.",
  },
  {
    question: "Can TeachPad create worksheets from the same chapter?",
    answer:
      "Yes. TeachPad can help teachers create worksheets, MCQs, notes, question papers, presentations, and activities from the same chapter.",
  },
  {
    question: "Is TeachPad useful for NCERT and JKBOSE teachers?",
    answer:
      "Yes. TeachPad is designed for textbook-based planning, which makes it useful for NCERT, JKBOSE, and other school curriculum needs.",
  },
  {
    question: "What details do I need to enter to generate a lesson plan?",
    answer:
      "Teachers usually need to select or enter board, class, subject, textbook, chapter, topic, duration, language, and teaching preferences.",
  },
];

export function LessonPlanClient() {
  return (
    <>
      <HeroSection />
      <ChapterSection />
      <FormatSection />
      <ProcessSection />
      <ExampleSection />
      <DownloadSection />
      <RelatedToolsSection />
      <CurriculumSection />
      <LinksSection />
      <TrustSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}

function HeroSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_16%_8%,#eef6ff_0,transparent_28%),radial-gradient(circle_at_88%_16%,#f4fbff_0,transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 pb-16 pt-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-8 lg:pb-32 lg:pt-32">
        <motion.div
          initial={prefersReduced ? "visible" : "hidden"}
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-2xl text-center lg:mx-0 lg:text-left"
        >
          <motion.div variants={staggerItem}>
            <Badge icon={Sparkles}>AI Lesson Plan Generator</Badge>
          </motion.div>
          <motion.h1
            variants={staggerItem}
            className="mt-5 text-[40px] font-black leading-[1.05] tracking-tight text-slate-950 min-[390px]:text-[46px] sm:text-6xl lg:text-[72px]"
          >
            AI Lesson Plan Generator for Teachers
          </motion.h1>
          <motion.p
            variants={staggerItem}
            className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:mx-0"
          >
            Create textbook-based lesson plans in seconds. Select your board, class, subject, textbook, chapter, topic, and duration. TeachPad creates a ready-to-use lesson plan with objectives, classroom flow, activities, assessment, homework, and teacher notes.
          </motion.p>
          <motion.div
            variants={staggerItem}
            className="mx-auto mt-7 flex max-w-[460px] flex-col justify-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap lg:mx-0 lg:justify-start"
          >
            <PrimaryLink href="/signup">Create Your Lesson Plan Free</PrimaryLink>
            <SecondaryLink href="#example">View Lesson Plan Example</SecondaryLink>
          </motion.div>
        </motion.div>

        <div className="relative mx-auto w-full max-w-[780px] lg:-mr-10 lg:max-w-none">
          <div className="hero-blob left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
          <ParallaxTilt className="relative z-10" maxDeg={3.5}>
            <motion.div
              initial={prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE_PREMIUM, delay: 0.4 }}
            >
              <div className="hero-float">
                <Image
                  src="/ai-tools/showcase-lesson-plan.png"
                  alt="TeachPad lesson plan generator interface with learning objectives and lesson outline."
                  width={1448}
                  height={1086}
                  priority
                  className="h-auto w-full drop-shadow-[0_34px_54px_rgba(47,79,129,0.18)]"
                />
              </div>
            </motion.div>
          </ParallaxTilt>
        </div>
      </div>
    </section>
  );
}

function ChapterSection() {
  return (
    <section className="mx-auto grid max-w-7xl gap-16 px-5 py-24 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-8 lg:py-36">
      <RevealOnScroll>
        <div>
          <Badge icon={BookOpen}>Textbook chapters</Badge>
          <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Create Lesson Plans from Textbook Chapters
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            TeachPad is a textbook-based lesson plan generator for teachers who want the plan to match the chapter they are teaching. Select the exact curriculum details, and TeachPad prepares a structured classroom plan around that chapter instead of producing a generic document.
          </p>
          <p className="mt-4 text-base leading-8 text-slate-600">
            It helps teachers, tutors, coaching teachers, and academic content creators prepare daily lessons faster while keeping the textbook at the center.
          </p>
        </div>
      </RevealOnScroll>
      
      <StaggerGroup className="grid gap-4 sm:grid-cols-2">
        {chapterPoints.map((point) => (
          <StaggerScaleItem key={point}>
            <Card3DTilt maxTilt={4} className="rounded-2xl border border-slate-200 bg-white p-5 h-full">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
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

function FormatSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="bg-[#f8fbff]">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-24 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-24 lg:px-8 lg:py-36">
        <RevealOnScroll>
          <div className="relative mx-auto w-full max-w-[820px] lg:mx-0 lg:-ml-8 xl:-ml-12">
            <Image
              src="/assets/illustrations/lesson-plan-format.png"
              alt="Teacher planning a lesson with textbook details."
              width={1448}
              height={1086}
              className="marketing-float-slow h-auto w-full drop-shadow-[0_24px_42px_rgba(47,79,129,0.12)]"
            />
          </div>
        </RevealOnScroll>
        
        <RevealOnScroll delay={0.1}>
          <div>
            <Badge icon={Layers3}>Lesson plan format</Badge>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Choose the Right Lesson Plan Format
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              A clear lesson plan format helps teachers enter the classroom prepared. TeachPad can support daily lesson plan for teachers, 5E lesson plan and 5E model lesson plan structures, micro teaching lesson plan practice, English lesson plan preparation, lesson plan in Hindi, and primary school lesson plan format needs.
            </p>
            <motion.div
              initial={prefersReduced ? "visible" : "hidden"}
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={checklistContainer}
              className="mt-7 grid gap-3 sm:grid-cols-2"
            >
              {formatItems.map((item) => (
                <motion.div
                  key={item}
                  variants={checklistItem}
                  className="flex items-start gap-3 rounded-xl bg-white p-3 text-sm font-semibold leading-6 text-slate-700 shadow-sm"
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-600 text-white">
                    <AnimatedCheckmark className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
      <RevealOnScroll>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">How it works</p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            How TeachPad Creates a Lesson Plan
          </h2>
        </div>
      </RevealOnScroll>
      
      <StaggerGroup className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {processSteps.map((step, index) => (
          <StaggerScaleItem key={step.title}>
            <Card3DTilt maxTilt={5} className="rounded-2xl border border-slate-200 bg-white p-5 h-full">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-sm font-black text-white">{index + 1}</span>
              <h3 className="mt-5 text-lg font-black text-slate-950">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{step.text}</p>
            </Card3DTilt>
          </StaggerScaleItem>
        ))}
      </StaggerGroup>
    </section>
  );
}

function ExampleSection() {
  return (
    <section id="example" className="bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)]">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-24 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24 lg:px-8 lg:py-36">
        <RevealOnScroll>
          <div>
            <Badge icon={FileText}>Lesson plan example</Badge>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Example Lesson Plan Output
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Teachers can review the generated plan, adjust the wording, add school-specific details, and use it as an editable lesson plan template for daily teaching.
            </p>
          </div>
        </RevealOnScroll>
        
        <RevealOnScroll delay={0.15}>
          <div className="relative overflow-hidden">
            <Image
              src="/assets/illustrations/lesson-plan-output-preview-v2.png"
              alt="Generated lesson plan output preview."
              width={1466}
              height={1528}
              className="h-auto w-full [mask-image:linear-gradient(180deg,#000_0%,#000_78%,rgba(0,0,0,0.68)_88%,transparent_100%)]"
            />
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

function DownloadSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
      <RevealOnScroll>
        <div className="grid items-center gap-12 rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:grid-cols-[1fr_0.8fr] md:p-16 lg:p-20">
          <div>
            <Badge icon={Download}>Save and export</Badge>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Download, Edit, and Save Lesson Plans
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              TeachPad creates editable lesson plans that teachers can review, customize, and use for classroom teaching or school records. You can adjust the wording, add your own teaching notes, and prepare the plan in a format that fits your school requirements.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Use your generated plan as a lesson plan template, a lesson plan example, or a daily teaching record. If PDF export is enabled in your TeachPad setup, teachers can also download the final lesson plan as a PDF for easy sharing and printing.
            </p>
            <div className="mt-8">
              <a
                href="/assets/pdfs/sample-lesson-plan-photosynthesis.pdf"
                download="sample-lesson-plan-photosynthesis.pdf"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-black text-white shadow-[0_18px_36px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 hover:bg-blue-700"
                style={{
                  transition: "transform var(--duration-micro) var(--ease-premium), background-color var(--duration-micro) var(--ease-premium), box-shadow var(--duration-micro) var(--ease-premium)"
                }}
              >
                Download Lesson Plan PDF
                <Download className="h-4 w-4" />
              </a>
            </div>
          </div>
          <Image
            src="/ai-tools/showcase-lesson-plan.png"
            alt="Editable lesson plan preview."
            width={1448}
            height={1086}
            className="marketing-float-slow mx-auto h-auto w-full max-w-xl"
          />
        </div>
      </RevealOnScroll>
    </section>
  );
}

function RelatedToolsSection() {
  return (
    <section className="bg-[#f8fbff]">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
        <RevealOnScroll>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Related teacher tools</p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Support your lesson plan with matching resources.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              These tools support the lesson plan, but the main focus of this page is lesson planning from textbook chapters.
            </p>
          </div>
        </RevealOnScroll>
        
        <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {relatedTools.map((tool) => (
            <StaggerScaleItem key={tool.title}>
              <Card3DTilt maxTilt={4} className="rounded-2xl border border-slate-200 bg-white p-5 h-full flex flex-col">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <tool.Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-black text-slate-950">{tool.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{tool.text}</p>
                <Link
                  href={tool.href}
                  className="mt-auto pt-5 inline-flex items-center gap-1.5 text-sm font-black text-blue-600 hover:text-blue-700"
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

function CurriculumSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-24 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24 lg:px-8 lg:py-36">
      <RevealOnScroll>
        <div>
          <Badge icon={School}>Curriculum grounding</Badge>
          <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Syllabus Aligned Classroom Planning
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            School coordinators and principles use TeachPad to keep lessons consistent across sections. By selecting the textbook, teachers generate plans that follow the chapter sequence, exercises, and examples.
          </p>
          <motion.ul
            initial={prefersReduced ? "visible" : "hidden"}
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={checklistContainer}
            className="mt-7 space-y-4"
          >
            {classroomPlanningPoints.map((point) => (
              <motion.li
                key={point}
                variants={checklistItem}
                className="flex items-start gap-3 text-sm font-semibold text-slate-700"
              >
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600">
                  <AnimatedCheckmark className="h-3.5 w-3.5" />
                </span>
                {point}
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </RevealOnScroll>
      
      <RevealOnScroll delay={0.15}>
        <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none">
          <Image
            src="/landing/school-3d-v2.png"
            alt="Curriculum aligned school planning."
            width={1600}
            height={900}
            className="marketing-float-slow h-auto w-full drop-shadow-[0_24px_42px_rgba(47,79,129,0.12)]"
          />
        </div>
      </RevealOnScroll>
    </section>
  );
}

function LinksSection() {
  return (
    <section className="bg-[#f8fbff] py-10">
      <RevealOnScroll>
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {resourceLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs font-bold text-slate-500 hover:text-blue-600 transition"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36 text-center">
      <RevealOnScroll>
        <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
          Practical Planning, Not Just Theories
        </h2>
        <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-600">
          We know teachers have tight schedules. TeachPad is built to produce lesson plans that work in actual classrooms, with realistic timings, simple activities, and clear syllabus grounding.
        </p>
      </RevealOnScroll>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36 bg-white">
      <RevealOnScroll>
        <h2 className="text-center text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
          Frequently Asked Questions
        </h2>
      </RevealOnScroll>
      
      <StaggerGroup className="mt-10 grid gap-4 max-w-4xl mx-auto">
        {faqs.map((faq) => (
          <StaggerFadeItem key={faq.question}>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
              <h3 className="text-lg font-black text-slate-950">{faq.question}</h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{faq.answer}</p>
            </article>
          </StaggerFadeItem>
        ))}
      </StaggerGroup>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)]">
      <RevealOnScroll>
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-24 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:gap-24 lg:px-8 lg:py-36">
          <div className="text-center lg:text-left">
            <h2 className="mx-auto max-w-2xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:mx-0">
              Start with your textbook. Create your lesson plan today.
            </h2>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-black text-white shadow-[0_18px_36px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 hover:bg-blue-700"
                style={{
                  transition: "transform var(--duration-micro) var(--ease-premium), background-color var(--duration-micro) var(--ease-premium), box-shadow var(--duration-micro) var(--ease-premium)"
                }}
              >
                Create Lesson Plan Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600"
                style={{
                  transition: "transform var(--duration-micro) var(--ease-premium), border-color var(--duration-micro) var(--ease-premium), color var(--duration-micro) var(--ease-premium), box-shadow var(--duration-micro) var(--ease-premium)"
                }}
              >
                Book a School Demo
              </Link>
            </div>
          </div>
          <Image
            src="/landing/backpack-globe-v2.png"
            alt="Backpack, globe, books, and stationery illustration"
            width={1600}
            height={900}
            className="marketing-float-slow mx-auto h-auto w-full max-w-xl"
          />
        </div>
      </RevealOnScroll>
    </section>
  );
}

// Helper components
function Badge({ children, icon: Icon }: { children: React.ReactNode; icon: any }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]">
      <Icon className="h-4 w-4" />
      {children}
    </span>
  );
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-black text-white shadow-[0_18px_36px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 hover:bg-blue-700"
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
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600"
      style={{
        transition: "transform var(--duration-micro) var(--ease-premium), border-color var(--duration-micro) var(--ease-premium), color var(--duration-micro) var(--ease-premium), box-shadow var(--duration-micro) var(--ease-premium)"
      }}
    >
      {children}
    </Link>
  );
}
