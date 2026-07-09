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
  Users,
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
  "Choose group size, activity duration, and activity type.",
  "Generate explanation and active learning tasks from the chapter flow.",
  "Create warm-ups, exit tickets, and team discussion prompts.",
  "Avoid starting student collaboration tasks from a blank sheet.",
  "Useful for school teachers, tutors, coaching teachers, and academic content creators.",
];

const includeCards = [
  [
    "Clear Learning Goals",
    "Specific learning outcomes and curriculum objectives for the activity.",
  ],
  [
    "Required Materials",
    "Complete list of teaching aids, worksheets, and resources needed.",
  ],
  [
    "Teacher Setup Steps",
    "Preparation details, grouping instructions, and step-by-step teacher prompts.",
  ],
  [
    "Student Task Guide",
    "Clear instructions, task details, and questions for active student learning.",
  ],
] as const;

const activityTypes = [
  [
    "Warm-Up Activity",
    "Short 5-10 minute task to introduce the topic and check previous knowledge.",
  ],
  [
    "Group Activity",
    "Collaborative classroom tasks with defined roles and student steps.",
  ],
  [
    "Hands-On Activity",
    "Practical tasks, experiments, and exercises grounded in chapter topics.",
  ],
  [
    "Discussion Activity",
    "Active debate prompts, think-pair-share ideas, and discussion questions.",
  ],
  [
    "Exit Ticket",
    "Quick recap tasks to assess chapter understanding at the end of class.",
  ],
] as const;

const processSteps = [
  {
    title: "Choose your textbook chapter",
    text: "Select the board, class, subject, textbook, and chapter.",
  },
  {
    title: "Choose activity settings",
    text: "Select activity type, duration, group size, and language.",
  },
  {
    title: "Generate structured plan",
    text: "TeachPad creates objectives, steps, and active prompts based on the chapter.",
  },
  {
    title: "Edit, save, and download",
    text: "Review the activity plan, edit steps, add custom questions, and prepare it for classroom teaching.",
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
    text: "Turn the chapter into tests and assessment papers.",
    cta: "Create Question Paper",
    href: "/signup",
    Icon: FileQuestion,
  },
  {
    title: "Notes Generator",
    text: "Create short notes before or after the activity.",
    cta: "Generate Notes",
    href: "/notes-generator",
    Icon: NotebookPen,
  },
  {
    title: "Presentation Generator",
    text: "Create slides to introduce the activity topic.",
    cta: "Create Presentation",
    href: "/presentation-generator",
    Icon: Presentation,
  },
];

const popularLinks = [
  { label: "Warm-up activity generator", href: "/signup" },
  { label: "Exit ticket generator", href: "/signup" },
  { label: "Group activity generator", href: "/signup" },
  { label: "Hands-on activity generator", href: "/signup" },
  { label: "Discussion activity generator", href: "/signup" },
  { label: "Think-pair-share activity", href: "/signup" },
  { label: "Role-play activity generator", href: "/signup" },
  { label: "Classroom game generator", href: "/signup" },
  { label: "Student engagement activity generator", href: "/signup" },
  { label: "Science activity generator", href: "/signup" },
  { label: "Maths activity generator", href: "/signup" },
  { label: "English activity generator", href: "/signup" },
  { label: "Hindi activity generator", href: "/signup" },
];

const resourceLinks = [
  { label: "Classroom activities for teachers", href: "/signup" },
  { label: "Activity ideas for teachers", href: "/signup" },
  { label: "Lesson activity generator", href: "/signup" },
  { label: "Warm-up activity generator", href: "/signup" },
  { label: "Exit ticket generator", href: "/signup" },
  { label: "Group activity generator", href: "/signup" },
  { label: "Hands-on activity generator", href: "/signup" },
  { label: "Classroom game generator", href: "/signup" },
  { label: "Lesson plan generator", href: "/lesson-plan-generator" },
  { label: "Worksheet generator", href: "/worksheet-generator" },
  { label: "Presentation generator", href: "/presentation-generator" },
];

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



export function ActivityClient() {
  return (
    <>
      <HeroSection />
      <ChapterSection />
      <IncludeSection />
      <ActivityTypeSection />
      <ProcessSection />
      <ExampleSection />
      <WarmUpExitSection />
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
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_16%_8%,#fff7ed_0,transparent_30%),radial-gradient(circle_at_88%_16%,#f4fbff_0,transparent_34%),linear-gradient(180deg,#ffffff_0%,#fffaf4_100%)]">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 pb-16 pt-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-8 lg:pb-32 lg:pt-32">
        <HeroStagger className="relative z-10 mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
          <HeroStaggerItem>
            <Badge icon={Sparkles}>AI Classroom Activity Generator</Badge>
          </HeroStaggerItem>
          <HeroStaggerItem>
            <h1 className="mt-5 text-[40px] font-black leading-[1.05] tracking-tight text-slate-950 min-[390px]:text-[46px] sm:text-6xl lg:text-[72px]">
              AI Classroom Activity Generator for Teachers
            </h1>
          </HeroStaggerItem>
          <HeroStaggerItem>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:mx-0">
              Create textbook-based classroom activities in seconds. Select your board, class, subject, textbook, chapter, topic, activity type, duration, group size, and language. TeachPad creates ready-to-use activities for warm-ups, group work, discussion, hands-on learning, recap, and student engagement.
            </p>
          </HeroStaggerItem>
          <HeroStaggerItem>
            <div className="mx-auto mt-7 flex max-w-[460px] flex-col justify-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap lg:mx-0 lg:justify-start">
              <PrimaryLink href="/signup">Create Activity Free</PrimaryLink>
              <SecondaryLink href="#example">View Activity Example</SecondaryLink>
            </div>
          </HeroStaggerItem>
        </HeroStagger>

        <ActivityPreview />
      </div>
    </section>
  );
}

function ActivityPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[760px] lg:-mr-8 lg:max-w-none">
      <div className="hero-blob left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
      <ParallaxTilt className="relative z-10" maxDeg={3.5}>
        <div className="hero-float">
          <Image
            src="/ai-tools/showcase-activity.png"
            alt="Editable classroom activity preview."
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
            Create Activities from Textbook Chapters
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            TeachPad works as a classroom activity generator for teachers who want activities connected to the exact chapter they are teaching. Use it as an activity generator for teachers, teaching activity generator, or lesson activity generator when you need textbook-based activities for real classroom use.
          </p>
          <p className="mt-4 text-base leading-8 text-slate-600">
            It helps school teachers, tutors, coaching teachers, and academic content creators prepare chapter-based warm-ups, group tasks, discussions, hands-on tasks, recap activities, and quick assessment activities.
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
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Activity plan</p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              What TeachPad Can Include in an Activity
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Create classroom activities with learning goals, materials, group setup, teacher steps, student instructions, discussion prompts, and quick assessment.
            </p>
          </div>
        </RevealOnScroll>
        
        <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {includeCards.map(([title, text]) => (
            <StaggerScaleItem key={title}>
              <Card3DTilt maxTilt={5} className="rounded-2xl border border-orange-100 bg-white p-5 h-full">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-orange-600">
                  <Puzzle className="h-5 w-5" />
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

function ActivityTypeSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
      <RevealOnScroll>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Activity types</p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Choose the Right Classroom Activity Type
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            Teachers need different activity types for different classroom goals. TeachPad can help create warm-up activities, group activities, hands-on activities, discussion activities, exit tickets, classroom games, and quick assessment tasks.
          </p>
        </div>
      </RevealOnScroll>
      
      <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {activityTypes.map(([title, text]) => (
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
              How TeachPad Creates a Classroom Activity
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
      <div className="mx-auto grid max-w-7xl items-start gap-16 px-5 py-24 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24 lg:px-8 lg:py-36">
        <RevealOnScroll>
          <div>
            <Badge icon={Users}>Activity example</Badge>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Example Classroom Activity Output
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Review a complete activity plan with objective, materials, teacher steps, student task, discussion questions, and quick assessment.
            </p>
          </div>
        </RevealOnScroll>
        
        <RevealOnScroll delay={0.15}>
          <div className="relative overflow-hidden">
            <Image
              src="/assets/illustrations/activity-output-preview.png"
              alt="Generated classroom activity output preview."
              width={991}
              height={933}
              className="h-auto w-full [mask-image:linear-gradient(180deg,#000_0%,#000_78%,rgba(0,0,0,0.68)_88%,transparent_100%)]"
            />
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

function WarmUpExitSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
      <RevealOnScroll>
        <div className="grid items-center gap-12 rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:grid-cols-[1fr_0.85fr] md:p-16 lg:p-20">
          <div>
            <Badge icon={HelpCircle}>Daily teaching</Badge>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Create Warm-Up and Exit Ticket Activities
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              TeachPad can help teachers create short classroom activities that fit into daily teaching. Use warm-up activities to introduce a topic, and exit ticket activities to check what students understood before the class ends.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Use it as a warm-up activity generator, exit ticket generator, quick classroom activities helper, student engagement activities planner, or activity for lesson plan support.
            </p>
          </div>
          <div className="rounded-3xl bg-[#fffaf4] p-5">
            {["Topic warm-up", "Quick group discussion", "Exit ticket check", "Student engagement task"].map((item, index) => (
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
              Download, Edit, and Save Classroom Activities
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              TeachPad creates editable classroom activities that teachers can review, customize, and use for teaching, revision, discussion, or student engagement. You can adjust the activity steps, add your own examples, change the group size, and prepare the activity for your classroom situation.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Use your generated activity as a warm-up task, group activity, discussion activity, recap task, or lesson plan activity. If export is enabled in TeachPad, teachers can save or download the activity for classroom use.
            </p>
            <div className="mt-8">
              <PrimaryLink href="/signup">Create Activity Free</PrimaryLink>
            </div>
          </div>
          <Image
            src="/ai-tools/showcase-activity.png"
            alt="Editable classroom activity preview."
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
    <section className="bg-[linear-gradient(180deg,#ffffff_0%,#fffaf4_100%)]">
      <RevealOnScroll>
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-24 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-8 lg:py-36">
          <div>
            <Badge icon={School}>Indian classrooms</Badge>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Built for NCERT, JKBOSE, and School Curriculum
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              TeachPad supports textbook-based activities for Indian classrooms. It can be useful as an NCERT activity generator, JKBOSE activity generator, and activity generator for Indian teachers because teachers start with the school curriculum, selected textbook, and chapter topic.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Teachers can prepare chapter-based activities for warm-ups, group work, discussion, hands-on learning, recap, and quick assessment while keeping the task aligned with what students are studying.
            </p>
          </div>
          <Image
            src="/assets/illustrations/create-activity-header.png"
            alt="Textbook-based classroom activity planning illustration."
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
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Related teacher tools</p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Support your activity with matching resources.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              These tools support activity-based teaching, but the main focus of this page is creating classroom activities from textbook chapters.
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
            title="Popular Classroom Activities Teachers Create"
            text="Explore classroom activity ideas teachers can use for topic introduction, group work, revision, discussion, and quick assessment."
            links={popularLinks}
          />
          <LinkPanel
            title="Explore More Activity Resources"
            text="Explore warm-up activities, group activities, hands-on tasks, discussion prompts, exit tickets, and classroom games for daily teaching."
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
              Create a classroom activity from your textbook chapter in seconds.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              Choose the class, subject, topic, or chapter you are teaching and let TeachPad prepare a classroom activity with objectives, materials, teacher steps, student tasks, discussion questions, and quick assessment.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <PrimaryLink href="/signup">Create Activity Free</PrimaryLink>
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
