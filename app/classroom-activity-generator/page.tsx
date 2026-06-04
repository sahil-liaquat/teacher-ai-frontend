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
  Sparkles,
  Users
} from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";

const pageTitle = "AI Classroom Activity Generator for Teachers | TeachPad";
const pageDescription =
  "Create classroom activities in seconds with TeachPad's AI Activity Generator. Generate warm-ups, group tasks, discussions, exit tickets, and activity ideas.";
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
    description: "Create warm-ups, group activities, discussions, exit tickets, and classroom activity ideas in seconds with TeachPad.",
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
    description: "Create classroom activities and engagement tasks in seconds with TeachPad.",
    images: [previewImage]
  }
};

const faqs = [
  {
    question: "What is an AI classroom activity generator?",
    answer:
      "An AI classroom activity generator helps teachers create activity ideas, group tasks, warm-ups, discussions, exit tickets, hands-on tasks, and engagement activities for a lesson topic or textbook chapter."
  },
  {
    question: "How does TeachPad create classroom activities?",
    answer:
      "Teachers select the board, class, subject, textbook, chapter, topic, activity type, duration, group size, materials, difficulty level, and language. TeachPad then creates a structured classroom activity based on those inputs."
  },
  {
    question: "Is TeachPad a free classroom activity generator?",
    answer:
      "Teachers can start creating classroom activities on TeachPad for free. Some advanced features, higher usage limits, exports, and saved resources may depend on the selected plan."
  },
  {
    question: "Can TeachPad create warm-up activities?",
    answer:
      "Yes. TeachPad can help teachers create warm-up activities to introduce a topic and prepare students for the lesson."
  },
  {
    question: "Can TeachPad create exit ticket activities?",
    answer:
      "Yes. TeachPad can create short exit ticket activities to check student understanding before the class ends."
  },
  {
    question: "Can TeachPad create group activities?",
    answer:
      "Yes. TeachPad can create group activities with instructions, discussion questions, and teacher guidance."
  },
  {
    question: "Can TeachPad create hands-on activities?",
    answer:
      "Yes. TeachPad can suggest hands-on activities depending on the selected topic, class level, available materials, and classroom needs."
  },
  {
    question: "Can TeachPad create activities from NCERT chapters?",
    answer:
      "Yes. TeachPad is designed for textbook-based activity creation, which makes it useful for NCERT, JKBOSE, and other curriculum-based classroom needs."
  },
  {
    question: "Can I edit the activity after it is generated?",
    answer:
      "Yes. Teachers should be able to review, edit, and customize generated classroom activities before using them in class."
  },
  {
    question: "Can TeachPad create activities in Hindi?",
    answer:
      "TeachPad can support classroom activity creation in English or Hindi depending on the available product language settings."
  },
  {
    question: "Can TeachPad create activities for lesson plans?",
    answer:
      "Yes. Teachers can use generated activities inside lesson plans, classroom discussions, group tasks, revision sessions, and assessment moments."
  },
  {
    question: "Can TeachPad suggest materials for classroom activities?",
    answer:
      "Yes. TeachPad can suggest simple materials needed for activities based on the topic, activity type, and classroom setup."
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

const chapterPoints = [
  "Select board/curriculum, class, subject, textbook, and chapter.",
  "Enter topic, activity type, duration, group size, and available materials.",
  "Generate activities aligned with the chapter topic.",
  "Create warm-up, group, discussion, hands-on, recap, and assessment activities.",
  "Avoid starting from a blank activity idea.",
  "Useful for school teachers, tutors, coaching teachers, and academic content creators."
];

const includeCards = [
  ["Activity Objective", "A clear learning goal for the classroom task."],
  ["Materials Needed", "List simple materials required for the activity."],
  ["Time Required", "Plan activities based on available class time."],
  ["Group Setup", "Suggest individual, pair, group, or whole-class formats."],
  ["Teacher Instructions", "Step-by-step instructions for running the activity."],
  ["Student Instructions", "Simple instructions students can follow easily."],
  ["Discussion Questions", "Add questions to guide classroom thinking and participation."],
  ["Quick Assessment", "Include a short check to see what students understood."]
];

const activityTypes = [
  ["Warm-Up Activity", "Introduce the topic and activate prior knowledge."],
  ["Group Activity", "Let students work together on a focused task."],
  ["Hands-On Activity", "Use simple materials for active learning."],
  ["Discussion Activity", "Guide students through classroom conversation."],
  ["Role-Play Activity", "Help students understand ideas through roles."],
  ["Think-Pair-Share Activity", "Give students time to think, discuss, and share."],
  ["Exit Ticket Activity", "Check understanding before the class ends."],
  ["Recap Activity", "Review the main ideas at the end of a lesson."],
  ["Classroom Game", "Make revision or practice more engaging."],
  ["Quick Assessment Activity", "Check learning with a short classroom task."]
];

const processSteps = [
  {
    title: "Choose your textbook chapter",
    text: "Select the board, class, subject, textbook, and chapter."
  },
  {
    title: "Add activity details",
    text: "Enter the topic, activity type, duration, group size, materials, difficulty level, and language."
  },
  {
    title: "Generate a structured activity",
    text: "TeachPad creates objective, instructions, materials, classroom steps, discussion prompts, and assessment."
  },
  {
    title: "Edit, save, and use in class",
    text: "Review the activity, adjust instructions, and use it for classroom engagement."
  }
];

const relatedTools = [
  {
    title: "Lesson Plan Generator",
    text: "Add the generated activity inside a complete lesson plan.",
    cta: "Create Lesson Plan",
    href: "/lesson-plan-generator",
    Icon: FileText
  },
  {
    title: "Worksheet Generator",
    text: "Create practice worksheets after the activity.",
    cta: "Create Worksheet",
    href: "/worksheet-generator",
    Icon: ClipboardList
  },
  {
    title: "MCQ Generator",
    text: "Generate quick questions to check activity learning.",
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
    text: "Create short notes before or after the activity.",
    cta: "Generate Notes",
    href: "/notes-generator",
    Icon: NotebookPen
  },
  {
    title: "Presentation Generator",
    text: "Create slides to introduce the activity topic.",
    cta: "Create Presentation",
    href: "/presentation-generator",
    Icon: Presentation
  }
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
  { label: "Hindi activity generator", href: "/signup" }
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
  { label: "Presentation generator", href: "/presentation-generator" }
];

export default function ClassroomActivityGeneratorPage() {
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
      <MarketingFooter />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_16%_8%,#fff7ed_0,transparent_30%),radial-gradient(circle_at_88%_16%,#f4fbff_0,transparent_34%),linear-gradient(180deg,#ffffff_0%,#fffaf4_100%)]">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 pb-10 pt-9 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:pb-16 lg:pt-14">
        <div className="relative z-10 mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
          <Badge icon={Sparkles}>AI Classroom Activity Generator</Badge>
          <h1 className="mt-5 text-[40px] font-black leading-[1.05] tracking-tight text-slate-950 min-[390px]:text-[46px] sm:text-6xl lg:text-[72px]">
            AI Classroom Activity Generator for Teachers
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:mx-0">
            Create textbook-based classroom activities in seconds. Select your board, class, subject, textbook, chapter, topic, activity type, duration, group size, and language. TeachPad creates ready-to-use activities for warm-ups, group work, discussion, hands-on learning, recap, and student engagement.
          </p>
          <div className="mx-auto mt-7 flex max-w-[460px] flex-col justify-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap lg:mx-0 lg:justify-start">
            <PrimaryLink href="/signup">Create Activity Free</PrimaryLink>
            <SecondaryLink href="#example">View Activity Example</SecondaryLink>
          </div>
        </div>

        <ActivityPreview />
      </div>
    </section>
  );
}

function ActivityPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[760px] lg:-mr-8 lg:max-w-none">
      <Image
        src="/ai-tools/showcase-activity.png"
        alt="Editable classroom activity preview."
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
          Create Activities from Textbook Chapters
        </h2>
        <p className="mt-5 text-base leading-8 text-slate-600">
          TeachPad works as a classroom activity generator for teachers who want activities connected to the exact chapter they are teaching. Use it as an activity generator for teachers, teaching activity generator, or lesson activity generator when you need textbook-based activities for real classroom use.
        </p>
        <p className="mt-4 text-base leading-8 text-slate-600">
          It helps school teachers, tutors, coaching teachers, and academic content creators prepare chapter-based warm-ups, group tasks, discussions, hands-on tasks, recap activities, and quick assessment activities.
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
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Activity plan</p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            What TeachPad Can Include in an Activity
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            Create classroom activities with learning goals, materials, group setup, teacher steps, student instructions, discussion prompts, and quick assessment.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {includeCards.map(([title, text]) => (
            <article key={title} className="rounded-2xl border border-orange-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-orange-600">
                <Puzzle className="h-5 w-5" />
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

function ActivityTypeSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Activity types</p>
        <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
          Choose the Right Classroom Activity Type
        </h2>
        <p className="mt-5 text-base leading-8 text-slate-600">
          Teachers need different activity types for different classroom goals. TeachPad can help create warm-up activities, group activities, hands-on activities, discussion activities, exit tickets, classroom games, and quick assessment tasks.
        </p>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {activityTypes.map(([title, text]) => (
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
            How TeachPad Creates a Classroom Activity
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
      <div className="mx-auto grid max-w-7xl items-start gap-10 px-5 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:py-20">
        <div>
          <Badge icon={Users}>Activity example</Badge>
          <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Example Classroom Activity Output
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            Review a complete activity plan with objective, materials, teacher steps, student task, discussion questions, and quick assessment.
          </p>
        </div>
        <div className="relative overflow-hidden">
          <Image
            src="/assets/illustrations/activity-output-preview.png"
            alt="Generated classroom activity output preview."
            width={991}
            height={933}
            className="h-auto w-full [mask-image:linear-gradient(180deg,#000_0%,#000_78%,rgba(0,0,0,0.68)_88%,transparent_100%)]"
          />
        </div>
      </div>
    </section>
  );
}

function WarmUpExitSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="grid items-center gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:grid-cols-[1fr_0.85fr] md:p-10">
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
          {["Topic warm-up", "Quick group discussion", "Exit ticket check", "Student engagement task"].map((item) => (
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
    </section>
  );
}

function CurriculumSection() {
  return (
    <section className="bg-[linear-gradient(180deg,#ffffff_0%,#fffaf4_100%)]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
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
            Support your activity with matching resources.
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            These tools support activity-based teaching, but the main focus of this page is creating classroom activities from textbook chapters.
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
