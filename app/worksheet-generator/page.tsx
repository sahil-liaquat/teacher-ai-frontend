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
  HelpCircle,
  Layers3,
  School,
  Sparkles
} from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import {
  RevealOnScroll,
  StaggerGroup,
  StaggerFadeItem,
  StaggerScaleItem,
  Card3DTilt,
  ParallaxTilt,
  AnimatedCheckmark,
  HeroStagger,
  HeroStaggerItem
} from "@/components/motion-primitives";

const pageTitle = "AI Worksheet Generator for Teachers | TeachPad";
const pageDescription =
  "Create textbook-based worksheets in seconds with TeachPad's AI Worksheet Generator. Generate practice questions, homework sheets, revision worksheets, and answer keys.";
const siteUrl = "https://teachpad.in";
const pageUrl = `${siteUrl}/worksheet-generator`;
const previewImage = "/landing/teachpad-main-hero-centered.png";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: "/worksheet-generator"
  },
  openGraph: {
    title: pageTitle,
    description: "Create textbook-based worksheets, practice questions, homework sheets, and answer keys in seconds with TeachPad.",
    url: pageUrl,
    siteName: "TeachPad",
    images: [
      {
        url: previewImage,
        width: 1672,
        height: 941,
        alt: "TeachPad AI Worksheet Generator for teachers."
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: "Create textbook-based worksheets in seconds with TeachPad.",
    images: [previewImage]
  }
};

const faqs = [
  {
    question: "What is a worksheet generator?",
    answer:
      "A worksheet generator is a tool that helps teachers create practice questions, revision exercises, homework sheets, and assessment material for a topic or chapter."
  },
  {
    question: "How does TeachPad create worksheets?",
    answer:
      "Teachers select the board, class, subject, textbook, chapter, question types, difficulty level, and language. TeachPad then creates a worksheet based on the selected chapter."
  },
  {
    question: "Is TeachPad a free worksheet generator?",
    answer:
      "Teachers can start creating worksheets on TeachPad for free. Some advanced features, higher usage limits, exports, and saved resources may depend on the selected plan."
  },
  {
    question: "Can TeachPad create worksheets with answers?",
    answer:
      "Yes. TeachPad can create worksheets with answer keys so teachers can save time while checking homework, revision work, and classroom practice."
  },
  {
    question: "Can I create printable worksheets with TeachPad?",
    answer:
      "Yes. TeachPad helps teachers prepare worksheets that can be used for printing, sharing, homework, and classroom practice. PDF export depends on the available product features."
  },
  {
    question: "What types of worksheets can I create?",
    answer:
      "Teachers can create MCQ worksheets, fill in the blanks worksheets, short answer worksheets, true or false worksheets, matching worksheets, and mixed practice worksheets."
  },
  {
    question: "Can TeachPad create worksheets from NCERT chapters?",
    answer:
      "Yes. TeachPad is designed for textbook-based worksheet creation, which makes it useful for NCERT, JKBOSE, and other curriculum-based classroom needs."
  },
  {
    question: "Can I edit the worksheet after it is generated?",
    answer:
      "Yes. Teachers should be able to review, edit, and customize generated worksheets before using them in class."
  },
  {
    question: "Can TeachPad create homework worksheets?",
    answer:
      "Yes. Teachers can create homework worksheets, revision worksheets, classroom practice sheets, and quick assessment worksheets from selected textbook chapters."
  },
  {
    question: "Can TeachPad create worksheets in Hindi?",
    answer:
      "TeachPad can support worksheet creation in English or Hindi depending on the available product language settings."
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
    name: "TeachPad AI Worksheet Generator",
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
  "Choose question types and difficulty level.",
  "Generate worksheets aligned with the chapter topic.",
  "Create practice, homework, revision, and assessment worksheets.",
  "Avoid starting from a blank document.",
  "Useful for school teachers, tutors, coaching teachers, and academic content creators."
];

const worksheetTypes = [
  {
    title: "MCQ Worksheet",
    text: "Create objective questions for quick practice and revision."
  },
  {
    title: "Fill in the Blanks Worksheet",
    text: "Help students recall key terms, definitions, and facts."
  },
  {
    title: "True or False Worksheet",
    text: "Check chapter understanding with simple statement-based questions."
  },
  {
    title: "Short Answer Worksheet",
    text: "Prepare written practice questions for classroom or homework use."
  },
  {
    title: "Matching Worksheet",
    text: "Match terms, definitions, examples, and concepts from the chapter."
  },
  {
    title: "Mixed Question Worksheet",
    text: "Combine different question types in one printable worksheet."
  }
];

const processSteps = [
  {
    title: "Choose your textbook chapter",
    text: "Select the board, class, subject, textbook, and chapter."
  },
  {
    title: "Choose worksheet settings",
    text: "Select question types, difficulty level, number of questions, and language."
  },
  {
    title: "Generate a structured worksheet",
    text: "TeachPad creates questions based on the selected chapter."
  },
  {
    title: "Edit, save, and export",
    text: "Review the worksheet, edit questions, add instructions, and prepare it for classroom use."
  }
];

const resourceLinks = [
  { label: "Worksheet generator", href: "/signup" },
  { label: "Worksheet with answers", href: "/signup" },
  { label: "Printable worksheet generator", href: "/signup" },
  { label: "Homework worksheet generator", href: "/signup" },
  { label: "Revision worksheet generator", href: "/signup" },
  { label: "MCQ worksheet generator", href: "/signup" },
  { label: "Fill in the blanks worksheet", href: "/signup" },
  { label: "Classroom worksheet generator", href: "/signup" },
  { label: "NCERT worksheet generator", href: "/signup" },
  { label: "JKBOSE worksheet generator", href: "/signup" },
  { label: "Lesson plan generator", href: "/signup" },
  { label: "Question paper generator", href: "/signup" }
];

export default function WorksheetGeneratorPage() {
  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-white text-[#07111f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MarketingHeader active="ai-tools" />
      <HeroSection />
      <ChapterSection />
      <WorksheetTypeSection />
      <ProcessSection />
      <ExampleSection />
      <AnswersSection />
      <DownloadSection />
      <CurriculumSection />
      <LinksSection />
      <FaqSection />
      <FinalCtaSection />
      <MarketingFooter />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_16%_8%,#eef6ff_0,transparent_28%),radial-gradient(circle_at_88%_16%,#f4fbff_0,transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 pb-16 pt-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-8 lg:pb-32 lg:pt-32">
        <HeroStagger className="relative z-10 mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
          <HeroStaggerItem>
            <Badge icon={Sparkles}>AI Worksheet Generator</Badge>
          </HeroStaggerItem>
          <HeroStaggerItem>
            <h1 className="mt-5 text-[40px] font-black leading-[1.05] tracking-tight text-slate-950 min-[390px]:text-[46px] sm:text-6xl lg:text-[72px]">
              AI Worksheet Generator for Teachers
            </h1>
          </HeroStaggerItem>
          <HeroStaggerItem>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8 lg:mx-0">
              Create textbook-based worksheets in seconds. Select your board, class, subject, textbook, chapter, question types, difficulty level, and language. TeachPad creates ready-to-use worksheets for practice, revision, homework, and classroom assessment.
            </p>
          </HeroStaggerItem>
          <HeroStaggerItem>
            <div className="mx-auto mt-7 flex max-w-[460px] flex-col justify-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap lg:mx-0 lg:justify-start">
              <PrimaryLink href="/signup">Create Worksheet Free</PrimaryLink>
              <SecondaryLink href="#example">View Worksheet Example</SecondaryLink>
            </div>
          </HeroStaggerItem>
        </HeroStagger>

        <WorksheetPreview />
      </div>
    </section>
  );
}

function WorksheetPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[760px] lg:-mr-8 lg:max-w-none">
      <div className="hero-blob left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
      <ParallaxTilt className="relative z-10" maxDeg={3.5}>
        <div className="hero-float">
          <Image
            src="/ai-tools/showcase-worksheet.png"
            alt="Editable worksheet preview."
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
            Create Worksheets from Textbook Chapters
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            TeachPad is a textbook-based worksheet generator for teachers who want practice material to match the chapter they are teaching. Select the curriculum details, choose the question style, and create a worksheet that supports classroom practice, homework, revision, or quick assessment.
          </p>
          <p className="mt-4 text-base leading-8 text-slate-600">
            It helps school teachers, tutors, coaching teachers, and academic content creators prepare chapter worksheets without starting from a blank document.
          </p>
        </div>
      </RevealOnScroll>
      <StaggerGroup className="grid gap-4 sm:grid-cols-2">
        {chapterPoints.map((point) => (
          <StaggerScaleItem key={point}>
            <Card3DTilt maxTilt={4} className="rounded-2xl border border-slate-200 bg-white p-5 h-full">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
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

function WorksheetTypeSection() {
  return (
    <section className="bg-[#f8fbff]">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
        <RevealOnScroll>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Worksheet types</p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Choose the Right Worksheet Type
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Teachers need different worksheet types for different classroom needs. TeachPad can work as a printable worksheet generator, worksheet generator with answers, and classroom worksheet generator for practice worksheets, homework worksheets, revision worksheets, worksheet with answers, and printable worksheet PDF preparation.
            </p>
          </div>
        </RevealOnScroll>
        <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {worksheetTypes.map((type) => (
            <StaggerScaleItem key={type.title}>
              <Card3DTilt maxTilt={5} className="rounded-2xl border border-slate-200 bg-white p-5 h-full">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ClipboardList className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-black text-slate-950">{type.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{type.text}</p>
              </Card3DTilt>
            </StaggerScaleItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
      <RevealOnScroll>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">How it works</p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            How TeachPad Creates a Worksheet
          </h2>
        </div>
      </RevealOnScroll>
      <StaggerGroup className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {processSteps.map((step, index) => (
          <StaggerScaleItem key={step.title}>
            <Card3DTilt maxTilt={5} className="rounded-2xl border border-slate-200 bg-white p-5 h-full">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-sm font-black text-white">{index + 1}</span>
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
            <Badge icon={ClipboardList}>Worksheet example</Badge>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Example Worksheet Output
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Review a generated worksheet, adjust questions, add marks or instructions, and use it for classroom practice, homework, or revision.
            </p>
          </div>
        </RevealOnScroll>
        <RevealOnScroll delay={0.15}>
          <div className="relative overflow-hidden">
            <Image
              src="/assets/illustrations/worksheet-output-preview.png"
              alt="Generated worksheet output preview."
              width={1019}
              height={956}
              className="h-auto w-full [mask-image:linear-gradient(180deg,#000_0%,#000_78%,rgba(0,0,0,0.68)_88%,transparent_100%)]"
            />
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

function AnswersSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
      <RevealOnScroll>
        <div className="grid items-center gap-12 rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:grid-cols-[1fr_0.85fr] md:p-16 lg:p-20">
          <div>
            <Badge icon={HelpCircle}>Answer keys</Badge>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Create Worksheets with Answers
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              TeachPad can generate worksheets with answer keys so teachers can quickly review student responses, prepare homework checks, or create self-practice material. Teachers can use answer-supported worksheets for classroom practice, revision, remedial work, and quick assessments.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-600">
              A worksheet with answers saves time during homework checking and makes revision practice easier for both teachers and students.
            </p>
          </div>
          <div className="rounded-3xl bg-[#f8fbff] p-5">
            {["Answer key included", "Homework checking support", "Revision practice", "Quick assessment review"].map((item, index) => (
              <RevealOnScroll key={item} delay={index * 0.12}>
                <div className="mb-3 flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-bold text-slate-700 shadow-sm last:mb-0">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-white">
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
    <section className="bg-[#f8fbff]">
      <RevealOnScroll>
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-24 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-24 lg:px-8 lg:py-36">
          <div>
            <Badge icon={Download}>Save and export</Badge>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Download, Edit, and Save Worksheets
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              TeachPad creates editable worksheets that teachers can review, customize, and use for classroom teaching, homework, revision, or school records. You can adjust the questions, add instructions, include marks, and prepare the worksheet in a format that fits your classroom needs.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Use your generated worksheet as a printable worksheet, homework worksheet, revision worksheet, or class test practice sheet. If PDF export is enabled in your TeachPad setup, teachers can also download the final worksheet as a PDF for easy printing and sharing.
            </p>
            <div className="mt-8">
              <PrimaryLink href="/signup">Download Worksheet PDF</PrimaryLink>
            </div>
          </div>
          <Image
            src="/ai-tools/showcase-worksheet.png"
            alt="Editable worksheet preview."
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
    <section className="bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)]">
      <RevealOnScroll>
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-24 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-8 lg:py-36">
          <div>
            <Badge icon={School}>Indian classrooms</Badge>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Built for NCERT, JKBOSE, and School Curriculum
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              TeachPad supports textbook-based worksheets for Indian classrooms. It can be useful as an NCERT worksheet generator, JKBOSE worksheet generator, and textbook-based worksheet generator because teachers start with the school curriculum, selected textbook, and chapter topic.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Teachers can prepare chapter-based worksheets for practice, revision, homework, and classroom assessment while keeping the worksheet aligned with what students are studying.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="/signup">Create Worksheet Free</PrimaryLink>
              <SecondaryLink href="/ai-tools">Explore AI Tools</SecondaryLink>
            </div>
          </div>
          <Image
            src="/assets/illustrations/create-worksheet-header.png"
            alt="Textbook-based worksheet planning illustration."
            width={1672}
            height={941}
            className="mx-auto h-auto w-full max-w-2xl drop-shadow-[0_24px_42px_rgba(47,79,129,0.12)]"
          />
        </div>
      </RevealOnScroll>
    </section>
  );
}

function LinksSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
      <RevealOnScroll>
        <div className="rounded-[32px] border border-emerald-100 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.05)] lg:p-12">
          <h2 className="text-xl font-black text-slate-950">Explore More Worksheet Resources</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Explore worksheet formats, examples, printable worksheets, answer keys, and subject-wise practice resources for classroom teaching.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {resourceLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-600"
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

function FaqSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
      <RevealOnScroll>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">FAQ</p>
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
        <div className="grid items-center gap-12 rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f5fbff_100%)] p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:grid-cols-[1fr_0.85fr] md:p-16 lg:p-20">
          <div>
            <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Create a worksheet from your textbook chapter in seconds.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              Choose the chapter you are teaching and let TeachPad prepare a ready-to-use worksheet with practice questions, answer keys, and classroom-friendly formatting.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <PrimaryLink href="/signup">Create Worksheet Free</PrimaryLink>
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

function Badge({ children, icon: Icon }: { children: React.ReactNode; icon: LucideIcon }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-600 shadow-[0_12px_26px_rgba(16,185,129,0.08)]">
      <Icon className="h-4 w-4" />
      {children}
    </span>
  );
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-black text-white shadow-[0_18px_36px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:bg-blue-700"
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
