import type { LucideIcon } from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import {
  ArrowRight,
  BookOpen,
  Check,
  CirclePlay,
  Clock3,
  GraduationCap,
  Play,
  School,
  Sparkles,
  Star,
  WandSparkles
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const tools = [
  {
    title: "Lesson Planner",
    description: "Create structured lesson plans from your selected textbook chapter, including objectives, activities, assessment, homework, and teacher notes.",
    image: "/landing/lesson-planner-3d-v2.png",
    accent: "blue"
  },
  {
    title: "Worksheet Generator",
    description: "Generate chapter-based worksheets with questions that match the topic, class level, and textbook content.",
    image: "/landing/worksheet-3d-v2.png",
    accent: "green"
  },
  {
    title: "Presentation Generator",
    description: "Turn textbook concepts into clean classroom presentations that help students understand the lesson visually.",
    image: "/landing/presentation-3d-v2.png",
    accent: "purple"
  },
  {
    title: "Live Quiz Generator",
    description: "Create quick quizzes from the chapter to check understanding during class or after teaching.",
    image: "/landing/live-quiz-3d-v2.png",
    accent: "orange"
  }
];

const textbookPoints = [
  "Uses the selected board or curriculum",
  "Uses the selected class, subject, textbook, and chapter",
  "Follows chapter flow, key concepts, examples, and exercises",
  "Creates more accurate, syllabus-aligned classroom content"
];

const steps = [
  {
    title: "Select your textbook",
    description: "Choose the board, class, subject, book, and chapter you want to teach.",
    image: "/assets/illustrations/textbook-library-header.png",
    Icon: BookOpen
  },
  {
    title: "Choose what you want to create",
    description: "Pick a lesson plan, worksheet, presentation, notes, classroom activity, or quiz.",
    image: "/ai-tools/tool-icons.png",
    Icon: WandSparkles
  },
  {
    title: "Review, edit, and use",
    description: "TeachPad generates from the chapter, then you can customize, save, download, or use it directly in class.",
    image: "/landing/beautiful-content-lesson-plan.png",
    Icon: GraduationCap
  }
];

const contentPoints = [
  "Clear headings and sections",
  "Editable, download-ready output",
  "Saved resource library"
];

const schoolBenefits = [
  "Reducing teacher planning time",
  "Maintaining syllabus and chapter alignment",
  "Improving consistency across classes",
  "Creating reusable teaching resources"
];

export default function HomePage() {
  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-white text-[#07111f]">
      <MarketingHeader active="home" />
      <HeroSection />
      <ToolsSection />
      <TextbookSection />
      <HowItWorksSection />
      <BeautifulContentSection />
      <ForSchoolsSection />
      <ResultsSection />
      <FinalCtaSection />
      <MarketingFooter />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative bg-[radial-gradient(circle_at_16%_10%,#eef6ff_0,transparent_30%),radial-gradient(circle_at_90%_12%,#f5fbff_0,transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-5 pb-10 pt-9 text-center sm:px-6 md:pb-16 lg:px-8 lg:pb-20 lg:pt-14">
        <div className="relative z-10 flex w-full max-w-5xl flex-col items-center">
          <h1 className="max-w-full text-[38px] font-black leading-[1.05] tracking-tight text-slate-950 min-[390px]:text-[42px] sm:text-6xl lg:text-[72px]">
            Teach from your <span className="text-blue-600">textbook.</span>
            <br />
            Let AI do the <span className="text-blue-600">preparation.</span>
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">
            TeachPad helps teachers create lesson plans, worksheets, presentations, notes, activities, and quizzes directly from the textbook chapter they are teaching.
          </p>

          <div className="mt-7 flex w-full max-w-[420px] flex-col justify-center gap-3 sm:mt-8 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <PrimaryLink href="/signup">Start Creating Free</PrimaryLink>
            <Link
              href="#features"
              className="inline-flex h-12 items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-5 text-sm font-bold text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-50 text-blue-600">
                <Play className="ml-0.5 h-4 w-4 fill-current" />
              </span>
              See How It Works
            </Link>
          </div>
        </div>

        <div className="relative z-0 mx-auto mt-8 w-full max-w-7xl sm:mt-10 lg:mt-8">
          <Image
            src="/landing/teachpad-main-hero-centered.png"
            alt="TeachPad dashboard showing textbook-based lesson planning, worksheet generation, notes, presentations, and classroom activities."
            width={1672}
            height={941}
            priority
            className="mx-auto h-auto w-full drop-shadow-[0_34px_54px_rgba(47,79,129,0.18)]"
          />
        </div>
      </div>
    </section>
  );
}

function ToolsSection() {
  return (
    <section id="features" className="mx-auto w-full max-w-7xl overflow-hidden px-5 py-14 sm:px-6 lg:px-8 lg:py-24">
      <SectionHeading
        eyebrow="AI tools"
        title={
          <>
            <span className="text-blue-600">One textbook.</span> Many classroom resources.
          </>
        }
      />
      <div className="mx-auto mt-10 grid w-full max-w-[350px] min-w-0 gap-8 sm:max-w-none sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((tool) => (
          <article
            key={tool.title}
            className="group min-w-0 text-center transition duration-300 hover:-translate-y-2"
          >
            <div className="grid h-[180px] place-items-center overflow-visible sm:h-[230px]">
              <Image src={tool.image} alt="" width={380} height={380} className="h-44 w-44 object-contain drop-shadow-[0_22px_38px_rgba(47,79,129,0.12)] transition duration-300 group-hover:scale-105 sm:h-60 sm:w-60" />
            </div>
            <h3 className="mt-4 text-xl font-black text-slate-950 sm:mt-5">{tool.title}</h3>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-600">{tool.description}</p>
          </article>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <PrimaryLink href="/ai-tools">View All Tools</PrimaryLink>
      </div>
    </section>
  );
}

function TextbookSection() {
  return (
    <section id="textbook-grounded" className="bg-gradient-to-b from-white to-[#f7fbff]">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-16">
        <div>
          <Badge icon={BookOpen}>Textbook grounded</Badge>
          <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            The textbook is the source.
            <br />
            AI is only the <span className="text-blue-600">assistant.</span>
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
            TeachPad uses the selected textbook chapter as the foundation before generating any classroom material, so the output is created from the book your school actually follows.
          </p>
          <ul className="mt-7 space-y-4">
            {textbookPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm font-semibold text-slate-700">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-[520px] lg:-mr-12 lg:max-w-none">
          <Image
            src="/landing/textbook-grounded-v2.png"
            alt="Open textbook with textbook analysis checklist"
            width={1500}
            height={1030}
            className="h-auto w-full drop-shadow-[0_26px_44px_rgba(47,79,129,0.12)]"
          />
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-16">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              From textbook to teaching material in <span className="text-blue-600">seconds.</span>
            </>
          }
        />
        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          {steps.map((step, index) => (
            <article key={step.title} className="group text-center transition duration-300 hover:-translate-y-2">
              <div className="relative grid min-h-[230px] place-items-center sm:min-h-[280px] lg:min-h-[320px]">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-sm font-black text-white">{index + 1}</span>
                <Image src={step.image} alt="" width={360} height={360} className="h-48 w-48 object-contain drop-shadow-[0_24px_42px_rgba(47,79,129,0.14)] transition duration-300 group-hover:scale-105 sm:h-64 sm:w-64 lg:h-72 lg:w-72" />
              </div>
              <div className="mt-5 flex items-center justify-center gap-2 text-blue-600">
                <step.Icon className="h-5 w-5" />
                <h3 className="text-lg font-black text-slate-950">{step.title}</h3>
              </div>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-600">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BeautifulContentSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
      <div className="grid items-center gap-6 overflow-hidden rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.07)] sm:gap-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10">
        <div className="-mx-5 -mb-8 sm:-mx-8 lg:-ml-10 lg:-mr-2">
          <Image
            src="/landing/output-quality-presentation.png"
            alt="Lesson plan editor interface mockup"
            width={1448}
            height={1086}
            className="h-auto w-full translate-y-5 drop-shadow-[0_24px_42px_rgba(47,79,129,0.12)]"
          />
        </div>

        <div>
          <Badge icon={Sparkles}>Output quality</Badge>
          <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Beautiful content.
            <br />
            Every time.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-8 text-slate-600">
            TeachPad outputs are designed for real teachers, not just for looking good on screen. Every resource is structured, editable, and easy to use in daily teaching.
          </p>
          <ul className="mt-7 space-y-4">
            {contentPoints.map((point) => (
              <li key={point} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-50 text-blue-600">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ForSchoolsSection() {
  return (
    <section id="for-schools" className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
      <div className="grid items-center gap-6 overflow-hidden rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.07)] sm:px-8 lg:grid-cols-[1fr_0.85fr_0.75fr] lg:px-10">
        <div className="-mx-5 -mb-5 sm:-mx-8 lg:-ml-10 lg:-mr-4">
          <Image src="/landing/school-3d-v2.png" alt="3D school building illustration" width={1600} height={900} className="h-auto w-full drop-shadow-[0_22px_40px_rgba(47,79,129,0.12)]" />
        </div>

        <div id="pricing">
          <Badge icon={School}>For schools</Badge>
          <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
            Keep every classroom aligned
            <br />
            with the textbook.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
            TeachPad helps schools make teaching preparation faster, more consistent, and more curriculum-aligned.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <PrimaryLink href="/signup">Book a Demo for Your School</PrimaryLink>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="grid gap-4">
            {schoolBenefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-3 text-sm font-semibold text-slate-700">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                  <Check className="h-4 w-4" />
                </span>
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultsSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
      <article className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <p className="mt-4 max-w-3xl text-xl font-bold leading-8 text-slate-900">
              "TeachPad helps teachers prepare faster without moving away from the textbook. The content follows the chapter, feels easy to edit, and works well for real classroom teaching."
            </p>
          </div>
          <div className="shrink-0 rounded-xl bg-white px-5 py-4 shadow-sm">
            <p className="font-black text-slate-950">Academic Coordinator</p>
            <p className="mt-1 text-sm text-slate-500">Partner School</p>
          </div>
        </div>
      </article>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-12 pt-8 sm:px-6 lg:px-8">
      <div className="grid items-center gap-8 rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f5fbff_100%)] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:grid-cols-[1fr_0.9fr] md:p-10 lg:p-12">
        <div>
          <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Start with your textbook. Create everything you need to teach.
          </h2>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <PrimaryLink href="/signup">Start Free</PrimaryLink>
            <SecondaryLink href="/signup">Book a School Demo</SecondaryLink>
          </div>
          <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-blue-600" />
              Built for Indian teachers and schools
            </span>
          </div>
        </div>
        <Image
          src="/landing/backpack-globe-v2.png"
          alt="Backpack, globe, books, and stationery illustration"
          width={1600}
          height={900}
          className="mx-auto h-auto w-full max-w-xl"
        />
      </div>
    </section>
  );
}

function PrimaryLink({ href, children, size = "md" }: { href: string; children: React.ReactNode; size?: "sm" | "md" }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 font-black text-white shadow-[0_18px_36px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-700 ${
        size === "sm" ? "h-11 px-5 text-sm" : "h-12 px-5 text-sm sm:px-6"
      }`}
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
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 sm:px-6"
    >
      <CirclePlay className="h-4 w-4" />
      {children}
    </Link>
  );
}

function Badge({ children, icon: Icon }: { children: React.ReactNode; icon: LucideIcon }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]">
      <Icon className="h-4 w-4" />
      {children}
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  align = "center"
}: {
  eyebrow: string;
  title: React.ReactNode;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-[350px] text-center sm:max-w-3xl" : "max-w-[350px] sm:max-w-3xl"}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight text-slate-950 min-[390px]:text-3xl sm:text-4xl lg:text-5xl">{title}</h2>
    </div>
  );
}
